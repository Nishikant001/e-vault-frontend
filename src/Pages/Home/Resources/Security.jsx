// src/Pages/Home/Resources/Security.jsx
import {
  Lock, Rocket, Users, ClipboardList, KeyRound, Globe, RefreshCw, Timer,
  ShieldCheck, Check, Award, Hospital, MapPin, Bug,
} from "lucide-react";

const FEATURES = [
  {
    icon: Lock,
    title: "AES-256 Encryption",
    desc: "All documents are encrypted at rest using AES-256 — the same standard used by banks and government agencies.",
    color: "border-blue-200 bg-blue-50",
  },
  {
    icon: Rocket,
    title: "TLS 1.3 in Transit",
    desc: "Data in transit is protected by TLS 1.3 to prevent interception during upload, download, or sharing.",
    color: "border-cyan-200 bg-cyan-50",
  },
  {
    icon: Users,
    title: "Role-Based Access Control",
    desc: "Fine-grained permissions ensure users can only access documents they're authorized to view or edit.",
    color: "border-purple-200 bg-purple-50",
  },
  {
    icon: ClipboardList,
    title: "Immutable Audit Logs",
    desc: "Every action — view, edit, delete, share — is recorded in tamper-proof logs with timestamp and user identity.",
    color: "border-emerald-200 bg-emerald-50",
  },
  {
    icon: KeyRound,
    title: "Two-Factor Authentication",
    desc: "Enforce 2FA for all users or specific roles to prevent unauthorized access even if credentials are compromised.",
    color: "border-orange-200 bg-orange-50",
  },
  {
    icon: Globe,
    title: "IP Allowlisting",
    desc: "Restrict access to your DMS instance to specific IP ranges or corporate VPNs for enhanced network security.",
    color: "border-rose-200 bg-rose-50",
  },
  {
    icon: RefreshCw,
    title: "Automated Backups",
    desc: "Daily encrypted backups with 90-day retention. Point-in-time restore available on Enterprise plans.",
    color: "border-indigo-200 bg-indigo-50",
  },
  {
    icon: Timer,
    title: "Session Management",
    desc: "Configurable session timeouts, single-session enforcement, and force logout for all active sessions.",
    color: "border-teal-200 bg-teal-50",
  },
];

const CERTIFICATIONS = [
  { name: "ISO 27001", icon: Award, desc: "Information Security Management" },
  { name: "SOC 2 Type II", icon: ShieldCheck, desc: "Security & Availability" },
  { name: "GDPR", icon: Globe, desc: "EU Data Protection Compliant" },
  { name: "HIPAA", icon: Hospital, desc: "Healthcare Data Standards" },
];

export default function Security() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-4">
          <ShieldCheck className="w-3.5 h-3.5" /> Security
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Enterprise-Grade Security</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Your documents are protected by multiple layers of security — from encryption to access controls to compliance certifications.
        </p>
      </div>

      {/* Security score banner */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 text-white text-center mb-14 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -translate-x-20 -translate-y-20"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/5 rounded-full translate-x-20 translate-y-20"></div>
        <div className="relative z-10">
          <div className="text-6xl font-extrabold mb-1">A+</div>
          <div className="text-blue-100 mb-4 text-sm">Security Rating — Independently Verified</div>
          <div className="flex flex-wrap justify-center gap-4">
            {["99.9% Uptime SLA", "0 Data Breaches", "24/7 Monitoring", "< 1hr Incident Response"].map((badge) => (
              <span key={badge} className="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                <Check className="w-3.5 h-3.5" /> {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Features grid */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Features</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
        {FEATURES.map((f) => (
          <div key={f.title} className={`border rounded-2xl p-5 hover:shadow-md transition-all ${f.color}`}>
            <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3"><f.icon className="w-5 h-5 text-gray-700" /></div>
            <h3 className="font-bold text-gray-800 mb-1.5 text-sm">{f.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Compliance */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Compliance & Certifications</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
        {CERTIFICATIONS.map((cert) => (
          <div key={cert.name} className="bg-white border border-gray-100 rounded-2xl p-6 text-center hover:shadow-md transition-all hover:border-blue-200">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3"><cert.icon className="w-7 h-7 text-blue-600" /></div>
            <div className="font-bold text-gray-800">{cert.name}</div>
            <div className="text-xs text-gray-400 mt-1">{cert.desc}</div>
          </div>
        ))}
      </div>

      {/* Data residency */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center gap-6">
        <span className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0"><MapPin className="w-8 h-8 text-blue-600" /></span>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 text-lg mb-1">Data Residency Options</h3>
          <p className="text-gray-500 text-sm">Choose where your data lives — India, EU, US, or Singapore data centers. Enterprise plans support private cloud deployments.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {["🇮🇳 India", "🇪🇺 EU", "🇺🇸 USA", "🇸🇬 Singapore"].map((region) => (
              <span key={region} className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600">{region}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Vulnerability reporting */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center gap-5">
        <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0"><Bug className="w-7 h-7" /></span>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">Responsible Disclosure Program</h3>
          <p className="text-slate-300 text-sm">Found a security issue? We have an active bug bounty program. Report it and we'll respond within 24 hours.</p>
        </div>
        <button className="shrink-0 bg-white text-slate-800 font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-all text-sm">
          Report a Vulnerability
        </button>
      </div>
    </main>
  );
}