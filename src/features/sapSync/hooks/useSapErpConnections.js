// src/features/sapSync/hooks/useSapErpConnections.js
//
// PHASE 3 — Tenant-side Multi-ERP / Default ERP Management
//
// Shared across:
//   - SapSyncDashboard
//   - MasterSyncPage
//   - DocumentSyncPage
//
// Responsibilities:
//   1. Load ERP connections assigned to the current tenant.
//   2. Keep only active SAP connections for SAP OData sync.
//   3. Automatically select the tenant's default SAP ERP.
//   4. Allow Tenant Admin to change the default ERP.
//   5. Refresh the ERP list after changing the default.
//   6. Preserve the existing single-ERP behavior.
//

import { useCallback, useEffect, useMemo, useState } from "react";
import { SapSyncApi } from "../api";

export function useSapErpConnections() {
  const [connections, setConnections] = useState([]);
  const [selectedErpConfigId, setSelectedErpConfigId] = useState(null);

  // FLEXIBLE MULTI-SELECT SYNC — a separate array of checked ERP ids,
  // used by "Sync Selected" (pick ANY subset — 1, 2, or all of them) as
  // opposed to selectedErpConfigId above, which is the single "active
  // ERP for the next single-ERP action" used everywhere else. The two
  // are independent: checking boxes here never changes
  // selectedErpConfigId, and vice versa.
  const [selectedErpConfigIds, setSelectedErpConfigIds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [settingDefault, setSettingDefault] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load ERP connections assigned to the current tenant.
   *
   * This endpoint must return only the ERP connections belonging
   * to the authenticated tenant.
   */
  const loadConnections = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await SapSyncApi.listErpConnections();

      const list = Array.isArray(res?.data) ? res.data : [];

      setConnections(list);

      /**
       * SAP OData can only work with SAP ERP connections.
       *
       * Even if the tenant-wide default is CUSTOM/ORACLE,
       * never select that connection for SAP synchronization.
       */
            const activeSapConnections = list.filter(
        (connection) =>
          connection?.isActive !== false &&
          String(connection?.status || "").toUpperCase() !== "INACTIVE"
      );

      /**
       * Selection rules:
       *
       * 1. If there is exactly one active SAP ERP:
       *    automatically use it.
       *
       * 2. If there are multiple active SAP ERPs:
       *    use the tenant's default SAP ERP if available.
       *
       * 3. If tenant-wide default is CUSTOM/ORACLE:
       *    do NOT select it for SAP sync.
       *
       * 4. If multiple SAP ERPs exist but none is default:
       *    leave selection empty so the user explicitly chooses one.
       */
      if (activeSapConnections.length === 1) {
        setSelectedErpConfigId(activeSapConnections[0].erpConfigId);
      } else if (activeSapConnections.length > 1) {
        const defaultSapConnection = activeSapConnections.find(
          (connection) => connection.isDefault === true
        );

        setSelectedErpConfigId(
          defaultSapConnection
            ? defaultSapConnection.erpConfigId
            : null
        );
      } else {
        setSelectedErpConfigId(null);
      }

      // FLEXIBLE MULTI-SELECT SYNC — default every active SAP ERP to
      // checked, so "Sync Selected" starts equivalent to "Sync All" and
      // the Tenant Admin just unchecks whichever ones they DON'T want
      // this time, rather than having to check everything from empty.
      setSelectedErpConfigIds(
        activeSapConnections.map((connection) => connection.erpConfigId)
      );

      return list;
    } catch (err) {
      console.error(
        "[SAP ERP Connections] Failed to load ERP connections:",
        err
      );

      setConnections([]);
      setSelectedErpConfigId(null);
      setSelectedErpConfigIds([]);

      setError(
        err?.message ||
          "Unable to load ERP connections."
      );

      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial load.
   */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (cancelled) return;

      await loadConnections();
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [loadConnections]);

  /**
   * Active connections assigned to this tenant.
   *
   * This contains all ERP types because the Tenant Admin
   * may need to see which ERP is the tenant-wide default.
   */
  const activeConnections = useMemo(() => {
    return connections.filter(
      (connection) =>
        connection?.isActive !== false &&
        String(connection?.status || "").toUpperCase() !== "INACTIVE"
    );
  }, [connections]);

  /**
   * Active SAP connections only.
   *
   * SAP OData pages should use this list.
   */
    const sapConnections = useMemo(() => {
    return activeConnections;
  }, [activeConnections]);

  /**
   * Tenant-wide default connection.
   *
   * This can be SAP, ORACLE or CUSTOM.
   */
  const defaultConnection = useMemo(() => {
    return activeConnections.find(
      (connection) => connection.isDefault === true
    ) || null;
  }, [activeConnections]);

  /**
   * Default SAP connection.
   *
   * Important:
   * A CUSTOM/ORACLE tenant-wide default must never be used
   * as the SAP OData connection.
   */
  const defaultSapConnection = useMemo(() => {
    return sapConnections.find(
      (connection) => connection.isDefault === true
    ) || null;
  }, [sapConnections]);

  /**
   * Change tenant-wide default ERP.
   *
   * This is intentionally exposed from the hook so the same
   * operation can be used by Tenant Admin UI without duplicating
   * API/state logic in every SAP page.
   *
   * The backend must validate that:
   * - the connection belongs to the current tenant
   * - the connection is active
   * - only one connection becomes default
   */
  const setDefaultErp = useCallback(
    async (erpConfigId) => {
      if (
        erpConfigId === undefined ||
        erpConfigId === null ||
        erpConfigId === ""
      ) {
        throw new Error("ERP configuration is required.");
      }

      setSettingDefault(true);
      setError(null);

      try {
        /**
         * Tenant-side default endpoint.
         *
         * Keep this API call centralized here so pages don't
         * need to know the backend URL.
         */
        if (typeof SapSyncApi.setDefaultErpConnection !== "function") {
          throw new Error(
            "setDefaultErpConnection API is not available."
          );
        }

        await SapSyncApi.setDefaultErpConnection(
          Number(erpConfigId)
        );

        /**
         * Reload from server rather than manually modifying state.
         *
         * This guarantees that the UI reflects the actual database
         * state after the backend has enforced the one-default rule.
         */
        await loadConnections();

        return true;
      } catch (err) {
        console.error(
          "[SAP ERP Connections] Failed to set default ERP:",
          err
        );

        const message =
          err?.message ||
          "Unable to change the default ERP.";

        setError(message);

        throw err;
      } finally {
        setSettingDefault(false);
      }
    },
    [loadConnections]
  );

  // FLEXIBLE MULTI-SELECT SYNC ─────────────────────────────────────
  //
  // toggleErpSelection: flips one ERP's checkbox on/off.
  // selectAllErps / clearErpSelection: bulk actions for a "select all /
  // clear" link next to the checkbox list.
  //
  // All three only ever touch selectedErpConfigIds — they never affect
  // selectedErpConfigId (the single-ERP selector used everywhere else).

  const toggleErpSelection = useCallback((erpConfigId) => {
    const id = Number(erpConfigId);

    setSelectedErpConfigIds((current) =>
      current.includes(id)
        ? current.filter((existing) => existing !== id)
        : [...current, id]
    );
  }, []);

  const selectAllErps = useCallback(() => {
    setSelectedErpConfigIds(
      sapConnections.map((connection) => connection.erpConfigId)
    );
  }, [sapConnections]);

  const clearErpSelection = useCallback(() => {
    setSelectedErpConfigIds([]);
  }, []);

  /**
   * Explicitly select an ERP for the current SAP sync operation.
   *
   * This does NOT change the tenant-wide default.
   */
  const selectErp = useCallback((erpConfigId) => {
    if (
      erpConfigId === undefined ||
      erpConfigId === null ||
      erpConfigId === ""
    ) {
      setSelectedErpConfigId(null);
      return;
    }

    const id = Number(erpConfigId);

    const exists = sapConnections.some(
      (connection) =>
        Number(connection.erpConfigId) === id
    );

    if (!exists) {
      console.warn(
        "[SAP ERP Connections] Ignoring ERP selection because it is not an active SAP connection:",
        erpConfigId
      );
      return;
    }

    setSelectedErpConfigId(id);
  }, [sapConnections]);

  /**
   * ERP id sent to SAP sync API.
   *
   * Single SAP ERP:
   *   send the ERP id explicitly as well; backend can validate it.
   *
   * Multiple SAP ERPs:
   *   send the selected ERP.
   *
   * No SAP ERP:
   *   undefined.
   */
  const erpConfigIdForRequest = useMemo(() => {
    if (sapConnections.length === 0) {
      return undefined;
    }

    if (sapConnections.length === 1) {
      return sapConnections[0].erpConfigId;
    }

    return selectedErpConfigId || undefined;
  }, [sapConnections, selectedErpConfigId]);

  /**
   * Whether the ERP selector should be displayed.
   */
  const showSelector = sapConnections.length > 1;

  /**
   * "Sync All" is meaningful only when multiple SAP
   * connections are assigned.
   */
  const showSyncAll = sapConnections.length > 1;

  /**
   * User must explicitly choose an ERP when multiple SAP
   * connections exist but none is selected.
   */
  const requiresErpSelection =
    sapConnections.length > 1 &&
    !selectedErpConfigId;

  // FLEXIBLE MULTI-SELECT SYNC ─────────────────────────────────────
  //
  // showMultiSelect: only worth showing checkboxes when there's more
  // than one SAP ERP to choose between — same threshold as showSelector
  // above.
  //
  // erpConfigIdsForRequest: the array to actually send to
  // SapSyncApi.triggerMasterSync/triggerDocumentSync for "Sync
  // Selected". null when nothing is checked, so callers can disable the
  // button / show a validation message instead of sending an empty
  // list (which the backend would otherwise reject as "no ERP given").
  const showMultiSelect = sapConnections.length > 1;

  const erpConfigIdsForRequest = useMemo(() => {
    if (selectedErpConfigIds.length === 0) return null;
    return selectedErpConfigIds;
  }, [selectedErpConfigIds]);

  return {
    // All active tenant ERP connections
    connections: activeConnections,

    // Active SAP connections used by SAP OData
    sapConnections,

    // Current tenant-wide default
    defaultConnection,

    // Current default only if it is SAP
    defaultSapConnection,

    // Current SAP sync selection
    selectedErpConfigId,

    // Direct setter kept for existing components
    setSelectedErpConfigId,

    // Safer selection helper
    selectErp,

    // Tenant Admin default operation
    setDefaultErp,

    // Request value for SAP sync APIs
    erpConfigIdForRequest,

    // FLEXIBLE MULTI-SELECT SYNC — checkbox-driven "Sync Selected"
    selectedErpConfigIds,
    toggleErpSelection,
    selectAllErps,
    clearErpSelection,
    erpConfigIdsForRequest,
    showMultiSelect,

    // UI state
    showSelector,
    showSyncAll,
    requiresErpSelection,

    // Loading/error state
    loadingConnections: loading,
    settingDefault,
    error,

    // Useful for refresh buttons/components
    reloadConnections: loadConnections,
  };
}