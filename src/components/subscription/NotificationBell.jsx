//
// Bell icon + unread badge + dropdown panel, backed by
// GET/PUT /api/notifications*. Replaces the static hardcoded-"3" bell
// button that already existed in TenantLayout.jsx's Topbar and
// SuperAdmin/Layout.jsx — same visual slot, real data.

import { useState, useEffect, useCallback, useRef } from "react";
// import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, AlertTriangle, Info, Clock } from "lucide-react";
import { NotificationApi, NOTIFICATION_TONE } from "../../services/subscriptionApi";
import CommunicationSocket from "../../features/communication/services/communicationSocket";
import { SOCKET_EVENTS } from "../../features/communication/utils/socketEvents";

const TONE_ICON = {
  danger: AlertTriangle,
  warning: Clock,
  info: Info,
  neutral: Bell,
};

const TONE_CLASS = {
  danger: "text-danger-500",
  warning: "text-warning-500",
  info: "text-info-500",
  neutral: "text-[var(--text-tertiary)]",
};

function timeAgo(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  // const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [serverUnreadCount, setServerUnreadCount] = useState(0);
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await NotificationApi.list();
setItems(res.data || []);

const unreadRes = await NotificationApi.unreadCount();
setServerUnreadCount(unreadRes.data?.count || 0);
    } catch (err) {
      setError(err.message || "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
  const socket = CommunicationSocket.connect();

  const handleNewNotification = (notification) => {
  if (!notification) return;

  setItems((prev) => {
    const exists = prev.some(
      (item) => item.id === notification.id
    );

    if (exists) return prev;

    return [notification, ...prev];
  });

  if (!notification.isRead) {
    setServerUnreadCount((count) => count + 1);
  }
};

  const unsubscribe = CommunicationSocket.on(
    SOCKET_EVENTS.NOTIFICATION_NEW,
    handleNewNotification
  );

  return () => {
    unsubscribe?.();
  };
}, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const unreadCount = serverUnreadCount;

  async function markRead(id) {
   setItems((prev) =>
  prev.map((n) => ({ ...n, isRead: true }))
);

setServerUnreadCount(0);

setServerUnreadCount((count) =>
  Math.max(0, count - 1)
);
    try {
      await NotificationApi.markRead(id);
    } catch {
      load(); // reconcile on failure
    }
  }

  async function markAllRead() {
    const prevItems = items;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await NotificationApi.markAllRead();
    } catch {
      setItems(prevItems);
    }
  }
 function handleNotificationClick(notification) {
  if (!notification.isRead) {
    markRead(notification.id);
  }

  const documentId = notification.metadata?.documentId;

  if (
    notification.type === "APPROVAL_PENDING" ||
    notification.type === "APPROVAL_SUBMITTED" ||
    notification.type === "APPROVAL_REJECTED" ||
    notification.type === "APPROVAL_SENT_BACK"
  ) {
    const params = new URLSearchParams();

    if (documentId) {
      params.set("documentId", documentId);
    }

    window.location.href = `/approvals?${params.toString()}`;
  }
}

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        aria-label="Notifications"
        className="relative w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#232F40] text-slate-500 dark:text-slate-400"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-blue-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 max-h-[420px] flex flex-col rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-app-lg">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--text-primary)]">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-app-sm bg-[var(--surface-sunken)]" />
                ))}
              </div>
            ) : error ? (
              <p className="p-4 text-sm text-danger-500">{error}</p>
            ) : items.length === 0 ? (
              <p className="p-6 text-center text-sm text-[var(--text-tertiary)]">You're all caught up.</p>
            ) : (
              items.map((n) => {
                const tone = NOTIFICATION_TONE[n.type] || "neutral";
                const Icon = TONE_ICON[tone];
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex w-full items-start gap-2.5 border-b border-[var(--border-subtle)] px-4 py-3 text-left last:border-0 hover:bg-[var(--surface-card-hover)] ${
                      !n.isRead ? "bg-brand-50/40 dark:bg-brand-500/5" : ""
                    }`}
                  >
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${TONE_CLASS[tone]}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.isRead ? "font-semibold" : "font-medium"} text-[var(--text-primary)]`}>
                        {n.title}
                      </p>
                      {n.message && <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{n.message}</p>}
                      <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
