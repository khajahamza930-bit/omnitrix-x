const test = require("node:test");
const assert = require("node:assert/strict");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { io } = require("socket.io-client");

// Finds a free port so the test server does not clash with your dev server.
function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const listener = net.createServer();

    listener.once("error", reject);

    listener.listen(0, "127.0.0.1", () => {
      const { port } = listener.address();

      listener.close((error) => {
        if (error) reject(error);
        else resolve(port);
      });
    });
  });
}

function connectClient(url) {
  return new Promise((resolve, reject) => {
    const socket = io(url, {
      autoConnect: false,
      reconnection: false,
      timeout: 3000,
    });

    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", (error) => {
      socket.disconnect();
      reject(error);
    });

    socket.connect();
  });
}

// Sends an event with a payload and waits for the server reply.
function emitAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    socket.timeout(3000).emit(event, payload, (error, response) => {
      if (error) {
        reject(new Error(`${event} acknowledgement timed out`));
        return;
      }

      resolve(response);
    });
  });
}

// leave-room has no payload, so the reply function is the only argument.
function emitLeaveRoom(socket) {
  return new Promise((resolve, reject) => {
    socket.timeout(3000).emit("leave-room", (error, response) => {
      if (error) {
        reject(new Error("leave-room acknowledgement timed out"));
        return;
      }

      resolve(response);
    });
  });
}

function waitForEvent(socket, event, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`Timed out waiting for ${event}`));
    }, timeoutMs);

    function onEvent(payload) {
      clearTimeout(timer);
      resolve(payload);
    }

    socket.once(event, onEvent);
  });
}

async function waitForHealth(url, child) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error("Multiplayer server exited before becoming ready.");
    }

    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return;
    } catch {
      // The server may still be starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("Multiplayer server did not become ready in time.");
}

test("alien choice and the ready lock are enforced by the server", async (t) => {
  const port = await getAvailablePort();
  const url = `http://127.0.0.1:${port}`;

  const child = spawn(process.execPath, [path.join(__dirname, "server.js")], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: String(port),
      CLIENT_ORIGINS: "http://localhost:5173",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let serverOutput = "";
  let serverErrors = "";

  child.stdout.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });

  child.stderr.on("data", (chunk) => {
    serverErrors += chunk.toString();
  });

  const clients = [];

  t.after(async () => {
    for (const client of clients) {
      client.disconnect();
    }

    if (child.exitCode === null) {
      child.kill();

      await Promise.race([
        new Promise((resolve) => child.once("exit", resolve)),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    }
  });

  try {
    await waitForHealth(url, child);

    const playerOne = await connectClient(url);
    const playerTwo = await connectClient(url);
    const outsider = await connectClient(url);

    clients.push(playerOne, playerTwo, outsider);

    // An unknown alien cannot be used to create a room.
    const badCreate = await emitAck(playerOne, "create-room", {
      name: "Player One",
      alien: "Goku",
    });

    assert.equal(badCreate.success, false);
    assert.match(badCreate.message, /valid alien/i);

    // A known alien is kept exactly as it was sent.
    const created = await emitAck(playerOne, "create-room", {
      name: "Player One",
      alien: "Four Arms",
    });

    assert.equal(created.success, true);
    assert.equal(created.room.players[0].alien, "Four Arms");

    // An unknown alien cannot be used to join a room.
    const badJoin = await emitAck(playerTwo, "join-room", {
      code: created.room.code,
      name: "Player Two",
      alien: "Goku",
    });

    assert.equal(badJoin.success, false);
    assert.match(badJoin.message, /valid alien/i);

    const joined = await emitAck(playerTwo, "join-room", {
      code: created.room.code,
      name: "Player Two",
      alien: "XLR8",
    });

    assert.equal(joined.success, true);
    assert.equal(joined.room.players[1].alien, "XLR8");

    // The server now answers select-alien and set-ready.
    const badAlien = await emitAck(playerOne, "select-alien", {
      alien: "Unknown Alien",
    });

    assert.equal(badAlien.success, false);

    const goodAlien = await emitAck(playerOne, "select-alien", {
      alien: "Diamondhead",
    });

    assert.equal(goodAlien.success, true);

    const badReady = await emitAck(playerOne, "set-ready", { ready: "yes" });

    assert.equal(badReady.success, false);

    // Ready locks the alien until the player unreadies.
    const readyOn = await emitAck(playerOne, "set-ready", { ready: true });

    assert.equal(readyOn.success, true);

    const lockedChange = await emitAck(playerOne, "select-alien", {
      alien: "Upgrade",
    });

    assert.equal(lockedChange.success, false);
    assert.match(lockedChange.message, /unready/i);

    const readyOff = await emitAck(playerOne, "set-ready", { ready: false });

    assert.equal(readyOff.success, true);

    const unlockedChange = await emitAck(playerOne, "select-alien", {
      alien: "Upgrade",
    });

    assert.equal(unlockedChange.success, true);

    // A player who is not in a room cannot ready up or change an alien.
    const outsiderReady = await emitAck(outsider, "set-ready", {
      ready: true,
    });

    assert.equal(outsiderReady.success, false);

    const outsiderAlien = await emitAck(outsider, "select-alien", {
      alien: "Heatblast",
    });

    assert.equal(outsiderAlien.success, false);

    // Leaving a room is acknowledged, and the other player is told.
    const opponentLeft = waitForEvent(playerOne, "opponent-left");
    const leaveReply = await emitLeaveRoom(playerTwo);

    assert.equal(leaveReply.success, true);
    await opponentLeft;
  } catch (error) {
    error.message +=
      `\nServer output:\n${serverOutput}` +
      `\nServer errors:\n${serverErrors}`;

    throw error;
  }
});
