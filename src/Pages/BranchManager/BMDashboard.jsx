import { useEffect, useState } from "react";
import { Loader2, AlertCircle, FileText, Building2, Factory, Clock } from "lucide-react";
import { API_BASE_URL } from "../../services/apiClient";

const API = API_BASE_URL;
function getToken() { return localStorage.getItem("accessToken") || ""; }
function authHeaders() { return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }; }

const STATUS_COLOR = {
  UPLOADED:   "text-blue-600 dark:text-blue-400",
  PROCESSING: "text-amber-600 dark:text-amber-400",
  COMPLETED:  "text-green-600 dark:text-green-400",
  FAILED:     "text-red-600 dark:text-red-400",
};

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

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse">
      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
      <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
  );
}

export default function BMDashboard({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [docs, setDocs] = useState([]);
  const [companyCodes, setCompanyCodes] = useState([]);
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [docsRes, ccRes, plantsRes] = await Promise.all([
          fetch(`${API}/documents`, { headers: authHeaders() }),
          fetch(`${API}/company-codes`, { headers: authHeaders() }),
          fetch(`${API}/plants`, { headers: authHeaders() }),
        ]);
        const docsData = await docsRes.json();
        const ccData = await ccRes.json();
        const plantsData = await plantsRes.json();
        if (!docsRes.ok || !docsData.success) throw new Error(docsData.message || "Failed to load documents");
        setDocs(docsData.data || []);
        setCompanyCodes(ccData.data || []);
        setPlants(plantsData.data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const byStatus = docs.reduce((acc, d) => {
    acc[d.uploadStatus] = (acc[d.uploadStatus] || 0) + 1;
    return acc;
  }, {});
  const recent = [...docs]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <AlertCircle className="w-6 h-6 text-red-400" />
        <p className="text-[13px] font-semibold text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <StatCard label="Total Documents" value={docs.length} sub={`${byStatus.COMPLETED || 0} completed`} icon={<FileText className="w-4 h-4 text-slate-400" />} />
            <StatCard label="Company Codes" value={companyCodes.length} sub={`${companyCodes.filter(c => c.status === "ACTIVE").length} active`} icon={<Building2 className="w-4 h-4 text-slate-400" />} />
            <StatCard label="Plants" value={plants.length} sub={`${plants.filter(p => p.status === "ACTIVE").length} active`} icon={<Factory className="w-4 h-4 text-slate-400" />} />
            <StatCard
              label="Processing"
              value={byStatus.PROCESSING || 0}
              sub={(byStatus.FAILED || 0) > 0 ? `${byStatus.FAILED} failed` : "No failures"}
              subColor={(byStatus.FAILED || 0) > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}
              icon={<Clock className="w-4 h-4 text-slate-400" />}
            />
          </>
        )}
      </div>

      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Recent Documents
          </h2>
          <button onClick={() => onNavigate?.("documents")} className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            View all
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[12px]">Loading…</span>
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-10 text-[12px] text-slate-400">No documents uploaded yet.</div>
        ) : (
          <div className="space-y-0">
            {recent.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-[8px] border-b border-slate-100 dark:border-slate-700 last:border-0">
                <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="flex-1 text-[12px] text-slate-700 dark:text-slate-300 truncate">{d.originalFileName || d.name}</span>
                <span className={`text-[10px] font-bold ${STATUS_COLOR[d.uploadStatus] || "text-slate-400"}`}>{d.uploadStatus}</span>
                <span className="text-[10px] text-slate-400 w-20 text-right flex-shrink-0">
                  {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
