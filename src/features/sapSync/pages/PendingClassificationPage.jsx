// src/features/sapSync/pages/PendingClassificationPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, ListChecks, Save, Eye } from "lucide-react";
import AppCard, { CardHeader } from "../../../components/ui/Card";
import AppTable from "../../../components/ui/Table";
import AppButton from "../../../components/ui/Button";
import Pagination from "../../../components/ui/Pagination";
import StatusBadge from "../../../components/ui/StatusBadge";
import AppModal from "../../../components/ui/Modal";
import AppSelect from "../../../components/ui/Select";
import { useToast } from "../../../components/ui/Toast";
import { SapSyncApi, getCurrentTenantId } from "../api";
import { formatDateTime, statusTone } from "../constants";

const PAGE_SIZE = 10;

/* ---------------------------------------------------------
 * Helpers
 * --------------------------------------------------------- */

// "0000000000000010000000243" -> "10000000243"
function trimLeadingZeros(value) {
  if (!value) return value;
  const trimmed = String(value).replace(/^0+(?=\d)/, "");
  return trimmed || "0";
}

/* ---------------------------------------------------------
 * SapIdCell — short value by default, full value in a
 * floating tooltip on hover
 * --------------------------------------------------------- */
function SapIdCell({ value }) {
  const short = trimLeadingZeros(value);
  const isTrimmed = short !== value;

  return (
    <span className="group/id relative inline-flex max-w-[110px] cursor-default font-mono text-[11px] text-[var(--text-primary)]">
      <span className="truncate">{short}</span>
      {isTrimmed && (
        <span
          className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden whitespace-nowrap rounded-md border border-[var(--border-primary)] bg-[var(--surface-2)] px-2 py-1 text-[11px] font-mono text-[var(--text-primary)] shadow-lg group-hover/id:block"
        >
          {value}
        </span>
      )}
    </span>
  );
}

/* ---------------------------------------------------------
 * MarqueeText — truncated by default, on hover slides the
 * text right-to-left just enough to reveal the full string,
 * then resets when the mouse leaves
 * --------------------------------------------------------- */
function MarqueeText({ text, className = "", widthClass = "max-w-[180px]" }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [hovering, setHovering] = useState(false);

  const handleEnter = () => {
    const container = containerRef.current;
    const label = textRef.current;
    if (!container || !label) return;
    const overflow = label.scrollWidth - container.clientWidth;
    if (overflow > 0) {
      setOffset(overflow);
      setHovering(true);
    }
  };

  const handleLeave = () => {
    setHovering(false);
    setOffset(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      title={text}
      className={`relative overflow-hidden whitespace-nowrap ${widthClass} ${className}`}
    >
      <span
        ref={textRef}
        className="inline-block ease-linear"
        style={{
          transform: hovering ? `translateX(-${offset}px)` : "translateX(0)",
          transition: hovering
            ? `transform ${Math.min(Math.max(offset * 8, 900), 4000)}ms linear`
            : "transform 200ms ease-out",
        }}
      >
        {text}
      </span>
    </div>
  );
}

export default function PendingClassificationPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [pageInfo, setPageInfo] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [assignTarget, setAssignTarget] = useState(null); // single row | "bulk" | null
  const [refData, setRefData] = useState({ departments: [], categories: [], documentTypes: [] });
  const [viewingId, setViewingId] = useState(null);

  const handleViewDocument = async (row) => {
    setViewingId(row.id);
    try {
      const res = await SapSyncApi.viewPendingClassificationDocument(row.id);
      if (!res.ok) {
        let message = `Could not open document (HTTP ${res.status}).`;
        try {
          const errBody = await res.json();
          message = errBody.message || message;
        } catch {
          // response wasn't JSON — keep the generic message
        }
        throw new Error(message);
      }
      const blob = await res.blob();
      if (!blob.size) throw new Error("Document file not found.");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) {
      toast({ title: "Could not open document", description: e.message, tone: "error" });
    } finally {
      setViewingId(null);
    }
  };

  const load = () => {
    setLoading(true);
    SapSyncApi.listPendingClassification({ page, limit: PAGE_SIZE })
      .then((res) => {
        setRows(res.data || []);
        setPageInfo(res.pagination || { total: 0, page: 1, totalPages: 1 });
      })
      .catch((e) => toast({ title: "Could not load pending classification list", description: e.message, tone: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]); // eslint-disable-line

  useEffect(() => {
    const tenantId = getCurrentTenantId();
    if (!tenantId) return;
    Promise.all([SapSyncApi.listDepartmentsLite(tenantId), SapSyncApi.listCategoriesLite(), SapSyncApi.listDocumentTypesLite()])
      .then(([d, c, t]) => setRefData({ departments: d.data || [], categories: c.data || [], documentTypes: t.data || [] }))
      .catch(() => {});
  }, []);

  const columns = useMemo(
    () => [
      {
        key: "sapDocumentId",
        header: "SAP Document ID",
        width: "120px",
        render: (r) => <SapIdCell value={r.sapDocumentId} />,
      },
      {
        key: "filename",
        header: "Filename",
        width: "190px",
        render: (r) => (
          <MarqueeText text={r.filename} widthClass="max-w-[180px]" className="text-xs" />
        ),
      },
      {
        key: "missingFields",
        header: "Missing Fields",
        width: "150px",
        render: (r) => (
          <div className="flex max-w-[150px] flex-wrap gap-1">
            {r.missingFields.map((f) => (
              <StatusBadge key={f} status={f} tone="warning" showIcon={false} className="text-[10px]" />
            ))}
          </div>
        ),
      },
      {
        key: "reason",
        header: "Reason",
        width: "150px",
        render: (r) => (
          <span className="block max-w-[150px] truncate text-[11px] text-[var(--text-tertiary)]" title={r.reason}>
            {r.reason}
          </span>
        ),
      },
      {
        key: "importedDate",
        header: "Imported Date",
        width: "110px",
        render: (r) => <span className="whitespace-nowrap text-[11px]">{formatDateTime(r.importedDate)}</span>,
      },
      {
        key: "status",
        header: "Status",
        width: "90px",
        render: (r) => <StatusBadge status={r.status} tone={statusTone(r.status)} className="text-[10px]" />,
      },
      {
        key: "actions",
        header: "",
        width: "110px",
        render: (r) => (
          <div className="flex items-center justify-end gap-1.5">
            <AppButton
              size="sm"
              variant="secondary"
              icon={Eye}
              title="View Document"
              loading={viewingId === r.id}
              className="!h-8 !w-8 !p-0 justify-center"
              onClick={(e) => { e.stopPropagation(); handleViewDocument(r); }}
            />
            <AppButton
              size="sm"
              variant="secondary"
              icon={ListChecks}
              title="Assign Mapping"
              className="!h-8 !w-8 !p-0 justify-center"
              onClick={(e) => { e.stopPropagation(); setAssignTarget(r); }}
            />
          </div>
        ),
      },
    ],
    [viewingId]
  );

  return (
    <div className="space-y-4">
      <AppCard>
        <CardHeader
          title="Pending Classification"
          subtitle="SAP documents imported without a resolvable Department, Category, or Document Type."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <AppButton variant="secondary" size="sm" icon={RefreshCw} onClick={load}>
                Refresh
              </AppButton>
              {selected.length > 0 && (
                <AppButton size="sm" icon={ListChecks} onClick={() => setAssignTarget("bulk")}>
                  Bulk Mapping ({selected.length})
                </AppButton>
              )}
            </div>
          }
        />

        <div className="overflow-x-hidden">
          <AppTable
            columns={columns}
            rows={rows}
            loading={loading}
            selectable
            selectedRows={selected}
            onSelectRows={setSelected}
            tableClassName="table-fixed w-full"
            emptyTitle="Nothing pending classification"
            emptyDescription="Every synced document currently has a resolved Department, Category and Document Type."
          />
        </div>
        <Pagination page={pageInfo.page} totalPages={pageInfo.totalPages} onChange={setPage} totalItems={pageInfo.total} pageSize={PAGE_SIZE} />
      </AppCard>

      <AssignModal
        target={assignTarget}
        selectedIds={selected}
        refData={refData}
        onClose={() => setAssignTarget(null)}
        onSaved={() => {
          setAssignTarget(null);
          setSelected([]);
          load();
        }}
      />
    </div>
  );
}

function AssignModal({ target, selectedIds, refData, onClose, onSaved }) {
  const { toast } = useToast();
  const [departmentId, setDepartmentId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [documentTypeId, setDocumentTypeId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDepartmentId("");
    setCategoryId("");
    setDocumentTypeId("");
  }, [target]);


  // NEW: filter categories by selected department
// Category — department select hone ke baad hi dikhaye
const filteredCategories = useMemo(() => {
  if (!departmentId) return [];   // pehle: return refData.categories
  return refData.categories.filter(
    (c) => Number(c.departmentId) === Number(departmentId)
  );
}, [refData.categories, departmentId]);

// Document Type — category select hone ke baad hi dikhaye
const filteredDocumentTypes = useMemo(() => {
  if (!categoryId) return [];   // pehle: return refData.documentTypes
  return refData.documentTypes.filter(
    (t) => Number(t.categoryId) === Number(categoryId)
  );
}, [refData.documentTypes, categoryId]);

  // NEW: handlers that reset child selections
  const handleDepartmentChange = (e) => {
    setDepartmentId(e.target.value);
    setCategoryId("");
    setDocumentTypeId("");
  };

  const handleCategoryChange = (e) => {
    setCategoryId(e.target.value);
    setDocumentTypeId("");
  };

  if (!target) return null;
  const isBulk = target === "bulk";

  async function save() {
    const payload = {};
    if (departmentId) payload.departmentId = Number(departmentId);
    if (categoryId) payload.categoryId = Number(categoryId);
    if (documentTypeId) payload.documentTypeId = Number(documentTypeId);
    if (!Object.keys(payload).length) {
      toast({ title: "Select at least one field to assign", tone: "warning" });
      return;
    }
    setSaving(true);
    try {
      if (isBulk) {
        await SapSyncApi.bulkAssignClassification(selectedIds.map((id) => ({ id, ...payload })));
        toast({ title: `Mapping applied to ${selectedIds.length} document(s)`, tone: "success" });
      } else {
        await SapSyncApi.assignClassification(target.id, payload);
        toast({ title: "Mapping saved", tone: "success" });
      }
      onSaved();
    } catch (e) {
      toast({ title: "Save Mapping failed", description: e.message, tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      open={!!target}
      onClose={onClose}
      title={isBulk ? `Bulk Mapping — ${selectedIds.length} document(s)` : `Assign Mapping — ${target.sapDocumentId}`}
      size="sm"
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose} disabled={saving}>Cancel</AppButton>
          <AppButton icon={Save} onClick={save} loading={saving}>Save Mapping</AppButton>
        </>
      }
    >
      <div className="space-y-4">
        <AppSelect label="Department" value={departmentId} onChange={handleDepartmentChange}>
          <option value="">Leave unchanged</option>
          {refData.departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </AppSelect>

        <AppSelect label="Category" value={categoryId} onChange={handleCategoryChange} disabled={!departmentId}>
  <option value="">
    {departmentId ? "Leave unchanged" : "Select a department first"}
  </option>
  {filteredCategories.map((c) => (
    <option key={c.id} value={c.id}>{c.name}</option>
  ))}
</AppSelect>

        <AppSelect label="Document Type" value={documentTypeId} onChange={(e) => setDocumentTypeId(e.target.value)} disabled={!categoryId}>
  <option value="">
    {categoryId ? "Leave unchanged" : "Select a category first"}
  </option>
  {filteredDocumentTypes.map((t) => (
    <option key={t.id} value={t.id}>{t.name}</option>
  ))}
</AppSelect>
      </div>
    </AppModal>
  );
}