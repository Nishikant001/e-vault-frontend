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
import AppCard, { CardHeader } from "../../../components/ui/Card";
import AppButton from "../../../components/ui/Button";
import AppSearch from "../../../components/ui/SearchInput";
import AppModal from "../../../components/ui/Modal";
import StatusBadge from "../../../components/ui/StatusBadge";
import { useToast } from "../../../components/ui/Toast";
import { SapSyncApi } from "../api";
import { formatDateTime, statusTone } from "../constants";
import { useLabels } from "../../../context/MetadataContext";

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

  const load = () => {
    setLoading(true);
    Promise.all([
      SapSyncApi.listMasters("departments", { page: 1, limit: HIERARCHY_FETCH_LIMIT }),
      SapSyncApi.listMasters("categories", { page: 1, limit: HIERARCHY_FETCH_LIMIT }),
      SapSyncApi.listMasters("document-types", { page: 1, limit: HIERARCHY_FETCH_LIMIT }),
    ])
      .then(([deptRes, catRes, docRes]) => {
        setDepartments(deptRes.data || []);
        setCategories(catRes.data || []);
        setDocTypes(docRes.data || []);
      })
      .catch((e) =>
        toast({ title: "Could not load master data", description: e.message, tone: "error" })
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line

  async function runSync() {
    setSyncing(true);
    try {
      await SapSyncApi.triggerMasterSync();
      toast({ title: "Master Synchronization completed", tone: "success" });
      load();
    } catch (e) {
      toast({ title: "Master Synchronization failed", description: e.message, tone: "error" });
    } finally {
      setSyncing(false);
    }
  }

  // ---- Build ONE flat combined list: Department > Category > Document Type ----
  // Sorted by department name then category name so rowSpan grouping works.
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
      if (cat) usedCatIds.add(getNodeId(cat));
      if (dept) usedDeptIds.add(getNodeId(dept));

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
        raw: doc,
      });
    });

    categories.forEach((cat) => {
      const catId = getNodeId(cat);
      if (usedCatIds.has(catId)) return;
      const dept = catToDept[catId];
      if (dept) usedDeptIds.add(getNodeId(dept));
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
        raw: dept,
      });
    });

    // Sort so identical department/category values sit next to each other —
    // required for the rowSpan grouping to render correctly below.
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
        (r.sapCode || "").toLowerCase().includes(q)
    );
  }, [combinedRows, search]);

  // ---- Compute rowSpan for Department and Category columns ----
  // A cell only renders (with its span count) on the FIRST row of its group;
  // every following row in that same group renders nothing for that column.
  const spannedRows = useMemo(() => {
    return filteredRows.map((row, i) => {
      const prev = filteredRows[i - 1];

      const sameDept = prev && prev.department === row.department;
      const sameCat = sameDept && prev.category === row.category;

      let deptSpan = 0;
      if (!sameDept) {
        deptSpan = 1;
        for (let j = i + 1; j < filteredRows.length && filteredRows[j].department === row.department; j++) {
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

      return { ...row, showDept: !sameDept, deptSpan, showCat: !sameCat, catSpan };
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
      r.source,
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sap-masters-combined.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <MasterSyncGuideModal open={showGuide} onClose={() => setShowGuide(false)} />

      <AppCard>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <span className="text-lg font-bold text-[var(--text-primary)]">
                Masterdata Synchronization
              </span>
              <button
                type="button"
                onClick={() => setShowGuide(true)}
                aria-label="View Master Synchronization guide"
                className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white ring-4 ring-brand-500/20 animate-pulse transition-colors hover:animate-none hover:bg-brand-600"
              >
                <Info className="h-3 w-3" />
              </button>
            </span>
          }
          subtitle={`${labels.level1Label} → ${labels.level2Label} → ${labels.level3Label} hierarchy synced from ERP master data.`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <AppButton variant="secondary" size="sm" icon={RefreshCw} onClick={load}>
                Refresh
              </AppButton>
              <AppButton size="sm" icon={Database} loading={syncing} disabled={syncing} onClick={runSync}>
                Sync All Masters
              </AppButton>
            </div>
          }
        />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <AppSearch
            value={search}
            onChange={setSearch}
            placeholder={`Search ${labels.level1Label}, ${labels.level2Label} or ${labels.level3Label}…`}
            className="max-w-sm"
          />
          <AppButton variant="secondary" size="sm" icon={Download} onClick={exportCsv}>
            Export
          </AppButton>
        </div>

        {loading ? (
          <div className="space-y-2 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-app-md bg-[var(--surface-sunken)]" />
            ))}
          </div>
        ) : spannedRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-[var(--text-tertiary)]">
            <Search className="h-7 w-7 opacity-40" />
            <span className="text-[12.5px]">
              {search ? "No matches found." : "No master data found. Run a Master Synchronization first."}
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-app-md border border-[var(--border-subtle)]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--surface-sunken)] text-left text-xs font-semibold text-[var(--text-tertiary)]">
                  <th className="px-4 py-3">{labels.level1Label}</th>
                  <th className="px-4 py-3">{labels.level2Label}</th>
                  <th className="px-4 py-3">{labels.level3Label}</th>
                  <th className="px-4 py-3">ERP Code</th>
                  <th className="px-4 py-3">Sync Status</th>
                  <th className="px-4 py-3">Last Sync Time</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {spannedRows.map((r) => (
                  <tr key={r.key} className="border-t border-[var(--border-subtle)] hover:bg-[var(--surface-sunken)]/60">
                    {r.showDept && (
                      <td
                        rowSpan={r.deptSpan}
                        className="align-top px-4 py-3 font-semibold text-[var(--text-primary)] border-r border-[var(--border-subtle)]"
                      >
                        {r.department}
                      </td>
                    )}
                    {r.showCat && (
                      <td
                        rowSpan={r.catSpan}
                        className="align-top px-4 py-3 font-medium text-[var(--text-secondary)] border-r border-[var(--border-subtle)]"
                      >
                        {r.category}
                      </td>
                    )}
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{r.documentType}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.sapCode || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.syncStatus} tone={statusTone(r.syncStatus)} />
                    </td>
                    <td className="px-4 py-3">{formatDateTime(r.lastSyncTime)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.source} tone={r.source === "SAP" ? "info" : "neutral"} showIcon={false} />
                    </td>
                    <td className="px-4 py-3">
                      <button
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

      <AppModal open={!!detail} onClose={() => setDetail(null)} title="Master Record Details" size="sm">
        {detail && (
          <dl className="space-y-3 text-sm">
            <Row label="SAP Code" value={detail.sapCode || "—"} />
            <Row label="Local Name" value={detail.localName} />
            <Row label="Local ID" value={detail.localId} />
            <Row label="Sync Status" value={<StatusBadge status={detail.syncStatus} tone={statusTone(detail.syncStatus)} />} />
            <Row label="Last Sync Time" value={formatDateTime(detail.lastSyncTime)} />
            <Row label="Source" value={detail.source} />
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
      desc: "Use Export to download the currently filtered combined list as a CSV file (flat, one row per item).",
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
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-tertiary)]">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </AppModal>
  );
}