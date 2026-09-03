/**
 * AppCard — base surface for nearly every panel in the app.
 * Pass `accent` (a token color, e.g. "brand" | "success" | "warning" | "danger" | "info")
 * to show the folder-tab signature notch on the card's top edge.
 */
export default function AppCard({
  as: Component = "div",
  accent,
  interactive = false,
  padding = "p-6",
  className = "",
  children,
  ...props
}) {
  const accentVar = accent ? { "--tab-color": `var(--color-${accent}-500)` } : undefined;
  return (
    <Component
      style={accentVar}
      className={`relative rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)]
        shadow-app-sm ${padding} ${accent ? "folder-tab mt-1.5" : ""}
        ${interactive ? "transition-all duration-150 hover:shadow-app-md hover:border-[var(--border-default)] cursor-pointer" : ""}
        ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-5 ${className}`}>
      <div className="min-w-0">
        <h3 className="font-display font-semibold text-[15px] text-[var(--text-primary)] truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
