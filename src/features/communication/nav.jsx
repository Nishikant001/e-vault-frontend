// src/features/communication/nav.jsx
//
// Mirrors features/aiAssistant/nav.jsx exactly, so wiring Communication
// into App.jsx's per-role PAGE maps is a one-line addition per role —
// same pattern the codebase already uses for AI Assistant.
//
// Communication has a single page (no role-gated sub-pages), so this is
// intentionally simpler than the AI Assistant nav helper.

import CommunicationPage from "./pages/CommunicationPage";

export const COMMUNICATION_NAV_KEY = "communication";

/** Spread into TENANT_ADMIN_PAGES / BRANCH_MANAGER_PAGES / etc. in App.jsx,
 * exactly like `...buildAIAssistantPages(role)`. */
export function buildCommunicationPages() {
  return {
    [COMMUNICATION_NAV_KEY]: () => <CommunicationPage />,
  };
}

export const COMMUNICATION_PAGE_TITLES = {
  [COMMUNICATION_NAV_KEY]: "Communication",
};
