// src/Pages/Audit/auditDisplay.js
// Small presentational helpers shared by the Audit list, timeline and modal.

const ACTION_PALETTE = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
];

export function actionColor(action = "") {
  if (/delete|reject|fail/i.test(action)) {
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  }
  if (/approve|success|complet/i.test(action)) {
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  }
  let hash = 0;
  for (let i = 0; i < action.length; i++) hash = (hash * 31 + action.charCodeAt(i)) >>> 0;
  return ACTION_PALETTE[hash % ACTION_PALETTE.length];
}

export function statusColor(status = "") {
  switch (String(status).toUpperCase()) {
    case "SUCCESS":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
    case "FAILED":
      return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800";
    case "PENDING":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  }
}

export function formatDateTime(value) {
  if (!value) return { date: "—", time: "" };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "" };
  return {
    date: d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

export function formatRelative(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

export function displayValue(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}

export function groupByDay(entries) {
  const groups = [];
  const map = new Map();
  entries.forEach((e) => {
    const d = e.createdAt ? new Date(e.createdAt) : null;
    const key = d ? d.toDateString() : "Unknown date";
    if (!map.has(key)) {
      const group = { key, label: d ? d.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "short", year: "numeric" }) : "Unknown date", items: [] };
      map.set(key, group);
      groups.push(group);
    }
    map.get(key).items.push(e);
  });
  return groups;
}
