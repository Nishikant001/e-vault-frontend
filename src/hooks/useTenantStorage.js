import { useEffect, useState } from "react";
import { get } from "../services/apiClient";

export const FALLBACK_QUOTA_BYTES = 10 * 1024 ** 3; // backend ka default file quota

export function formatBytes(bytes = 0) {
  const n = Math.max(0, Number(bytes) || 0);
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.round(n / 1024)} KB`;
}

export function useTenantStorage() {
  const [s, setS] = useState({ usedBytes: 0, quotaBytes: FALLBACK_QUOTA_BYTES, loading: true });

  useEffect(() => {
    let alive = true;
    (async () => {
      // 1) Backend route (optional, tabhi chalega jab /tenants/my-storage add kiya ho)
      try {
        const r = await get("/tenants/my-storage");
        const d = r?.data;
        if (alive && d) {
          setS({ usedBytes: Number(d.usedBytes) || 0, quotaBytes: Number(d.quotaBytes) || FALLBACK_QUOTA_BYTES, loading: false });
          return;
        }
      } catch { /* fallback neeche */ }

      // 2) Fallback: documents ke fileSizeBytes ka sum
      try {
        const r = await get("/documents");
        const rows = Array.isArray(r?.data) ? r.data : [];
        const used = rows.reduce((sum, d) => sum + (Number(d.fileSizeBytes) || 0), 0);
        if (alive) setS({ usedBytes: used, quotaBytes: FALLBACK_QUOTA_BYTES, loading: false });
      } catch {
        if (alive) setS((p) => ({ ...p, loading: false }));
      }
    })();
    return () => { alive = false; };
  }, []);

  const percent = s.quotaBytes ? Math.min(100, Math.round((s.usedBytes / s.quotaBytes) * 100)) : 0;
  return { ...s, percent };
}