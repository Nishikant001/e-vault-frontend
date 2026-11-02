import { useState } from "react";

const FOLDER_TREE = [
  {
    name: "Finance", docs: 56, color: "#3B82F6",
    children: [
      { name: "Accounts Payable", docs: 34 },
      { name: "Accounts Receivable", docs: 12 },
      { name: "Tax & Compliance", docs: 10 },
    ],
  },
  {
    name: "Procurement", docs: 178, color: "#8B5CF6",
    children: [
      { name: "Purchase Orders", docs: 89 },
      { name: "GRN", docs: 67 },
      { name: "Vendor Contracts", docs: 22 },
    ],
  },
  {
    name: "Legal", docs: 87, color: "#EF4444",
    children: [
      { name: "Contracts", docs: 45 },
      { name: "Agreements", docs: 30 },
      { name: "Compliance", docs: 12 },
    ],
  },
  {
    name: "Human Resource", docs: 43, color: "#10B981",
    children: [
      { name: "Employee Records", docs: 28 },
      { name: "Policies", docs: 15 },
    ],
  },
  {
    name: "IT", docs: 134, color: "#F59E0B",
    children: [
      { name: "Asset Management", docs: 56 },
      { name: "Software Licenses", docs: 44 },
      { name: "IT Policies", docs: 34 },
    ],
  },
  {
    name: "Internal Audit", docs: 210, color: "#06B6D4",
    children: [
      { name: "Audit Reports", docs: 120 },
      { name: "Remarks", docs: 90 },
    ],
  },
];

const FOLDER_ICON = (color) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={color + "33"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
  </svg>
);

const SUB_FOLDER_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
  </svg>
);

const CHEVRON = (open) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const LOCK_ICON = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

function FolderRow({ folder }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Parent folder */}
      <div
        className="flex items-center gap-3 px-4 py-[10px] hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-slate-400 dark:text-slate-500 flex-shrink-0">{CHEVRON(open)}</span>
        <span className="flex-shrink-0">{FOLDER_ICON(folder.color)}</span>
        <span className="flex-1 text-[13px] font-semibold text-slate-700 dark:text-slate-200">{folder.name}</span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 mr-2">{folder.docs} docs</span>
        <span title="Read-only" className="flex-shrink-0">{LOCK_ICON}</span>
      </div>

      {/* Children */}
      {open && (
        <div className="border-l border-slate-200 dark:border-slate-700 ml-[42px]">
          {folder.children.map((child) => (
            <div key={child.name} className="flex items-center gap-3 px-4 py-[8px] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-default">
              <span className="flex-shrink-0">{SUB_FOLDER_ICON}</span>
              <span className="flex-1 text-[12px] text-slate-600 dark:text-slate-400">{child.name}</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{child.docs} docs</span>
              <span title="Read-only" className="flex-shrink-0">{LOCK_ICON}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ViewerFolders() {
  return (
    <div className="space-y-4 max-w-2xl">

      {/* Read-only notice */}
      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        <span className="text-[12px] text-amber-700 dark:text-amber-400 font-medium">
          Read-only mode — you can browse folders but cannot create, rename, or delete.
        </span>
      </div>

      {/* Folder Tree */}
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
          <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Folder Structure</span>
          <span className="ml-auto text-[11px] text-slate-400">Click a folder to expand</span>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {FOLDER_TREE.map((folder) => (
            <FolderRow key={folder.name} folder={folder} />
          ))}
        </div>
      </div>

    </div>
  );
}