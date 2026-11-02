// src/features/aiAssistant/pages/AIRecentChatsPage.jsx
import { useCallback, useEffect, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { ChatApi } from "../api";
import { useAIAssistant } from "../AIAssistantContext";
import ChatSessionList from "../components/ChatSessionList";
import { AppButton, useToast } from "../../../components/ui";

export default function AIRecentChatsPage({ onNavigate }) {
  const { setActiveSessionId } = useAIAssistant();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    ChatApi.listSessions()
      .then((res) => setSessions(res.data || []))
      .catch((err) => toast({ title: "Couldn't load conversations", description: err.message, tone: "error" }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg text-[var(--text-primary)]">Recent Chats</h2>
        <AppButton
          size="sm"
          icon={MessageSquarePlus}
          onClick={() => { setActiveSessionId(null); onNavigate?.("aiChat"); }}
        >
          New chat
        </AppButton>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden" style={{ minHeight: 420 }}>
        <ChatSessionList
          sessions={sessions}
          loading={loading}
          onSelect={(s) => { setActiveSessionId(s.id); onNavigate?.("aiChat"); }}
          onDelete={async (s) => {
            try {
              await ChatApi.deleteSession(s.id);
              setSessions((prev) => prev.filter((x) => x.id !== s.id));
            } catch (err) {
              toast({ title: "Couldn't delete conversation", description: err.message, tone: "error" });
            }
          }}
        />
      </div>
    </div>
  );
}
