const express = require("express");
const http = require("node:http");
const cors = require("cors");
const { Server } = require("socket.io");

const {
  createRoomCode,
  normalizePlayerName,
  normalizeRoomCode,
  isAllowedAlien,
  allowEvent,
} = require("./security");

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 3001;

const allowedOrigins = (
  process.env.CLIENT_ORIGINS || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function checkOrigin(origin, callback) {
  // Allow clients that do not send an Origin header, such as
  // trusted server-to-server or local non-browser clients.
  if (!origin || allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  return callback(null, false);
}

app.use(cors({ origin: checkOrigin }));
app.use(express.json({ limit: "10kb" }));

const io = new Server(server, {
  cors: {
    origin: checkOrigin,
    methods: ["GET", "POST"],
  },
  // CORS headers alone do not reject WebSocket handshakes.
  // Validate the Origin header before accepting a connection.
  allowRequest: (request, callback) => {
    const origin = request.headers.origin;

    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback("Origin not allowed", false);
  },
});

const rooms = new Map();

function acknowledge(callback, payload) {
  if (typeof callback === "function") {
    callback(payload);
  }
}

function rejectRateLimit(socket, eventName, callback) {
  acknowledge(callback, {
    success: false,
    message: "Too many requests. Please wait and try again.",
  });

  console.warn(`Rate limit reached for ${eventName}`);
}

function getPublicRoom(room) {
  return {
    code: room.code,
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      ready: player.ready,
      alien: player.alien,
      health: player.health,
    })),
    status: room.status,
  };
}

function broadcastRoom(room) {
  io.to(room.code).emit("room-updated", getPublicRoom(room));
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("create-room", (payload, callback) => {
    if (!allowEvent(socket, "create-room", 3, 60000)) {
      return rejectRateLimit(socket, "create-room", callback);
    }

    const data = payload && typeof payload === "object" ? payload : {};

    if (socket.data.roomCode) {
      return acknowledge(callback, {
        success: false,
        message: "Leave your current room before creating another.",
      });
    }

    const playerName = normalizePlayerName(data.name);

    if (!playerName) {
      return acknowledge(callback, {
        success: false,
        message: "Enter a valid name between 1 and 20 characters.",
      });
    }

    let code;

    try {
      code = createRoomCode(rooms);
    } catch {
      return acknowledge(callback, {
        success: false,
        message: "Unable to create a room right now. Try again.",
      });
    }

    const room = {
      code,
      players: [
        {
          id: socket.id,
          name: playerName,
          ready: false,
          alien: null,
          health: 100,
        },
      ],
      status: "waiting",
    };

    rooms.set(code, room);
    socket.join(code);
    socket.data.roomCode = code;

    console.log(`${playerName} created a room`);

    acknowledge(callback, {
      success: true,
      room: getPublicRoom(room),
    });

    broadcastRoom(room);
  });

  socket.on("join-room", (payload, callback) => {
    if (!allowEvent(socket, "join-room", 6, 60000)) {
      return rejectRateLimit(socket, "join-room", callback);
    }

    const data = payload && typeof payload === "object" ? payload : {};
    const roomCode = normalizeRoomCode(data.code);

    if (socket.data.roomCode) {
      return acknowledge(callback, {
        success: false,
        message: "Leave your current room before joining another.",
      });
    }

    if (!roomCode) {
      return acknowledge(callback, {
        success: false,
        message: "Enter a valid six-character room code.",
      });
    }

    const playerName = normalizePlayerName(data.name);

    if (!playerName) {
      return acknowledge(callback, {
        success: false,
        message: "Enter a valid name between 1 and 20 characters.",
      });
    }

    const room = rooms.get(roomCode);

    if (!room) {
      return acknowledge(callback, {
        success: false,
        message: "Room not found. Check the room code.",
      });
    }

    if (room.players.length >= 2) {
      return acknowledge(callback, {
        success: false,
        message: "This room is already full.",
      });
    }

    if (room.status !== "waiting") {
      return acknowledge(callback, {
        success: false,
        message: "This battle has already started.",
      });
    }

    room.players.push({
      id: socket.id,
      name: playerName,
      ready: false,
      alien: null,
      health: 100,
    });

    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    console.log(`${playerName} joined a room`);

    acknowledge(callback, {
      success: true,
      room: getPublicRoom(room),
    });

    broadcastRoom(room);
  });

  socket.on("set-ready", (payload) => {
    if (!allowEvent(socket, "set-ready", 10, 5000)) return;

    const data = payload && typeof payload === "object" ? payload : {};

    if (typeof data.ready !== "boolean") return;

    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "waiting") return;

    const player = room.players.find((item) => item.id === socket.id);
    if (!player) return;

    player.ready = data.ready;

    if (
      room.players.length === 2 &&
      room.players.every((item) => item.ready)
    ) {
      room.status = "battle";
      io.to(room.code).emit("battle-started", getPublicRoom(room));
    }

    broadcastRoom(room);
  });

  socket.on("select-alien", (payload) => {
    if (!allowEvent(socket, "select-alien", 12, 5000)) return;

    const data = payload && typeof payload === "object" ? payload : {};

    if (!isAllowedAlien(data.alien)) return;

    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "waiting") return;

    const player = room.players.find((item) => item.id === socket.id);
    if (!player) return;

    player.alien = data.alien;
    broadcastRoom(room);
  });

  socket.on("attack", (payload, callback) => {
    if (!allowEvent(socket, "attack", 1, 800)) {
      return rejectRateLimit(socket, "attack", callback);
    }

    const room = rooms.get(socket.data.roomCode);

    if (!room || room.status !== "battle") {
      return acknowledge(callback, {
        success: false,
        message: "The battle has not started.",
      });
    }

    const attacker = room.players.find((item) => item.id === socket.id);
    const defender = room.players.find((item) => item.id !== socket.id);

    if (!attacker || !defender) {
      return acknowledge(callback, {
        success: false,
        message: "Opponent not found.",
      });
    }

    if (attacker.health <= 0 || defender.health <= 0) {
      return acknowledge(callback, {
        success: false,
        message: "This battle has already ended.",
      });
    }

    // Damage is determined by the server, never by client input.
    const actualDamage = 10;
    defender.health = Math.max(0, defender.health - actualDamage);

    io.to(room.code).emit("battle-updated", {
      room: getPublicRoom(room),
      attackerId: attacker.id,
      defenderId: defender.id,
      damage: actualDamage,
    });

    if (defender.health <= 0) {
      room.status = "finished";

      io.to(room.code).emit("battle-finished", {
        winnerId: attacker.id,
        winnerName: attacker.name,
      });
    }

    acknowledge(callback, { success: true });
  });

  socket.on("leave-room", () => {
    leaveRoom(socket);
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    leaveRoom(socket);
  });

  function leaveRoom(currentSocket) {
    const code = currentSocket.data.roomCode;
    if (!code) return;

    delete currentSocket.data.roomCode;
    currentSocket.leave(code);

    const room = rooms.get(code);
    if (!room) return;

    room.players = room.players.filter(
      (player) => player.id !== currentSocket.id
    );

    if (room.players.length === 0) {
      rooms.delete(code);
      console.log(`An empty room was deleted`);
      return;
    }

    room.status = "waiting";

    room.players.forEach((player) => {
      player.ready = false;
      player.health = 100;
    });

    io.to(code).emit("opponent-left");
    broadcastRoom(room);
  }
});

app.get("/", (req, res) => {
  res.send("OMNITRIX X multiplayer server is running!");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "omnitrix-x-multiplayer",
  });
});

// Do not expose internal server errors to clients.
app.use((error, req, res, next) => {
  console.error("HTTP request error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    success: false,
    message: "An internal server error occurred.",
  });
});

server.listen(PORT, () => {
  console.log(`OMNITRIX X server running on port ${PORT}`);
  console.log(`Allowed browser origins: ${allowedOrigins.join(", ")}`);
});
