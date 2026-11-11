const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createRoomCode,
  normalizePlayerName,
  normalizeRoomCode,
  isAllowedAlien,
  allowEvent,
} = require("./security");

test("room codes contain six allowed characters", () => {
  const code = createRoomCode(new Map());

  assert.equal(code.length, 6);
  assert.match(code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
});

test("room code generation avoids existing codes", () => {
  const existing = new Map([["AAAAAA", {}]]);
  const code = createRoomCode(existing);

  assert.notEqual(code, "AAAAAA");
});

test("player names are trimmed and validated", () => {
  assert.equal(normalizePlayerName("  Hamza  "), "Hamza");
  assert.equal(normalizePlayerName(""), null);
  assert.equal(normalizePlayerName("   "), null);
  assert.equal(normalizePlayerName("A".repeat(21)), null);
  assert.equal(normalizePlayerName("Bad\u0000Name"), null);
  assert.equal(normalizePlayerName(123), null);
});

test("room codes are normalized and validated", () => {
  assert.equal(normalizeRoomCode(" abc234 "), "ABC234");
  assert.equal(normalizeRoomCode("ABC-234"), null);
  assert.equal(normalizeRoomCode("ABC12"), null);
  assert.equal(normalizeRoomCode("TOOLONG"), null);
  assert.equal(normalizeRoomCode(null), null);
});

test("only known aliens can be selected", () => {
  assert.equal(isAllowedAlien("Heatblast"), true);
  assert.equal(isAllowedAlien("Grey Matter"), true);
  assert.equal(isAllowedAlien("Unknown Alien"), false);
  assert.equal(isAllowedAlien(123), false);
});

test("event rate limiter allows requests within the limit", () => {
  const socket = { data: {} };

  assert.equal(allowEvent(socket, "attack", 1, 800, 1000), true);
  assert.equal(allowEvent(socket, "attack", 1, 800, 1100), false);
});

test("event rate limiter allows requests after the window expires", () => {
  const socket = { data: {} };

  assert.equal(allowEvent(socket, "attack", 1, 800, 1000), true);
  assert.equal(allowEvent(socket, "attack", 1, 800, 1800), true);
});

test("rate limits are independent for different events", () => {
  const socket = { data: {} };

  assert.equal(allowEvent(socket, "attack", 1, 800, 1000), true);
  assert.equal(allowEvent(socket, "join-room", 1, 800, 1000), true);
});
