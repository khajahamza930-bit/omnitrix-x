
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

function createRoomCode() {
  let code;

  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (rooms.has(code));

  return code;
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

  socket.on("create-room", ({ name } = {}, callback) => {
    const playerName =
      typeof name === "string" && name.trim()
        ? name.trim().slice(0, 20)
        : "Player 1";

    const code = createRoomCode();

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

    console.log(`${playerName} created room ${code}`);

    if (typeof callback === "function") {
      callback({ success: true, room: getPublicRoom(room) });
    }

    broadcastRoom(room);
  });

  socket.on("join-room", ({ code, name } = {}, callback) => {
    const roomCode =
      typeof code === "string" ? code.trim().toUpperCase() : "";

    const room = rooms.get(roomCode);

    if (!room) {
      return callback?.({
        success: false,
        message: "Room not found. Check the room code.",
      });
    }

    if (room.players.length >= 2) {
      return callback?.({
        success: false,
        message: "This room is already full.",
      });
    }

    if (room.status !== "waiting") {
      return callback?.({
        success: false,
        message: "This battle has already started.",
      });
    }

    const playerName =
      typeof name === "string" && name.trim()
        ? name.trim().slice(0, 20)
        : "Player 2";

    room.players.push({
      id: socket.id,
      name: playerName,
      ready: false,
      alien: null,
      health: 100,
    });

    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    console.log(`${playerName} joined room ${roomCode}`);

    callback?.({ success: true, room: getPublicRoom(room) });
    broadcastRoom(room);
  });

  socket.on("set-ready", ({ ready } = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "waiting") return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    player.ready = Boolean(ready);

    if (
      room.players.length === 2 &&
      room.players.every((p) => p.ready)
    ) {
      room.status = "battle";
      io.to(room.code).emit("battle-started", getPublicRoom(room));
    }

    broadcastRoom(room);
  });

  socket.on("select-alien", ({ alien } = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "waiting") return;

    if (typeof alien !== "string" || alien.length > 50) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    player.alien = alien;
    broadcastRoom(room);
  });

  socket.on("attack", ({ damage } = {}, callback) => {
    const room = rooms.get(socket.data.roomCode);

    if (!room || room.status !== "battle") {
      return callback?.({
        success: false,
        message: "The battle has not started.",
      });
    }

    const attacker = room.players.find((p) => p.id === socket.id);
    const defender = room.players.find((p) => p.id !== socket.id);

    if (!attacker || !defender) {
      return callback?.({
        success: false,
        message: "Opponent not found.",
      });
    }

    // Temporary demo damage. The server controls the actual value.
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

    callback?.({ success: true });
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

    const room = rooms.get(code);
    currentSocket.leave(code);
    delete currentSocket.data.roomCode;

    if (!room) return;

    room.players = room.players.filter(
      (player) => player.id !== currentSocket.id
    );

    if (room.players.length === 0) {
      rooms.delete(code);
      console.log(`Room ${code} deleted`);
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

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`OMNITRIX X server running on http://localhost:${PORT}`);
});
