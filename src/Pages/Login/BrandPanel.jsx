// src/Pages/Login/BrandPanel.jsx
//
// Shared left-hand brand panel for the login/register family of screens
// (Login, LoginFree, RegisterFree). Keeping this in one place means the
// three screens always look and feel like one product instead of three.

import logo from "../../assets/evault-logo-light.png";

export default function BrandPanel({
  eyebrow = "Secure Sign-In",
  title,
  description,
  features = [],
  statusText = "All systems operational",
}) {
  return (
    <div className="relative hidden w-[42%] shrink-0 overflow-hidden bg-ink-950 lg:flex lg:flex-col lg:justify-between lg:p-10">
      {/* ambient brand glow */}
      <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-brand-400/10 blur-3xl" />
      {/* fine dot-grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative z-10">
        <img src={logo} alt="e-Vault" className="h-20 w-auto object-contain relative left-32 top-8  " />

        <div className="mt-1 flex items-center gap-2 pt-10 mt-7">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400 mt-[14px]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300 pt-4">
            {eyebrow}
          </span>
        </div>

        <h1 className="mt-8 font-display text-[28px] font-bold leading-tight text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-[700px] text-sm leading-relaxed text-ink-300">
            {description}
          </p>
        )}

        {features.length > 0 && (
          <div className="mt-9 flex flex-col gap-4">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-app-md bg-white/[0.06] ring-1 ring-white/10">
                  <Icon className="h-4 w-4 text-brand-300" />
                </div>
                <span className="text-[13px] font-medium text-ink-200">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10 flex items-center gap-2 pt-10">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-500 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
        </span>
        <span className="text-[11px] font-medium text-ink-400">{statusText}</span>
      </div>
    </div>
  );
}
