import { useState } from "react";
import { SYS_CONFIG, NOTIF_SETTINGS } from "../SuperAdmin/Superadmincontext";

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${on ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"}`}
    >
      <span className={`absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${on ? "left-[22px]" : "left-[3px]"}`} />
    </button>
  );
}

function EditModal({ field, value, onClose, onSave }) {
  const [val, setVal] = useState(value);
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 mb-4">Edit — {field}</h3>
        <input
          type="text"
          value={val}
          onChange={e => setVal(e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
        />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
          <button onClick={() => { onSave(val); onClose(); }} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function SystemSettings() {
  const [config, setConfig] = useState(SYS_CONFIG);
  const [notifs, setNotifs] = useState(NOTIF_SETTINGS);
  const [editItem, setEditItem] = useState(null);
  const [saved, setSaved] = useState(false);

  function handleSaveConfig(index, newVal) {
    setConfig(prev => prev.map((c, i) => i === index ? { ...c, value: newVal } : c));
  }

  function toggleNotif(key) {
    setNotifs(prev => prev.map(n => n.key === key ? { ...n, on: !n.on } : n));
  }

  function handleSaveAll() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">System Settings</h2>
          <p className="text-[11px] text-slate-400 mt-px">Global platform configuration</p>
        </div>
        <button
          onClick={handleSaveAll}
          className={`px-4 py-[8px] text-[12px] font-bold rounded-lg transition-all ${
            saved
              ? "bg-green-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {saved ? "✓ Saved!" : "Save All Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* System Config */}
        <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">⚙ System Configuration</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {config.map((c, i) => (
              <div key={c.label} className="flex items-center px-4 py-[13px] hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <span className="flex-1 text-[12px] text-slate-600 dark:text-slate-400">{c.label}</span>
                <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 mr-3">{c.value}</span>
                <button
                  onClick={() => setEditItem({ index: i, label: c.label, value: c.value })}
                  className="px-3 py-[4px] border border-slate-200 dark:border-slate-600 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">✉ Notification Settings</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {notifs.map((n) => (
              <div key={n.key} className="flex items-center px-4 py-[14px] hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <span className="flex-1 text-[12px] text-slate-600 dark:text-slate-400">{n.label}</span>
                <Toggle on={n.on} onChange={() => toggleNotif(n.key)} />
              </div>
            ))}
          </div>

          {/* Security section */}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
            <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Security</h4>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between px-3 py-[10px] border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-[12px] text-slate-700 dark:text-slate-300 font-medium">
                <span>🔑 Reset Master Key</span>
                <span className="text-slate-400">→</span>
              </button>
              <button className="w-full flex items-center justify-between px-3 py-[10px] border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-[12px] text-slate-700 dark:text-slate-300 font-medium">
                <span>🔒 Force 2FA All Users</span>
                <span className="text-slate-400">→</span>
              </button>
              <button className="w-full flex items-center justify-between px-3 py-[10px] border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-[12px] text-red-600 dark:text-red-400 font-medium">
                <span>⚠ Clear All Sessions</span>
                <span className="text-red-400">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {editItem && (
        <EditModal
          field={editItem.label}
          value={editItem.value}
          onClose={() => setEditItem(null)}
          onSave={(val) => handleSaveConfig(editItem.index, val)}
        />
      )}
    </div>
  );
}