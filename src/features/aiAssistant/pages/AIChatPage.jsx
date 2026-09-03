// src/features/aiAssistant/pages/AIChatPage.jsx
//
// The main Copilot-style chat screen. Wires directly to:
//   POST /api/ai/chat/sessions, GET /api/ai/chat/sessions,
//   GET/POST /api/ai/chat/sessions/:id/messages, DELETE /api/ai/chat/sessions/:id
//
// NOTE on "streaming": the backend's sendMessage controller returns a single
// JSON payload (not SSE/chunked), so there is no real token stream to
// consume. To still deliver the requested "typing animation / stop
// generating" UX, the full answer is revealed client-side a few
// characters at a time once it arrives, and Stop halts that reveal.
// If the backend adds a streaming endpoint later, swap the reveal loop
// in `send()` for a fetch-stream reader — everything else here is unaffected.

import { useEffect, useRef, useState, useCallback } from "react";
import { Plus, AlertTriangle, RotateCcw } from "lucide-react";
import { ChatApi, DocumentAIApi } from "../api";
import { useAIAssistant } from "../AIAssistantContext";
import ScopeSelector from "../components/ScopeSelector";
import ChatComposer from "../components/ChatComposer";
import ChatSessionList from "../components/ChatSessionList";
import SuggestedQuestions from "../components/SuggestedQuestions";
import MessageActions from "../components/MessageActions";
import MarkdownMessage from "../components/MarkdownMessage";
import { CitationList } from "../components/MetadataAndDocCards";
import AIActionButtons from "../components/AIActionButtons";
import { AppButton, useToast, SkeletonText, EmptyState } from "../../../components/ui";

const REVEAL_CHARS_PER_TICK = 6;
const REVEAL_INTERVAL_MS = 12;

export default function AIChatPage({ role, onNavigate, presetDocumentId = null }) {
  const { scope, setScope, activeSessionId, setActiveSessionId, pendingDraft, setPendingDraft } = useAIAssistant();
  const { toast } = useToast();

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [revealedText, setRevealedText] = useState("");
  const [pendingMessage, setPendingMessage] = useState(null); // full assistant payload being revealed
  const [feedback, setFeedback] = useState({}); // messageId -> "like"|"dislike" (local only)
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const revealTimerRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (pendingDraft) {
      setDraft(pendingDraft);
      setPendingDraft(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (presetDocumentId) {
      setScope({ scopeType: "DOCUMENT", scopeDocumentIds: [presetDocumentId], label: `Document #${presetDocumentId}` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetDocumentId]);

  const loadSessions = useCallback(() => {
    setSessionsLoading(true);
    ChatApi.listSessions()
      .then((res) => setSessions(res.data || []))
      .catch(() => setError("Couldn't load your conversations. Check your connection and try again."))
      .finally(() => setSessionsLoading(false));
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const loadMessages = useCallback((sessionId) => {
    if (!sessionId) return setMessages([]);
    setMessagesLoading(true);
    ChatApi.getMessages(sessionId)
      .then((res) => setMessages(res.data || []))
      .catch(() => setError("Couldn't load this conversation's history."))
      .finally(() => setMessagesLoading(false));
  }, []);

  useEffect(() => { loadMessages(activeSessionId); }, [activeSessionId, loadMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, revealedText]);

  useEffect(() => () => clearInterval(revealTimerRef.current), []);

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setDraft("");
  };

  const ensureSession = async () => {
    if (activeSessionId) return activeSessionId;
    const payload = {
      title: draft.slice(0, 60) || undefined,
      scopeType: scope.scopeType,
      scopeDocumentIds: scope.scopeDocumentIds,
      scopeFolderJson: scope.scopeFolderJson,
    };
    const res = await ChatApi.createSession(payload);
    const session = res.data;
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    return session.id;
  };

  const revealAnswer = (fullText, onDone) => {
    let i = 0;
    setRevealedText("");
    clearInterval(revealTimerRef.current);
    revealTimerRef.current = setInterval(() => {
      i += REVEAL_CHARS_PER_TICK;
      setRevealedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(revealTimerRef.current);
        onDone();
      }
    }, REVEAL_INTERVAL_MS);
  };

  const send = async (overrideText) => {
    const text = (overrideText ?? draft).trim();
    if (!text || sending) return;
    setError(null);
    setDraft("");
    setSending(true);

    const userTempId = `temp-user-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userTempId, role: "USER", content: text, createdAt: new Date().toISOString() }]);

    try {
      const sessionId = await ensureSession();
      const res = await ChatApi.sendMessage(sessionId, { message: text });
      const { message, citations, confidenceScore, followUpQuestions } = res.data;
      setPendingMessage({ ...message, citations, confidenceScore, followUpQuestions });
      revealAnswer(message.content || "", () => {
        setMessages((prev) => [...prev, { ...message, citations, confidenceScore, followUpQuestions }]);
        setPendingMessage(null);
        setSending(false);
        setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, lastMessageAt: new Date().toISOString() } : s)));
      });
    } catch (err) {
      setSending(false);
      setPendingMessage(null);
      setError(err.message || "The AI assistant couldn't respond. Please try again.");
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "ASSISTANT", content: null, isError: true, errorText: err.message },
      ]);
    }
  };

  const stopGenerating = () => {
    clearInterval(revealTimerRef.current);
    if (pendingMessage) {
      setMessages((prev) => [...prev, { ...pendingMessage, content: revealedText }]);
    }
    setPendingMessage(null);
    setSending(false);
  };

  const regenerateLast = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "USER");
    if (lastUser) send(lastUser.content);
  };

  const runDocumentAction = async (actionKey) => {
    const documentId = scope.scopeDocumentIds?.[0];
    if (!documentId) {
      toast({ title: "Select a document first", description: "Choose \"Current Document\" scope to run this action.", tone: "warning" });
      return;
    }
    setActionLoading(actionKey);
    try {
      const fn = { summarize: DocumentAIApi.summarize, explain: DocumentAIApi.explain, ocrInconsistencies: DocumentAIApi.ocrInconsistencies, missingMetadata: DocumentAIApi.missingMetadata, autoTag: DocumentAIApi.autoTag, reindex: DocumentAIApi.reindex }[actionKey];
      const res = await fn(documentId);
      const resultText = res.data.result || JSON.stringify(res.data, null, 2);
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: "USER", content: `[${actionKey}] on this document` },
        { id: `ai-${Date.now()}`, role: "ASSISTANT", content: resultText, citations: [] },
      ]);
    } catch (err) {
      toast({ title: "Action failed", description: err.message, tone: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] gap-4">
      {/* Left mini-panel: recent sessions */}
      <div className="hidden lg:flex w-64 shrink-0 flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-2.5 border-b border-slate-100">
          <AppButton variant="secondary" size="sm" icon={Plus} fullWidth onClick={startNewChat}>New chat</AppButton>
        </div>
        <ChatSessionList
          compact
          sessions={sessions}
          loading={sessionsLoading}
          activeSessionId={activeSessionId}
          onSelect={(s) => setActiveSessionId(s.id)}
          onDelete={async (s) => {
            try {
              await ChatApi.deleteSession(s.id);
              setSessions((prev) => prev.filter((x) => x.id !== s.id));
              if (String(activeSessionId) === String(s.id)) startNewChat();
            } catch (err) {
              toast({ title: "Couldn't delete conversation", description: err.message, tone: "error" });
            }
          }}
        />
      </div>

      {/* Main chat column */}
      <div className="flex-1 flex flex-col min-w-0 rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-3 border-b border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-[15px] text-slate-800">AI Chat</h2>
            <span className="text-[11.5px] text-slate-400">Scope: {scope.label}</span>
          </div>
          <ScopeSelector scope={scope} onChange={setScope} presetDocumentId={presetDocumentId} />
          {scope.scopeType === "DOCUMENT" && scope.scopeDocumentIds?.[0] && (
            <AIActionButtons
              role={role}
              loadingKey={actionLoading}
              onEndpointAction={runDocumentAction}
              onPromptAction={(prompt) => send(prompt)}
              onNavigateAction={(key) => key === "compare" && onNavigate?.("aiCompare")}
            />
          )}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messagesLoading ? (
            <SkeletonText lines={4} />
          ) : messages.length === 0 && !pendingMessage ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <EmptyState
                title="Ask anything about your documents"
                description="Try one of the suggestions below, or ask your own question."
                className="border-0"
              />
              <SuggestedQuestions onPick={(q) => send(q)} />
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "USER" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.role === "USER" ? "bg-brand-500 text-white" : "bg-slate-50 border border-slate-100"}`}>
                  {m.isError ? (
                    <div className="flex items-start gap-2 text-danger-600 text-[13px]">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <p>{m.errorText || "Something went wrong."}</p>
                        <button onClick={regenerateLast} className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium underline">
                          <RotateCcw className="h-3 w-3" /> Retry
                        </button>
                      </div>
                    </div>
                  ) : m.role === "USER" ? (
                    <p className="text-[13.5px] whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <>
                      <MarkdownMessage content={m.content} />
                      <CitationList citations={m.citations} onOpen={(c) => toast({ title: `Opening ${c.documentName}`, description: `Page ${c.pageNumber}` })} />
                      {typeof m.confidenceScore === "number" && (
                        <p className="mt-1.5 text-[10.5px] text-slate-400">Confidence: {Math.round(m.confidenceScore * 100)}%</p>
                      )}
                      <MessageActions
                        content={m.content}
                        onRegenerate={regenerateLast}
                        onLike={() => setFeedback((f) => ({ ...f, [m.id]: "like" }))}
                        onDislike={() => setFeedback((f) => ({ ...f, [m.id]: "dislike" }))}
                        feedback={feedback[m.id]}
                        onExport={() => {
                          const blob = new Blob([m.content], { type: "text/markdown" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url; a.download = "ai-response.md"; a.click();
                          URL.revokeObjectURL(url);
                        }}
                      />
                      {m.followUpQuestions?.length > 0 && (
                        <div className="mt-2">
                          <SuggestedQuestions chips={m.followUpQuestions} onPick={(q) => send(q)} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}

          {pendingMessage && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-slate-50 border border-slate-100">
                <MarkdownMessage content={revealedText} />
                <span className="inline-block w-1.5 h-3.5 bg-slate-400 animate-pulse ml-0.5 align-middle" />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-100 px-3 py-2 text-[12.5px] text-danger-600">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="p-3 border-t border-slate-100">
          <ChatComposer
            value={draft}
            onChange={setDraft}
            onSend={() => send()}
            onStop={stopGenerating}
            busy={sending}
          />
        </div>
      </div>
    </div>
  );
}
