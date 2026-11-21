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

// Starts a copy of the server with extra settings and waits until it is ready.
async function startServer(extraEnv) {
  const port = await getAvailablePort();
  const url = `http://127.0.0.1:${port}`;

  const child = spawn(process.execPath, [path.join(__dirname, "server.js")], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: String(port),
      CLIENT_ORIGINS: "http://localhost:5173",
      ...extraEnv,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";

  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });

  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited early.\n${output}`);
    }

    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return { url, child };
    } catch {
      // The server may still be starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  child.kill();
  throw new Error(`Server did not start in time.\n${output}`);
}

async function stopServer(child) {
  if (child.exitCode === null) {
    child.kill();

    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  }
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

test("the server refuses new rooms when it is full", async (t) => {
  const { url, child } = await startServer({ MAX_ROOMS: "1" });
  const clients = [];

  t.after(async () => {
    for (const client of clients) {
      client.disconnect();
    }

    await stopServer(child);
  });

  const first = await connectClient(url);
  const second = await connectClient(url);

  clients.push(first, second);

  const created = await emitAck(first, "create-room", {
    name: "Player One",
    alien: "Heatblast",
  });

  assert.equal(created.success, true);

  const refused = await emitAck(second, "create-room", {
    name: "Player Two",
    alien: "Heatblast",
  });

  assert.equal(refused.success, false);
  assert.match(refused.message, /busy/i);

  // When the first room is gone, there is space again.
  const left = await emitLeaveRoom(first);

  assert.equal(left.success, true);

  const createdAgain = await emitAck(second, "create-room", {
    name: "Player Two",
    alien: "Heatblast",
  });

  assert.equal(createdAgain.success, true);
});

test("the server refuses new connections when it is full", async (t) => {
  const { url, child } = await startServer({ MAX_CONNECTIONS: "2" });
  const clients = [];

  t.after(async () => {
    for (const client of clients) {
      client.disconnect();
    }

    await stopServer(child);
  });

  const first = await connectClient(url);
  const second = await connectClient(url);

  clients.push(first, second);

  // A third connection must be refused.
  await assert.rejects(connectClient(url));

  // After one player leaves, a new connection is accepted again.
  first.disconnect();

  let accepted = null;

  for (let attempt = 0; attempt < 10 && !accepted; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      accepted = await connectClient(url);
    } catch {
      // The server may not have noticed the disconnect yet.
    }
  }

  assert.ok(accepted, "a new connection should be accepted after one left");
  clients.push(accepted);
});
