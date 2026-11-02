// src/features/communication/hooks/useConversation.js
//
// Manages everything about ONE open conversation: message history +
// pagination, sending/editing/deleting, typing indicator broadcast, and
// wiring up real-time Socket.IO events for that conversation room.
// REST/DB remains the source of truth — every socket event here reflects
// a change the server already persisted (see project brief §19/§45).

import { useEffect, useRef, useState, useCallback } from "react";
import CommunicationApi from "../api/communicationApi";
import CommunicationSocket from "../services/communicationSocket";
import { SOCKET_EVENTS } from "../utils/socketEvents";

const TYPING_STOP_DELAY_MS = 2000;

export function useConversation(conversationId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [typingUserIds, setTypingUserIds] = useState(() => new Set());

  const typingTimeoutRef = useRef(null);

  const upsertMessage = useCallback((incoming) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === incoming.id);
      if (idx === -1) return [...prev, incoming].sort((a, b) => a.id - b.id);
      const next = [...prev];
      next[idx] = incoming;
      return next;
    });
  }, []);

  // ── Initial load + reset on conversation switch ─────────────────
  useEffect(() => {
    if (!conversationId) return undefined;
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      setMessages([]);
      setHasMore(true);
      setError(null);
      setLoading(true);

      try {
        const res = await CommunicationApi.listMessages(conversationId);
        if (cancelled) return;
        setMessages(res.data || []);
        setHasMore((res.data || []).length >= 40);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    CommunicationApi.markRead(conversationId).catch(() => {});

    // Join the conversation room — server verifies membership before
    // actually adding this socket to the room.
    CommunicationSocket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, { conversationId });

    return () => {
      cancelled = true;
      CommunicationSocket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, { conversationId });
    };
  }, [conversationId]);

  // ── Real-time subscriptions ──────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;

    const offNew = CommunicationSocket.on(SOCKET_EVENTS.MESSAGE_NEW, ({ conversationId: cid, message }) => {
      if (Number(cid) === Number(conversationId)) {
        upsertMessage(message);
        CommunicationApi.markRead(conversationId).catch(() => {});
      }
    });
    const offSent = CommunicationSocket.on(SOCKET_EVENTS.MESSAGE_SENT, ({ message }) => {
      if (Number(message?.conversationId) === Number(conversationId)) upsertMessage(message);
    });
    const offEdited = CommunicationSocket.on(SOCKET_EVENTS.MESSAGE_EDITED, ({ message }) => {
      if (Number(message?.conversationId) === Number(conversationId)) upsertMessage(message);
    });
    const offDeleted = CommunicationSocket.on(SOCKET_EVENTS.MESSAGE_DELETED, ({ message }) => {
      if (Number(message?.conversationId) === Number(conversationId)) upsertMessage(message);
    });
    const offTyping = CommunicationSocket.on(SOCKET_EVENTS.MESSAGE_TYPING, ({ conversationId: cid, userId }) => {
      if (Number(cid) === Number(conversationId)) {
        setTypingUserIds((prev) => new Set(prev).add(userId));
      }
    });
    const offStopTyping = CommunicationSocket.on(SOCKET_EVENTS.MESSAGE_STOP_TYPING, ({ conversationId: cid, userId }) => {
      if (Number(cid) === Number(conversationId)) {
        setTypingUserIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    });

    return () => {
      offNew();
      offSent();
      offEdited();
      offDeleted();
      offTyping();
      offStopTyping();
    };
  }, [conversationId, upsertMessage]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || !messages.length || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    try {
      const oldestId = messages[0].id;
      const res = await CommunicationApi.listMessages(conversationId, { beforeId: oldestId });
      const older = res.data || [];
      setHasMore(older.length >= 40);
      setMessages((prev) => [...older, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, messages, loadingOlder, hasMore]);

  const sendText = useCallback(
    async (content, { replyToMessageId } = {}) => {
      if (!conversationId || !content?.trim()) return;
      setSending(true);
      try {
        const res = await CommunicationApi.sendMessage(conversationId, { content, replyToMessageId });
        upsertMessage(res.data);
        return res.data;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [conversationId, upsertMessage]
  );

  const sendVoice = useCallback(
    async (blob, durationSeconds, { replyToMessageId } = {}) => {
      if (!conversationId) return;
      setSending(true);
      try {
        const res = await CommunicationApi.sendVoiceMessage(conversationId, { blob, durationSeconds, replyToMessageId });
        upsertMessage(res.data);
        return res.data;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [conversationId, upsertMessage]
  );

  /** Uploads one or more files (+ optional caption) as a single message.
   * Returns { promise, cancel() } so the composer can show live progress
   * and let the user cancel mid-upload — mirrors CommunicationApi's shape. */
  const sendAttachments = useCallback(
    (files, { content, replyToMessageId, onProgress } = {}) => {
      if (!conversationId || !files?.length) return { promise: Promise.resolve(), cancel: () => {} };
      setSending(true);
      const { promise, cancel } = CommunicationApi.sendAttachmentMessage(conversationId, {
        files,
        content,
        replyToMessageId,
        onProgress,
      });
      const wrapped = promise
        .then((res) => {
          upsertMessage(res.data);
          return res.data;
        })
        .catch((err) => {
          if (!err.cancelled) setError(err.message);
          throw err;
        })
        .finally(() => setSending(false));
      return { promise: wrapped, cancel };
    },
    [conversationId, upsertMessage]
  );

  const editMessage = useCallback(
    async (messageId, content) => {
      const res = await CommunicationApi.editMessage(messageId, content);
      upsertMessage(res.data);
      return res.data;
    },
    [upsertMessage]
  );

  const deleteMessage = useCallback(
    async (messageId) => {
      const res = await CommunicationApi.deleteMessage(messageId);
      upsertMessage(res.data);
      return res.data;
    },
    [upsertMessage]
  );

  const notifyTyping = useCallback(() => {
    if (!conversationId) return;
    CommunicationSocket.emit(SOCKET_EVENTS.MESSAGE_TYPING, { conversationId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      CommunicationSocket.emit(SOCKET_EVENTS.MESSAGE_STOP_TYPING, { conversationId });
    }, TYPING_STOP_DELAY_MS);
  }, [conversationId]);

  useEffect(() => () => typingTimeoutRef.current && clearTimeout(typingTimeoutRef.current), []);

  return {
    messages,
    loading,
    loadingOlder,
    hasMore,
    sending,
    error,
    typingUserIds,
    loadOlder,
    sendText,
    sendVoice,
    sendAttachments,
    editMessage,
    deleteMessage,
    notifyTyping,
  };
}

export default useConversation;
