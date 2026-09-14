// src/Pages/Login/RegisterFree.jsx
//
// FREE tenant self-registration — mobile number → OTP → tenant name +
// password → auto-login. Entirely separate from Login.jsx (the existing
// PAID email/password screen), which is untouched. On success this stores
// tokens exactly like Login.jsx does and calls the same onLogin(user)
// contract, so App.jsx doesn't need to know which flow the user came from.
//
// Shares the same split-screen shell (BrandPanel + ThemeToggle) as
// Login.jsx and LoginFree.jsx so the three screens read as one product.

import { useState, useRef, useEffect } from "react";
import {
  Smartphone,
  ShieldCheck,
  Building2,
  Lock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Rocket,
  Mail,
} from "lucide-react";
import { AppInput, AppButton, useToast } from "../../components/ui";
import { setToken } from "../../services/apiClient";
import {
  FreeRegisterApi,
  cacheSubscriptionSnapshot,
} from "../../services/subscriptionApi";
import BrandPanel from "./BrandPanel";
import ThemeToggle from "./ThemeToggle";

const RESEND_SECONDS = 30;

const FEATURES = [
  { icon: Rocket, label: "Live in under 2 minutes" },
  { icon: Building2, label: "Your own tenant workspace" },
  { icon: ShieldCheck, label: "Enterprise-grade security, day one" },
];

function StepDots({ step }) {
  return (
    <div className="mb-7 flex items-center justify-center gap-2">
      {[1, 2, 3].map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              n < step
                ? "bg-success-500 text-white"
                : n === step
                  ? "bg-brand-500 text-white"
                  : "bg-[var(--surface-sunken)] text-[var(--text-tertiary)]"
            }`}
          >
            {n < step ? <CheckCircle2 className="h-4 w-4" /> : n}
          </div>
          {n < 3 && (
            <div
              className={`h-0.5 w-8 rounded-full ${n < step ? "bg-success-500" : "bg-[var(--border-subtle)]"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function RegisterFree({ onLogin, onBackToLogin }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [email, setEmail] = useState("");
  const timerRef = useRef(null);
  const [ownerName, setOwnerName] = useState("");

  useEffect(() => {
    if (resendIn <= 0) return;
    timerRef.current = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [resendIn]);

  function isValidMobile(v) {
    return /^\d{10}$/.test(v.trim());
  }

  async function sendOtp() {
    setError("");
    if (!isValidMobile(mobileNumber))
      return setError("Enter a valid 10-digit mobile number.");
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()))
      return setError("Enter a valid email address.");
    setLoading(true);
    try {
      await FreeRegisterApi.sendOtp(mobileNumber.trim(), email.trim()); // email bhi pass karo
      toast({
        title: "OTP sent",
        description: `We texted a code to ${mobileNumber}.`,
        tone: "success",
      });
      setResendIn(RESEND_SECONDS);
      setStep(2);
    } catch (err) {
      setError(err.message || "Could not send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (resendIn > 0) return;
    setLoading(true);
    setError("");
    try {
      await FreeRegisterApi.sendOtp(mobileNumber.trim(), email.trim());
      toast({ title: "OTP resent", tone: "success" });
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(err.message || "Could not resend OTP.");
    } finally {
      setLoading(false);
    }
  }

async function confirmOtpAndContinue() {
  setError("");
  if (!/^\d{6}$/.test(otp.trim())) return setError("Enter the 6-digit code.");

  setLoading(true);
  try {
    await FreeRegisterApi.verifyOtp(mobileNumber.trim(), otp.trim());
    setStep(3);
  } catch (err) {
    setError(err.message || "Invalid or expired OTP. Please try again.");
  } finally {
    setLoading(false);
  }
}

  async function createAccount() {
    setError("");
    if (!ownerName.trim()) return setError("Owner name is required.");
    if (!tenantName.trim()) return setError("Organization name is required.");
    if (password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword)
      return setError("Passwords do not match.");

    setLoading(true);
    try {
      const data = await FreeRegisterApi.complete({
        mobileNumber: mobileNumber.trim(),
        ownerName: ownerName.trim(),
        companyName: tenantName.trim(),
        password,
        confirmPassword,
      });

      setToken(data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      cacheSubscriptionSnapshot(null);

      let role = "TenantAdmin";
      let name = ownerName.trim();
      let tenantId = data.tenant?.id ?? null;
      try {
        const payload = JSON.parse(atob(data.accessToken.split(".")[1]));
        role = payload.role || role;
        name = payload.name || name;
        tenantId = payload.tenantId || tenantId;
      } catch {
        // fall back to the values above
      }

      toast({
        title: "Trial started",
        description: "Your 30-day free trial is now active.",
        tone: "success",
      });
      onLogin?.({
        email: data.user?.email ?? null,
        mobileNumber: mobileNumber.trim(),
        role,
        name,
        tenantId,
      });
    } catch (err) {
      setError(
        err.message || "Could not create your account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const STEP_COPY = {
    1: {
      title: "Start your free trial",
      subtitle: "30 days, full document management, no card required.",
    },
    2: {
      title: "Verify your number",
      subtitle: "Enter the code we just sent you.",
    },
    3: {
      title: "Set up your workspace",
      subtitle: "Name your organization and choose a password.",
    },
  };

  return (
    <div className="relative   flex min-h-screen bg-[var(--surface-card)]">
      <ThemeToggle />
      <BrandPanel
        eyebrow="Free Trial"
        title="30 days, no SAP or AI Assistant, full document management."
        description="Everything you need to organize, review, and approve documents — set up in minutes."
        features={FEATURES}
      />

      <div className="flex w-full flex-col items-center justify-center bg-[var(--surface-card)] px-6 py-10 sm:px-12 lg:w-[58%] lg:px-16">
        <div className="w-full max-w-[440px]">
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            {STEP_COPY[step].title}
          </h2>
          <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
            {STEP_COPY[step].subtitle}
          </p>

          <div className="mt-8">
            <StepDots step={step} />

            {error && (
              <div className="mb-4 rounded-app-md border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600 dark:bg-danger-500/10 dark:text-danger-500">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <AppInput
                  label="Mobile number"
                  icon={Smartphone}
                  required
                  inputMode="numeric"
                  placeholder="98765 43210"
                  value={mobileNumber}
                  onChange={(e) =>
                    setMobileNumber(
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                />
                <AppInput
                  label="Email address"
                  icon={Mail}
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                />
                <AppButton
                  fullWidth
                  size="lg"
                  loading={loading}
                  onClick={sendOtp}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Send OTP
                </AppButton>
                ...
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <AppInput
                  label="6-digit code"
                  icon={ShieldCheck}
                  required
                  inputMode="numeric"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" && confirmOtpAndContinue()
                  }
                  hint={`Code sent to ${mobileNumber}`}
                />
                <AppButton
  fullWidth
  size="lg"
  loading={loading}
  onClick={confirmOtpAndContinue}
  icon={ArrowRight}
  iconPosition="right"
>
  Verify
</AppButton>
                <div className="text-center text-sm text-[var(--text-secondary)]">
                  {resendIn > 0 ? (
                    <span>Resend code in {resendIn}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={loading}
                      className="font-medium text-brand-500 hover:text-brand-600"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Change number
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <AppInput
                  label="Owner name"
                  icon={Building2}
                  required
                  placeholder="Your full name"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                />
                <AppInput
  label="Organization name"
  icon={Building2}
  required
  placeholder="Acme Hospitality"
  value={tenantName}
  onChange={(e) => setTenantName(e.target.value)}
/>
                <AppInput
                  label="Password"
                  icon={Lock}
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <AppInput
                  label="Confirm password"
                  icon={Lock}
                  type={showPass ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createAccount()}
                />
                <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={showPass}
                    onChange={(e) => setShowPass(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-[var(--border-default)] text-brand-500 focus:ring-brand-500/30"
                  />
                  Show passwords
                </label>
                <AppButton
                  fullWidth
                  size="lg"
                  loading={loading}
                  onClick={createAccount}
                >
                  Create account &amp; start trial
                </AppButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
