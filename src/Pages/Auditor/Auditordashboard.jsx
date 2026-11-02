import { useState } from "react";

const AUDIT_TRAIL = [
  { user: "john.doe",  action: "Uploaded INV-2024-01568.pdf",  time: "14-May-2024 10:22", type: "upload" },
  { user: "priya.k",   action: "Approved INV-2024-01560",       time: "14-May-2024 09:48", type: "approve" },
  { user: "manager",   action: "Edited OCR fields on GRN-892",  time: "14-May-2024 09:10", type: "edit" },
  { user: "uploader",  action: "New version uploaded v1.1",     time: "13-May-2024 17:30", type: "upload" },
  { user: "priya.k",   action: "Rejected CTR-2024-00045.pdf",   time: "13-May-2024 15:12", type: "reject" },
  { user: "john.doe",  action: "Viewed GRN-2024-00892.pdf",     time: "13-May-2024 14:05", type: "view" },
];

const USER_COLORS = {
  "john.doe": "bg-blue-600",
  "priya.k":  "bg-green-600",
  "manager":  "bg-purple-600",
  "uploader": "bg-orange-500",
};

const TYPE_COLORS = {
  upload:  "text-blue-600 dark:text-blue-400",
  approve: "text-green-600 dark:text-green-400",
  edit:    "text-purple-600 dark:text-purple-400",
  reject:  "text-red-600 dark:text-red-400",
  view:    "text-slate-500 dark:text-slate-400",
};

const SHIELD_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const ALERT_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

function AuditorDashboard({ onNavigate }) {
  return (
    <div className="space-y-4">

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 max-w-xl">
        <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-colors">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] font-semibold mb-2">
            {SHIELD_ICON} Audit Events Today
          </div>
          <div className="text-[32px] font-bold text-slate-800 dark:text-slate-100">142</div>
        </div>
        <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-colors">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] font-semibold mb-2">
            {ALERT_ICON} Anomalies
          </div>
          <div className="text-[32px] font-bold text-orange-500">2</div>
        </div>
      </div>

      {/* Audit Trail */}
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl transition-colors">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {SHIELD_ICON} Audit Trail
          </h2>
          <button
            onClick={() => onNavigate && onNavigate("auditlog")}
            className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            View Full Log →
          </button>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {AUDIT_TRAIL.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-[11px] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              {/* User badge */}
              <span className={`text-[10px] font-bold px-[8px] py-[3px] rounded text-white flex-shrink-0 ${USER_COLORS[entry.user] || "bg-slate-500"}`}>
                {entry.user}
              </span>
              {/* Action */}
              <span className={`flex-1 text-[12px] font-medium ${TYPE_COLORS[entry.type]}`}>
                {entry.action}
              </span>
              {/* Time */}
              <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0">
                {entry.time}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default AuditorDashboard;