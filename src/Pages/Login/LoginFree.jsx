// src/Pages/Login/LoginFree.jsx
//
// FREE tenant login — mobile number + password, with a "Login via OTP
// instead" toggle. Separate from Login.jsx (existing PAID email/password
// screen), which this file never imports or modifies. On success, stores
// tokens + caches the trial snapshot exactly like Login.jsx stores its own
// tokens, then calls the same onLogin(user) contract App.jsx expects.
//
// Shares the same split-screen shell (BrandPanel + ThemeToggle) as
// Login.jsx and RegisterFree.jsx so the three screens read as one product.

import { useState, useRef, useEffect } from "react";
import { Smartphone, Lock, ShieldCheck, ArrowLeft, KeyRound, Sparkles, Clock3, HeadphonesIcon } from "lucide-react";
import { AppInput, AppButton, useToast } from "../../components/ui";
import { setToken } from "../../services/apiClient";
import { FreeLoginApi, cacheSubscriptionSnapshot } from "../../services/subscriptionApi";
import BrandPanel from "./BrandPanel";
import ThemeToggle from "./ThemeToggle";

const RESEND_SECONDS = 30;

const FEATURES = [
  { icon: Sparkles, label: "Full document management, free" },
  { icon: Clock3, label: "30-day trial, no card required" },
  { icon: HeadphonesIcon, label: "Upgrade anytime, no lock-in" },
];

export default function LoginFree({ onLogin, onBackToLogin, onGoToRegister }) {
  const { toast } = useToast();
  const [mode, setMode] = useState("password"); // "password" | "otp"
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    timerRef.current = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [resendIn]);

  function isValidMobile(v) {
    return /^\d{10}$/.test(v.trim());
  }

  function finishLogin(data) {
    setToken(data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    cacheSubscriptionSnapshot(data.subscription || null);

    let role = "TenantAdmin";
    let name = mobileNumber.trim();
    let tenantId = null;
    try {
      const payload = JSON.parse(atob(data.accessToken.split(".")[1]));
      role = payload.role || role;
      name = payload.name || payload.email || name;
      tenantId = payload.tenantId || null;
    } catch {
      // fall back to defaults above
    }

    onLogin?.({ email: null, mobileNumber: mobileNumber.trim(), role, name, tenantId });
  }

  async function handleSendOtp() {
    setError("");
    if (!isValidMobile(mobileNumber)) return setError("Enter a valid 10-digit mobile number.");
    setLoading(true);
    try {
      await FreeLoginApi.sendOtp(mobileNumber.trim());
      toast({ title: "OTP sent", tone: "success" });
      setOtpSent(true);
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(err.message || "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setError("");
    if (!isValidMobile(mobileNumber)) return setError("Enter a valid 10-digit mobile number.");

    if (mode === "password") {
      if (!password) return setError("Password is required.");
    } else if (!otpSent) {
      return handleSendOtp();
    } else if (!/^\d{6}$/.test(otp.trim())) {
      return setError("Enter the 6-digit code.");
    }

    setLoading(true);
    try {
      const data = await FreeLoginApi.login(
        mode === "password"
          ? { mobileNumber: mobileNumber.trim(), password }
          : { mobileNumber: mobileNumber.trim(), otp: otp.trim() },
      );
      finishLogin(data);
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setError("");
    setOtp("");
    setOtpSent(false);
    setResendIn(0);
  }

  return (
    <div className="relative flex min-h-screen bg-[var(--surface-card)]">
      <ThemeToggle />
      <BrandPanel
        eyebrow="Free Trial"
        title="Try the full platform, on us."
        description="Sign in with your mobile number to pick up your 30-day free trial where you left off."
        features={FEATURES}
      />

      <div className="flex w-full flex-col items-center justify-center bg-[var(--surface-card)] px-6 py-10 sm:px-12 lg:w-[58%] lg:px-16">
          <div className="w-full max-w-[440px]">
            <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Free trial sign in</h2>
            <p className="mt-2 text-[15px] text-[var(--text-secondary)]">Sign in with your mobile number.</p>

            <div className="mt-8 space-y-5">
              <AppInput
                label="Mobile number"
                icon={Smartphone}
                required
                inputMode="numeric"
                placeholder="98765 43210"
                value={mobileNumber}
                onChange={(e) => {
                  setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                  setOtpSent(false);
                }}
              />

              {mode === "password" ? (
                <div>
                  <AppInput
                    label="Password"
                    icon={Lock}
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <label className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={showPass}
                      onChange={(e) => setShowPass(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-[var(--border-default)] text-brand-500 focus:ring-brand-500/30"
                    />
                    Show password
                  </label>
                </div>
              ) : (
                <>
                  <AppInput
                    label="6-digit code"
                    icon={ShieldCheck}
                    inputMode="numeric"
                    placeholder={otpSent ? "123456" : "Send a code first"}
                    disabled={!otpSent}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  {otpSent && (
                    <div className="text-right text-sm">
                      {resendIn > 0 ? (
                        <span className="text-[var(--text-tertiary)]">Resend in {resendIn}s</span>
                      ) : (
                        <button type="button" onClick={handleSendOtp} className="font-medium text-brand-500 hover:text-brand-600">
                          Resend OTP
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="rounded-app-md border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600 dark:bg-danger-500/10 dark:text-danger-500">
                  {error}
                </div>
              )}

              <AppButton
                fullWidth
                size="lg"
                loading={loading}
                onClick={handleLogin}
                icon={mode === "otp" && !otpSent ? KeyRound : undefined}
              >
                {mode === "otp" && !otpSent ? "Send OTP" : "Sign in"}
              </AppButton>

              <button
                type="button"
                onClick={() => switchMode(mode === "password" ? "otp" : "password")}
                className="w-full text-center text-sm font-medium text-brand-500 hover:text-brand-600"
              >
                {mode === "password" ? "Login via OTP instead" : "Login with password instead"}
              </button>

              <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4 text-sm">
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="flex items-center gap-1.5 font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Paid account sign in
                </button>
                <button type="button" onClick={onGoToRegister} className="font-medium text-brand-500 hover:text-brand-600">
                  Start free trial
                </button>
              </div>
            </div>
          </div>
        </div>

     
    </div>
  );
}
