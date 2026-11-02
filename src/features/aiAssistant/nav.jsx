// src/features/aiAssistant/nav.js
import { MessageSquare, Search, FileText, GitCompare, History, Bookmark, Settings2 } from "lucide-react";
import { canViewAISettings } from "./api";
import AIChatPage from "./pages/AIChatPage";
import AISearchPage from "./pages/AISearchPage";
import AISummaryPage from "./pages/AISummaryPage";
import AIComparePage from "./pages/AIComparePage";
import AIRecentChatsPage from "./pages/AIRecentChatsPage";
import AISavedPromptsPage from "./pages/AISavedPromptsPage";
import AISettingsPage from "./pages/AISettingsPage";

// Every one of these keys must stay in sync with PAGE_TITLES and the
// per-role PAGE objects in App.jsx — see buildAIAssistantPages() below,
// which generates the render-functions for you.
export const AI_NAV_KEYS = {
  CHAT: "aiChat",
  SEARCH: "aiSearch",
  SUMMARIES: "aiSummaries",
  COMPARE: "aiCompare",
  RECENT_CHATS: "aiRecentChats",
  SAVED_PROMPTS: "aiSavedPrompts",
  SETTINGS: "aiSettings",
};

const ALL_NAV_ITEMS = [
  { key: AI_NAV_KEYS.CHAT, label: "AI Chat", icon: MessageSquare },
  { key: AI_NAV_KEYS.SEARCH, label: "AI Search", icon: Search },
  { key: AI_NAV_KEYS.SUMMARIES, label: "Summaries", icon: FileText },
  { key: AI_NAV_KEYS.COMPARE, label: "Compare Documents", icon: GitCompare },
  { key: AI_NAV_KEYS.RECENT_CHATS, label: "Recent Chats", icon: History },
  { key: AI_NAV_KEYS.SAVED_PROMPTS, label: "Saved Prompts", icon: Bookmark },
  { key: AI_NAV_KEYS.SETTINGS, label: "AI Settings", icon: Settings2, guard: canViewAISettings },
];

/** Returns the "AI Assistant" sidebar section for a given role, already
 * filtered (e.g. AI Settings only shows for roles the backend actually
 * lets view it — SuperAdmin/TenantAdmin/BranchManager/DeptHead/Manager/Auditor). */
export function getAIAssistantNavItems(role) {
  return ALL_NAV_ITEMS.filter((item) => !item.guard || item.guard(role));
}

export const AI_NAV_SECTION_LABEL = "AI Assistant";

/** Generates the { key: (nav) => <Page onNavigate={nav} /> } map for a role,
 * in exactly the shape App.jsx's PAGE objects already use — spread this
 * into TENANT_ADMIN_PAGES / BRANCH_MANAGER_PAGES / etc. */
export function buildAIAssistantPages(role) {
  return {
    [AI_NAV_KEYS.CHAT]: (nav) => <AIChatPage role={role} onNavigate={nav} />,
    [AI_NAV_KEYS.SEARCH]: (nav) => <AISearchPage onNavigate={nav} />,
    [AI_NAV_KEYS.SUMMARIES]: () => <AISummaryPage />,
    [AI_NAV_KEYS.COMPARE]: () => <AIComparePage />,
    [AI_NAV_KEYS.RECENT_CHATS]: (nav) => <AIRecentChatsPage onNavigate={nav} />,
    [AI_NAV_KEYS.SAVED_PROMPTS]: (nav) => <AISavedPromptsPage onNavigate={nav} />,
    [AI_NAV_KEYS.SETTINGS]: () => <AISettingsPage role={role} />,
  };
}

export const AI_PAGE_TITLES = {
  [AI_NAV_KEYS.CHAT]: "AI Chat",
  [AI_NAV_KEYS.SEARCH]: "AI Search",
  [AI_NAV_KEYS.SUMMARIES]: "Document Summaries",
  [AI_NAV_KEYS.COMPARE]: "Compare Documents",
  [AI_NAV_KEYS.RECENT_CHATS]: "Recent Chats",
  [AI_NAV_KEYS.SAVED_PROMPTS]: "Saved Prompts",
  [AI_NAV_KEYS.SETTINGS]: "AI Settings",
};
