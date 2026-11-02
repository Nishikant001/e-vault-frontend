// src/features/sapSync/pages/MasterSyncPage.jsx

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Download,
  Eye,
  Database,
  Info,
  Sparkles,
  Search,
} from "lucide-react";

import AppCard from "../../../components/ui/Card";
import AppButton from "../../../components/ui/Button";
import AppSearch from "../../../components/ui/SearchInput";
import AppModal from "../../../components/ui/Modal";
import StatusBadge from "../../../components/ui/StatusBadge";

import { useToast } from "../../../components/ui/Toast";

import { SapSyncApi } from "../api";
import { formatDateTime, statusTone } from "../constants";
import { useLabels } from "../../../context/MetadataContext";

import { useSapErpConnections } from "../hooks/useSapErpConnections";
import ErpConnectionSelect from "../components/ErpConnectionSelect";
import ErpMultiSelect from "../components/ErpMultiSelect";
import { summarizeMultiSync } from "../syncResultSummary";

const HIERARCHY_FETCH_LIMIT = 1000;

function getNodeId(record) {
  return record?.localId ?? record?.id ?? record?._id ?? null;
}

function getParentId(record) {
  return (
    record?.parentId ??
    record?.parentLocalId ??
    record?.departmentId ??
    record?.categoryId ??
    record?.deptId ??
    record?.catId ??
    record?.parentLocalName ??
    null
  );
}

function formatSourceLabel(source) {
  if (source === "SAP") return "ERP";
  if (source === "LOCAL") return "e-Vault";
  return source;
}

export default function MasterSyncPage() {
  const { toast } = useToast();
  const labels = useLabels();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [detail, setDetail] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [docTypes, setDocTypes] = useState([]);

  /*
   * MULTI ERP CONTEXT
   *
   * Existing single-ERP tenants continue to work exactly as before.
   *
   * If tenant has multiple active ERP connections:
   * - selectedErpConfigId contains selected ERP
   * - erpConfigIdForRequest is passed to backend
   * - Sync All uses /masters/all
   */
  const {
    connections,
    selectedErpConfigId,
    setSelectedErpConfigId,
    erpConfigIdForRequest,
    showSelector,
    showSyncAll,
    sapConnections,
    selectedErpConfigIds,
    toggleErpSelection,
    selectAllErps,
    clearErpSelection,
    erpConfigIdsForRequest,
    showMultiSelect,
  } = useSapErpConnections();

  const selectedConnection = useMemo(() => {
    if (!selectedErpConfigId) return null;

    return (
      connections.find(
        (connection) =>
          Number(connection.erpConfigId) === Number(selectedErpConfigId),
      ) || null
    );
  }, [connections, selectedErpConfigId]);

  /*
   * Load master records.
   *
   * IMPORTANT:
   * Master listing itself remains tenant scoped by backend.
   * We do not change the existing listing API unnecessarily.
   */
  const load = () => {
    setLoading(true);

    Promise.all([
      SapSyncApi.listMasters("departments", {
        page: 1,
        limit: HIERARCHY_FETCH_LIMIT,
      }),

      SapSyncApi.listMasters("categories", {
        page: 1,
        limit: HIERARCHY_FETCH_LIMIT,
      }),

      SapSyncApi.listMasters("document-types", {
        page: 1,
        limit: HIERARCHY_FETCH_LIMIT,
      }),
    ])
      .then(([deptRes, catRes, docRes]) => {
        setDepartments(deptRes.data || []);
        setCategories(catRes.data || []);
        setDocTypes(docRes.data || []);
      })
      .catch((e) =>
        toast({
          title: "Could not load master data",
          description: e.message,
          tone: "error",
        }),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * SINGLE ERP SYNC
   *
   * For multi-ERP tenant:
   * selected ERP ID is explicitly sent.
   *
   * For single-ERP tenant:
   * undefined is passed so backend keeps existing behaviour.
   */
  async function runSync() {
    if (showSelector && !erpConfigIdForRequest) {
      toast({
        title: "Select an ERP first",
        description:
          "Please select the ERP connection you want to synchronize.",
        tone: "error",
      });
      return;
    }

    setSyncing(true);

    try {
      await SapSyncApi.triggerMasterSync(erpConfigIdForRequest);

      toast({
        title: "Master Synchronization completed",
        description: selectedConnection
          ? `${selectedConnection.name} was synchronized successfully.`
          : "Master data was synchronized successfully.",
        tone: "success",
      });

      load();
    } catch (e) {
      toast({
        title: "Master Synchronization failed",
        description: e.message,
        tone: "error",
      });
    } finally {
      setSyncing(false);
    }
  }

  /*
   * SYNC ALL ACTIVE ERPs
   *
   * This is deliberately separate from single ERP sync.
   *
   * /masters/all
   *
   * Backend decides which active ERP connections belong to the tenant.
   */
  async function runSyncAll() {
    if (!showSyncAll) {
      await runSync();
      return;
    }

    setSyncing(true);

    try {
      const response = await SapSyncApi.triggerSyncAllMasters();

      const results = response?.data?.results || response?.results || [];

      const successCount = results.filter(
        (item) =>
          String(item?.status || "").toUpperCase() === "SUCCESS" ||
          String(item?.status || "").toUpperCase() === "COMPLETED",
      ).length;

      const failedCount = results.filter(
        (item) =>
          String(item?.status || "").toUpperCase() === "FAILED" ||
          String(item?.status || "").toUpperCase() === "ERROR",
      ).length;

      if (failedCount > 0 && successCount > 0) {
        toast({
          title: "Master Synchronization partially completed",
          description: `${successCount} ERP(s) completed and ${failedCount} ERP(s) failed.`,
          tone: "error",
        });
      } else if (failedCount > 0) {
        toast({
          title: "Master Synchronization failed",
          description: `${failedCount} ERP synchronization(s) failed.`,
          tone: "error",
        });
      } else {
        toast({
          title: "All ERP Master Synchronization completed",
          description:
            successCount > 0
              ? `${successCount} ERP synchronization(s) completed successfully.`
              : "All active ERP synchronization jobs were started.",
          tone: "success",
        });
      }

      load();
    } catch (e) {
      toast({
        title: "Sync All failed",
        description: e.message,
        tone: "error",
      });
    } finally {
      setSyncing(false);
    }
  }

  /*
   * SYNC SELECTED ERPs (flexible subset — e.g. 2 of 3)
   *
   * Sends erpConfigIds[] to /sap-sync/masters. Backend verifies every id
   * belongs to this tenant and runs each ERP independently, so one ERP
   * failing never stops the others.
   */
  async function runSyncSelected() {
  if (!erpConfigIdsForRequest) {
    toast({
      title: "Select at least one ERP",
      description: "Tick the ERP connections you want to synchronize.",
      tone: "error",
    });
    return;
  }

  const selectedIds = erpConfigIdsForRequest.map(Number);

  const selectedConnections = connections.filter((connection) =>
    selectedIds.includes(Number(connection.erpConfigId))
  );

  const sapIds = selectedConnections
    .filter(
      (connection) =>
        String(connection.erpType || "").toUpperCase() === "SAP"
    )
    .map((connection) => Number(connection.erpConfigId));

  const genericConnections = selectedConnections.filter(
    (connection) =>
      String(connection.erpType || "").toUpperCase() !== "SAP"
  );

  setSyncing(true);

  try {
    const tasks = [];

    // SAP connections: keep the existing SAP sync flow.
    if (sapIds.length > 0) {
      tasks.push(
        SapSyncApi.triggerMasterSync(sapIds).then(() => ({
          name: "SAP",
          status: "SUCCESS",
        }))
      );
    }

    // Oracle / Custom: use the generic ERP sync endpoint.
    for (const connection of genericConnections) {
      const erpConfigId = Number(connection.erpConfigId);

      tasks.push(
        Promise.all([
          SapSyncApi.triggerGenericErpSync(
            erpConfigId,
            "CATEGORY"
          ),
          SapSyncApi.triggerGenericErpSync(
            erpConfigId,
            "DOCUMENT_TYPE"
          ),
        ]).then(() => ({
          name: connection.name || connection.erpType,
          status: "SUCCESS",
        }))
      );
    }

    const results = await Promise.allSettled(tasks);

    const successful = results.filter(
      (result) => result.status === "fulfilled"
    );

    const failed = results.filter(
      (result) => result.status === "rejected"
    );

    if (failed.length > 0) {
      toast({
        title:
          successful.length > 0
            ? "Sync partially completed"
            : "Sync Selected failed",
        description: `${successful.length} ERP(s) succeeded, ${failed.length} ERP(s) failed. ${failed[0].reason?.message || ""}`,
        tone: "error",
      });
    } else {
      toast({
        title: "Sync Selected completed",
        description: `${successful.length} ERP(s) synchronized successfully.`,
        tone: "success",
      });
    }

    load();
  } catch (e) {
    toast({
      title: "Sync Selected failed",
      description: e.message,
      tone: "error",
    });
  } finally {
    setSyncing(false);
  }
}

  // ---------------------------------------------------------
  // Build ONE flat combined list:
  // Department > Category > Document Type
  // ---------------------------------------------------------

  const combinedRows = useMemo(() => {
    const rows = [];

    const catToDept = {};

    categories.forEach((cat) => {
      const dept = departments.find((d) => getNodeId(d) === getParentId(cat));

      catToDept[getNodeId(cat)] = dept || null;
    });

    const usedCatIds = new Set();
    const usedDeptIds = new Set();

    docTypes.forEach((doc) => {
      const cat = categories.find((c) => getNodeId(c) === getParentId(doc));

      const dept = cat ? catToDept[getNodeId(cat)] : null;

      if (cat) {
        usedCatIds.add(getNodeId(cat));
      }

      if (dept) {
        usedDeptIds.add(getNodeId(dept));
      }

      rows.push({
        key: `doc-${getNodeId(doc)}`,
        deptId: dept ? getNodeId(dept) : "—",
        department: dept?.localName || "—",
        catId: cat ? getNodeId(cat) : "—",
        category: cat?.localName || "—",
        documentType: doc.localName,
        sapCode: doc.sapCode,
        syncStatus: doc.syncStatus,
        lastSyncTime: doc.lastSyncTime,
        source: doc.source,
        erpSourceName: doc.erpSourceName,
        raw: doc,
      });
    });

    categories.forEach((cat) => {
      const catId = getNodeId(cat);

      if (usedCatIds.has(catId)) return;

      const dept = catToDept[catId];

      if (dept) {
        usedDeptIds.add(getNodeId(dept));
      }

      rows.push({
        key: `cat-${catId}`,
        deptId: dept ? getNodeId(dept) : "—",
        department: dept?.localName || "—",
        catId,
        category: cat.localName,
        documentType: "—",
        sapCode: cat.sapCode,
        syncStatus: cat.syncStatus,
        lastSyncTime: cat.lastSyncTime,
        source: cat.source,
        erpSourceName: cat.erpSourceName,
        raw: cat,
      });
    });

    departments.forEach((dept) => {
      const deptId = getNodeId(dept);

      if (usedDeptIds.has(deptId)) return;

      rows.push({
        key: `dept-${deptId}`,
        deptId,
        department: dept.localName,
        catId: "—",
        category: "—",
        documentType: "—",
        sapCode: dept.sapCode,
        syncStatus: dept.syncStatus,
        lastSyncTime: dept.lastSyncTime,
        source: dept.source,
        erpSourceName: dept.erpSourceName,
        raw: dept,
      });
    });

    rows.sort((a, b) => {
      const d = a.department.localeCompare(b.department);

      if (d !== 0) return d;

      const c = a.category.localeCompare(b.category);

      if (c !== 0) return c;

      return a.documentType.localeCompare(b.documentType);
    });

    return rows;
  }, [departments, categories, docTypes]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return combinedRows;

    const q = search.trim().toLowerCase();

    return combinedRows.filter(
      (r) =>
        r.department.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.documentType.toLowerCase().includes(q) ||
        (r.sapCode || "").toLowerCase().includes(q),
    );
  }, [combinedRows, search]);

  const spannedRows = useMemo(() => {
    return filteredRows.map((row, i) => {
      const prev = filteredRows[i - 1];

      const sameDept = prev && prev.department === row.department;

      const sameCat = sameDept && prev.category === row.category;

      let deptSpan = 0;

      if (!sameDept) {
        deptSpan = 1;

        for (
          let j = i + 1;
          j < filteredRows.length &&
          filteredRows[j].department === row.department;
          j++
        ) {
          deptSpan++;
        }
      }

      let catSpan = 0;

      if (!sameCat) {
        catSpan = 1;

        for (
          let j = i + 1;
          j < filteredRows.length &&
          filteredRows[j].department === row.department &&
          filteredRows[j].category === row.category;
          j++
        ) {
          catSpan++;
        }
      }

      return {
        ...row,
        showDept: !sameDept,
        deptSpan,
        showCat: !sameCat,
        catSpan,
      };
    });
  }, [filteredRows]);

  function exportCsv() {
    const header = [
      labels.level1Label,
      labels.level2Label,
      labels.level3Label,
      "ERP Code",
      "Sync Status",
      "Last Sync Time",
      "Source",
    ];

    const lines = filteredRows.map((r) => [
      r.department,
      r.category,
      r.documentType,
      r.sapCode,
      r.syncStatus,
      formatDateTime(r.lastSyncTime),
      formatSourceLabel(r.source),
    ]);

    const csv = [header, ...lines]
      .map((row) =>
        row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "sap-masters-combined.csv";

    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <MasterSyncGuideModal
        open={showGuide}
        onClose={() => setShowGuide(false)}
      />

      <AppCard>
        {/* PAGE IDENTITY */}
<div className="relative z-20 rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]">
  <div className="absolute inset-x-0 top-0 h-px rounded-t-app-lg bg-brand-500/30" />

          <div className="flex flex-col gap-5 p-5 lg:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex min-w-0 items-start gap-3.5">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-app-md bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
                  <Database className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                      Masterdata Synchronization
                    </h1>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/15 bg-brand-500/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                      SAP Master Data Pipeline
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowGuide(true)}
                      aria-label="View Master Synchronization guide"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-brand-500/20 bg-brand-500/5 text-brand-500 transition-all hover:bg-brand-500/10 hover:text-brand-600"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--text-tertiary)]">
                    {labels.level1Label} → {labels.level2Label} →{" "}
                    {labels.level3Label} hierarchy synced from ERP master data.
                  </p>
                </div>
              </div>
            </div>

            {/* ERP CONTROL BAR */}
<div className="relative z-30 rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-sunken)]/45 p-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    {/* <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                      ERP Connection
                    </span> */}
                  </div>

                  {showSelector && (
                    <div className="w-full sm:w-[275px] shrink-0">
                      <ErpConnectionSelect
                        connections={connections}
                        value={selectedErpConfigId}
                        onChange={setSelectedErpConfigId}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
                  <AppButton
                    variant="secondary"
                    size="sm"
                    icon={RefreshCw}
                    onClick={load}
                    disabled={loading || syncing}
                  >
                    Refresh
                  </AppButton>

                  {showMultiSelect && (
                    <>
                      <div className="shrink-0">
                        <ErpMultiSelect
                          connections={sapConnections}
                          selectedIds={selectedErpConfigIds}
                          onToggle={toggleErpSelection}
                          onSelectAll={selectAllErps}
                          onClear={clearErpSelection}
                          disabled={syncing}
                        />
                      </div>

                      <AppButton
                        variant="secondary"
                        size="sm"
                        icon={Database}
                        loading={syncing}
                        disabled={syncing || !erpConfigIdsForRequest}
                        onClick={runSyncSelected}
                      >
                        Sync Selected ({selectedErpConfigIds.length})
                      </AppButton>
                    </>
                  )}

                  {showSyncAll ? (
                    <AppButton
                      size="sm"
                      icon={Database}
                      loading={syncing}
                      disabled={syncing}
                      onClick={runSyncAll}
                    >
                      Sync All ERPs
                    </AppButton>
                  ) : (
                    <AppButton
                      size="sm"
                      icon={Database}
                      loading={syncing}
                      disabled={syncing}
                      onClick={runSync}
                    >
                      Sync All Masters
                    </AppButton>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {showSelector && (
          <div className="mb-4 flex items-center justify-between rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3 py-2">
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-tertiary)]">
                ACTIVE ERP
              </p>

              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {selectedConnection?.name || "Select ERP connection"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-[var(--text-tertiary)]">
                ERP Code
              </p>

              <p className="font-mono text-xs text-[var(--text-secondary)]">
                {selectedConnection?.erpConfigId || "—"}
              </p>
            </div>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <AppSearch
            value={search}
            onChange={setSearch}
            placeholder={`Search ${labels.level1Label}, ${labels.level2Label} or ${labels.level3Label}…`}
            className="max-w-sm"
          />

          <AppButton
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={exportCsv}
          >
            Export
          </AppButton>
        </div>

        {loading ? (
          <div className="space-y-2 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-app-md bg-[var(--surface-sunken)]"
              />
            ))}
          </div>
        ) : spannedRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-[var(--text-tertiary)]">
            <Search className="h-7 w-7 opacity-40" />

            <span className="text-[12.5px]">
              {search
                ? "No matches found."
                : "No master data found. Run a Master Synchronization first."}
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-app-md border border-[var(--border-subtle)]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--surface-sunken)] text-left text-[11px] font-semibold text-[var(--text-tertiary)]">
                  <th className="px-3 py-2">{labels.level1Label}</th>

                  <th className="px-3 py-2">{labels.level2Label}</th>

                  <th className="px-3 py-2">{labels.level3Label}</th>

                  <th className="px-3 py-2">ERP Code</th>

                  <th className="px-3 py-2">Sync Status</th>

                  <th className="px-3 py-2">Last Sync Time</th>

                  <th className="px-3 py-2">Source</th>

                  <th className="px-3 py-2" />
                </tr>
              </thead>

              <tbody>
                {spannedRows.map((r) => (
                  <tr
                    key={r.key}
                    className="border-t border-[var(--border-subtle)] hover:bg-[var(--surface-sunken)]/60"
                  >
                    {r.showDept && (
                      <td
                        rowSpan={r.deptSpan}
                        className="align-top px-3 py-2 font-medium text-[var(--text-primary)] border-r border-[var(--border-subtle)]"
                      >
                        {r.department}
                      </td>
                    )}

                    {r.showCat && (
                      <td
                        rowSpan={r.catSpan}
                        className="align-top px-3 py-2 font-medium text-[var(--text-secondary)] border-r border-[var(--border-subtle)]"
                      >
                        {r.category}
                      </td>
                    )}

                    <td className="px-3 py-2 text-[var(--text-secondary)]">
                      {r.documentType}
                    </td>

                    <td className="px-3 py-2 font-mono text-xs">
                      {r.sapCode || "—"}
                    </td>

                    <td className="px-3 py-2">
                      <StatusBadge
                        status={r.syncStatus}
                        tone={statusTone(r.syncStatus)}
                      />
                    </td>

                    <td className="px-3 py-2">
                      {formatDateTime(r.lastSyncTime)}
                    </td>

                    <td className="px-3 py-2">
                      {r.erpSourceName ? (
                        <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                          {r.erpSourceName}
                        </span>
                      ) : (
                        <StatusBadge
                          status={formatSourceLabel(r.source)}
                          tone={r.source === "SAP" ? "info" : "neutral"}
                          showIcon={false}
                        />
                      )}
                    </td>

                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetail(r.raw);
                        }}
                        className="rounded-app-sm p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] hover:text-brand-500"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AppCard>

      <AppModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Master Record Details"
        size="sm"
      >
        {detail && (
          <dl className="space-y-3 text-sm">
            <Row label="ERP Code" value={detail.sapCode || "—"} />

            <Row label="Local Name" value={detail.localName} />

            <Row label="Local ID" value={detail.localId} />

            <Row
              label="Sync Status"
              value={
                <StatusBadge
                  status={detail.syncStatus}
                  tone={statusTone(detail.syncStatus)}
                />
              }
            />

            <Row
              label="Last Sync Time"
              value={formatDateTime(detail.lastSyncTime)}
            />

            <Row label="Source" value={formatSourceLabel(detail.source)} />
          </dl>
        )}
      </AppModal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-2 last:border-0">
      <dt className="text-[var(--text-tertiary)]">{label}</dt>

      <dd className="font-medium text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}

function MasterSyncGuideModal({ open, onClose }) {
  const steps = [
    {
      icon: Database,
      title: "Sync all masters",
      desc: "Click Sync All Masters to pull the latest Departments, Categories and Document Types from ERP.",
    },
    {
      icon: Search,
      title: "One grouped list",
      desc: "Departments and Categories only print once per group — every row underneath belongs to that same Department / Category, just like a merged spreadsheet.",
    },
    {
      icon: Download,
      title: "Export a list",
      desc: "Use Export to download the currently filtered combined list as a CSV file.",
    },
  ];

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          Master Synchronization — Guide
        </span>
      }
      footer={
        <AppButton variant="primary" onClick={onClose}>
          Got it
        </AppButton>
      }
    >
      <div className="space-y-4">
        {steps.map((s, i) => (
          <div key={s.title} className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
              <s.icon className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {i + 1}. {s.title}
              </p>

              <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-tertiary)]">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </AppModal>
  );
}
