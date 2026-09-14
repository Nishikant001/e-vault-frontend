// src/features/communication/api/communicationApi.js
//
// Thin, single-purpose wrapper around the backend Internal Communication
// Module: /api/communication/*. This is the ONLY file that knows these
// endpoint paths — every Communication component/hook talks to the
// backend through the functions exported here, on top of the shared
// services/apiClient helpers (same convention as features/aiAssistant/api.js).
//
// Completely independent of features/aiAssistant/api.js — no shared
// endpoints, no shared state.

import { get, post, patch, del, getToken, API_BASE_URL } from "../../../services/apiClient";

export const CommunicationApi = {
  // ── Users ────────────────────────────────────────────────────────
  searchUsers: (q) => get("/communication/users", { q }),

  // ── Conversations ────────────────────────────────────────────────
  listConversations: (search) => get("/communication/conversations", { search }),
  startConversation: (userId) => post("/communication/conversations", { userId }),
  getConversation: (conversationId) => get(`/communication/conversations/${conversationId}`),

  // ── Group conversations ──────────────────────────────────────────
  createGroup: (name, participantIds) => post("/communication/conversations/group", { name, participantIds }),
  renameGroup: (conversationId, name) => patch(`/communication/conversations/${conversationId}`, { name }),
  addParticipants: (conversationId, userIds) =>
    post(`/communication/conversations/${conversationId}/participants`, { userIds }),
  removeParticipant: (conversationId, userId) =>
    del(`/communication/conversations/${conversationId}/participants/${userId}`),
  leaveGroup: (conversationId) => del(`/communication/conversations/${conversationId}/participants/me`),

  // ── Messages ─────────────────────────────────────────────────────
  listMessages: (conversationId, { beforeId, limit } = {}) =>
    get(`/communication/conversations/${conversationId}/messages`, { beforeId, limit }),

  sendMessage: (conversationId, { content, replyToMessageId }) =>
    post(`/communication/conversations/${conversationId}/messages`, { content, replyToMessageId }),

  editMessage: (messageId, content) => patch(`/communication/messages/${messageId}`, { content }),

  deleteMessage: (messageId) => del(`/communication/messages/${messageId}`),

  markRead: (conversationId) => post(`/communication/conversations/${conversationId}/read`),

  // ── Voice ────────────────────────────────────────────────────────
  /** multipart upload: { blob, durationSeconds, replyToMessageId? } */
  async sendVoiceMessage(conversationId, { blob, durationSeconds, replyToMessageId }) {
    const formData = new FormData();
    const ext = (blob.type || "audio/webm").split("/")[1]?.split(";")[0] || "webm";
    formData.append("voice", blob, `voice-message.${ext}`);
    formData.append("durationSeconds", String(Math.round(durationSeconds || 0)));
    if (replyToMessageId) formData.append("replyToMessageId", String(replyToMessageId));

    const res = await fetch(`${API_BASE_URL}/communication/conversations/${conversationId}/voice`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.success === false) {
      const err = new Error(data?.message || `Voice upload failed (HTTP ${res.status})`);
      err.statusCode = res.status;
      throw err;
    }
    return data;
  },

  /** Returns a Blob URL for authenticated voice playback. Caller is
   * responsible for revoking it (URL.revokeObjectURL) when done. */
  async fetchVoiceBlobUrl(voiceMessageId) {
    const res = await fetch(`${API_BASE_URL}/communication/voice/${voiceMessageId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error(`Failed to load voice message (HTTP ${res.status})`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  // ── Attachments ──────────────────────────────────────────────────
  /** Uploads one or more files (+ optional caption text) as a single
   * message, using XHR (not fetch) so we can report upload progress and
   * support cancellation. Returns a { promise, cancel() } pair.
   *   files: File[]
   *   onProgress: (percent: number) => void
   */
  sendAttachmentMessage(conversationId, { files, content, replyToMessageId, onProgress }) {
    const formData = new FormData();
    for (const file of files) formData.append("files", file, file.name);
    if (content) formData.append("content", content);
    if (replyToMessageId) formData.append("replyToMessageId", String(replyToMessageId));

    const xhr = new XMLHttpRequest();
    const promise = new Promise((resolve, reject) => {
      xhr.open("POST", `${API_BASE_URL}/communication/conversations/${conversationId}/attachments`);
      xhr.setRequestHeader("Authorization", `Bearer ${getToken()}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        let data = null;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          // non-JSON response, fall through to status check below
        }
        if (xhr.status >= 200 && xhr.status < 300 && data?.success !== false) {
          resolve(data);
        } else {
          const err = new Error(data?.message || `Upload failed (HTTP ${xhr.status})`);
          err.statusCode = xhr.status;
          reject(err);
        }
      };

      xhr.onerror = () => reject(new Error("Network error while uploading"));
      xhr.onabort = () => {
        const err = new Error("Upload cancelled");
        err.cancelled = true;
        reject(err);
      };

      xhr.send(formData);
    });

    return { promise, cancel: () => xhr.abort() };
  },

  /** Direct download URL — the browser sends the Bearer token via the
   * apiClient-aware <a>/fetch flow in the component, since a plain <a
   * href> can't attach an Authorization header. Kept here only as the
   * canonical path builder. */
  attachmentDownloadUrl: (attachmentId) => `${API_BASE_URL}/communication/attachments/${attachmentId}/download`,

  /** Fetches an attachment as a Blob URL for authenticated downloads/
   * inline image previews. Caller is responsible for revoking it. */
  async fetchAttachmentBlobUrl(attachmentId, { inline = false } = {}) {
    const url = `${API_BASE_URL}/communication/attachments/${attachmentId}/download${inline ? "?mode=inline" : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error(`Failed to load attachment (HTTP ${res.status})`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};

export default CommunicationApi;
