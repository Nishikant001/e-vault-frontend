// src/features/communication/utils/socketEvents.js
//
// Mirrors backend src/constants/communicationConstants.js SOCKET_EVENTS
// exactly. Kept as a plain object (not imported cross-project) since the
// frontend and backend are separate deployable apps.

export const SOCKET_EVENTS = {
  CONNECTED: "communication:connected",
  PRESENCE: "communication:presence",
  ERROR: "communication:error",

  JOIN_CONVERSATION: "communication:conversation:join",
  LEAVE_CONVERSATION: "communication:conversation:leave",

  MESSAGE_NEW: "communication:message:new",
  MESSAGE_SENT: "communication:message:sent",
  MESSAGE_DELIVERED: "communication:message:delivered",
  MESSAGE_READ: "communication:message:read",
  MESSAGE_TYPING: "communication:message:typing",
  MESSAGE_STOP_TYPING: "communication:message:stop-typing",
  MESSAGE_EDITED: "communication:message:edited",
  MESSAGE_DELETED: "communication:message:deleted",
  
  NOTIFICATION_NEW: "notification:new",


  CONVERSATION_CREATED: "communication:conversation:created",
  CONVERSATION_UPDATED: "communication:conversation:updated",

  USER_ONLINE: "communication:user:online",
  USER_OFFLINE: "communication:user:offline",

  // Calling — WebRTC signalling (mirrors backend communicationConstants.js)
  CALL_INVITE: "communication:call:invite",
  CALL_OFFER: "communication:call:offer",
  CALL_ANSWER: "communication:call:answer",
  CALL_ICE_CANDIDATE: "communication:call:ice-candidate",
  CALL_ACCEPT: "communication:call:accept",
  CALL_DECLINE: "communication:call:decline",
  CALL_CANCEL: "communication:call:cancel",
  CALL_BUSY: "communication:call:busy",
  CALL_END: "communication:call:end",
  CALL_TIMEOUT: "communication:call:timeout",
  CALL_ERROR: "communication:call:error",
};

export default SOCKET_EVENTS;
