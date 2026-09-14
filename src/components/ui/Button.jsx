import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-brand-500 text-white shadow-app-sm hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-300",
  secondary:
    "bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-app-xs hover:bg-[var(--surface-card-hover)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]",
  danger:
    "bg-danger-500 text-white shadow-app-sm hover:bg-danger-600 disabled:bg-danger-500/50",
  link: "bg-transparent text-brand-500 hover:text-brand-600 underline-offset-4 hover:underline p-0 h-auto shadow-none",
};

const SIZES = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
  icon: "h-10 w-10 p-0 justify-center",
};

/**
 * AppButton — the single button primitive for the app.
 * Usage: <AppButton variant="primary" icon={Plus}>New tenant</AppButton>
 */
export default function AppButton({
  as: Component = "button",
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
  children,
  ...props
}) {
  return (
    <Component
      disabled={disabled || loading}
      className={`inline-flex items-center rounded-app-md font-medium transition-all duration-150
        disabled:cursor-not-allowed disabled:opacity-60
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500
        ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? "w-full justify-center" : ""} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!loading && Icon && iconPosition === "left" && <Icon className="h-4 w-4 shrink-0" />}
      {children && <span className={size === "icon" ? "sr-only" : ""}>{children}</span>}
      {!loading && Icon && iconPosition === "right" && <Icon className="h-4 w-4 shrink-0" />}
    </Component>
  );
}
