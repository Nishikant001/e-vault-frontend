// src/features/communication/pages/CommunicationPage.jsx
//
// Top-level page for the Internal Communication Module. Desktop: 3-column
// layout (conversation list | active chat | optional new-chat panel).
// Mobile: conversation list → chat screen navigation (project brief §42).
//
// Completely independent of AIChatPage.jsx / aiAssistant — own API layer,
// own socket connection, own state. Does not touch Temporary Access.

import { useEffect, useMemo, useState, useCallback } from "react";
import { WifiOff, MessagesSquare, SquarePen } from "lucide-react";
import "../communication-theme.css";
import CommunicationApi from "../api/communicationApi";
import { decodeToken } from "../../../services/apiClient";
import useCommunicationSocket from "../hooks/useCommunicationSocket";
import useConversation from "../hooks/useConversation";
import useCallManager from "../hooks/useCallManager";
import CommunicationSocket from "../services/communicationSocket";
import { SOCKET_EVENTS } from "../utils/socketEvents";
import ConversationList from "../components/ConversationList";
import ChatHeader from "../components/ChatHeader";
import MessageList from "../components/MessageList";
import MessageComposer from "../components/MessageComposer";
import UserSearch from "../components/UserSearch";
import GroupCreateModal from "../components/GroupCreateModal";
import AddMembersModal from "../components/AddMembersModal";
import IncomingCallModal from "../components/IncomingCallModal";
import CallWindow from "../components/CallWindow";
import { useToast } from "../../../components/ui";

export default function CommunicationPage() {
  const currentUserId = useMemo(() => decodeToken()?.id ?? null, []);
  const { toast } = useToast();

  const { connected, reconnecting, isUserOnline } = useCommunicationSocket();
  const call = useCallManager();

  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem("comm-theme-mode") || "dark";
    } catch {
      return "dark";
    }
  });
  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem("comm-theme-mode", next);
      } catch {
        // non-fatal — theme just won't persist across reloads
      }
      return next;
    });
  }, []);

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [activeConversation, setActiveConversation] = useState(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [otherUserReadUpTo, setOtherUserReadUpTo] = useState(null);

  const {
    messages,
    loading: messagesLoading,
    loadingOlder,
    hasMore,
    sending,
    typingUserIds,
    loadOlder,
    sendText,
    sendVoice,
    sendAttachments,
    editMessage,
    deleteMessage,
    notifyTyping,
  } = useConversation(activeConversation?.conversationId);

  const refreshConversations = useCallback(() => {
    setConversationsLoading(true);
    CommunicationApi.listConversations(searchValue)
      .then((res) => setConversations(res.data || []))
      .catch(() => {})
      .finally(() => setConversationsLoading(false));
  }, [searchValue]);

  // Debounced fetch/re-fetch of the conversation list — covers both the
  // initial load (searchValue starts as "") and every subsequent search
  // box change, deferred via setTimeout so state updates never happen
  // synchronously inside the effect body itself.
  useEffect(() => {
    const timer = setTimeout(refreshConversations, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  // Keep the conversation list's preview/unread state fresh whenever the
  // active conversation's message set changes (new/edited/deleted).
  useEffect(() => {
    if (!activeConversation) return undefined;
    const timer = setTimeout(refreshConversations, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Track the other participant's read receipt for the active conversation.
  useEffect(() => {
    if (!activeConversation) return undefined;
    const off = CommunicationSocket.on(SOCKET_EVENTS.MESSAGE_READ, ({ conversationId, userId, lastReadMessageId }) => {
      if (
        Number(conversationId) === Number(activeConversation.conversationId) &&
        userId !== currentUserId
      ) {
        setOtherUserReadUpTo(lastReadMessageId);
      }
    });
    return off;
  }, [activeConversation, currentUserId]);

  const handleSelectConversation = async (conv) => {
    setActiveConversation(conv);
    setReplyTo(null);
    setMobileShowChat(true);
    setShowUserSearch(false);
    setOtherUserReadUpTo(null);

    // GROUP conversations need the full member list (not carried by the
    // conversation-list summary) for the header/add-members flow.
    if (conv.type === "GROUP") {
      try {
        const res = await CommunicationApi.getConversation(conv.conversationId);
        setActiveConversation((prev) =>
          prev?.conversationId === conv.conversationId ? { ...prev, ...res.data } : prev
        );
      } catch {
        // Keep the summary shape if the detail fetch fails — non-fatal.
      }
    }
  };

  const handleSelectUser = async (user) => {
    try {
      const res = await CommunicationApi.startConversation(user.id);
      setShowUserSearch(false);
      await refreshConversations();
      setActiveConversation({
        conversationId: res.data.conversationId,
        otherUser: user,
        lastMessagePreview: null,
        lastMessageAt: null,
        unreadCount: 0,
      });
      setMobileShowChat(true);
    } catch (err) {
      toast?.({ title: "Couldn't start conversation", description: err.message, tone: "error" });
    }
  };

  const handleGroupCreated = async (conversationId) => {
    setShowGroupModal(false);
    await refreshConversations();
    try {
      const res = await CommunicationApi.getConversation(conversationId);
      setActiveConversation({ conversationId, ...res.data });
      setMobileShowChat(true);
    } catch (err) {
      toast?.({ title: "Group created", description: "Select it from the list to open it.", tone: "default" });
    }
  };

  const handleAddedMembers = async () => {
    setShowAddMembers(false);
    if (!activeConversation) return;
    try {
      const res = await CommunicationApi.getConversation(activeConversation.conversationId);
      setActiveConversation((prev) => ({ ...prev, ...res.data }));
    } catch {
      // non-fatal
    }
    refreshConversations();
  };

  const handleLeaveGroup = async () => {
    if (!activeConversation) return;
    try {
      await CommunicationApi.leaveGroup(activeConversation.conversationId);
      setActiveConversation(null);
      setMobileShowChat(false);
      refreshConversations();
    } catch (err) {
      toast?.({ title: "Couldn't leave group", description: err.message, tone: "error" });
    }
  };

  const handleSendText = async (content, opts) => {
    try {
      await sendText(content, opts);
      setReplyTo(null);
    } catch (err) {
      toast?.({ title: "Message failed to send", description: err.message, tone: "error" });
    }
  };

  const handleSendVoice = async (blob, durationSeconds, opts) => {
    try {
      await sendVoice(blob, durationSeconds, opts);
      setReplyTo(null);
    } catch (err) {
      toast?.({ title: "Voice message failed", description: err.message, tone: "error" });
    }
  };

  const handleSendAttachments = (files, content, opts) => {
    const { promise, cancel } = sendAttachments(files, { ...opts, content });
    const wrapped = promise
      .then((data) => {
        setReplyTo(null);
        return data;
      })
      .catch((err) => {
        if (!err.cancelled) {
          toast?.({ title: "Attachment failed to send", description: err.message, tone: "error" });
        }
        throw err;
      });
    return { promise: wrapped, cancel };
  };

  const handleEdit = async (messageId, content) => {
    try {
      await editMessage(messageId, content);
    } catch (err) {
      toast?.({ title: "Couldn't edit message", description: err.message, tone: "error" });
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await deleteMessage(messageId);
    } catch (err) {
      toast?.({ title: "Couldn't delete message", description: err.message, tone: "error" });
    }
  };

  const handleStartCall = (callType) => {
    if (!activeConversation || activeConversation.type === "GROUP") return;
    call.startCall(activeConversation.conversationId, activeConversation.otherUser, callType);
  };

  // Surface terminal call outcomes as a toast when there's no CallWindow
  // on screen to show them inline (e.g. busy/offline/failed before the
  // window ever opened).
  useEffect(() => {
    if (!call.errorMessage || call.activeCall) return;
    toast?.({ title: "Call", description: call.errorMessage, tone: "error" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.errorMessage]);

  const isGroupActive = activeConversation?.type === "GROUP";
  const isOtherTyping =
    !!activeConversation && Array.from(typingUserIds).some((id) => id !== currentUserId);

  return (
    <div className="comm-theme flex h-full min-h-0 flex-col" data-comm-theme={themeMode}>
      <IncomingCallModal call={call.incomingCall} onAccept={call.acceptCall} onDecline={call.declineCall} />

      {showGroupModal && (
        <GroupCreateModal
          onClose={() => setShowGroupModal(false)}
          onCreated={handleGroupCreated}
          onError={(msg) => toast?.({ title: "Couldn't create group", description: msg, tone: "error" })}
        />
      )}

      {showAddMembers && activeConversation && (
        <AddMembersModal
          conversationId={activeConversation.conversationId}
          existingMemberIds={(activeConversation.members || []).map((m) => m.id)}
          onClose={() => setShowAddMembers(false)}
          onAdded={handleAddedMembers}
          onError={(msg) => toast?.({ title: "Couldn't add members", description: msg, tone: "error" })}
        />
      )}

      {call.activeCall && (
        <CallWindow
          call={call.activeCall}
          callState={call.callState}
          localStream={call.localStream}
          remoteStream={call.remoteStream}
          muted={call.muted}
          cameraOff={call.cameraOff}
          screenSharing={call.screenSharing}
          durationSeconds={call.durationSeconds}
          errorMessage={call.errorMessage}
          onToggleMute={call.toggleMute}
          onToggleCamera={call.toggleCamera}
          onToggleScreenShare={call.toggleScreenShare}
          onEndCall={call.callState === "CALLING" ? call.cancelCall : call.endCall}
        />
      )}

      {!connected && (
        <div className="comm-animate-in comm-offline-banner">
          <WifiOff className="h-3.5 w-3.5" />
          {reconnecting ? "Reconnecting..." : "You're offline — messages will send once reconnected."}
        </div>
      )}

      <div className="comm-shell grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[320px_1fr]">
        {/* Column 1: conversation list (mobile: hidden once a chat is open) */}
        <div className={`comm-divider-r min-h-0 ${mobileShowChat ? "hidden md:block" : "block"}`}>
          <ConversationList
            conversations={conversations}
            loading={conversationsLoading}
            activeConversationId={activeConversation?.conversationId}
            isUserOnline={isUserOnline}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onSelectConversation={handleSelectConversation}
            onNewConversation={() => setShowUserSearch(true)}
            onNewGroup={() => setShowGroupModal(true)}
            themeMode={themeMode}
            onToggleTheme={toggleTheme}
          />
        </div>

        {/* Column 2: active chat OR new-conversation search OR empty state */}
        <div className={`flex min-h-0 flex-col ${mobileShowChat ? "block" : "hidden md:flex"}`}>
          {showUserSearch ? (
            <UserSearch
              isUserOnline={isUserOnline}
              onSelectUser={handleSelectUser}
              onClose={() => setShowUserSearch(false)}
            />
          ) : activeConversation ? (
            <>
              <ChatHeader
                conversation={activeConversation}
                otherUser={activeConversation.otherUser}
                online={isUserOnline(activeConversation.otherUser?.id)}
                onBack={() => setMobileShowChat(false)}
                onStartCall={handleStartCall}
                callDisabled={call.callState !== "IDLE"}
                onAddMembers={isGroupActive ? () => setShowAddMembers(true) : undefined}
                onLeaveGroup={isGroupActive ? handleLeaveGroup : undefined}
              />
              <MessageList
                messages={messages}
                loading={messagesLoading}
                loadingOlder={loadingOlder}
                hasMore={hasMore}
                currentUserId={currentUserId}
                conversationId={activeConversation.conversationId}
                initialUnreadCount={activeConversation.unreadCount}
                otherUserRead={otherUserReadUpTo}
                isOtherTyping={isOtherTyping}
                otherUserName={activeConversation.otherUser?.name}
                isGroup={isGroupActive}
                onLoadOlder={loadOlder}
                onReply={setReplyTo}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              <MessageComposer
                sending={sending}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onSendText={handleSendText}
                onSendVoice={handleSendVoice}
                onSendAttachments={handleSendAttachments}
                onTyping={notifyTyping}
              />
            </>
          ) : (
            <div className="comm-panel-chat flex flex-1 items-center justify-center p-8">
              <div className="comm-animate-in flex max-w-sm flex-col items-center text-center">
                <div className="comm-empty-icon comm-float mb-5" style={{ height: "5rem", width: "5rem" }}>
                  <MessagesSquare className="h-9 w-9" />
                </div>
                <h3 className="comm-empty-title text-lg">Select a conversation</h3>
                <p className="comm-empty-body mt-1.5">
                  Select a conversation to start messaging, or start a new one.
                </p>
                <button
                  type="button"
                  onClick={() => setShowUserSearch(true)}
                  className="comm-empty-cta mt-6 flex items-center gap-2"
                >
                  <SquarePen className="h-4 w-4" />
                  New conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
