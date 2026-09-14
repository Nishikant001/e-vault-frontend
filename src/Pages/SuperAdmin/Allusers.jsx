import { useState } from "react";
import { ALL_USERS } from "../SuperAdmin/Superadmincontext";

const ROLE_COLORS = {
  SuperAdmin:    "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30",
  TenantAdmin:   "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30",
  BranchManager: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30",
  DeptHead:      "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30",
  Manager:       "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30",
  Uploader:      "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30",
  Viewer:        "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700",
  Auditor:       "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30",
  Approver:      "text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30",
};

function AddUserModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">Add New User</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="space-y-3">
          {["Full Name", "Username", "Email"].map((f) => (
            <div key={f}>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">{f}</label>
              <input type="text" placeholder={`Enter ${f.toLowerCase()}`}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-[12px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600" />
            </div>
          ))}
          {["Role", "Tenant"].map((f) => (
            <div key={f}>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">{f}</label>
              <select className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-[12px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition">
                {f === "Role"
                  ? ["SuperAdmin","TenantAdmin","BranchManager","DeptHead","Manager","Uploader","Viewer","Auditor","Approver"].map(r => <option key={r}>{r}</option>)
                  : ["Veda Hospitality","Positive Energy Pvt Ltd","Westar Galaxy Trading Pvt"].map(t => <option key={t}>{t}</option>)
                }
              </select>
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Password</label>
            <input type="password" placeholder="Set password"
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-[12px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition placeholder-slate-300 dark:placeholder-slate-600" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[12px] font-bold transition">Add User</button>
        </div>
      </div>
    </div>
  );
}

export default function AllUsers() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");

  const roles = ["All", ...new Set(ALL_USERS.map(u => u.role))];
  const filtered = ALL_USERS.filter(u => {
    const matchSearch = u.u.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "All" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">All Users</h2>
          <p className="text-[11px] text-slate-400 mt-px">{ALL_USERS.length} total users across all tenants</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-[8px] bg-green-600 hover:bg-green-700 text-white text-[12px] font-bold rounded-lg transition">
          + Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users…"
          className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-[12px] bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition w-48 placeholder-slate-300 dark:placeholder-slate-600"
        />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-[12px] bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition"
        >
          {roles.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#151E2B]">
                {["Username", "Role", "Tenant", "Status", "Action"].map(h => (
                  <th key={h} className="text-left px-4 py-[9px] text-[11px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-[10px]">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ${u.avc}`}>{u.av}</div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{u.u}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold px-2 py-[2px] rounded ${ROLE_COLORS[u.role] || ""}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.tenant}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-2 py-[2px] rounded-full">{u.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="px-3 py-[4px] border border-slate-200 dark:border-slate-600 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
          {filtered.map((u, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${u.avc}`}>{u.av}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">{u.u}</div>
                <div className="flex items-center gap-2 mt-[2px]">
                  <span className={`text-[10px] font-bold px-2 py-[1px] rounded ${ROLE_COLORS[u.role] || ""}`}>{u.role}</span>
                  <span className="text-[10px] text-slate-400">{u.tenant}</span>
                </div>
              </div>
              <button className="px-3 py-[5px] border border-slate-200 dark:border-slate-600 rounded-lg text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">Edit</button>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-[13px]">No users found.</div>
        )}
      </div>

      {showModal && <AddUserModal onClose={() => setShowModal(false)} />}
    </div>
  );
}