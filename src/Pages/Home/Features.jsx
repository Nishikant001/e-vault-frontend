// src/Pages/Home/Features.jsx
// Standalone Features page — same style as About.jsx / Contact.jsx
// SharedNavbar + SharedFooter LandingRouter.jsx mein already wrap karte hain,
// isliye yahan sirf page content hai.

import { useEffect, useRef, useState } from "react";
import {
  FolderOpen,
  Search,
  ShieldCheck,
  Workflow,
  UploadCloud,
  History,
  Users,
  BarChart3,
  ScanText,
  CheckCircle2,
  DatabaseZap,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Scroll-reveal hook — IntersectionObserver based fade-up.
   Respects prefers-reduced-motion automatically via CSS below.
   ──────────────────────────────────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function Reveal({ as: Tag = "div", delay = 0, className = "", children }) {
  const [ref, visible] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}

/* ──────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: FolderOpen,
    title: "Smart Organization",
    desc: "Organize documents efficiently using departments, categories, and document types for a well-structured repository.",
    color: "blue",
  },
  {
    icon: Search,
    title: "Powerful Search",
    desc: "Find documents instantly using TCodes, file names, metadata, or status with lightning-fast search capabilities.",
    color: "cyan",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Compliant",
    desc: "Protect sensitive information with role-based access control, encryption, and enterprise-grade security.",
    color: "emerald",
  },
  {
    icon: Workflow,
    title: "Approval Workflows",
    desc: "Create multi-level approval workflows that automate document reviews and approvals across teams.",
    color: "purple",
  },
  {
    icon: UploadCloud,
    title: "Seamless Upload",
    desc: "Upload documents effortlessly with drag-and-drop functionality and automatic OCR processing.",
    color: "amber",
  },
  {
    icon: History,
    title: "Version History",
    desc: "Track every document version and access previous revisions whenever needed.",
    color: "rose",
  },
  {
    icon: Users,
    title: "Multi-Role Access",
    desc: "Provide tailored dashboards and permissions for Super Admins, Managers, Reviewers, and Viewers.",
    color: "indigo",
  },
  {
    icon: BarChart3,
    title: "Audit & Analytics",
    desc: "Gain complete visibility with real-time audit logs, reporting, and workflow analytics.",
    color: "sky",
  },
];

const COLOR_MAP = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100", glow: "group-hover:shadow-blue-100" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-600", ring: "ring-cyan-100", glow: "group-hover:shadow-cyan-100" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100", glow: "group-hover:shadow-emerald-100" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", ring: "ring-purple-100", glow: "group-hover:shadow-purple-100" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100", glow: "group-hover:shadow-amber-100" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-100", glow: "group-hover:shadow-rose-100" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", ring: "ring-indigo-100", glow: "group-hover:shadow-indigo-100" },
  sky: { bg: "bg-sky-50", text: "text-sky-600", ring: "ring-sky-100", glow: "group-hover:shadow-sky-100" },
};

const STATS = [
  { value: "10,000+", label: "Documents processed daily" },
  { value: "99.9%", label: "Platform uptime" },
  { value: "8", label: "Role-based access levels" },
  { value: "< 2s", label: "Average search response" },
];

const WORKFLOW_STEPS = [
  { icon: UploadCloud, title: "Upload", desc: "Documents are uploaded and assigned to the appropriate department and category.", color: "blue" },
  { icon: ScanText, title: "OCR Processing", desc: "Text, metadata, and TCodes are automatically extracted, reducing manual effort.", color: "amber" },
  { icon: CheckCircle2, title: "Approval", desc: "Documents are routed through predefined workflows to the appropriate approvers.", color: "purple" },
  { icon: DatabaseZap, title: "SAP Sync", desc: "Once approved, documents are securely synchronized and stored in SAP.", color: "emerald" },
];

const COMPARISON = [
  { label: "Document search time", before: "15–20 min manual digging", after: "Under 2 seconds" },
  { label: "Approval visibility", before: "Email threads, no tracking", after: "Real-time status for every step" },
  { label: "Version control", before: "File names like 'final_v3_FINAL'", after: "Automatic version history" },
  { label: "Audit readiness", before: "Scramble before every audit", after: "Always-on audit trail" },
];

const FAQS = [
  {
    q: "Can DMS integrate with an existing SAP environment?",
    a: "Yes. Once a document is approved, it can be synchronized directly with SAP using configured integration workflows, eliminating manual data entry.",
  },
  {
    q: "How does role-based access work?",
    a: "Each user is assigned a specific role such as Super Admin, Tenant Admin, Manager, Reviewer, or Viewer, with permissions tailored to their responsibilities.",
  },
  {
    q: "How accurate is the OCR processing?",
    a: "The OCR engine accurately extracts text and TCodes from both printed and scanned documents, while low-confidence results can be reviewed during approval.",
  },
  {
    q: "Are previous document versions preserved?",
    a: "Yes. Every upload creates a new version, while all previous versions remain accessible through the document history.",
  },
];

function FaqItem({ item, index }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="font-semibold text-gray-900 text-[15px] group-hover:text-blue-600 transition-colors">
          {item.q}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
            open ? "rotate-180 text-blue-500" : ""
          }`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? "200px" : "0px" }}
      >
        <p className="text-gray-500 text-sm leading-relaxed pb-5 pr-8">
          {item.a}
        </p>
      </div>
    </div>
  );
}

export default function Features({ onNavigate }) {
  const [activeStep, setActiveStep] = useState(0);

  // Auto-advance the workflow simulator
  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((s) => (s + 1) % WORKFLOW_STEPS.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-white overflow-hidden">
      <style>{`
        @keyframes floatSlow { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-10px) } }
        @keyframes pulseRing { 0%{ box-shadow: 0 0 0 0 rgba(37,99,235,0.25) } 100%{ box-shadow: 0 0 0 14px rgba(37,99,235,0) } }
        @keyframes shimmer { 0%{ background-position: -200% 0 } 100%{ background-position: 200% 0 } }
        @keyframes drawLine { from{ stroke-dashoffset: 1 } to{ stroke-dashoffset: 0 } }

        .reveal { opacity: 0; transform: translateY(18px); transition: opacity 0.6s cubic-bezier(.2,.7,.2,1), transform 0.6s cubic-bezier(.2,.7,.2,1); }
        .reveal-visible { opacity: 1; transform: translateY(0); }

        .float-anim { animation: floatSlow 5s ease-in-out infinite; }
        .active-pulse { animation: pulseRing 1.8s ease-out infinite; }

        .progress-track { background: linear-gradient(90deg,#e2e8f0 0%, #e2e8f0 100%); }
        .progress-fill { background: linear-gradient(90deg,#2563eb,#06b6d4); transition: width 0.6s cubic-bezier(.4,0,.2,1); }

        @media (prefers-reduced-motion: reduce) {
          .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
          .float-anim, .active-pulse { animation: none !important; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-b from-blue-50/60 via-white to-white py-20 px-4 sm:px-6 lg:px-8">
        {/* ambient blobs */}
        <div className="absolute top-10 left-[8%] w-72 h-72 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 right-[10%] w-72 h-72 bg-cyan-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 active-pulse"></span>
              Everything you need
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
              Powerful Features for{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Modern Document Management
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 text-gray-500 text-lg max-w-2xl mx-auto">
  DMS provides everything you need to securely store, organize, manage,
  and process your documents — from upload to SAP integration, all within
  a single unified platform.
</p>
          </Reveal>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="px-4 sm:px-6 lg:px-8 -mt-2">
        <Reveal className="max-w-6xl mx-auto bg-gray-900 rounded-3xl px-6 sm:px-10 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 shadow-xl shadow-gray-200">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="text-center sm:border-r sm:last:border-r-0 border-white/10"
            >
              <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="text-[11px] sm:text-xs text-gray-400 mt-1.5 leading-snug">
                {s.label}
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ── Feature Grid ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Built for every part of the document lifecycle
            </h2>
            <p className="text-gray-500 mt-3 text-sm sm:text-base">
              Every feature is designed to solve real business workflow challenges,
bringing greater control, efficiency, and transparency.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const c = COLOR_MAP[f.color];
              return (
                <Reveal key={f.title} delay={i * 60}>
                  <div
                    className={`group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl ${c.glow} hover:-translate-y-1.5 transition-all duration-300 h-full`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${c.bg} ${c.text} flex items-center justify-center ring-4 ${c.ring} mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-base mb-2">
                      {f.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Live workflow simulator (signature element) ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-12 max-w-2xl mx-auto">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              How it works
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-4">
              From upload to SAP, fully tracked
            </h2>
           <p className="text-gray-500 mt-3 text-sm sm:text-base">
  Follow the complete journey of a document from upload to final SAP storage.
</p>
          </Reveal>

          <Reveal className="bg-white border border-gray-100 rounded-3xl shadow-lg shadow-gray-100 p-6 sm:p-10">
            {/* progress bar */}
            <div className="relative h-1.5 progress-track rounded-full mb-10 overflow-hidden">
              <div
                className="progress-fill h-full rounded-full"
                style={{
                  width: `${((activeStep + 1) / WORKFLOW_STEPS.length) * 100}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {WORKFLOW_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isActive = i === activeStep;
                const isDone = i < activeStep;
                const c = COLOR_MAP[step.color];
                return (
                  <button
                    key={step.title}
                    onClick={() => setActiveStep(i)}
                    className="text-left focus:outline-none"
                  >
                    <div
                      className={`relative w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${
                        isActive
                          ? `${c.bg} ${c.text} ring-4 ${c.ring} scale-110 float-anim`
                          : isDone
                          ? "bg-gray-50 text-gray-400"
                          : "bg-gray-50 text-gray-300"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      {isActive && (
                        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 active-pulse" />
                      )}
                    </div>
                    <div
                      className={`text-sm font-bold mb-1 transition-colors ${
                        isActive ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      0{i + 1} · {step.title}
                    </div>
                    <p
                      className={`text-xs leading-relaxed transition-colors ${
                        isActive ? "text-gray-500" : "text-gray-300"
                      }`}
                    >
                      {step.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Before / After comparison ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Before DMS vs. After DMS
            </h2>
            <p className="text-gray-500 mt-3 text-sm sm:text-base">
              Move from scattered spreadsheets and email chains to a centralized,
fully auditable document management system.
            </p>
          </Reveal>

          <Reveal className="rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {COMPARISON.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr] ${
                  i !== COMPARISON.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="px-6 py-5 bg-gray-50/60 font-semibold text-gray-700 text-sm flex items-center">
                  {row.label}
                </div>
                <div className="px-6 py-5 text-sm text-gray-400 flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-gray-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                  {row.before}
                </div>
                <div className="px-6 py-5 text-sm text-gray-900 font-medium flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-gray-100 bg-blue-50/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {row.after}
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50/60">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Frequently asked questions
            </h2>
          </Reveal>
          <Reveal className="bg-white rounded-3xl border border-gray-100 shadow-sm px-6 sm:px-8">
            {FAQS.map((item, i) => (
              <FaqItem key={item.q} item={item} index={i} />
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-5xl mx-auto relative bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl px-8 sm:px-16 py-14 text-center shadow-xl shadow-blue-200 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <h2 className="relative text-3xl font-bold text-white mb-3">
            Ready to get started?
          </h2>
          <p className="relative text-blue-50 mb-7 max-w-xl mx-auto">
            Start managing your documents smarter, faster, and more securely today.
          </p>
          <button
            onClick={() => onNavigate && onNavigate("home")}
            className="relative inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-7 py-3 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
          >
            Back to Home
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </Reveal>
      </section>
    </div>
  );
}