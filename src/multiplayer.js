
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";

export const socket = io(SERVER_URL, {
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
