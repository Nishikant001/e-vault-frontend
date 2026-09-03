import { useState } from "react";

const ALL_DOCS = [
  { id: 1, name: "INV-2024-01568.pdf", dept: "Finance",     category: "Accounts Payable", type: "Invoice",     vendor: "ABC Industries", amount: "₹1,01,480", version: "v1.0", status: "Posted"  },
  { id: 2, name: "GRN-2024-00892.pdf", dept: "Procurement", category: "Purchase Orders",  type: "GRN",         vendor: "ABC Industries", amount: "—",         version: "v1.0", status: "Posted"  },
  { id: 3, name: "CTR-2024-00045.pdf", dept: "Legal",       category: "Contracts",        type: "Contract",    vendor: "XYZ Corp",       amount: "₹5,00,000", version: "v2.1", status: "Active"  },
  { id: 4, name: "INV-2024-01501.pdf", dept: "Finance",     category: "Accounts Payable", type: "Invoice",     vendor: "PQR Ltd",        amount: "₹67,000",   version: "v1.0", status: "Pending" },
  { id: 5, name: "CN-2024-00120.pdf",  dept: "Finance",     category: "Accounts Payable", type: "Credit Note", vendor: "MNO Ltd",        amount: "₹12,200",   version: "v1.0", status: "Draft"   },
];

const TABS = ["All", "Invoice", "GRN", "Contract"];

const STATUS_STYLES = {
  Posted:  "text-green-600 dark:text-green-400",
  Active:  "text-blue-600 dark:text-blue-400",
  Pending: "text-amber-600 dark:text-amber-400",
  Draft:   "text-slate-500 dark:text-slate-400",
};

const TYPE_STYLES = {
  Invoice:     "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
  GRN:         "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
  Contract:    "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
  "Credit Note":"bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
};

const EYE_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

export default function ViewerDocuments() {
  const [activeTab, setActiveTab] = useState("All");

  const filtered = activeTab === "All"
    ? ALL_DOCS
    : ALL_DOCS.filter((d) => d.type === activeTab);

  return (
    <div className="space-y-4">

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-[6px] rounded-lg text-[12px] font-semibold border transition-all ${
              activeTab === tab
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-[#1A2433] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Read-only notice */}
      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
        <span className="text-[12px] text-amber-700 dark:text-amber-400 font-medium">
          Read-only mode — you can view documents but cannot edit or delete.
        </span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">

        {/* Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-[#151E2D]">
                {["Document", "Dept", "Category", "Type", "Vendor", "Amount", "Version", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-[10px] text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors last:border-0">
                  <td className="px-4 py-[10px]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-[10px] text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{doc.dept}</td>
                  <td className="px-4 py-[10px] text-[12px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{doc.category}</td>
                  <td className="px-4 py-[10px]">
                    <span className={`text-[11px] font-semibold px-[9px] py-[3px] rounded-md ${TYPE_STYLES[doc.type]}`}>{doc.type}</span>
                  </td>
                  <td className="px-4 py-[10px] text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{doc.vendor}</td>
                  <td className="px-4 py-[10px] text-[12px] font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">{doc.amount}</td>
                  <td className="px-4 py-[10px] text-[12px] text-blue-500 dark:text-blue-400 font-semibold">{doc.version}</td>
                  <td className="px-4 py-[10px]">
                    <span className={`text-[12px] font-bold ${STATUS_STYLES[doc.status] || "text-slate-400"}`}>{doc.status}</span>
                  </td>
                  <td className="px-4 py-[10px]">
                    <button
                      title="View document"
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-blue-500 hover:border-blue-300 transition-all"
                    >
                      {EYE_ICON}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700">
          {filtered.map((doc) => (
            <div key={doc.id} className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 truncate">{doc.name}</div>
                <div className="text-[11px] text-slate-400 mt-[2px]">{doc.dept} · {doc.category}</div>
                <div className="flex items-center gap-2 mt-[4px]">
                  <span className={`text-[11px] font-semibold px-2 py-[1px] rounded-md ${TYPE_STYLES[doc.type]}`}>{doc.type}</span>
                  <span className={`text-[11px] font-bold ${STATUS_STYLES[doc.status]}`}>{doc.status}</span>
                  <span className="text-[11px] text-blue-500 font-semibold">{doc.amount}</span>
                </div>
              </div>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-blue-500 transition-all flex-shrink-0">
                {EYE_ICON}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}