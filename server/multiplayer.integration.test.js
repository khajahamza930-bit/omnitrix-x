const test = require("node:test");
const assert = require("node:assert/strict");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { io } = require("socket.io-client");

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

function connectClient(url, origin) {
  return new Promise((resolve, reject) => {
    const socket = io(url, {
      autoConnect: false,
      reconnection: false,
      timeout: 3000,
      ...(origin
        ? {
            transports: ["websocket"],
            extraHeaders: { Origin: origin },
          }
        : {}),
    });

    const onError = (error) => {
      socket.disconnect();
      reject(error);
    };

    socket.once("connect", () => {
      socket.off("connect_error", onError);
      resolve(socket);
    });

    socket.once("connect_error", onError);
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

      if (response.ok) {
        return response.json();
      }
    } catch {
      // The server may still be starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("Multiplayer server did not become ready in time.");
}

test("multiplayer server enforces room and battle rules", async (t) => {
  const port = await getAvailablePort();
  const url = `http://127.0.0.1:${port}`;

  const child = spawn(
    process.execPath,
    [path.join(__dirname, "server.js")],
    {
      cwd: __dirname,
      env: {
        ...process.env,
        PORT: String(port),
        CLIENT_ORIGINS: "http://localhost:5173",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

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
    const health = await waitForHealth(url, child);

    assert.equal(health.status, "ok");
    assert.equal(health.service, "omnitrix-x-multiplayer");

    const allowedOriginResponse = await fetch(`${url}/health`, {
      headers: { Origin: "http://localhost:5173" },
    });

    assert.equal(
      allowedOriginResponse.headers.get("access-control-allow-origin"),
      "http://localhost:5173"
    );

    const untrustedOriginResponse = await fetch(`${url}/health`, {
      headers: { Origin: "https://untrusted.example" },
    });

    assert.equal(
      untrustedOriginResponse.headers.get("access-control-allow-origin"),
      null
    );

    // Verify that an explicitly allowed WebSocket origin can connect.
    const allowedOriginClient = await connectClient(
      url,
      "http://localhost:5173"
    );

    assert.equal(allowedOriginClient.connected, true);
    allowedOriginClient.disconnect();

    // Verify that an untrusted WebSocket origin is rejected.
    await assert.rejects(
      connectClient(url, "https://untrusted.example"),
      "Untrusted WebSocket origin should be rejected."
    );

    const playerOne = await connectClient(url);
    const playerTwo = await connectClient(url);
    const playerThree = await connectClient(url);

    clients.push(playerOne, playerTwo, playerThree);

    // A player can create only one room per connection.
    const created = await emitAck(playerOne, "create-room", {
      name: "Player One",
    });

    assert.equal(created.success, true);
    assert.match(created.room.code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);

    const duplicateRoom = await emitAck(playerOne, "create-room", {
      name: "Another Player",
    });

    assert.equal(duplicateRoom.success, false);

    // Invalid names and codes must be rejected.
    const invalidName = await emitAck(playerThree, "join-room", {
      code: created.room.code,
      name: "   ",
    });

    assert.equal(invalidName.success, false);

    const invalidCode = await emitAck(playerThree, "join-room", {
      code: "INVALID!",
      name: "Player Three",
    });

    assert.equal(invalidCode.success, false);

    // A second player can join the waiting room.
    const joined = await emitAck(playerTwo, "join-room", {
      code: created.room.code.toLowerCase(),
      name: "Player Two",
    });

    assert.equal(joined.success, true);
    assert.equal(joined.room.players.length, 2);

    // A third player cannot enter a full room.
    const fullRoom = await emitAck(playerThree, "join-room", {
      code: created.room.code,
      name: "Player Three",
    });

    assert.equal(fullRoom.success, false);
    assert.match(fullRoom.message, /full/i);

    // Known alien selections are accepted.
    const validSelection = waitForEvent(playerOne, "room-updated");

    playerOne.emit("select-alien", { alien: "Heatblast" });

    const selectedRoom = await validSelection;

    assert.equal(selectedRoom.players[0].alien, "Heatblast");

    // Unknown alien selections must not replace the valid selection.
    const unchangedRoom = waitForEvent(playerOne, "room-updated");

    playerOne.emit("select-alien", { alien: "Unknown Alien" });
    playerOne.emit("set-ready", { ready: true });

    const afterInvalidSelection = await unchangedRoom;

    assert.equal(afterInvalidSelection.players[0].alien, "Heatblast");
    assert.equal(afterInvalidSelection.players[0].ready, true);

    // One ready player is not enough to start a battle.
    const playerTwoReady = waitForEvent(playerOne, "room-updated");

    playerTwo.emit("set-ready", { ready: true });

    const readyRoom = await playerTwoReady;

    assert.equal(readyRoom.status, "battle");
    assert.equal(readyRoom.players.every((player) => player.ready), true);

    assert.equal(readyRoom.currentTurnPlayerId, playerOne.id);

    const outsiderAttack = await emitAck(playerThree, "attack", {
      damage: 999999,
    });

    assert.equal(outsiderAttack.success, false);

    // Player Two cannot attack before Player One.
    const wrongFirstTurn = await emitAck(playerTwo, "attack", {
      damage: 999999,
    });

    assert.equal(wrongFirstTurn.success, false);
    assert.match(wrongFirstTurn.message, /not your turn/i);

    const delay = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds));

    // Player One attacks first. Client-supplied damage is ignored.
    const firstBattleUpdate = waitForEvent(playerOne, "battle-updated");

    const firstAttack = await emitAck(playerOne, "attack", {
      damage: 999999,
    });

    assert.equal(firstAttack.success, true);
    assert.equal(firstAttack.damage, 10);
    assert.equal(firstAttack.currentTurnPlayerId, playerTwo.id);

    const firstBattle = await firstBattleUpdate;

    assert.equal(firstBattle.damage, 10);
    assert.equal(firstBattle.room.currentTurnPlayerId, playerTwo.id);

    const firstDefender = firstBattle.room.players.find(
      (player) => player.id === playerTwo.id
    );

    assert.equal(firstDefender.health, 90);

    // Player One cannot attack twice because the turn has passed.
    const repeatedAttack = await emitAck(playerOne, "attack", {
      damage: 10,
    });

    assert.equal(repeatedAttack.success, false);
    assert.match(repeatedAttack.message, /not your turn/i);

    // Even after the rate-limit window, Player One cannot attack again.
    await delay(850);

    const wrongSecondTurn = await emitAck(playerOne, "attack", {
      damage: 10,
    });

    assert.equal(wrongSecondTurn.success, false);
    assert.match(wrongSecondTurn.message, /not your turn/i);

    // Player Two takes the next valid turn.
    await delay(850);

    const secondBattleUpdate = waitForEvent(playerOne, "battle-updated");

    const secondAttack = await emitAck(playerTwo, "attack", {
      damage: 999999,
    });

    assert.equal(secondAttack.success, true);
    assert.equal(secondAttack.damage, 10);
    assert.equal(secondAttack.currentTurnPlayerId, playerOne.id);

    const secondBattle = await secondBattleUpdate;

    assert.equal(secondBattle.room.currentTurnPlayerId, playerOne.id);

    const firstPlayerHealth = secondBattle.room.players.find(
      (player) => player.id === playerOne.id
    );

    assert.equal(firstPlayerHealth.health, 90);

    // Continue alternating valid turns until the server declares a winner.
    const battleFinished = waitForEvent(playerOne, "battle-finished", 30000);

    for (let attackNumber = 3; attackNumber <= 19; attackNumber += 1) {
      await delay(850);

      const attackingSocket =
        attackNumber % 2 === 1 ? playerOne : playerTwo;

      const expectedTurn =
        attackNumber % 2 === 1 ? playerTwo.id : playerOne.id;

      const updatePromise = waitForEvent(playerOne, "battle-updated");

      const result = await emitAck(attackingSocket, "attack", {
        damage: 999999,
      });

      assert.equal(result.success, true);
      assert.equal(result.damage, 10);

      const update = await updatePromise;

      assert.equal(update.damage, 10);

      if (attackNumber < 19) {
        assert.equal(update.room.currentTurnPlayerId, expectedTurn);
      } else {
        assert.equal(update.room.status, "finished");
        assert.equal(update.room.currentTurnPlayerId, null);
      }
    }

    const winner = await battleFinished;

    assert.equal(winner.winnerId, playerOne.id);
    assert.equal(winner.winnerName, "Player One");

    const finalBattleState = await emitAck(playerOne, "attack", {
      damage: 999999,
    });

    assert.equal(finalBattleState.success, false);
    assert.match(finalBattleState.message, /not started/i);

    // Leaving restores the remaining player to a waiting room.
    const opponentLeft = waitForEvent(playerOne, "opponent-left");
    const roomAfterLeave = waitForEvent(playerOne, "room-updated");

    playerTwo.emit("leave-room");

    await opponentLeft;

    const resetRoom = await roomAfterLeave;

    assert.equal(resetRoom.status, "waiting");
    assert.equal(resetRoom.currentTurnPlayerId, null);
    assert.equal(resetRoom.players.length, 1);
    assert.equal(resetRoom.players[0].ready, false);
    assert.equal(resetRoom.players[0].health, 100);

    const rejoined = await emitAck(playerTwo, "join-room", {
      code: created.room.code,
      name: "Player Two",
    });

    assert.equal(rejoined.success, true);

    // Consume the room update caused by the successful rejoin first.
    const rejoinedRoom = await waitForEvent(playerOne, "room-updated");

    assert.equal(rejoinedRoom.players.length, 2);

    const disconnectedEvent = waitForEvent(playerOne, "opponent-left");
    const disconnectedRoomEvent = waitForEvent(playerOne, "room-updated");

    playerTwo.disconnect();

    await disconnectedEvent;

    const roomAfterDisconnect = await disconnectedRoomEvent;

    assert.equal(roomAfterDisconnect.status, "waiting");
    assert.equal(roomAfterDisconnect.currentTurnPlayerId, null);
    assert.equal(roomAfterDisconnect.players.length, 1);
    assert.equal(roomAfterDisconnect.players[0].health, 100);
    assert.equal(roomAfterDisconnect.players[0].ready, false);

    console.log("Integration test completed successfully.");
  } catch (error) {
    error.message +=
      `\nServer output:\n${serverOutput}` +
      `\nServer errors:\n${serverErrors}`;

    throw error;
  }
});
