// src/features/communication/services/communicationSocket.js
//
// Thin singleton wrapper around socket.io-client. Handles the JWT
// handshake (same token used by REST — no second auth mechanism),
// reconnection, and exposes a small pub/sub surface so multiple
// components/hooks can listen to the same connection without each
// opening its own socket.

import { io } from "socket.io-client";
import { getToken, API_BASE_URL } from "../../../services/apiClient";

// The backend serves both REST (…/api) and Socket.IO on the same
// HTTP server (see backend app.js) — derive the socket origin from the
// API base URL by stripping the trailing /api, unless an explicit
// override is provided via VITE_COMMUNICATION_SOCKET_URL.
function resolveSocketUrl() {
  const override =
    typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_COMMUNICATION_SOCKET_URL;
  if (override) return override;
  return API_BASE_URL.replace(/\/api\/?$/, "");
}

let socket = null;
const listeners = new Map(); // event -> Set<callback>

function ensureSocket() {
  if (socket) return socket;

  socket = io(resolveSocketUrl(), {
    path: "/socket.io",
    autoConnect: false,
    auth: (cb) => cb({ token: getToken() }),
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  // Re-dispatch every incoming event to whoever subscribed via `on()`
  // below — this lets several hooks/components share one socket
  // connection. onAny() is the documented socket.io-client API for this.
  socket.onAny((event, ...args) => {
    listeners.get(event)?.forEach((cb) => cb(...args));
  });

  return socket;
}

function connect() {
  const s = ensureSocket();
  if (!s.connected) s.connect();
  return s;
}

function disconnect() {
  socket?.disconnect();
}

function on(event, callback) {
  ensureSocket();
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(callback);
  return () => listeners.get(event)?.delete(callback);
}

function emit(event, payload, ack) {
  ensureSocket();
  if (ack) socket.emit(event, payload, ack);
  else socket.emit(event, payload);
}

function isConnected() {
  return !!socket?.connected;
}

export const CommunicationSocket = { connect, disconnect, on, emit, isConnected };
export default CommunicationSocket;
