/**
 * tabs: [{ value, label, icon }]
 */
export default function Tabs({ tabs, value, onChange, className = "" }) {
  return (
    <div role="tablist" className={`flex items-center gap-1 border-b border-[var(--border-subtle)] ${className}`}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors
              ${active ? "text-brand-500" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {tab.label}
            {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-500" />}
          </button>
        );
      })}
    </div>
  );
}
