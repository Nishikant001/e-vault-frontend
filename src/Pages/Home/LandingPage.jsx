import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import {
  BookOpen,
  Plug,
  BarChart3,
  Video,
  ShieldCheck,
  Cloud,
  TrendingUp,
  FolderOpen,
  ScanText,
  Tags,
  History,
  Workflow as WorkflowIcon,
  ScrollText,
  Search,
  KeyRound,
  Archive,
  Hash,
  PenTool,
  UploadCloud,
  Eye,
  CheckCircle2,
  Megaphone,
  Zap,
  Database,
  ClipboardCheck,
  Link2,
  FileText,
  Building2,
  Activity,
  Lock,
  Rocket,
  Play,
  Menu as MenuIcon,
  X as XIcon,
  Check,
  ChevronDown,
  Star,
  Plus,
} from "lucide-react";
import { FaLinkedin, FaXTwitter, FaYoutube, FaGithub } from "react-icons/fa6";

import { useLanguage } from "../Home/LanguageContext";
import dmsDashboard from "../../assets/dms-dashboard.png";
import logo from "../../assets/e-vault-background-c.png";
import logoLight from "../../assets/evault-logo-light.png";
import showcaseRepo from "../../assets/showcaseRepo.png";
import showcaseWorkflow from "../../assets/showcaseWorkflow.png";
import showcaseInsight from "../../assets/showcaseInsight.png";
// ↑ update this path to wherever you save the dashboard screenshot,
//   e.g. src/assets/dms-dashboard.png

// ── Animation hook: element view mein aane par trigger hota hai
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Home", key: "home" },
  { label: "Features", key: "features" },
  { label: "Solutions", key: "solutions" },
  { label: "Resources", key: "documentation", hasMenu: true },
  { label: "About Us", key: "about" },
  { label: "Contact", key: "contact" },
];

const RESOURCES_MENU = [
  {
    title: "Documentation",
    desc: "Guides to set up and configure DMS",
    icon: BookOpen,
  },
  {
    title: "API Reference",
    desc: "Integrate DMS into your own tools",
    icon: Plug,
  },
  {
    title: "Case Studies",
    desc: "How enterprise teams use DMS",
    icon: BarChart3,
  },
  {
    title: "Webinars",
    desc: "Live and on-demand product sessions",
    icon: Video,
  },
];

const TRUST_STATS = [
  { value: "1,000+", label: "Organizations" },
  { value: "50,000+", label: "Active Users" },
  { value: "100M+", label: "Documents Managed" },
  { value: "99.99%", label: "Uptime SLA" },
];

const HERO_BADGES = [
  {
    icon: ShieldCheck,
    label: "Secure & Compliant",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    icon: Cloud,
    label: "Access Anywhere",
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    icon: TrendingUp,
    label: "Scalable Solution",
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
];

const FEATURES = [
  {
    icon: FolderOpen,
    title: "Document Management",
    desc: "Centralize every file in one governed, searchable repository.",
  },
  {
    icon: ScanText,
    title: "OCR",
    desc: "Turn scanned paper and images into searchable, editable text.",
  },
  {
    icon: Tags,
    title: "Metadata",
    desc: "Tag documents with custom fields for instant, precise retrieval.",
  },
  {
    icon: History,
    title: "Version Control",
    desc: "Track every edit and roll back to any prior version instantly.",
  },
  {
    icon: WorkflowIcon,
    title: "Workflow",
    desc: "Automate review, approval, and publishing across teams.",
  },
  {
    icon: ScrollText,
    title: "Audit Logs",
    desc: "See who viewed, edited, or shared any document, and when.",
  },
  {
    icon: Search,
    title: "AI Search",
    desc: "Full-text, natural-language search across your entire archive.",
  },
  {
    icon: KeyRound,
    title: "Role Permission",
    desc: "Granular, role-based access down to the folder and field level.",
  },
  {
    icon: Archive,
    title: "Retention Policy",
    desc: "Automate archival and disposal to stay compliant, effortlessly.",
  },
  {
    icon: Hash,
    title: "Document Numbering",
    desc: "Auto-generate consistent identifiers across every department.",
  },
  {
    icon: PenTool,
    title: "Digital Signature",
    desc: "Collect legally binding e-signatures without leaving the platform.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    desc: "AES-256 encryption, SSO, and continuous compliance monitoring.",
  },
];

const PRODUCT_SHOWCASE = [
  {
    eyebrow: "Unified Repository",
    title: "One place for every document, folder, and record",
    desc: "Stop hunting across drives, inboxes, and shared folders. DMS gives your organization a single governed source of truth, with permissions and audit trails built in from day one.",
    bullets: [
      "Drag-and-drop uploads",
      "Smart auto-tagging",
      "Nested folder permissions",
    ],
    reverse: false,
    image: showcaseRepo,
  },
  {
    eyebrow: "Automated Workflows",
    title: "Route approvals without chasing anyone down",
    desc: "Build multi-step review and approval chains that move documents automatically from draft to published, with reminders and escalations handled for you.",
    bullets: [
      "Visual workflow builder",
      "Conditional routing rules",
      "Slack & email notifications",
    ],
    reverse: true,
    image: showcaseWorkflow,
  },
  {
    eyebrow: "Insight & Compliance",
    title: "Know exactly what's happening, always",
    desc: "Real-time dashboards surface storage trends, workflow bottlenecks, and access activity, so compliance reporting takes minutes instead of days.",
    bullets: [
      "Exportable audit reports",
      "Retention policy alerts",
      "Custom analytics views",
    ],
    reverse: false,
    image: showcaseInsight,
  },
];

const WORKFLOW_STEPS = [
  {
    icon: UploadCloud,
    title: "Upload",
    desc: "Drag in files or scan paper directly into DMS.",
  },
  {
    icon: Eye,
    title: "Review",
    desc: "Assigned reviewers annotate and comment inline.",
  },
  {
    icon: CheckCircle2,
    title: "Approval",
    desc: "Stakeholders sign off through a routed approval chain.",
  },
  {
    icon: Megaphone,
    title: "Publish",
    desc: "Approved documents go live to the right audiences.",
  },
  {
    icon: Archive,
    title: "Archive",
    desc: "Retention rules move records to long-term storage.",
  },
];

const WHY_CHOOSE = [
  {
    icon: KeyRound,
    title: "Enterprise Security",
    desc: "AES-256 encryption, SSO, and continuous audit logging keep every document protected.",
  },
  {
    icon: Zap,
    title: "Lightning Search",
    desc: "Full-text and metadata search return results across millions of documents in milliseconds.",
  },
  {
    icon: Database,
    title: "Central Repository",
    desc: "Every file, version, and approval lives in one governed system of record.",
  },
  {
    icon: WorkflowIcon,
    title: "Workflow Automation",
    desc: "Replace manual chasing with automated review, approval, and publishing chains.",
  },
  {
    icon: ClipboardCheck,
    title: "Compliance",
    desc: "Retention policies and audit trails keep you ready for any regulatory review.",
  },
  {
    icon: Link2,
    title: "Easy Integration",
    desc: "Connect DMS to the tools your teams already use, from Slack to your ERP.",
  },
];

const STATS = [
  { value: "2,000,000+", label: "Documents Managed", icon: FileText },
  { value: "500+", label: "Organizations", icon: Building2 },
  { value: "99.99%", label: "Availability", icon: Activity },
  { value: "256-bit", label: "Encryption Standard", icon: Lock },
];

const TESTIMONIALS = [
  {
    quote:
      "DMS cut our contract approval time from weeks to days and gave compliance a single place to audit everything.",
    name: "Priya Nair",
    role: "Head of Operations",
    company: "Solace Health Group",
    rating: 5,
  },
  {
    quote:
      "The search alone paid for the platform. Our legal team finds precedent documents in seconds instead of hours.",
    name: "Daniel Osei",
    role: "General Counsel",
    company: "Northfield Partners",
    rating: 5,
  },
  {
    quote:
      "Rolling out role-based access across twelve regional offices used to be a nightmare. With DMS it took an afternoon.",
    name: "Mei Lin Tan",
    role: "IT Director",
    company: "Bridgeview Logistics",
    rating: 5,
  },
];

const FAQ_ITEMS = [
  {
    q: "How long does implementation typically take?",
    a: "Most teams are fully onboarded within two to four weeks, including data migration, permission setup, and workflow configuration. Our implementation team works alongside yours throughout.",
  },
  {
    q: "Can DMS integrate with our existing tools?",
    a: "Yes. DMS connects to common identity providers, storage systems, and communication tools like Slack and Microsoft Teams through native integrations and an open API.",
  },
  {
    q: "Is our data encrypted?",
    a: "All documents are encrypted at rest with AES-256 and in transit with TLS 1.2+. Enterprise plans also support customer-managed encryption keys.",
  },
  {
    q: "What happens if we need to leave the platform?",
    a: "You retain full ownership of your data at all times. DMS provides complete export tools so you can migrate documents, metadata, and audit history whenever you choose.",
  },
  {
    q: "Do you offer a trial before we commit?",
    a: "Yes, every plan starts with a free trial, and our team can also arrange a guided demo tailored to your organization's document workflows.",
  },
];

const FOOTER_LINKS = {
  Company: ["About Us", "Careers", "Blog", "Press"],
  Solutions: ["Enterprise DMS", "Legal", "Healthcare", "Government"],
  Resources: ["Documentation", "API Reference", "Case Studies", "Webinars"],
  Support: ["Help Center", "Contact Support", "System Status", "Community"],
  Legal: ["Privacy Policy", "Terms of Service", "Security", "Compliance"],
};

const SOCIAL_LINKS = [
  { label: "LinkedIn", icon: FaLinkedin },
  { label: "X", icon: FaXTwitter },
  { label: "YouTube", icon: FaYoutube },
  { label: "GitHub", icon: FaGithub },
];

// ─────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────

function TrustCounter({ value, inView }) {
  const [count, setCount] = useState(0);
  const numeric = parseFloat(value.replace(/[^0-9.]/g, ""));
  const suffix = value.replace(/[0-9.,]/g, "");

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1400;
    const step = numeric / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= numeric) {
        setCount(numeric);
        clearInterval(timer);
      } else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, numeric]);

  const display =
    numeric % 1 !== 0 ? count.toFixed(2) : Math.floor(count).toLocaleString();
  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

function StatCounter({ value, inView }) {
  const [count, setCount] = useState(0);
  const numeric = parseFloat(value.replace(/[^0-9.]/g, ""));
  const suffix = value.replace(/[0-9.,]/g, "");

  useEffect(() => {
    if (!inView || isNaN(numeric)) return;
    let start = 0;
    const duration = 1500;
    const step = numeric / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= numeric) {
        setCount(numeric);
        clearInterval(timer);
      } else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, numeric]);

  if (isNaN(numeric)) return <span>{value}</span>;
  return (
    <span>
      {Math.floor(count).toLocaleString()}
      {suffix}
    </span>
  );
}

function ShowcaseRow({ item, index }) {
  const [ref, inView] = useInView(0.15);
  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-16 ${index !== 0 ? "border-t border-gray-100" : ""}`}
    >
      <div
        className={`${item.reverse ? "lg:order-2" : ""} transition-all duration-700 ${
          inView
            ? "opacity-100 translate-x-0"
            : `opacity-0 ${item.reverse ? "translate-x-8" : "-translate-x-8"}`
        }`}
      >
        <span className="inline-block text-[#2563EB] text-sm font-semibold tracking-wide uppercase mb-3">
          {item.eyebrow}
        </span>
        <h3 className="text-3xl font-extrabold text-[#111827] leading-tight mb-4">
          {item.title}
        </h3>
        <p className="text-gray-500 text-lg leading-relaxed mb-6">
          {item.desc}
        </p>
        <ul className="flex flex-col gap-3">
          {item.bullets.map((b) => (
            <li
              key={b}
              className="flex items-center gap-3 text-sm font-medium text-gray-700"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Check className="w-3 h-3" />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div
        className={`${item.reverse ? "lg:order-1" : ""} transition-all duration-700 delay-150 ${
          inView
            ? "opacity-100 translate-x-0"
            : `opacity-0 ${item.reverse ? "-translate-x-8" : "translate-x-8"}`
        }`}
      >
        <div className="relative rounded-3xl bg-gradient-to-br from-[#F8FAFC] to-[#E0F2FE] ">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-300/20 rounded-full blur-2xl pointer-events-none" />
          <img
            src={item.image}
            alt={item.title}
            className="relative z-10 w-full h-auto rounded-2xl"
            style={{ boxShadow: "0 20px 50px rgba(37,99,235,0.12)" }}
          />
        </div>
      </div>
    </div>
  );
}

function initials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}

function AccordionItem({ item, isOpen, onClick }) {
  return (
    <div className="border border-gray-100 rounded-2xl bg-white overflow-hidden">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 hover:bg-blue-50/50 transition-colors"
      >
        <span className="font-semibold text-[#111827]">{item.q}</span>
        <span
          className={`shrink-0 w-8 h-8 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
        >
          <Plus className="w-4 h-4" />
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? "200px" : "0px" }}
      >
        <p className="px-6 pb-5 text-sm text-gray-500 leading-relaxed">
          {item.a}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN LANDING EXPORT
// ─────────────────────────────────────────────
export default function DMSLanding({ onGetStarted, onNavigate, onWatchDemo }) {
  const { t, lang, setLang, languages } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const [openFaq, setOpenFaq] = useState(0);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const [trustRef, trustInView] = useInView(0.3);
  const [featuresRef, featuresInView] = useInView(0.1);
  const [workflowRef, workflowInView] = useInView(0.2);
  const [whyRef, whyInView] = useInView(0.1);
  const [statsRef, statsInView] = useInView(0.3);
  const [testimonialsRef, testimonialsInView] = useInView(0.15);
  const [faqRef, faqInView] = useInView(0.15);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handleNav = (key) => {
    setActiveNav(key);
    setMenuOpen(false);
    onNavigate?.(key);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <div className="font-sans bg-white text-[#111827] min-h-screen">
      <Helmet>
        <title>
          DMS — Document Management System | Smart. Secure. Simplified.
        </title>
        <meta
          name="description"
          content="Store, organize, and access all your documents securely from one centralized platform. Role-based access, version control, smart search and more."
        />
        <meta
          name="keywords"
          content="document management system, DMS, secure documents, file storage, workflow, cloud documents"
        />
        <meta name="author" content="DMS" />
        <link rel="canonical" href="https://yourdomain.com/" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/" />
        <meta property="og:title" content="DMS — Manage Documents Smarter" />
        <meta
          property="og:description"
          content="One platform to store, organize, search and secure all your documents. Built for modern teams."
        />
        <meta
          property="og:image"
          content="https://yourdomain.com/og-image.png"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="DMS — Manage Documents Smarter" />
        <meta
          name="twitter:description"
          content="One platform to store, organize, search and secure all your documents."
        />
        <meta
          name="twitter:image"
          content="https://yourdomain.com/og-image.png"
        />

        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* ── Keyframes via style tag */}
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes heroFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes heroFloatImg { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
        @keyframes heroGlow { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.08); } }
        @keyframes heroSpinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes ripple { from { transform: scale(0); opacity: 0.5; } to { transform: scale(3.5); opacity: 0; } }
        .animate-fade-in-up { animation: fadeInUp 0.7s ease forwards; }
        .animate-fade-in-left { animation: fadeInLeft 0.7s ease forwards; }
        .animate-fade-in-right { animation: fadeInRight 0.7s ease forwards; }
        .animate-scale-in { animation: scaleIn 0.6s ease forwards; }
        .text-gradient {
          background: linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #60A5FA 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(37,99,235,0.12); }
        .btn-glow { transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(37,99,235,0.3); }
        .btn-glow:hover { box-shadow: 0 8px 25px rgba(37,99,235,0.5); transform: translateY(-2px); }
        .btn-ripple { position: relative; overflow: hidden; }
        .btn-ripple::after {
          content: ""; position: absolute; top: 50%; left: 50%;
          width: 8px; height: 8px; background: rgba(255,255,255,0.6);
          border-radius: 50%; transform: translate(-50%, -50%) scale(0);
          opacity: 0; pointer-events: none;
        }
        .btn-ripple:active::after { animation: ripple 0.5s ease-out; }
        .gradient-border-card { position: relative; background: #fff; border-radius: 20px; }
        .gradient-border-card::before {
          content: ""; position: absolute; inset: 0; border-radius: 20px; padding: 1px;
          background: linear-gradient(135deg, rgba(37,99,235,0.35), rgba(96,165,250,0.05));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          pointer-events: none; opacity: 0; transition: opacity 0.3s ease;
        }
        .gradient-border-card:hover::before { opacity: 1; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/70 backdrop-blur-xl p-3 border-b border-gray-200/70 shadow-[0_4px_30px_rgba(37,99,235,0.06)]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          {/* Logo */}
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => handleNav("home")}
          >
            <img
              src={logo}
              alt="e-Vault"
              className="h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <div key={link.key} className="relative group">
                <button
                  onClick={() => handleNav(link.key)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors duration-200 relative ${
                    activeNav === link.key
                      ? "text-[#2563EB]"
                      : "text-gray-600 hover:text-[#2563EB]"
                  }`}
                >
                  {link.label}
                  {link.hasMenu && (
                    <ChevronDown className="w-3.5 h-3.5 ml-1 inline-block align-middle" />
                  )}
                  <span
                    className={`absolute left-3 right-3 -bottom-0.5 h-0.5 bg-gradient-to-r from-[#2563EB] to-[#60A5FA] rounded-full transition-all duration-300 origin-left ${
                      activeNav === link.key
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </button>

                {link.hasMenu && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[440px] opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
                    <div className="bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl p-4 grid grid-cols-2 gap-2">
                      {RESOURCES_MENU.map((item) => (
                        <button
                          key={item.title}
                          onClick={() => handleNav("documentation")}
                          className="text-left flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors duration-150"
                        >
                          <span className="w-9 h-9 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center flex-shrink-0">
                            <item.icon className="w-4 h-4" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-gray-800">
                              {item.title}
                            </span>
                            <span className="block text-xs text-gray-500 mt-0.5">
                              {item.desc}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative group">
              {/* <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-full px-3 py-1.5 bg-white/80 hover:border-blue-300 transition-colors">
                <span>{languages.find((l) => l.code === lang)?.flag}</span>
                <span>{languages.find((l) => l.code === lang)?.label}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button> */}
              {/* <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 max-h-72 overflow-y-auto">
                {languages.map((lng) => (
                  <button
                    key={lng.code}
                    onClick={() => setLang(lng.code)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-blue-50 hover:text-[#2563EB] transition-colors ${
                      lang === lng.code ? "bg-blue-50 text-[#2563EB] font-semibold" : "text-gray-700"
                    }`}
                  >
                    <span className="text-base">{lng.flag}</span>
                    <span>{lng.label}</span>
                    {lang === lng.code && (
                      <Check className="w-3.5 h-3.5 ml-auto text-blue-500" />
                    )}
                  </button>
                ))}
              </div> */}
            </div>

            {/* <button onClick={() => handleNav("login")} className="text-sm font-semibold text-gray-600 hover:text-[#2563EB] px-3 py-2 transition-colors">
              Login
            </button> */}

            <button
              onClick={onGetStarted}
              className="btn-glow bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1d4fd1] hover:to-[#2f6fe0] text-white text-sm font-semibold px-5 py-2.5 rounded-full"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <XIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100 px-4 pb-4 pt-2 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <button
                key={link.key}
                onClick={() => handleNav(link.key)}
                className="text-left text-sm font-medium text-gray-700 hover:text-[#2563EB] transition-colors py-1"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={onGetStarted}
              className="btn-glow bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white text-sm font-semibold px-5 py-2.5 rounded-full mt-2"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden min-h-[calc(100vh-64px)] flex items-center">
        {/* Full-bleed background image */}
        <div className="absolute inset-0">
          <img
            src={dmsDashboard}
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Sirf bilkul left edge par halka fade, taaki text readable rahe — image ka baaki hissa crisp/clear */}
          <div className="absolute inset-y-0 left-0 w-[12%] bg-gradient-to-r from-white to-transparent pointer-events-none" />
        </div>

        {/* Floating chips scattered across the whole section */}
        {/* {FLOATING_CHIPS.map((chip, i) => (
    <FloatingChip
      key={chip.label}
      icon={chip.icon}
      label={chip.label}
      className={CHIP_POSITIONS[i]}
      delay={`${i * 0.3}s`}
      duration={`${5.5 + (i % 4) * 0.4}s`}
    />
  ))} */}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-xl flex flex-col gap-6">
            {/* Left */}
            <div className="flex flex-col gap-6">
              <span
                className={`inline-flex w-fit items-center gap-2 bg-blue-50 text-[#2563EB] text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-100 transition-all duration-700 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                <span className="w-2 h-2 rounded-full bg-[#2563EB] inline-block animate-pulse"></span>
                Smart. Secure. Simplified.
              </span>

              <h1
                className={`text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight transition-all duration-700 delay-100 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                Manage Documents <span className="text-gradient">Smarter</span>
              </h1>

              <p
                className={`text-lg text-gray-500 max-w-lg leading-relaxed transition-all duration-700 delay-200 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                Store, organize, and access all your documents securely from one
                centralized platform. Improve productivity and collaboration
                across your organization.
              </p>

              <div
                className={`flex flex-wrap gap-3 transition-all duration-700 delay-300 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                <button
                  onClick={onGetStarted}
                  className="btn-glow flex items-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1d4fd1] hover:to-[#2f6fe0] text-white font-semibold px-6 py-3 rounded-xl"
                >
                  <Rocket className="w-5 h-5" />
                  Get Started
                </button>
                <button
                  onClick={onWatchDemo}
                  className="flex items-center bg-transparent gap-2 border border-gray-700 hover:border-blue-500 text-gray-700 hover:text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 bg-gradient-to-r   hover:from-[#1c47b4] hover:to-[#3770d2] hover:-translate-y-0.5"
                >
                  <Play className="w-5 h-5" />
                  Book Demo
                </button>
              </div>

              <div
                className={`flex flex-wrap gap-6 mt-2 transition-all duration-700 delay-400 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                {HERO_BADGES.map((b) => (
                  <div
                    key={b.label}
                    className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border ${b.color}`}
                  >
                    <b.icon className="w-4 h-4" />
                    {b.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Dashboard hero visual */}
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <section className="border-y border-gray-100 bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
            Trusted by teams worldwide
          </p>
          <div ref={trustRef} className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_STATS.map((s, i) => (
              <div
                key={s.label}
                className={`text-center transition-all duration-700 ${trustInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-[#111827]">
                  <TrustCounter value={s.value} inView={trustInView} />
                </div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section
        id="features"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
      >
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block bg-blue-50 text-[#2563EB] text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-4">
            Platform Capabilities
          </span>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
            Everything an enterprise archive needs
          </h2>
          <p className="text-gray-500 text-lg">
            Twelve core capabilities that turn scattered files into a governed,
            searchable system of record.
          </p>
        </div>

        <div
          ref={featuresRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`gradient-border-card card-hover p-6 border border-gray-100 shadow-sm transition-all duration-500 ${featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${(i % 6) * 70}ms` }}
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCT SHOWCASE ── */}
      <section className="bg-[#F8FAFC] border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {PRODUCT_SHOWCASE.map((item, i) => (
            <ShowcaseRow key={item.title} item={item} index={i} />
          ))}
        </div>
      </section>

      {/* ── WORKFLOW TIMELINE ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block bg-blue-50 text-[#2563EB] text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-4">
            How It Works
          </span>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
            A document's life, fully automated
          </h2>
          <p className="text-gray-500 text-lg">
            From the moment a file lands in DMS to the day it's archived.
          </p>
        </div>

        <div
          ref={workflowRef}
          className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-10 gap-x-4"
        >
          <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-gray-100 z-0">
            <div
              className="h-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] origin-left"
              style={{
                transform: workflowInView ? "scaleX(1)" : "scaleX(0)",
                transition: "transform 1.4s ease",
              }}
            />
          </div>

          {WORKFLOW_STEPS.map((step, i) => (
            <div
              key={step.title}
              className={`relative z-10 flex flex-col items-center text-center transition-all duration-500 ${workflowInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-white border-2 border-blue-100 shadow-md flex items-center justify-center mb-4 hover:scale-110 hover:border-[#2563EB] transition-all duration-300">
                <step.icon className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">
                {step.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[140px]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY TEAMS CHOOSE DMS ── */}
      <section className="bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#60A5FA] py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-48 translate-y-48 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12 relative z-10">
          <span className="inline-block bg-white/10 text-white text-xs font-semibold px-4 py-1.5 rounded-full border border-white/20 mb-4">
            Why DMS?
          </span>
          <h2 className="text-4xl font-extrabold text-white mb-3">
            Why Teams Choose DMS
          </h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            One platform for all your document needs, from creation to
            collaboration to compliance.
          </p>
        </div>

        <div
          ref={whyRef}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10"
        >
          {WHY_CHOOSE.map((c, i) => (
            <div
              key={c.title}
              className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white hover:bg-white/20 card-hover transition-all duration-500 ${whyInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-4">
                <c.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{c.title}</h3>
              <p className="text-blue-100 text-sm leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-6 card-hover transition-all duration-500 ${statsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-2">
                <s.icon className="w-4.5 h-4.5 text-[#2563EB]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                <StatCounter value={s.value} inView={statsInView} />
              </div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-[#F8FAFC] border-y border-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block bg-blue-50 text-[#2563EB] text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-4">
              Customer Stories
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
              Loved by operations, legal, and IT teams
            </h2>
          </div>

          <div
            ref={testimonialsRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className={`bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl p-6 shadow-sm card-hover transition-all duration-500 ${testimonialsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="flex gap-0.5 text-amber-400 mb-4">
                  {[...Array(t.rating)].map((_, s) => (
                    <Star
                      key={s}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#60A5FA] text-white text-xs font-bold flex items-center justify-center">
                    {initials(t.name)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {t.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t.role}, {t.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <span className="inline-block bg-blue-50 text-[#2563EB] text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-4">
            FAQ
          </span>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
            Questions, answered
          </h2>
          <p className="text-gray-500 text-lg">
            Everything you need to know before rolling out DMS.
          </p>
        </div>

        <div ref={faqRef} className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={item.q}
              className={`transition-all duration-500 ${faqInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <AccordionItem
                item={item}
                isOpen={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative rounded-3xl p-12 sm:p-16 overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#60A5FA] text-center">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-8 -translate-x-8 pointer-events-none" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold px-4 py-1.5 rounded-full border border-white/25 mb-4">
              <Rocket className="w-3.5 h-3.5" /> Get Started Today
            </span>
            <h2 className="text-4xl font-extrabold text-white mb-4">
              Ready to modernize document management?
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
              Join 1,000+ organizations already managing their documents smarter
              with DMS.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={onGetStarted}
                className="btn-ripple bg-white text-[#2563EB] font-semibold px-8 py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
              >
                Start Free Trial
              </button>
              <button
                onClick={onGetStarted}
                className="btn-ripple border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200"
              >
                Book Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0B1220] text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img
                  src={logoLight}
                  alt="e-Vault"
                  className="h-15 w-auto object-contain"
                />
              </div>
              <p className="text-sm text-gray-400 mb-4 max-w-xs">
                Enterprise document management, workflow automation, and
                compliance in one platform.
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Work email"
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:-translate-y-0.5 transition-transform"
                >
                  {subscribed ? (
                    <span className="inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Subscribed
                    </span>
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </form>
            </div>

            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
              <div key={section}>
                <h4 className="text-white text-sm font-semibold mb-4">
                  {section}
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-sm text-gray-400 hover:text-blue-300 transition-colors"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              © 2026 DMS. All rights reserved.
            </div>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:bg-blue-500/20 hover:text-blue-300 hover:-translate-y-0.5 transition-all"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
