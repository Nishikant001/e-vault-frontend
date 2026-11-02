// src/features/communication/hooks/useCommunicationSocket.js
//
// Owns the socket connection lifecycle for the Communication page:
// connects on mount, disconnects on unmount, and tracks presence +
// connection-health state that any part of the UI can read (online
// users, reconnecting banner, etc).

import { useEffect, useRef, useState, useCallback } from "react";
import CommunicationSocket from "../services/communicationSocket";

export function useCommunicationSocket() {
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = CommunicationSocket.connect();
    socketRef.current = socket;

    const handleConnect = () => {
      setConnected(true);
      setReconnecting(false);
    };
    const handleDisconnect = () => setConnected(false);
    const handleReconnectAttempt = () => setReconnecting(true);
    const handleReconnect = () => setReconnecting(false);

    const handleUserOnline = ({ userId }) => {
      setOnlineUserIds((prev) => new Set(prev).add(userId));
    };
    const handleUserOffline = ({ userId }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.io.on("reconnect", handleReconnect);

    const offOnline = CommunicationSocket.on("communication:user:online", handleUserOnline);
    const offOffline = CommunicationSocket.on("communication:user:offline", handleUserOffline);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.io.off("reconnect", handleReconnect);
      offOnline();
      offOffline();
      CommunicationSocket.disconnect();
    };
  }, []);

  const isUserOnline = useCallback((userId) => onlineUserIds.has(userId), [onlineUserIds]);

  return { connected, reconnecting, isUserOnline };
}

export default useCommunicationSocket;
