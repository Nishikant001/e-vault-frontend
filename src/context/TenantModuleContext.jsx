import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMyModules } from "../services/tenantModuleApi";

const TenantModuleContext = createContext(null);

export function TenantModuleProvider({ user, children }) {
  const [modules, setModules] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const refreshModules = useCallback(async () => {
    if (!user || user.role === "SuperAdmin" || !user.tenantId) {
      setModules([]);
      setStatus("ready");
      setError(null);
      return [];
    }
    setStatus("loading");
    setError(null);
    try {
      const response = await getMyModules();
      const list = Array.isArray(response?.data) ? response.data : [];
      setModules(list.filter((m) => m && (m.enabled === true || m.isActive === true)));
      setStatus("ready");
      return list;
    } catch (err) {
      // Existing pages must remain usable during a transient entitlement API
      // outage. The backend remains the security source of truth; no new
      // optional frontend module is granted by this fallback.
      setModules([]);
      setStatus("error");
      setError(err);
      return [];
    }
  }, [user?.role, user?.tenantId]);

  useEffect(() => {
    let cancelled = false;
    if (!user || user.role === "SuperAdmin" || !user.tenantId) {
      setModules([]);
      setStatus("ready");
      setError(null);
      return undefined;
    }
    setStatus("loading");
    setError(null);
    getMyModules()
      .then((response) => {
        if (cancelled) return;
        const list = Array.isArray(response?.data) ? response.data : [];
        setModules(list.filter((m) => m && (m.enabled === true || m.isActive === true)));
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setModules([]);
        setStatus("error");
        setError(err);
      });
    return () => { cancelled = true; };
  }, [user?.role, user?.tenantId]);

  const moduleKeys = useMemo(() => new Set(modules.map((m) => m.module_key || m.moduleKey)), [modules]);

  const hasModule = useCallback((moduleKey) => {
    if (!moduleKey || user?.role === "SuperAdmin") return true;
    // Existing pages remain available during a temporary module-service
    // outage; once the service is healthy, the backend response is enforced.
    if (status === "error" || status === "idle") return true;
    return moduleKeys.has(moduleKey);
  }, [moduleKeys, status, user?.role]);

  const value = useMemo(() => ({
    modules,
    status,
    error,
    loading: status === "loading",
    ready: status === "ready",
    refreshModules,
    hasModule,
    isModuleVisible: hasModule,
  }), [modules, status, error, refreshModules, hasModule]);

  return <TenantModuleContext.Provider value={value}>{children}</TenantModuleContext.Provider>;
}

export function useTenantModules() {
  const value = useContext(TenantModuleContext);
  if (!value) throw new Error("useTenantModules must be used inside TenantModuleProvider");
  return value;
}
