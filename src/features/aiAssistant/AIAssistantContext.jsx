// src/features/aiAssistant/AIAssistantContext.jsx
//
// Small shared-state layer for the AI Assistant module. Holds the
// currently selected document-context scope (Current Document / Folder /
// Department / Category / Document Type / All Documents) and the active
// chat session id, so the sidebar's "Recent Chats" list, the main chat
// screen, and the one-click AI action buttons on a document all agree on
// what's currently selected without prop-drilling through every layout.
//
// This is UI convenience state only — the backend ChatSession row remains
// the source of truth for scope (scopeType/scopeDocumentIds/scopeFolderJson).

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const AIAssistantCtx = createContext(null);

const PINNED_KEY = "ai_assistant_pinned_sessions";
const SAVED_PROMPTS_KEY = "ai_assistant_saved_prompts";
const RENAMED_TITLES_KEY = "ai_assistant_renamed_sessions";

function readLocalMap(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalMap(key, map) {
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* ignore quota errors */
  }
}

function readLocalList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* ignore quota errors */
  }
}

export function AIAssistantProvider({ children }) {
  // scope: { scopeType: "ALL"|"DOCUMENT"|"DOCUMENT_SET"|"FOLDER", scopeDocumentIds, scopeFolderJson, label }
  const [scope, setScope] = useState({ scopeType: "ALL", label: "All Documents" });
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [pinnedSessionIds, setPinnedSessionIds] = useState(() => readLocalList(PINNED_KEY));
  const [savedPrompts, setSavedPrompts] = useState(() => readLocalList(SAVED_PROMPTS_KEY));
  const [renamedTitles, setRenamedTitles] = useState(() => readLocalMap(RENAMED_TITLES_KEY));
  const [pendingDraft, setPendingDraft] = useState(null);

  // The backend's chatRoutes has no PUT/rename endpoint for ChatSession —
  // only create/list/messages/delete. Renames are therefore kept as a
  // client-side overlay (keyed by session id) rather than silently no-op'ing.
  const renameSession = useCallback((sessionId, title) => {
    setRenamedTitles((prev) => {
      const next = { ...prev, [sessionId]: title };
      writeLocalMap(RENAMED_TITLES_KEY, next);
      return next;
    });
  }, []);

  const togglePinned = useCallback((sessionId) => {
    setPinnedSessionIds((prev) => {
      const next = prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId];
      writeLocalList(PINNED_KEY, next);
      return next;
    });
  }, []);

  const addSavedPrompt = useCallback((prompt) => {
    setSavedPrompts((prev) => {
      const next = [{ id: `p_${Date.now()}`, text: prompt, createdAt: new Date().toISOString() }, ...prev];
      writeLocalList(SAVED_PROMPTS_KEY, next);
      return next;
    });
  }, []);

  const removeSavedPrompt = useCallback((id) => {
    setSavedPrompts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      writeLocalList(SAVED_PROMPTS_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      scope,
      setScope,
      activeSessionId,
      setActiveSessionId,
      pinnedSessionIds,
      togglePinned,
      savedPrompts,
      addSavedPrompt,
      removeSavedPrompt,
      renamedTitles,
      renameSession,
      pendingDraft,
      setPendingDraft,
    }),
    [
      scope, activeSessionId, pinnedSessionIds, savedPrompts,
      addSavedPrompt, removeSavedPrompt, togglePinned, renamedTitles, renameSession, pendingDraft,
    ]
  );

  return <AIAssistantCtx.Provider value={value}>{children}</AIAssistantCtx.Provider>;
}

export function useAIAssistant() {
  const ctx = useContext(AIAssistantCtx);
  if (!ctx) throw new Error("useAIAssistant must be used within an AIAssistantProvider");
  return ctx;
}
