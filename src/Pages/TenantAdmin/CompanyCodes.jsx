import { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Plus,
  X,
  Search,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Factory,
  Power,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";

import { API_BASE_URL } from "../../services/apiClient";

const API = API_BASE_URL;

function getToken() {
  return localStorage.getItem("accessToken") || "";
}
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

const PAGE_SIZE = 8;

// ── Status Badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`text-[10px] font-bold px-[10px] py-[3px] rounded-full border whitespace-nowrap ${
        active
          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
          : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

const CODE_COLORS = [
  "bg-blue-600",
  "bg-purple-600",
  "bg-emerald-600",
  "bg-orange-500",
  "bg-pink-600",
  "bg-teal-600",
  "bg-indigo-600",
];
function codeColor(code = "") {
  let n = 0;
  for (let i = 0; i < code.length; i++) n += code.charCodeAt(i);
  return CODE_COLORS[n % CODE_COLORS.length];
}
// ── Simple SVG Donut Chart (no extra dependency) ─────────────
function DonutChart({ active, inactive }) {
  const total = active + inactive;
  const size = 128;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const activePct = total === 0 ? 0 : active / total;
  const activeLen = circumference * activePct;

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-100 dark:text-slate-700"
        />
        {total > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={`${activeLen} ${circumference - activeLen}`}
            strokeLinecap="round"
            className="text-blue-600 dark:text-blue-500 -rotate-90 origin-center transition-all duration-500"
          />
        )}
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-800 dark:fill-slate-100 text-[22px] font-bold"
        >
          {total}
        </text>
        <text
          x="50%"
          y="64%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-400 text-[9px] font-semibold uppercase tracking-wider"
        >
          Plants
        </text>
      </svg>
    </div>
  );
}
// ── Create / Edit Modal ─────────────────────────────────────────
function CompanyCodeModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial;
  const [code, setCode] = useState(initial?.code || "");
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!isEdit && !code.trim()) return setError("Company code is required.");
    if (!name.trim()) return setError("Name is required.");

    setLoading(true);
    try {
      const url = isEdit
        ? `${API}/company-codes/${initial.id}`
        : `${API}/company-codes`;
      const body = isEdit
        ? { name: name.trim(), description: description.trim() || undefined }
        : {
            code: code.trim().toUpperCase(),
            name: name.trim(),
            description: description.trim() || undefined,
          };

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        return setError(data.message || "Failed to save company code.");
      onSaved();
      onClose();
    } catch {
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
              {isEdit ? "Edit Company Code" : "New Company Code"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Code {!isEdit && <span className="text-red-500">*</span>}
            </label>
            {isEdit ? (
              <div className="bg-slate-50 dark:bg-[#151E2B] rounded-xl px-3 py-[10px] text-[13px] font-mono font-bold text-slate-600 dark:text-slate-400">
                {initial.code}
              </div>
            ) : (
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="e.g. 1000, IN01"
                maxLength={10}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] font-mono bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600"
              />
            )}
            {!isEdit && (
              <p className="text-[10px] text-slate-400 mt-1">
                Short unique code within your tenant — auto-uppercased.
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="e.g. Acme India Pvt Ltd"
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Description{" "}
              <span className="text-slate-400 font-normal normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              rows={3}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-[12px] font-semibold text-red-600 dark:text-red-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-[9px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Create Company Code"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete / Deactivate Confirm ─────────────────────────────────
function DeleteModal({ item, onClose, onConfirm, loading, error }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 text-center mb-1">
          Delete Company Code?
        </h3>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 text-center mb-4">
          <span className="font-bold text-slate-700 dark:text-slate-200">
            "{item.name}"
          </span>{" "}
          will be marked inactive. This is blocked if it still has active
          plants.
        </p>
        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-[12px] font-semibold text-red-600 dark:text-red-400 mb-4">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-[9px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold transition disabled:opacity-60"
          >
            {loading ? "Deleting…" : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
// ── Guide / Info Modal ──────────────────────────────────────────
function GuideModal({ onClose }) {
  const steps = [
    {
      title: "Create a Company Code",
      desc: "Click the + button to add a new company code. Give it a short unique code (e.g. 1000, IN01) and a name.",
    },
    {
      title: "Select a Company Code",
      desc: "Click any company code from the list on the left to view its details on the right.",
    },
    {
      title: "Add Plants",
      desc: "Company codes don't have plants by default — go to the Plants page to create plants and link them to a company code.",
    },
    {
      title: "Edit Details",
      desc: "Use the Edit button in the details panel to update the name or description. The code itself cannot be changed after creation.",
    },
    {
      title: "Deactivate",
      desc: "Deactivating marks a company code inactive. This is blocked if it still has active plants under it — deactivate or reassign those first.",
    },
  ];
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Info className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
              Company Codes — Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {steps.map((s, i) => (
            <div key={s.title} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <div className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
                  {s.title}
                </div>
                <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-[9px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function CompanyCodes() {
  const [companyCodes, setCompanyCodes] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  async function fetchCompanyCodes() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/company-codes`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to load company codes");
      setCompanyCodes(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlants() {
    try {
      const res = await fetch(`${API}/plants`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setPlants(data.data || []);
    } catch {}
  }

  useEffect(() => { fetchCompanyCodes(); fetchPlants(); }, []);

  useEffect(() => { setPage(1); }, [search]);

  // Auto-select the first company code once the list loads, so details
  // show immediately instead of the empty "select one" placeholder.
  useEffect(() => {
    if (!loading && !selected && companyCodes.length > 0) {
      setSelected(companyCodes[0]);
    }
  }, [loading, companyCodes]);

  const filtered = useMemo(
    () =>
      companyCodes.filter(
        (c) =>
          c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.code?.toLowerCase().includes(search.toLowerCase()),
      ),
    [companyCodes, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const plantsFor = (companyCodeId) =>
    plants.filter((p) => p.companyCodeId === companyCodeId);
  const selectedPlants = selected ? plantsFor(selected.id) : [];

  async function handleDeleteConfirm() {
    if (!deleteItem) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`${API}/company-codes/${deleteItem.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDeleteError(data.message || "Failed to delete.");
        return;
      }
      if (selected?.id === deleteItem.id) setSelected(null);
      setDeleteItem(null);
      fetchCompanyCodes();
    } catch {
      setDeleteError("Server error.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex gap-0 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden min-h-[600px] bg-white dark:bg-[#1A2433]">
      {/* ── LEFT: List ── */}
      <div className="w-[320px] min-w-[320px] border-r border-slate-200 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-[#151E2B]">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-[17px] font-bold text-slate-800 dark:text-slate-100">
                  Company Codes
                </h2>
                <div className="relative group">
                  <button
                    onClick={() => setShowGuide(true)}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 hover:bg-blue-500 hover:text-white transition-colors"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                  <div className="pointer-events-none absolute left-0 top-full mt-2 w-56 bg-slate-800 dark:bg-slate-700 text-white text-[10.5px] leading-relaxed rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                    Click to see a step-by-step guide on how to use this page.
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {companyCodes.length}
                </span>{" "}
                company code(s)
                <span className="mx-2 opacity-40">·</span>
                Tenant &rarr; Company Code &rarr; Plant
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="w-12 h-7 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
            >
              <Plus className="w-5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-6 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or code…"
            className="w-full text-[11px] pl-8 pr-3 py-[6px] border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition placeholder-slate-300 dark:placeholder-slate-600"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[11px]">Loading…</span>
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-[11px] font-semibold text-red-500">{error}</p>
            </div>
          )}
          {!loading &&
            !error &&
            paged.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-100 dark:border-slate-700 transition-all ${
                  selected?.id === c.id
                    ? "bg-white dark:bg-[#1A2433] border-l-2 border-l-blue-600"
                    : "hover:bg-white dark:hover:bg-[#1A2433]"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ${c.status === "ACTIVE" ? codeColor(c.code) : "bg-slate-400"}`}
                >
                  {c.code?.slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {c.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {c.code} · {plantsFor(c.id).length} plants
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-10 text-[11px] text-slate-400">
              No company codes found.
            </div>
          )}
        </div>

        {!loading && !error && filtered.length > 0 && (
          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700/40 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700/40 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Details ── */}
      {/* ── RIGHT: Details ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-[#151E2B]/40">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 p-10">
            <Building2 className="w-10 h-10 opacity-40" />
            <span className="text-[13px]">
              Select a company code to view details
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A2433]">
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white ${selected.status === "ACTIVE" ? codeColor(selected.code) : "bg-slate-400"}`}
                  >
                    {selected.code?.slice(0, 3)}
                  </div>
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
                    {selected.name}
                  </span>
                  <StatusBadge status={selected.status} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-9">
                  {selected.description || "No description"} · Code:{" "}
                  <span className="font-mono font-bold text-blue-500">
                    {selected.code}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditItem(selected)}
                  className="text-[11px] font-semibold px-3 py-[6px] border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => {
                    setDeleteItem(selected);
                    setDeleteError("");
                  }}
                  className="text-[11px] font-semibold px-3 py-[6px] rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition flex items-center gap-1.5"
                >
                  <Power className="w-3 h-3" /> Deactivate
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-5">
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    label: "Total Plants",
                    value: selectedPlants.length,
                    icon: Factory,
                    tone: "text-blue-600 dark:text-blue-400",
                    bg: "bg-blue-50 dark:bg-blue-900/20",
                  },
                  {
                    label: "Active Plants",
                    value: selectedPlants.filter((p) => p.status === "ACTIVE")
                      .length,
                    icon: CheckCircle2,
                    tone: "text-green-600 dark:text-green-400",
                    bg: "bg-green-50 dark:bg-green-900/20",
                  },
                  {
                    label: "Inactive Plants",
                    value: selectedPlants.filter((p) => p.status !== "ACTIVE")
                      .length,
                    icon: XCircle,
                    tone: "text-red-500 dark:text-red-400",
                    bg: "bg-red-50 dark:bg-red-900/20",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-3 shadow-sm"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}
                    >
                      <s.icon className={`w-5 h-5 ${s.tone}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate">
                        {s.label}
                      </div>
                      <div
                        className={`text-[22px] font-bold leading-tight ${s.tone}`}
                      >
                        {s.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table + Chart row */}
              <div className="grid grid-cols-3 gap-4 items-start">
                {/* Plants table */}
                <div className="col-span-2 bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <h4 className="text-[12px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Factory className="w-3.5 h-3.5" /> Plants under this
                      company code
                    </h4>
                  </div>
                  {selectedPlants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-3 text-slate-400">
                      <Factory className="w-8 h-8 opacity-40" />
                      <span className="text-[12px]">
                        No plants yet. Add plants from the Plants page.
                      </span>
                    </div>
                  ) : (
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-[#151E2B]">
                          {["Code", "Name", "Status"].map((h) => (
                            <th
                              key={h}
                              className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 py-2 border-b border-slate-200 dark:border-slate-700"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPlants.map((p) => (
                          <tr
                            key={p.id}
                            className="border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-[#151E2B] transition"
                          >
                            <td className="px-4 py-[10px] font-mono text-slate-500 dark:text-slate-400">
                              {p.code}
                            </td>
                            <td className="px-4 py-[10px] font-semibold text-slate-800 dark:text-slate-100">
                              {p.name}
                            </td>
                            <td className="px-4 py-[10px]">
                              <StatusBadge status={p.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Right column: chart + info */}
                <div className="col-span-1 flex flex-col gap-4">
                  <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                    <h4 className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-2">
                      Plant Status Breakdown
                    </h4>
                    <DonutChart
                      active={
                        selectedPlants.filter((p) => p.status === "ACTIVE")
                          .length
                      }
                      inactive={
                        selectedPlants.filter((p) => p.status !== "ACTIVE")
                          .length
                      }
                    />
                    <div className="flex items-center justify-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />{" "}
                        Active
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" />{" "}
                        Inactive
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
                    <h4 className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Company Details
                    </h4>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Code</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                          {selected.code}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Status</span>
                        <StatusBadge status={selected.status} />
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-slate-400 flex-shrink-0">
                          Description
                        </span>
                        <span className="text-slate-700 dark:text-slate-200 text-right">
                          {selected.description || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      {showCreate && (
        <CompanyCodeModal
          onClose={() => setShowCreate(false)}
          onSaved={fetchCompanyCodes}
        />
      )}
      {editItem && (
        <CompanyCodeModal
          initial={editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => {
            fetchCompanyCodes();
            setSelected((s) =>
              s && s.id === editItem.id ? { ...s, ...editItem } : s,
            );
          }}
        />
      )}
      {deleteItem && (
        <DeleteModal
          item={deleteItem}
          onClose={() => {
            setDeleteItem(null);
            setDeleteError("");
          }}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
          error={deleteError}
        />
      )}
    </div>
  );
}
