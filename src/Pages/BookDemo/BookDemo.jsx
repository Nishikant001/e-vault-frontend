// src/Pages/BookDemo/BookDemo.jsx
//
// Product overview / "Book Demo" landing page. This is a pure marketing
// page — it does NOT touch auth, login, or register logic. It only
// navigates OUT to your existing routes:
//   - "Start Free Trial"  -> /register  (your existing RegisterFree page)
//   - "Sign in" (footer)  -> /login     (your existing Login page)
//
// Drop this file in, wire up the route + button shown in the integration
// notes below, and you're done.

import { useState, useEffect, useRef } from "react";
import {
  ScanText, Search, ShieldCheck, KeyRound, History, Activity, WorkflowIcon,
  Bell, BarChart3, FolderOpen, Share2, Tags, Rocket, Play, X as XIcon,
  CheckCircle2, ChevronRight, ChevronDown, Plus, ArrowRight, Mail,
  UserCheck, ScrollText, LockKeyhole, FileText, Building2, Users,
  UploadCloud, FileSearch, GitBranch, LayoutDashboard, BookOpen,
  Sparkles, Clock3, CreditCard,
} from "lucide-react";

// ─────────────────────────────────────────────
// Small shared hook (self-contained, no cross-file deps)
// ─────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function Counter({ value, inView }) {
  const [count, setCount] = useState(0);
  const numeric = parseFloat(value.replace(/[^0-9.]/g, ""));
  const suffix = value.replace(/[0-9.,]/g, "");
  useEffect(() => {
    if (!inView || isNaN(numeric)) return;
    let start = 0;
    const duration = 1400;
    const step = numeric / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= numeric) { setCount(numeric); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, numeric]);
  if (isNaN(numeric)) return <span>{value}</span>;
  return <span>{Math.floor(count).toLocaleString()}{suffix}</span>;
}

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const TRUSTED = ["Company A", "Company B", "Company C", "Company D", "Company E"];

const FEATURES = [
  { icon: ScanText, title: "AI OCR", desc: "Automatically extract text from scanned images and PDFs." },
  { icon: Search, title: "Smart Search", desc: "Search by filename, OCR text, metadata and tags." },
  { icon: ShieldCheck, title: "Secure Cloud Storage", desc: "Enterprise-grade encrypted storage, always." },
  { icon: KeyRound, title: "Role Based Access", desc: "Super Admin, Tenant Admin, Manager and Employee tiers." },
  { icon: History, title: "Version Control", desc: "Track every document version and roll back instantly." },
  { icon: Activity, title: "Activity Logs", desc: "Audit every user action across your organization." },
  { icon: WorkflowIcon, title: "Workflow Automation", desc: "Route documents through approval chains automatically." },
  { icon: Bell, title: "Notifications", desc: "Real-time alerts for approvals, shares, and mentions." },
  { icon: BarChart3, title: "Dashboard Analytics", desc: "Visual reports on storage, activity, and workflows." },
  { icon: FolderOpen, title: "Folder Management", desc: "Unlimited nested folders, organized your way." },
  { icon: Share2, title: "Document Sharing", desc: "Share files securely, inside or outside your team." },
  { icon: Tags, title: "Metadata Extraction", desc: "Automatic metadata generation on every upload." },
];

const TRIAL_INCLUDES = [
  "Dashboard access", "Upload documents", "Folder management", "AI OCR",
  "Smart search", "Document preview", "Version history", "Activity logs",
  "User profile", "Notifications", "AI metadata extraction",
  "Basic role management", "Secure storage", "Responsive dashboard",
];

const HOW_IT_WORKS = [
  { title: "Create free account", desc: "Sign up with your mobile number, no card required." },
  { title: "Verify your number", desc: "Confirm with a one-time code sent by SMS." },
  { title: "Create your organization", desc: "Name your workspace and you're ready to go." },
  { title: "Upload documents", desc: "Drag in files or scan paper directly into DMS." },
  { title: "AI processes your files", desc: "OCR and metadata extraction run automatically." },
  { title: "Search anything", desc: "Find files by name, content, tag, or owner in seconds." },
  { title: "Collaborate with your team", desc: "Invite teammates and share documents securely." },
  { title: "Manage everything, securely", desc: "Roles, audit logs, and retention keep you in control." },
];

const WALKTHROUGH = [
  { icon: UploadCloud, eyebrow: "Upload", title: "Bring in any file, any way", desc: "Drag and drop or scan directly into DMS.", bullets: ["PDF, DOC, DOCX, XLS, XLSX", "PNG, JPG, ZIP", "Bulk upload with progress tracking"] },
  { icon: ScanText, eyebrow: "AI OCR", title: "Every scan becomes searchable text", desc: "Scanned pages and images are read automatically, no manual retyping.", bullets: ["Handwriting & print recognition", "Runs the moment you upload", "Powers full-text search"] },
  { icon: FileSearch, eyebrow: "Smart Search", title: "Find it in seconds, not folders", desc: "Search across everything your organization has ever stored.", bullets: ["By file name, OCR text or tag", "By metadata, date, folder or owner", "Instant, ranked results"] },
  { icon: GitBranch, eyebrow: "Version Control", title: "Nothing is ever really overwritten", desc: "Every save is a version you can compare and restore.", bullets: ["Full version history", "One-click restore", "See who changed what, and when"] },
  { icon: LayoutDashboard, eyebrow: "Analytics", title: "See the shape of your archive", desc: "Storage, activity, and workflow health, at a glance.", bullets: ["Upload & usage trends", "Bottleneck detection", "Exportable reports"] },
];

const MANUAL_SECTIONS = [
  {
    key: "getting-started", label: "Getting Started", icon: Rocket,
    items: ["Create an account", "Verify your email or mobile number", "Sign in", "Upload your first document", "Create a folder", "Search your documents", "Invite your team"],
  },
  {
    key: "uploading", label: "Uploading Files", icon: UploadCloud,
    items: ["Supported formats: PDF, DOC, DOCX, XLS, XLSX", "Images: PNG, JPG, JPEG", "Archives: ZIP", "Drag-and-drop or click to browse", "Bulk uploads run in the background"],
  },
  {
    key: "searching", label: "Searching", icon: Search,
    items: ["Search by file name", "Search by OCR-extracted text", "Filter by tags or metadata", "Filter by folder, owner, or date"],
  },
  {
    key: "versions", label: "Version Control", icon: History,
    items: ["Every save creates a new version", "Compare any two versions side by side", "Restore a previous version in one click"],
  },
  {
    key: "sharing", label: "Sharing", icon: Share2,
    items: ["Share a document with a teammate or a link", "Set view or edit permissions", "Revoke access anytime"],
  },
  {
    key: "notifications", label: "Notifications", icon: Bell,
    items: ["Real-time alerts for approvals and shares", "Configurable per-project notification rules"],
  },
  {
    key: "security", label: "Security", icon: ShieldCheck,
    items: ["Role-based access control", "AES-256 encrypted storage", "Full audit logs on every action"],
  },
  {
    key: "roles", label: "Roles", icon: Users,
    items: ["Super Admin — controls all organizations", "Tenant Admin — controls one organization", "Manager — approves workflows", "Employee — uploads and manages documents"],
  },
];

const ROLES = [
  { icon: LockKeyhole, title: "Super Admin", desc: "Controls all organizations on the platform." },
  { icon: Building2, title: "Tenant Admin", desc: "Controls a single organization's workspace." },
  { icon: UserCheck, title: "Manager", desc: "Reviews and approves documents in workflows." },
  { icon: FileText, title: "Employee", desc: "Uploads and manages day-to-day documents." },
];

const STATS = [
  { value: "99.9%", label: "Availability" },
  { value: "1,000,000+", label: "Documents Managed" },
  { value: "500+", label: "Organizations" },
  { value: "100,000+", label: "Users" },
];

const FAQ = [
  { q: "How long is the free trial?", a: "The free trial runs for 14 days with full access to core document management features, no credit card required." },
  { q: "Do I need a credit card to start?", a: "No. You can start and use the full trial without entering any payment details." },
  { q: "Can I upgrade later?", a: "Yes, you can upgrade to a paid plan at any time from inside your dashboard, and your data carries over." },
  { q: "Can I invite team members?", a: "Yes. Trial workspaces support inviting teammates with role-based permissions from day one." },
  { q: "How secure is my data?", a: "All documents are encrypted at rest and in transit, with full audit logs and role-based access control." },
  { q: "Can I cancel anytime?", a: "Yes, there's no lock-in. You can cancel or stop using the trial at any point with no obligation." },
  { q: "What file types are supported?", a: "PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG and ZIP are all supported for upload." },
];

// ─────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────
function SectionTag({ children }) {
  return (
    <span className="inline-block bg-blue-50 text-[#2563EB] text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-4">
      {children}
    </span>
  );
}

function AccordionItem({ item, isOpen, onClick }) {
  return (
    <div className="border border-gray-100 rounded-2xl bg-white overflow-hidden">
      <button onClick={onClick} className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 hover:bg-blue-50/50 transition-colors">
        <span className="font-semibold text-[#111827]">{item.q}</span>
        <span className={`shrink-0 w-8 h-8 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>
          <Plus className="w-4 h-4" />
        </span>
      </button>
      <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: isOpen ? "220px" : "0px" }}>
        <p className="px-6 pb-5 text-sm text-gray-500 leading-relaxed">{item.a}</p>
      </div>
    </div>
  );
}

function DemoVideoModal({ open, onClose }) {
  if (!open) return null;
  const screenshots = ["Dashboard overview", "Document upload & OCR", "Smart search results"];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center hover:bg-gray-100">
          <XIcon className="w-4 h-4" />
        </button>
        <div className="aspect-video bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-white">
          <div className="text-center px-8">
            <Play className="w-12 h-12 mx-auto mb-3 opacity-90" />
            <p className="font-semibold">Product video coming soon</p>
            <p className="text-sm text-blue-100 mt-1">Here's a look at what's inside instead:</p>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          {screenshots.map((s) => (
            <div key={s} className="p-4 text-center">
              <div className="aspect-video rounded-xl bg-[#F8FAFC] border border-gray-100 mb-2 flex items-center justify-center text-gray-300">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <p className="text-xs text-gray-500">{s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function BookDemo({ onStartFreeTrial, onSignIn, onBack }) {
  const [videoOpen, setVideoOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [activeManual, setActiveManual] = useState(MANUAL_SECTIONS[0].key);

  const [featuresRef, featuresInView] = useInView(0.1);
  const [trialRef, trialInView] = useInView(0.1);
  const [statsRef, statsInView] = useInView(0.3);
  const [faqRef, faqInView] = useInView(0.15);
  const [rolesRef, rolesInView] = useInView(0.15);

  const activeSection = MANUAL_SECTIONS.find((s) => s.key === activeManual);

  const goStartTrial = () => (onStartFreeTrial ? onStartFreeTrial() : (window.location.href = "/register?plan=trial"));
  const goSignIn = () => (onSignIn ? onSignIn() : (window.location.href = "/login"));

  return (
    <div className="font-sans bg-white text-[#111827] min-h-screen">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floatSlow { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .animate-fade-in-up { animation: fadeInUp 0.7s ease forwards; }
        .text-gradient {
          background: linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #60A5FA 100%);
          background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: shimmer 3s linear infinite;
        }
        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(37,99,235,0.12); }
        .btn-glow { transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(37,99,235,0.3); }
        .btn-glow:hover { box-shadow: 0 8px 25px rgba(37,99,235,0.5); transform: translateY(-2px); }
        .float-doc { animation: floatSlow 5s ease-in-out infinite; }
      `}</style>

      {/* ── minimal top bar ── */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={onBack} className="text-sm font-semibold text-gray-600 hover:text-[#2563EB] flex items-center gap-1.5">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to home
          </button>
          <div className="flex items-center gap-3">
            <button onClick={goSignIn} className="hidden sm:inline text-sm font-semibold text-gray-600 hover:text-[#2563EB] px-3 py-2">
              Sign in
            </button>
            <button onClick={goStartTrial} className="btn-glow bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white text-sm font-semibold px-5 py-2.5 rounded-full">
              Start Free Trial
            </button>
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] py-20 lg:py-28">
        <div className="absolute top-10 right-[8%] w-24 h-24 rounded-2xl bg-white shadow-xl border border-blue-100 float-doc hidden lg:flex items-center justify-center" style={{ animationDelay: "0.3s" }}>
          <FileText className="w-8 h-8 text-[#2563EB]" />
        </div>
        <div className="absolute bottom-16 right-[20%] w-16 h-16 rounded-xl bg-white shadow-xl border border-blue-100 float-doc hidden lg:flex items-center justify-center" style={{ animationDelay: "1s" }}>
          <ScanText className="w-6 h-6 text-[#2563EB]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <SectionTag>Product Overview</SectionTag>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-5">
              Enterprise AI <span className="text-gradient">Document Management</span> Platform
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-4">
              Store, organize, search, secure and manage all your business documents from one intelligent cloud platform powered by AI.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              Automate document management with AI OCR, smart search, version control, role-based access, workflow automation and secure collaboration, all in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={goStartTrial} className="btn-glow flex items-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-semibold px-6 py-3 rounded-xl">
                <Rocket className="w-5 h-5" /> Start Free Trial
              </button>
              <button onClick={() => setVideoOpen(true)} className="flex items-center gap-2 border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-[#2563EB] font-semibold px-6 py-3 rounded-xl bg-white hover:bg-blue-50 transition-all">
                <Play className="w-5 h-5" /> Watch Demo
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-4">No credit card required · 14-day free trial</p>
          </div>

          <div className="relative">
            <div className="rounded-3xl bg-gradient-to-br from-white to-[#EFF6FF] border border-blue-100 shadow-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-300" /><span className="w-3 h-3 rounded-full bg-amber-300" /><span className="w-3 h-3 rounded-full bg-emerald-300" />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[LayoutDashboard, FolderOpen, BarChart3].map((Icon, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#2563EB]" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[80, 55, 65].map((w, i) => (
                  <div key={i} className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA]" style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <section className="border-y border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">Trusted by teams worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {TRUSTED.map((c) => (
              <span key={c} className="text-gray-300 font-bold text-lg grayscale hover:grayscale-0 hover:text-[#2563EB] transition-all cursor-default">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <SectionTag>Why Choose Our Platform</SectionTag>
          <h2 className="text-4xl font-extrabold mb-3">Everything an enterprise archive needs</h2>
          <p className="text-gray-500 text-lg">Twelve core capabilities that turn scattered files into a governed, searchable system of record.</p>
        </div>
        <div ref={featuresRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`card-hover p-6 border border-gray-100 rounded-2xl shadow-sm transition-all duration-500 ${featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ transitionDelay: `${(i % 6) * 70}ms` }}>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h3 className="font-bold mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FREE TRIAL ── */}
      <section className="bg-[#F8FAFC] border-y border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionTag>Free Trial</SectionTag>
            <h2 className="text-4xl font-extrabold mb-3">What's included in your free trial</h2>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-[#2563EB] text-sm font-semibold px-4 py-1.5 rounded-full border border-blue-100">
                <Clock3 className="w-4 h-4" /> 14 Days Free Trial
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-sm font-semibold px-4 py-1.5 rounded-full border border-emerald-100">
                <CreditCard className="w-4 h-4" /> No Credit Card Required
              </span>
            </div>
          </div>
          <div ref={trialRef} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {TRIAL_INCLUDES.map((item, i) => (
                <div key={item} className={`flex items-center gap-3 transition-all duration-500 ${trialInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`} style={{ transitionDelay: `${i * 40}ms` }}>
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><CheckCircle2 className="w-3.5 h-3.5" /></span>
                  <span className="text-sm font-medium text-gray-700">{item}</span>
                </div>
              ))}
            </div>
            <button onClick={goStartTrial} className="btn-glow w-full mt-8 flex items-center justify-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-semibold px-6 py-3.5 rounded-xl">
              <Sparkles className="w-5 h-5" /> Start Free Trial
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <SectionTag>How It Works</SectionTag>
          <h2 className="text-4xl font-extrabold mb-3">From sign-up to fully organized</h2>
        </div>
        <div className="relative">
          <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-100" />
          <div className="flex flex-col gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="relative flex items-start gap-5 pl-0">
                <div className="relative z-10 w-11 h-11 rounded-full bg-white border-2 border-[#2563EB] text-[#2563EB] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="pt-1.5">
                  <h3 className="font-bold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT WALKTHROUGH ── */}
      <section className="bg-[#F8FAFC] border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {WALKTHROUGH.map((item, i) => (
            <div key={item.title} className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center py-14 ${i !== 0 ? "border-t border-gray-100" : ""}`}>
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <span className="inline-block text-[#2563EB] text-sm font-semibold tracking-wide uppercase mb-3">{item.eyebrow}</span>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 mb-5">{item.desc}</p>
                <ul className="flex flex-col gap-2.5">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-3 text-sm font-medium text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0"><Check className="w-3 h-3" /></span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                <div className="rounded-2xl bg-white border border-blue-100 shadow-sm p-10 flex items-center justify-center aspect-video">
                  <item.icon className="w-16 h-16 text-[#2563EB]" strokeWidth={1.2} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── USER MANUAL ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <SectionTag>User Manual</SectionTag>
          <h2 className="text-4xl font-extrabold mb-3">Everything explained, in one place</h2>
          <p className="text-gray-500 text-lg">A quick reference for how the platform actually works, day to day.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {MANUAL_SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveManual(s.key)}
                className={`flex items-center gap-2.5 shrink-0 text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeManual === s.key ? "bg-blue-50 text-[#2563EB] border border-blue-100" : "text-gray-500 hover:bg-gray-50 border border-transparent"
                }`}
              >
                <s.icon className="w-4 h-4 shrink-0" /> {s.label}
              </button>
            ))}
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center"><activeSection.icon className="w-5 h-5" /></span>
              <h3 className="text-xl font-bold text-gray-900">{activeSection.label}</h3>
            </div>
            <ul className="flex flex-col gap-3">
              {activeSection.items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                  <ChevronRight className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#60A5FA] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <span className="inline-block bg-white/10 text-white text-xs font-semibold px-4 py-1.5 rounded-full border border-white/20 mb-4">User Roles</span>
          <h2 className="text-4xl font-extrabold text-white mb-3">Built for every level of your team</h2>
        </div>
        <div ref={rolesRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ROLES.map((r, i) => (
            <div key={r.title} className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white card-hover transition-all duration-500 ${rolesInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-4"><r.icon className="w-6 h-6 text-white" /></div>
              <h3 className="text-lg font-bold mb-1.5">{r.title}</h3>
              <p className="text-blue-100 text-sm leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <div key={s.label} className={`text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-6 card-hover transition-all duration-500 ${statsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900"><Counter value={s.value} inView={statsInView} /></div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <SectionTag>FAQ</SectionTag>
          <h2 className="text-4xl font-extrabold mb-3">Questions, answered</h2>
        </div>
        <div ref={faqRef} className="flex flex-col gap-3">
          {FAQ.map((item, i) => (
            <div key={item.q} className={`transition-all duration-500 ${faqInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: `${i * 70}ms` }}>
              <AccordionItem item={item} isOpen={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)} />
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative rounded-3xl p-12 sm:p-16 overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#60A5FA] text-center">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-8 -translate-x-8 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold text-white mb-4">Ready to transform your document management?</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">Start your free trial today and experience enterprise AI document management.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={goStartTrial} className="bg-white text-[#2563EB] font-semibold px-8 py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
                Start Free Trial
              </button>
              <a href="mailto:sales@yourdomain.com" className="flex items-center gap-2 border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200">
                <Mail className="w-4 h-4" /> Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      <DemoVideoModal open={videoOpen} onClose={() => setVideoOpen(false)} />
    </div>
  );
}

function Check({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}