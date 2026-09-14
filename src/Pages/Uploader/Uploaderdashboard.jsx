import { useState } from "react";

const RECENT_UPLOADS = [
  { id: 1, name: "Invoice_Apr2025.pdf",       dept: "Finance",        status: "Approved",  date: "Today, 10:32 AM",  size: "1.2 MB" },
  { id: 2, name: "PO_Procurement_0042.pdf",   dept: "Procurement",    status: "Pending",   date: "Today, 09:15 AM",  size: "845 KB" },
  { id: 3, name: "HR_JoiningForm_Ravi.pdf",   dept: "Human Resource", status: "Pending",   date: "Yesterday",        size: "320 KB" },
  { id: 4, name: "IT_Asset_Report_Q1.xlsx",   dept: "IT",             status: "Approved",  date: "Yesterday",        size: "2.1 MB" },
  { id: 5, name: "LegalAgreement_Vendor.pdf", dept: "Legal",          status: "Rejected",  date: "10 Jun 2025",      size: "980 KB" },
  { id: 6, name: "AuditRemark_Internal.docx", dept: "Internal Audit", status: "Approved",  date: "09 Jun 2025",      size: "560 KB" },
];

const DEPT_BREAKDOWN = [
  { dept: "Finance",        count: 18, color: "#3B82F6" },
  { dept: "Procurement",    count: 24, color: "#8B5CF6" },
  { dept: "Human Resource", count: 9,  color: "#10B981" },
  { dept: "IT",             count: 7,  color: "#F59E0B" },
  { dept: "Legal",          count: 5,  color: "#EF4444" },
  { dept: "Internal Audit", count: 4,  color: "#06B6D4" },
];

const STATUS_STYLES = {
  Approved: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  Pending:  "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  Rejected: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

function StatCard({ icon, label, value, sub, subColor = "text-green-600 dark:text-green-400" }) {
  return (
    <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-1 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-[28px] font-bold text-slate-800 dark:text-slate-100 leading-tight">{value}</div>
      {sub && <div className={`text-[11px] font-medium ${subColor}`}>{sub}</div>}
    </div>
  );
}

function UploadZone({ onStartWorkflow }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); onStartWorkflow(); }}
      onClick={onStartWorkflow}
      className={`cursor-pointer rounded-xl border-2 border-dashed transition-all p-8 flex flex-col items-center gap-3
        ${dragging
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 bg-slate-50 dark:bg-[#151E2D]"
        }`}
    >
      <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${dragging ? "bg-blue-100 dark:bg-blue-800/40" : "bg-slate-200 dark:bg-slate-700"}`}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={dragging ? "#3B82F6" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
        </svg>
      </div>
      <div className="text-center">
        <div className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
          {dragging ? "Drop to start workflow" : "Click to start DMS Workflow"}
        </div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          Dept → Category → DocType → PO Search → OCR → Approve → SAP
        </div>
      </div>
    </div>
  );
}

export default function UploaderDashboard({ onNavigate }) {
  return (
    <div className="space-y-5">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="⬆️" label="Uploaded Today"     value="4"  sub="↑ 2 from yesterday" />
        <StatCard icon="📄" label="Total My Docs"       value="67" sub="Across all folders"  subColor="text-blue-600 dark:text-blue-400" />
        <StatCard icon="⏳" label="Pending Approval"    value="3"  sub="Awaiting review"     subColor="text-amber-600 dark:text-amber-400" />
        <StatCard icon="✅" label="Approved This Month" value="21" sub="Last: 10 min ago" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h2 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            ⬆️ Quick Upload
          </h2>
          <UploadZone onStartWorkflow={() => onNavigate?.("upload")} />
        </div>

        <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h2 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            📁 My Docs by Department
          </h2>
          <div className="space-y-[10px]">
            {DEPT_BREAKDOWN.map((d) => (
              <div key={d.dept} className="flex items-center gap-3">
                <div className="w-[120px] text-[12px] text-slate-600 dark:text-slate-400 flex-shrink-0 truncate">{d.dept}</div>
                <div className="w-6 text-[12px] font-bold text-right flex-shrink-0" style={{ color: d.color }}>{d.count}</div>
                <div className="flex-1 h-[6px] bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(d.count / 24) * 100}%`, backgroundColor: d.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            🕐 Recent Uploads
          </h2>
          <button onClick={() => onNavigate?.("documents")} className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            View All →
          </button>
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {["File Name", "Department", "Status", "Date", "Size"].map((h) => (
                  <th key={h} className="pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_UPLOADS.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors last:border-0">
                  <td className="py-[9px] pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px]">{doc.name.endsWith(".pdf") ? "📄" : doc.name.endsWith(".xlsx") ? "📊" : "📝"}</span>
                      <span className="text-[12px] text-slate-700 dark:text-slate-300 font-medium truncate max-w-[180px]">{doc.name}</span>
                    </div>
                  </td>
                  <td className="py-[9px] pr-4 text-[12px] text-slate-500 dark:text-slate-400">{doc.dept}</td>
                  <td className="py-[9px] pr-4">
                    <span className={`text-[10px] font-bold px-[8px] py-[2px] rounded-full ${STATUS_STYLES[doc.status]}`}>{doc.status}</span>
                  </td>
                  <td className="py-[9px] pr-4 text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{doc.date}</td>
                  <td className="py-[9px] text-[11px] text-slate-400 dark:text-slate-500">{doc.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden space-y-2">
          {RECENT_UPLOADS.map((doc) => (
            <div key={doc.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[18px] mt-[1px]">{doc.name.endsWith(".pdf") ? "📄" : doc.name.endsWith(".xlsx") ? "📊" : "📝"}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">{doc.name}</div>
                <div className="text-[10px] text-slate-400 mt-[2px]">{doc.dept} · {doc.date}</div>
              </div>
              <span className={`text-[10px] font-bold px-[8px] py-[2px] rounded-full flex-shrink-0 ${STATUS_STYLES[doc.status]}`}>{doc.status}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}