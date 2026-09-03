import { useState, useEffect, useCallback } from "react";
import { Info } from "lucide-react";
import { UserDetailDrawer } from "./UserAssignment";

import { API_BASE_URL } from "../../services/apiClient";

const API_BASE = API_BASE_URL;

const ROLES = [
  "TenantAdmin",
  "BranchManager",
  "DeptHead",
  "Manager",
  "Uploader",
  "Viewer",
  "Auditor",
  "Approver",
];

const ROLE_META = {
  TenantAdmin: {
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    dot: "bg-purple-500",
    desc: "All except system settings",
  },
  BranchManager: {
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    dot: "bg-blue-500",
    desc: "Branch + doc management",
  },
  DeptHead: {
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    dot: "bg-orange-500",
    desc: "Dept docs + approvals",
  },
  Manager: {
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    dot: "bg-amber-500",
    desc: "Upload + edit + approve",
  },
  Uploader: {
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    dot: "bg-cyan-500",
    desc: "Upload + edit only",
  },
  Viewer: {
    color:
      "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300",
    dot: "bg-slate-400",
    desc: "Read-only access",
  },
  Auditor: {
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    dot: "bg-red-500",
    desc: "Read + full audit log",
  },
  Approver: {
    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    dot: "bg-teal-500",
    desc: "View + workflow approvals",
  },
};

const AVATAR_COLORS = [
  "bg-violet-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-cyan-600",
  "bg-fuchsia-600",
  "bg-indigo-600",
];

function initials(name = "") {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??"
  );
}

function avatarColor(id) {
  return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
}

// ─── Inline Toast ────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-xl text-[13px] font-semibold text-white transition-all
            ${t.type === "success" ? "bg-emerald-600" : t.type === "error" ? "bg-red-600" : "bg-blue-600"}`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────────────────────────
function ConfirmDialog({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1C2A3A] rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Confirm Action
        </div>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-6">
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[12px] font-semibold border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-[12px] font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Remove User
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── Guide / Info Modal ──────────────────────────────────────────────────────
function GuideModal({ open, onClose }) {
  if (!open) return null;
  const steps = [
    {
      title: "Invite a User",
      desc: "Click the Invite User button to add a new user. Fill in their name, email, a temporary password, and assign a role.",
    },
    {
      title: "Change a Role",
      desc: "Click the role badge next to any user in the table to instantly change their role from the dropdown.",
    },
    {
      title: "Toggle Active / Inactive",
      desc: "Use the switch in the Status column to activate or deactivate a user. TenantAdmin users cannot be deactivated.",
    },
    {
      title: "View Access",
      desc: "Click Access to see and manage what folders, plants, or company codes a user has permission to view.",
    },
    {
      title: "Edit or Remove",
      desc: "Use the menu next to a user to edit their details or remove them. Removing a user asks for confirmation first.",
    },
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1C2A3A] rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Info className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
              User Management — Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-lg leading-none"
          >
            ×
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

// ─── User Modal (Add / Edit) ─────────────────────────────────────────────────
function UserModal({ open, mode, user, onClose, onSave, loading }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Viewer",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === "edit" && user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        password: "",
        role: user.role || "Viewer",
      });
    } else {
      setForm({ name: "", email: "", password: "", role: "Viewer" });
    }
    setErrors({});
  }, [open, mode, user]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (mode === "add" && !form.password) e.password = "Password is required";
    if (mode === "add" && form.password && form.password.length < 6)
      e.password = "Min 6 characters";
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave(form);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1C2A3A] rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
              {mode === "add" ? "Invite New User" : "Edit User"}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {mode === "add"
                ? "Add a user to your tenant"
                : "Update user details and role"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Full Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Ravi Kumar"
              className={`w-full px-3 py-2.5 text-[13px] rounded-lg border bg-white dark:bg-[#243044] text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none transition-colors
                ${errors.name ? "border-red-400" : "border-slate-200 dark:border-slate-600 focus:border-blue-500"}`}
            />
            {errors.name && (
              <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="user@company.com"
              disabled={mode === "edit"}
              className={`w-full px-3 py-2.5 text-[13px] rounded-lg border bg-white dark:bg-[#243044] text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none transition-colors
                ${mode === "edit" ? "opacity-50 cursor-not-allowed" : ""}
                ${errors.email ? "border-red-400" : "border-slate-200 dark:border-slate-600 focus:border-blue-500"}`}
            />
            {errors.email && (
              <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password (add only) */}
          {mode === "add" && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="Min 6 characters"
                className={`w-full px-3 py-2.5 text-[13px] rounded-lg border bg-white dark:bg-[#243044] text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none transition-colors
                  ${errors.password ? "border-red-400" : "border-slate-200 dark:border-slate-600 focus:border-blue-500"}`}
              />
              {errors.password && (
                <p className="text-[11px] text-red-500 mt-1">
                  {errors.password}
                </p>
              )}
            </div>
          )}

          {/* Role */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Assign Role
            </label>
            <div className="relative">
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value }))
                }
                className="w-full px-3 py-2.5 text-[13px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#243044] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors appearance-none pr-8"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r} — {ROLE_META[r]?.desc}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                ▾
              </div>
            </div>
            {/* Role badge preview */}
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${ROLE_META[form.role]?.color}`}
              >
                {form.role}
              </span>
              <span className="text-[11px] text-slate-400">
                {ROLE_META[form.role]?.desc}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-[#18222E] rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-[12px] font-semibold border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 text-[12px] font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {mode === "add" ? "Create User" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Role Dropdown ────────────────────────────────────────────────────
function RoleDropdown({ userId, currentRole, onRoleChange, saving }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-[3px] rounded-full transition-all
          ${ROLE_META[currentRole]?.color || "bg-slate-100 text-slate-600"}
          ${saving ? "opacity-60" : "hover:opacity-80 cursor-pointer"}`}
      >
        {saving ? (
          <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <span
            className={`w-1.5 h-1.5 rounded-full ${ROLE_META[currentRole]?.dot}`}
          />
        )}
        {currentRole}
        <span className="opacity-60 text-[9px]">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-40 bg-white dark:bg-[#1C2A3A] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-56 py-1 overflow-hidden">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
              Change Role
            </div>
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => {
                  onRoleChange(userId, r);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors
                  ${r === currentRole ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${ROLE_META[r]?.dot}`}
                />
                <div>
                  <div
                    className={`text-[11px] font-bold ${r === currentRole ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}
                  >
                    {r}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {ROLE_META[r]?.desc}
                  </div>
                </div>
                {r === currentRole && (
                  <span className="ml-auto text-blue-500 text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Actions Menu (3-dot) ────────────────────────────────────────────────────
function ActionsMenu({ user, onEdit, onDelete, disabled }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        ⋮
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 bg-white dark:bg-[#1C2A3A] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-36 py-1 overflow-hidden">
            <button
              onClick={() => {
                setOpen(false);
                onEdit(user);
              }}
              className="w-full text-left px-3 py-2 text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onDelete(user);
              }}
              className="w-full text-left px-3 py-2 text-[12px] font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function TAUsers({ token, onNavigate }) {
  const [users, setUsers] = useState([]);
  const [tenantName, setTenantName] = useState("Your Organisation");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editUser, setEditUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmUser, setConfirmUser] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [detailUser, setDetailUser] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Get token from localStorage if not passed as prop
  const getToken = useCallback(
    () => token || localStorage.getItem("accessToken") || "",
    [token],
  );

  function toast(msg, type = "success") {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }

  // ── Fetch users ─────────────────────────────────────────────────────────
  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        // Try to get tenant name from first user or profile
        if (data.tenantName) setTenantName(data.tenantName);
      } else {
        toast(data.message || "Failed to load users", "error");
      }
    } catch {
      toast("Network error — check your connection", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  // ── Create user ──────────────────────────────────────────────────────────
  async function handleCreate(form) {
    setModalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast("User created successfully");
        setModalOpen(false);
        fetchUsers();
      } else {
        toast(data.message || "Could not create user", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setModalLoading(false);
    }
  }

  // ── Update user (name + role via PUT /api/users/:id) ─────────────────────
  async function handleEdit(form) {
    setModalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/${editUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name: form.name, role: form.role }),
      });
      const data = await res.json();
      if (data.success) {
        toast("User updated");
        setModalOpen(false);
        fetchUsers();
      } else {
        toast(data.message || "Update failed", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setModalLoading(false);
    }
  }

  // ── Toggle active ────────────────────────────────────────────────────────
  async function handleToggleActive(user) {
    if (user.role === "TenantAdmin") {
      toast("TenantAdmin ko deactivate nahi kar sakte", "error");
      return;
    }
    setSavingId(`toggle-${user.id}`);
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, isActive: !u.isActive } : u,
          ),
        );
        toast(user.isActive ? "User deactivated" : "User activated");
      } else {
        toast(data.message || "Failed to update", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setSavingId(null);
    }
  }

  // ── Inline role change ───────────────────────────────────────────────────
  async function handleRoleChange(userId, newRole) {
    setSavingId(`role-${userId}`);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
        toast(`Role changed to ${newRole}`);
      } else {
        toast(data.message || "Role update failed", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setSavingId(null);
    }
  }

  // ── Delete user ──────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirmUser) return;
    setSavingId(`del-${confirmUser.id}`);
    setConfirmOpen(false);
    try {
      const res = await fetch(`${API_BASE}/users/${confirmUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== confirmUser.id));
        toast("User removed");
      } else {
        toast(data.message || "Delete failed", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setSavingId(null);
      setConfirmUser(null);
    }
  }

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "All" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.length - activeCount;

  return (
    <>
      <Toast toasts={toasts} />
      <ConfirmDialog
        open={confirmOpen}
        message={`Remove "${confirmUser?.name || confirmUser?.email}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmUser(null);
        }}
      />
      <GuideModal open={showGuide} onClose={() => setShowGuide(false)} />
      <UserModal
        open={modalOpen}
        mode={modalMode}
        user={editUser}
        loading={modalLoading}
        onClose={() => setModalOpen(false)}
        onSave={modalMode === "add" ? handleCreate : handleEdit}
      />

      <UserDetailDrawer
        open={detailOpen}
        user={detailUser}
        onClose={() => setDetailOpen(false)}
        onNavigate={onNavigate}
        onToast={toast}
      />

      <div className="space-y-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#151E2B] p-5">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-[17px] font-bold text-slate-800 dark:text-slate-100">
                User Management
              </h1>
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
              Tenant:{" "}
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {tenantName}
              </span>
              <span className="mx-2 opacity-40">·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {activeCount} active
              </span>
              {inactiveCount > 0 && (
                <span className="text-slate-400 font-medium">
                  {" "}
                  · {inactiveCount} inactive
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => {
              setModalMode("add");
              setEditUser(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-3 mr-10 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[16px] font-bold rounded-xl transition-all shadow-lg shadow-blue-600/40 ring-2 ring-blue-400/50 hover:ring-blue-400/80 hover:scale-[1.03] self-start sm:self-auto"
          >
            <span className="text-base leading-none">+</span> Invite User
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total Users",
              value: users.length,
              color: "text-blue-600 dark:text-blue-400",
            },
            {
              label: "Active",
              value: activeCount,
              color: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Inactive",
              value: inactiveCount,
              color: "text-slate-500 dark:text-slate-400",
            },
            {
              label: "Roles Used",
              value: [...new Set(users.map((u) => u.role))].length,
              color: "text-purple-600 dark:text-purple-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3"
            >
              <div className={`text-[20px] font-bold ${s.color}`}>
                {s.value}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="relative">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="pl-3 pr-8 py-2.5 text-[12px] font-semibold bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 transition-colors appearance-none"
            >
              <option value="All">All Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
              ▾
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl">
          {" "}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-[13px] gap-3">
              <span className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
              Loading users…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="text-4xl mb-3">👤</div>
              <div className="text-[14px] font-semibold text-slate-600 dark:text-slate-400">
                No users found
              </div>
              <div className="text-[12px] mt-1">
                {search || filterRole !== "All"
                  ? "Try adjusting your filters"
                  : "Invite your first user to get started"}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-visible">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b  border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-[#16202E]">
                    <th className="text-left px-7 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[240px]">
                      User
                    </th>
                    <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                      Permissions
                    </th>
                    <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="text-right px-17 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, idx) => {
                    const isDeleting = savingId === `del-${u.id}`;
                    const isToggling = savingId === `toggle-${u.id}`;
                    const isRoleSaving = savingId === `role-${u.id}`;
                    return (
                      <tr
                        key={u.id}
                        className={`border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors
                          ${isDeleting ? "opacity-40" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"}`}
                      >
                        {/* User */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${avatarColor(u.id)}`}
                            >
                              {initials(u.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {u.name || "—"}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role (inline dropdown) */}
                        <td className="px-4 py-3.5">
                          <RoleDropdown
                            userId={u.id}
                            currentRole={u.role}
                            onRoleChange={handleRoleChange}
                            saving={isRoleSaving}
                          />
                        </td>

                        {/* Permissions */}
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {ROLE_META[u.role]?.desc || "—"}
                          </span>
                        </td>

                        {/* Status toggle */}
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => handleToggleActive(u)}
                            disabled={
                              isToggling ||
                              isDeleting ||
                              u.role === "TenantAdmin"
                            }
                            className={`w-10 h-[22px] rounded-full relative flex-shrink-0 transition-colors
                              ${u.isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}
                              ${isToggling ? "opacity-60" : ""}`}
                          >
                            {isToggling ? (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <span className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                              </span>
                            ) : (
                              <span
                                className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-all ${u.isActive ? "left-[22px]" : "left-[3px]"}`}
                              />
                            )}
                          </button>
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3.5">
                          <span className="text-[11px] text-slate-400">
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => {
                                setDetailUser(u);
                                setDetailOpen(true);
                              }}
                              disabled={isDeleting}
                              className="text-[11px] px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                            >
                              Access
                            </button>
                            <ActionsMenu
                              user={u}
                              disabled={isDeleting}
                              onEdit={(user) => {
                                setEditUser(user);
                                setModalMode("edit");
                                setModalOpen(true);
                              }}
                              onDelete={(user) => {
                                setConfirmUser(user);
                                setConfirmOpen(true);
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-[#16202E] flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Showing{" "}
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {filtered.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {users.length}
                </span>{" "}
                users
              </span>
              <button
                onClick={fetchUsers}
                className="text-[11px] text-blue-500 hover:text-blue-600 font-semibold transition-colors"
              >
                ↻ Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
