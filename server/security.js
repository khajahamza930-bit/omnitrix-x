const crypto = require("node:crypto");

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const ALLOWED_ALIENS = new Set([
  "Heatblast",
  "Four Arms",
  "XLR8",
  "Diamondhead",
  "Upgrade",
  "Cannonbolt",
  "Wildmutt",
  "Ripjaws",
  "Grey Matter",
  "Stinkfly",
  "Ghostfreak",
]);

function createRoomCode(existingRooms, maxAttempts = 50) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let code = "";

    for (let index = 0; index < 6; index += 1) {
      code += ROOM_CODE_ALPHABET[
        crypto.randomInt(0, ROOM_CODE_ALPHABET.length)
      ];
    }

    if (!existingRooms.has(code)) {
      return code;
    }
  }

  throw new Error("Unable to allocate a unique room code.");
}

function normalizePlayerName(value) {
  if (typeof value !== "string") return null;

  const name = value.trim();

  if (
    name.length === 0 ||
    name.length > 20 ||
    Array.from(name).some((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127;
    })
  ) {
    return null;
  }

  return name;
}

function normalizeRoomCode(value) {
  if (typeof value !== "string") return null;

  const code = value.trim().toUpperCase();

  return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(code)
    ? code
    : null;
}

function isAllowedAlien(value) {
  return typeof value === "string" && ALLOWED_ALIENS.has(value);
}

function allowEvent(socket, eventName, limit, windowMs, now = Date.now()) {
  if (!socket || typeof eventName !== "string") return false;

  if (!socket.data || typeof socket.data !== "object") {
    socket.data = {};
  }

  if (!(socket.data.eventRateLimits instanceof Map)) {
    socket.data.eventRateLimits = new Map();
  }

  const limits = socket.data.eventRateLimits;
  const previous = limits.get(eventName) || [];

  const recent = previous.filter(
    (timestamp) => now - timestamp < windowMs
  );

  if (recent.length >= limit) {
    limits.set(eventName, recent);
    return false;
  }

  recent.push(now);
  limits.set(eventName, recent);

  return true;
}

module.exports = {
  createRoomCode,
  normalizePlayerName,
  normalizeRoomCode,
  isAllowedAlien,
  allowEvent,
};
