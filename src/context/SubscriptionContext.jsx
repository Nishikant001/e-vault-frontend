// src/context/SubscriptionContext.jsx
//
// Read-side subscription state for FREE-tenant gating. Does NOT replace the
// existing auth pattern (user still lives in App.jsx's useState, hydrated
// from the JWT) — this only adds what that JWT doesn't carry: plan/trial
// status.
//
// IMPORTANT: the backend JWT (see src/services/jwtService.js) only carries
// { id, role, tenantId, email } — there is no tenantType claim, so this
// can never be read off the token. The only place plan/trial data lives is
// GET /api/subscriptions/status, which this context calls on mount (once
// a token exists) and exposes a `refresh()` to re-call after login or any
// action that could change it (upgrade, extend-trial, etc.).
//
// The FREE-login response snapshot (cached by services/subscriptionApi.js)
// is used only as an instant first paint before the live call resolves —
// the live GET /status response always overwrites it once it arrives.
//
// SuperAdmin (no tenant) and PAID tenants: `isFree` is false, so every
// gating check below is false and nothing here changes their experience.

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getToken } from "../services/apiClient";
import { SubscriptionStatusApi, getCachedSubscriptionSnapshot, cacheSubscriptionSnapshot } from "../services/subscriptionApi";

const SubscriptionContext = createContext(null);

function snapshotToState(snapshot) {
  if (!snapshot) return { plan: null, status: null, remainingTrialDays: null, trialExpired: false, trialEndDate: null };
  return {
    plan: snapshot.plan ?? null,
    status: snapshot.status ?? null,
    remainingTrialDays: snapshot.trialRemainingDays ?? snapshot.remainingTrialDays ?? null,
    trialExpired: snapshot.status === "EXPIRED" || !!snapshot.trialExpired,
    trialEndDate: snapshot.trialEndDate ?? null,
  };
}

export function SubscriptionProvider({ children }) {
  const [state, setState] = useState(() => snapshotToState(getCachedSubscriptionSnapshot()));
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setState(snapshotToState(null));
      setLoaded(true);
      return;
    }
    setLoading(true);
    try {
      const res = await SubscriptionStatusApi.get();
      const data = res?.data || res;
      cacheSubscriptionSnapshot(data);
      setState(snapshotToState(data));
    } catch {
      // SuperAdmin users (no tenant) get a 400 here — that's expected and
      // simply means "not a FREE/PAID tenant user", not an error to surface.
      setState(snapshotToState(null));
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { plan, status, remainingTrialDays, trialExpired, trialEndDate } = state;
  const isFree = plan?.code === "FREE";

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        planCode: plan?.code ?? null,
        isFree,
        status,
        remainingTrialDays,
        trialExpired,
        trialEndDate,
        loading,
        loaded,
        refresh,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within a SubscriptionProvider");
  return ctx;
}
