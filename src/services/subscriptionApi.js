// src/services/subscriptionApi.js
//
// Single-purpose wrapper around the backend Subscription Management System:
//   /api/subscriptions/register/*  → FREE self-registration (no auth)
//   /api/subscriptions/login/*     → FREE login (no auth)
//   /api/subscriptions/*           → SuperAdmin subscription administration
//   /api/plans/*                   → SuperAdmin plan catalog
//   /api/notifications/*           → notification center (any authenticated user)
//
// Follows the same convention as features/aiAssistant/api.js and
// features/sapSync/api.js: this is the ONLY file in the app that knows
// these endpoint paths. Every subscription/plan/notification screen talks
// to the backend through the functions exported here, on top of the
// shared services/apiClient helpers, so auth headers, base URL, and the
// `{ success, message }` error contract stay centralized.
//
// PAID login/registration is untouched — this file never talks to
// /api/auth/*.

import { get, post, put } from "./apiClient";

// ─────────────────────────────────────────────────────────────
// Gated-error handling — 402/403 codes any subscription-aware call
// can return. Centralized here (rather than scattered per-screen)
// per the "handle globally" requirement. Screens call
// `getGateInfo(error)` in their catch blocks to decide whether to show
// the Upgrade modal instead of a plain error toast.
// ─────────────────────────────────────────────────────────────
export const GATE_CODES = {
  TRIAL_EXPIRED: "TRIAL_EXPIRED",
  SUBSCRIPTION_SUSPENDED: "SUBSCRIPTION_SUSPENDED",
  FEATURE_NOT_AVAILABLE: "FEATURE_NOT_AVAILABLE",
  PAID_PLAN_REQUIRED: "PAID_PLAN_REQUIRED",
};

const GATE_CODE_SET = new Set(Object.values(GATE_CODES));

/** Returns { code, feature, message } if `error` (thrown by apiClient) is
 * one of the four gated-access error shapes, otherwise null. Use this in a
 * catch block to branch to the Upgrade modal instead of a generic toast. */
export function getGateInfo(error) {
  const code = error?.payload?.code;
  if (!code || !GATE_CODE_SET.has(code)) return null;
  return { code, feature: error.payload.feature, message: error.payload.message };
}

export const isGatedError = (error) => getGateInfo(error) !== null;

// ─────────────────────────────────────────────────────────────
// FREE Registration — /api/subscriptions/register/* (no auth)
// Task 2 New Flow, matches backend exactly:
//   Step 1: POST /register/send-otp   { mobileNumber, email }
//           POST /register/verify-otp { mobileNumber, otp }
//   Step 2: POST /register/complete   { mobileNumber, ownerName, companyName, password, confirmPassword }
// ─────────────────────────────────────────────────────────────
export const FreeRegisterApi = {
  sendOtp: (mobileNumber, email) => post("/subscriptions/register/send-otp", { mobileNumber, email }),
  verifyOtp: (mobileNumber, otp) => post("/subscriptions/register/verify-otp", { mobileNumber, otp }),
  complete: ({ mobileNumber, ownerName, companyName, password, confirmPassword }) =>
    post("/subscriptions/register/complete", { mobileNumber, ownerName, companyName, password, confirmPassword }),
};

// ─────────────────────────────────────────────────────────────
// FREE Login — /api/subscriptions/login (no auth)
// Task 3: Email + Password only — there is no phone/OTP login on the
// backend. Login response includes { subscription: { status,
// remainingTrialDays, trialExpired } } which we cache below.
// ─────────────────────────────────────────────────────────────
export const FreeLoginApi = {
  login: ({ email, password }) => post("/subscriptions/login", { email, password }),
};

// ─────────────────────────────────────────────────────────────
// Task 4 — Subscription status (any authenticated tenant user)
// GET /api/subscriptions/status → { plan, status, trialStartDate,
// trialEndDate, trialRemainingDays, paymentStatus }. This is the live,
// server-derived source of truth — call it after login and whenever the
// dashboard needs a fresh read, rather than relying only on the cached
// login-time snapshot below.
// ─────────────────────────────────────────────────────────────
export const SubscriptionStatusApi = {
  get: () => get("/subscriptions/status"),
};

// ─────────────────────────────────────────────────────────────
// Subscription snapshot cache
// ─────────────────────────────────────────────────────────────
// The FREE login response includes a point-in-time { status,
// remainingTrialDays, trialExpired } snapshot. We cache it in
// localStorage right next to the JWT (same pattern App.jsx already uses
// to hydrate `user` on boot) so the trial banner has something to render
// immediately after login/refresh, before the live GET /status call
// resolves. Treat this as a fallback only — SubscriptionContext always
// prefers a fresh GET /status response when it has one.
const SNAPSHOT_KEY = "subscriptionSnapshot";

export function cacheSubscriptionSnapshot(subscription) {
  if (!subscription) {
    localStorage.removeItem(SNAPSHOT_KEY);
    return;
  }
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(subscription));
}

export function getCachedSubscriptionSnapshot() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSubscriptionSnapshot() {
  localStorage.removeItem(SNAPSHOT_KEY);
}

// ─────────────────────────────────────────────────────────────
// SuperAdmin — Subscription administration — /api/subscriptions/*
// ─────────────────────────────────────────────────────────────
export const SubscriptionAdminApi = {
  list: () => get("/subscriptions"),
  upgrade: (tenantId, { planCode, reason }) =>
    post(`/subscriptions/${tenantId}/upgrade`, { planCode, reason }),
  downgrade: (tenantId, { planCode, reason }) =>
    post(`/subscriptions/${tenantId}/downgrade`, { planCode, reason }),
  extendTrial: (tenantId, { days, reason }) =>
    post(`/subscriptions/${tenantId}/extend-trial`, { days, reason }),
  deactivateTrial: (tenantId, { reason }) =>
    post(`/subscriptions/${tenantId}/deactivate-trial`, { reason }),
  convertToPaid: (tenantId, { reason }) =>
    post(`/subscriptions/${tenantId}/convert-to-paid`, { reason }),
};

// ─────────────────────────────────────────────────────────────
// SuperAdmin — Plan catalog — /api/plans/*
// ─────────────────────────────────────────────────────────────
// Mirrors backend FEATURE_KEYS (src/constants/subscriptionConstants.js)
// exactly — keep this list in sync if the backend adds a key.
export const FEATURE_KEYS = [
  "SAP_SYNC",
  "AI_ASSISTANT",
  "AI_CHAT",
  "AI_SEARCH",
  "VECTOR_SEARCH",
  "OCR",
  "APPROVAL_WORKFLOW",
  "SEARCH",
  "METADATA",
  "ANALYTICS",
  "REPORTS",
  "WATERMARK",
  "NOTIFICATIONS",
];

export const FEATURE_LABELS = {
  SAP_SYNC: "SAP Synchronization",
  AI_ASSISTANT: "AI Assistant (umbrella)",
  AI_CHAT: "AI Chat",
  AI_SEARCH: "AI Search",
  VECTOR_SEARCH: "Vector Search",
  OCR: "OCR",
  APPROVAL_WORKFLOW: "Approval Workflow",
  SEARCH: "Search",
  METADATA: "Metadata",
  ANALYTICS: "Analytics",
  REPORTS: "Reports",
  WATERMARK: "Watermark",
  NOTIFICATIONS: "Notifications",
};

export const PlanApi = {
  list: () => get("/plans"),
  create: ({ code, name, isTrialable, trialDurationDays, priceMonthly, priceYearly, features }) =>
    post("/plans", { code, name, isTrialable, trialDurationDays, priceMonthly, priceYearly, features }),
  update: (id, body) => put(`/plans/${id}`, body),
  setFeature: (id, { featureKey, enabled, limitValue }) =>
    put(`/plans/${id}/features`, { featureKey, enabled, limitValue }),
};

// ─────────────────────────────────────────────────────────────
// Notifications — /api/notifications/*
// ─────────────────────────────────────────────────────────────
export const NotificationApi = {
  list: ({ unreadOnly } = {}) =>
    get(
      "/notifications",
      unreadOnly ? { unreadOnly: "true" } : undefined
    ),

  unreadCount: () =>
    get("/notifications/unread-count"),

  markRead: (id) =>
    put(`/notifications/${id}/read`),

  markAllRead: () =>
    put("/notifications/read-all"),
};

// Notification `type` → visual tone, so TRIAL_REMINDER/TRIAL_EXPIRED stand
// out from generic SYSTEM/SUBSCRIPTION_CHANGED notices.
export const NOTIFICATION_TONE = {
  TRIAL_REMINDER: "warning",
  TRIAL_EXPIRED: "danger",
  SUBSCRIPTION_CHANGED: "info",
  SYSTEM: "neutral",

  COMMUNICATION_MESSAGE: "info",
  COMMUNICATION_MISSED_CALL: "warning",

  APPROVAL_SUBMITTED: "info",
  APPROVAL_PENDING: "warning",
  APPROVAL_APPROVED: "info",
  APPROVAL_COMPLETED: "info",
  APPROVAL_REJECTED: "danger",
  APPROVAL_SENT_BACK: "warning",
  APPROVAL_CANCELLED: "neutral",
};
