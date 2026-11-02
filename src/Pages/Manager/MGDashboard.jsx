import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "../../services/apiClient";

const API = API_BASE_URL;
function getToken() { return localStorage.getItem("accessToken") || ""; }
function authHeaders() { return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }; }

// NOTE: "Pending Approvals" below stays illustrative — the backend has no
// approvals/workflow model yet, so there is nothing real to fetch for it.
const PENDING_APPROVAL = { doc: "INV-2024-01501.pdf", vendor: "PQR Ltd", amount: "₹67,000" };

function StatCard({ label, value, sub, subColor = "text-green-600 dark:text-green-400", icon }) {
  return (
    <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-1 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-[26px] font-bold text-slate-800 dark:text-slate-100 leading-tight">{value}</div>
      {sub && <div className={`text-[11px] font-medium ${subColor}`}>{sub}</div>}
    </div>
  );
}

export default function MGDashboard({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true); setError("");
      try {
        const res = await fetch(`${API}/documents`, { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to load documents");
        setDocs(data.data || []);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const uploadedThisWeek = docs.filter((d) => new Date(d.createdAt).getTime() >= weekAgo).length;
  const processing = docs.filter((d) => d.uploadStatus === "PROCESSING").length;
  const recent = [...docs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="My Documents" value={loading ? "…" : docs.length} sub="Visible to you" icon="📄" />
        <StatCard label="Approvals" value={1} sub="Pending review" subColor="text-amber-600 dark:text-amber-400" icon="✅" />
        <StatCard label="Uploaded" value={loading ? "…" : uploadedThisWeek} sub="This week" icon="⬆️" />
        <StatCard label="Processing" value={loading ? "…" : processing} sub="In workflow" subColor="text-blue-600 dark:text-blue-400" icon="⏱" />
      </div>

      {/* Recent Docs + Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        {/* Recent Documents */}
        <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h2 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 mb-4">Recent Documents</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /><span className="text-[12px]">Loading…</span>
            </div>
          ) : error ? (
            <p className="text-[12px] text-red-500 py-4">{error}</p>
          ) : recent.length === 0 ? (
            <p className="text-[12px] text-slate-400 py-4">No documents yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <span className="text-[14px]">📄</span>
                  <span className="flex-1 text-[12px] font-semibold text-slate-700 dark:text-slate-300 truncate">{doc.originalFileName || doc.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-[2px] rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400">{doc.DocumentType?.name || "Doc"}</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{doc.uploadStatus}</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => onNavigate("newdoc")}
            className="mt-3 w-full py-[8px] bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-lg transition-colors"
          >
            + New Document
          </button>
        </div>

        {/* Pending Approvals (illustrative — no backend yet) */}
        <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h2 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 mb-4">Pending Approvals</h2>
          <div className="flex items-center gap-3 p-3 border border-slate-100 dark:border-slate-700 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0">!</div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold text-slate-800 dark:text-slate-200">{PENDING_APPROVAL.doc}</div>
              <div className="text-[11px] text-slate-400">{PENDING_APPROVAL.vendor} · {PENDING_APPROVAL.amount}</div>
            </div>
            <button
              onClick={() => onNavigate("approvals")}
              className="px-3 py-[6px] bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors flex-shrink-0"
            >
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
