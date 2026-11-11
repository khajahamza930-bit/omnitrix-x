import { io } from "socket.io-client";

const configuredServerUrl = import.meta.env.VITE_SERVER_URL?.trim();

const SERVER_URL =
  configuredServerUrl ||
  (import.meta.env.DEV ? "http://localhost:3001" : null);

if (!SERVER_URL) {
  throw new Error(
    "Missing VITE_SERVER_URL. Configure the multiplayer backend URL before deploying."
  );
}

let parsedServerUrl;

try {
  parsedServerUrl = new URL(SERVER_URL);
} catch {
  throw new Error("VITE_SERVER_URL must be a valid absolute URL.");
}

if (
  !["http:", "https:"].includes(parsedServerUrl.protocol) ||
  parsedServerUrl.username ||
  parsedServerUrl.password ||
  parsedServerUrl.pathname !== "/" ||
  parsedServerUrl.search ||
  parsedServerUrl.hash
) {
  throw new Error(
    "VITE_SERVER_URL must be an HTTP(S) server origin without credentials, path, query, or hash."
  );
}

export const socket = io(parsedServerUrl.origin, {
  autoConnect: true,
});

export function createRoom(name) {
  return new Promise((resolve) => {
    socket.emit("create-room", { name }, resolve);
  });
}

export function joinRoom(code, name) {
  return new Promise((resolve) => {
    socket.emit("join-room", { code, name }, resolve);
  });
}

export function setReady(ready) {
  socket.emit("set-ready", { ready });
}

export function selectAlien(alien) {
  socket.emit("select-alien", { alien });
}

export function attack() {
  return new Promise((resolve) => {
    socket.emit("attack", {}, resolve);
  });
}

export function leaveRoom() {
  socket.emit("leave-room");
}
