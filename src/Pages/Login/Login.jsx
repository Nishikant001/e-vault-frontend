// src/Pages/Login/Login.jsx
//
// PAID tenant login — email + password. Redesigned to share the same
// split-screen shell and AppCard/AppInput/AppButton design system as
// LoginFree.jsx and RegisterFree.jsx, so all three screens read as one
// product. Auth logic (fetch, token storage, onLogin contract) is
// unchanged from the previous version.

import { useState } from "react";
import { Mail, Lock, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2, Link2, Users, ScrollText } from "lucide-react";
import { AppInput, AppButton } from "../../components/ui";
import { API_BASE_URL } from "../../services/apiClient";
import BrandPanel from "./BrandPanel";
import ThemeToggle from "./ThemeToggle";

const API = API_BASE_URL;

const FEATURES = [
  { icon: Link2, label: "SAP OData Integration" },
  { icon: ShieldCheck, label: "JWT \u00b7 TLS Encrypted" },
  { icon: Users, label: "Multi-Role Access Control" },
  { icon: ScrollText, label: "Audit Trail & Compliance" },
];

export default function Login({ onLogin, onStartFreeTrial, onFreeLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleLogin() {
    setError("");
    if (!email.trim()) return setError("Email address is required.");
    if (!password.trim()) return setError("Password is required.");

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      let userRole = "Viewer";
      let userName = email.split("@")[0];
      let userTenantId = null;

      try {
        const payload = JSON.parse(atob(data.accessToken.split(".")[1]));
        userRole = payload.role || "Viewer";
        userName = payload.name || payload.email || email;
        userTenantId = payload.tenantId || null;
      } catch {
        // fall back to the defaults above
      }

      setSuccess(true);
      setTimeout(() => {
        onLogin?.({ email: email.trim(), role: userRole, name: userName, tenantId: userTenantId });
      }, 500);
    } catch {
      setError("Cannot reach server. Is the backend running?");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen bg-[var(--surface-card)]">
      <ThemeToggle />
      <BrandPanel
        title="Documents, under control."
        description="Sign in to manage documents, approvals, and SAP synchronization from one secure workspace."
        features={FEATURES}
      />

      {/* Form side */}
      <div className="flex w-full flex-col items-center justify-center bg-[var(--surface-card)] px-6 py-10 sm:px-12 lg:w-[58%] lg:px-16">
          <div className="w-full max-w-[440px]">
            <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Welcome back</h2>
            <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
              Sign in with your work email. Your role and permissions load automatically.
            </p>

            <div className="mt-8 space-y-5">
              <AppInput
                label="Email address"
                icon={Mail}
                type="email"
                required
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />

              <div>
                <AppInput
                  label="Password"
                  icon={Lock}
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="Simtak@5672"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <div className="mt-2 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={showPass}
                      onChange={(e) => setShowPass(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-[var(--border-default)] text-brand-500 focus:ring-brand-500/30"
                    />
                    Show password
                  </label>
                  <button type="button" className="text-xs font-semibold text-brand-500 hover:text-brand-600">
                    Forgot password?
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-app-md border border-danger-500/30 bg-danger-50 px-3 py-2.5 text-sm font-medium text-danger-600 dark:bg-danger-500/10 dark:text-danger-500">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <AppButton
                fullWidth
                size="lg"
                loading={loading}
                onClick={handleLogin}
                icon={success ? CheckCircle2 : ArrowRight}
                iconPosition="right"
              >
                {success ? "Signed in" : "Sign in"}
              </AppButton>

              <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-[var(--text-tertiary)]">
                <ShieldCheck className="h-3 w-3" />
                Secured with JWT · TLS encrypted · Role auto-detected
              </div>

              
            </div>
          </div>
        </div>

     
    </div>
  );
}
