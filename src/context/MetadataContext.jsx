// src/context/MetadataContext.jsx
//
// Single centralized provider for tenant-facing terminology/hierarchy.
// Fetches GET /api/tenants/me/metadata once per session and makes the
// result available to the entire app via three hooks:
//
//   useMetadata()   -> { hierarchy, loading, error, refetch }  (raw access)
//   useHierarchy()  -> the ordered hierarchy array, sorted by `level`
//   useLabels()     -> { level1Label, level2Label, level3Label, labelFor(key) }
//
// Every page that currently hardcodes "Department" / "Category" /
// "Document Type" as a literal string should instead call useLabels() and
// read .level1Label / .level2Label / .level3Label (or labelFor("DEPARTMENT")
// etc. when working with the "DEPARTMENT"/"CATEGORY"/"DOCUMENT_TYPE" type
// keys already used internally, e.g. in treeDataSource.js).
//
// Defaults to Golyan wording (DEFAULT_HIERARCHY) until the fetch resolves,
// and permanently for unauthenticated pages (Login, marketing site) that
// never call fetchMetadata at all — so there is no loading flash or layout
// shift for the current tenant.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { get, getToken } from "../services/apiClient";
import { DEFAULT_HIERARCHY } from "./defaultHierarchy";

const MetadataContext = createContext(null);

// ── ERP / Non-ERP Tenant Classification ─────────────────────────────
// Default tenant-capability shape used before the first successful fetch
// (or when it fails/errors) resolves. `erpEnabled: true` is a deliberate
// "fail open" choice: it means "don't hide ERP UI while we don't yet
// know better", so a transient metadata-fetch failure never yanks the
// SAP Sync section away from an existing PAID+ERP tenant. Real ERP_NOT_ENABLED
// enforcement always happens server-side (403) regardless of this flag —
// this state only drives what the sidebar/routes show, never a security
// boundary. FREE tenants are unaffected: their gating is entirely driven
// by SubscriptionContext's `isFree`, not by this.
const DEFAULT_TENANT_CAPABILITIES = {
  tenantType: null,
  erpEnabled: true,
  erpConfigId: null,
  erpConfig: null,
};

export function MetadataProvider({ children }) {
  const [hierarchy, setHierarchy] = useState(DEFAULT_HIERARCHY);
  const [tenantCapabilities, setTenantCapabilities] = useState(DEFAULT_TENANT_CAPABILITIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetadata = useCallback(async () => {
    // No token yet (Login page, marketing site, or logged out) — nothing
    // to fetch, and no reason to error; keep the Golyan defaults.
    if (!getToken()) {
      setHierarchy(DEFAULT_HIERARCHY);
      setTenantCapabilities(DEFAULT_TENANT_CAPABILITIES);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await get("/tenants/me/metadata");
      const data = res?.data || {};
      const fetched = data.hierarchy;
      setHierarchy(Array.isArray(fetched) && fetched.length > 0 ? fetched : DEFAULT_HIERARCHY);

      // Backward compatibility: some legacy tenant API responses may not
      // include `erpEnabled` at all. If it's missing but an erpConfigId IS
      // present, treat the tenant as ERP-enabled (the config assignment is
      // the stronger signal) rather than incorrectly hiding ERP features.
      // Use the backend's actual response as the source of truth whenever
      // erpEnabled IS present, even if it's explicitly false.
      const erpConfigId = data.erpConfigId ?? null;
      let erpEnabled;
      if (data.erpEnabled !== undefined && data.erpEnabled !== null) {
        erpEnabled = !!data.erpEnabled;
      } else {
        erpEnabled = !!erpConfigId;
      }

      setTenantCapabilities({
        tenantType: data.tenantType ?? null,
        erpEnabled,
        erpConfigId,
        erpConfig: data.erpConfig ?? null,
      });
    } catch (err) {
      // Fail soft: keep whatever hierarchy/capabilities we already had
      // (defaults, most likely) rather than breaking every page that
      // renders a label or gates a nav section.
      setError(err.message || "Failed to load tenant metadata");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  const value = useMemo(
    () => ({ hierarchy, tenantCapabilities, loading, error, refetch: fetchMetadata }),
    [hierarchy, tenantCapabilities, loading, error, fetchMetadata]
  );

  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>;
}

export function useMetadata() {
  const ctx = useContext(MetadataContext);
  if (!ctx) {
    // Defensive fallback rather than throwing — several pages (Home/*,
    // Login) render outside <MetadataProvider> today and that's fine, they
    // just get Golyan defaults instead of a crash.
    return {
      hierarchy: DEFAULT_HIERARCHY,
      tenantCapabilities: DEFAULT_TENANT_CAPABILITIES,
      loading: false,
      error: null,
      refetch: () => {},
    };
  }
  return ctx;
}

/**
 * ERP / Non-ERP Tenant Classification — read access to the current
 * tenant's ERP capability (tenantType / erpEnabled / erpConfigId /
 * erpConfig), sourced from GET /api/tenants/me/metadata via
 * MetadataProvider (see fetchMetadata above). This is the single place
 * the rest of the app should read this from — do not decode it off the
 * JWT (the token only carries {id, role, tenantId, email}, see
 * services/jwtService.js) and do not add a second fetch/provider for it.
 */
export function useTenantCapabilities() {
  const { tenantCapabilities } = useMetadata();
  return tenantCapabilities;
}

/** Ordered hierarchy array, sorted by `level` (1 = top). */
export function useHierarchy() {
  const { hierarchy } = useMetadata();
  return useMemo(() => [...hierarchy].sort((a, b) => a.level - b.level), [hierarchy]);
}

/**
 * Convenience label accessors. `level1Label`/`level2Label`/`level3Label`
 * match the exact names the original spec's Step 3 example JSON used, for
 * pages doing a direct 3-level swap (e.g. EntityComboSelector.jsx,
 * TAFolder.jsx breadcrumb config). `labelFor(key)` looks up by the internal
 * "DEPARTMENT"/"CATEGORY"/"DOCUMENT_TYPE" key already used throughout the
 * app (treeDataSource.js, sapSyncConstants-style type discriminators) for
 * places that don't think in terms of "level 1/2/3".
 */
export function useLabels() {
  const hierarchy = useHierarchy();

  return useMemo(() => {
    const byKey = Object.fromEntries(hierarchy.map((h) => [h.key, h]));
    const byLevel = Object.fromEntries(hierarchy.map((h) => [h.level, h]));

    const labelFor = (key, fallback) => byKey[key]?.label ?? fallback ?? key;

    return {
      level1Label: byLevel[1]?.label ?? "Department",
      level2Label: byLevel[2]?.label ?? "Category",
      level3Label: byLevel[3]?.label ?? "Document Type",
      labelFor,
    };
  }, [hierarchy]);
}
