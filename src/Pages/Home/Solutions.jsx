// src/Pages/Home/Solutions.jsx
// Standalone Solutions page — same brand theme as Features.jsx/About.jsx,
// but a distinct structure + motion language:
//   - Vertical connecting-line timeline (zigzag left/right) instead of a grid
//   - 3D tilt-on-hover industry cards instead of flat hover-lift cards
//   - Drift/spin ambient motion instead of float/pulse
// SharedNavbar + SharedFooter LandingRouter.jsx mein already wrap karte hain,
// isliye yahan sirf page content hai.

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Landmark,
  Stethoscope,
  Factory,
  ShieldCheck,
  Users,
  FileCheck2,
  Workflow,
  CheckCircle2,
  ArrowRight,
  Quote,
  Sparkles,
} from "lucide-react";

/* ── Scroll-reveal (same hook pattern as Features.jsx, kept consistent) ── */
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

/* ── 3D tilt-on-hover wrapper (signature motion for this page) ───────── */
function TiltCard({ children, className = "" }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setStyle({
      transform: `perspective(800px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateY(-4px)`,
    });
  };
  const handleLeave = () =>
    setStyle({ transform: "perspective(800px) rotateY(0) rotateX(0) translateY(0)" });

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`tilt-card ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

/* ── Data ─────────────────────────────────────────────────────────── */

const TIMELINE = [
  {
    key: "finance",
    icon: Landmark,
    color: "blue",
    role: "Finance Teams",
    headline: "Close books faster with every invoice in one place",
    pain: "Invoices, purchase orders, and vendor documents are often scattered across multiple systems, making month-end reconciliation slow and inefficient.",
    points: [
  "Link invoice and purchase order documents directly with SAP TCodes",
  "Prevent duplicate payments through approval workflows",
  "Eliminate manual data entry with seamless SAP synchronization",
],
  },
  {
    key: "hr",
    icon: Users,
    color: "purple",
    role: "HR & Compliance",
    headline: "Employee records, secure and always audit-ready",
    pain: "Managing employee contracts, offer letters, and compliance documents securely while maintaining controlled access can be challenging.",
    points: [
  "Protect sensitive employee records with role-based access control",
  "Track contract revisions and amendments through version history",
  "Complete compliance reviews quickly using detailed audit logs",
],
  },
  {
    key: "ops",
    icon: Factory,
    color: "amber",
    role: "Operations",
    headline: "Standard operating procedures jo actually follow hoti hain",
    pain: "Outdated SOPs, quality checklists, and vendor agreements can lead to operational inconsistencies and compliance risks.",
    points: [
      "Department-wise document tree se sahi version sabko milta hai",
      "OCR se scanned floor documents bhi searchable",
      "Multi-branch access ek hi central system se",
    ],
  },
  {
    key: "healthcare",
    icon: Stethoscope,
    color: "emerald",
    role: "Healthcare Admin",
    headline: "Patient and facility records, locked down by design",
    pain: "Healthcare organizations require strict document security while ensuring authorized teams can quickly access critical records.",
    points: [
      "Encrypted storage aur granular permissions",
      "Approval chain se sensitive disclosures controlled",
      "Full audit trail regulatory review ke liye ready",
    ],
  },
];

const COLOR_MAP = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100", grad: "from-blue-600 to-cyan-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", ring: "ring-purple-100", grad: "from-purple-600 to-indigo-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100", grad: "from-amber-500 to-orange-500" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100", grad: "from-emerald-600 to-teal-500" },
};

const INDUSTRIES = [
  { icon: Building2, title: "Enterprise & Corporate", desc: "Multi-department, multi-branch document control with centralized governance." },
  { icon: Landmark, title: "Banking & Finance", desc: "Compliance-grade audit trails for every financial document and approval." },
  { icon: Factory, title: "Manufacturing", desc: "SOPs, quality records, and vendor contracts kept current across plants." },
  { icon: Stethoscope, title: "Healthcare", desc: "Secure, access-controlled storage for sensitive regulatory paperwork." },
];

const OUTCOMES = [
  { icon: FileCheck2, stat: "70%", label: "Faster document retrieval" },
  { icon: Workflow, stat: "4x", label: "Quicker approval cycles" },
  { icon: ShieldCheck, stat: "100%", label: "Audit-trail coverage" },
];

export default function Solutions({ onNavigate }) {
  const [progress, setProgress] = useState(0);
  const timelineRef = useRef(null);

  // Drives the connecting-line fill as the user scrolls through the timeline
  useEffect(() => {
    const onScroll = () => {
      const el = timelineRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height + vh * 0.5;
      const passed = Math.min(Math.max(vh * 0.5 - r.top, 0), total);
      setProgress(Math.min(passed / total, 1));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bg-white overflow-hidden">
      <style>{`
        @keyframes pulseRing { 0%{ box-shadow: 0 0 0 0 rgba(37,99,235,0.25) } 100%{ box-shadow: 0 0 0 14px rgba(37,99,235,0) } }
        @keyframes driftX { 0%,100%{ transform: translateX(0) } 50%{ transform: translateX(14px) } }
        @keyframes spinSlow { from{ transform: rotate(0deg) } to{ transform: rotate(360deg) } }

        .reveal { opacity: 0; transform: translateY(18px); transition: opacity 0.6s cubic-bezier(.2,.7,.2,1), transform 0.6s cubic-bezier(.2,.7,.2,1); }
        .reveal-visible { opacity: 1; transform: translateY(0); }
        .reveal-left { opacity: 0; transform: translateX(-26px); transition: opacity 0.6s cubic-bezier(.2,.7,.2,1), transform 0.6s cubic-bezier(.2,.7,.2,1); }
        .reveal-left.reveal-visible { opacity: 1; transform: translateX(0); }
        .reveal-right { opacity: 0; transform: translateX(26px); transition: opacity 0.6s cubic-bezier(.2,.7,.2,1), transform 0.6s cubic-bezier(.2,.7,.2,1); }
        .reveal-right.reveal-visible { opacity: 1; transform: translateX(0); }

        .pulse-dot { animation: pulseRing 1.8s ease-out infinite; }
        .drift { animation: driftX 6s ease-in-out infinite; }
        .spin-slow { animation: spinSlow 14s linear infinite; }

        .tilt-card { transition: transform 0.25s ease-out; transform-style: preserve-3d; }

        @media (prefers-reduced-motion: reduce) {
          .reveal, .reveal-left, .reveal-right { opacity: 1 !important; transform: none !important; transition: none !important; }
          .pulse-dot, .drift, .spin-slow { animation: none !important; }
          .tilt-card { transition: none !important; transform: none !important; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-b from-blue-50/60 via-white to-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-16 right-[12%] w-64 h-64 border border-blue-100 rounded-full spin-slow pointer-events-none" />
        <div className="absolute top-10 left-[6%] w-72 h-72 bg-purple-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 pulse-dot"></span>
              Solutions for every team
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
              One platform,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                every department's problem solved
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 text-gray-500 text-lg max-w-2xl mx-auto">
  Every department has unique document management challenges. Explore
  how DMS adapts its workflows to support Finance, HR, Operations,
  Healthcare, and other business functions efficiently.
</p>
          </Reveal>
        </div>
      </section>

      {/* ── Outcomes strip ── */}
      <section className="px-4 sm:px-6 lg:px-8 -mt-2">
        <Reveal className="max-w-5xl mx-auto bg-gray-900 rounded-3xl px-6 sm:px-10 py-8 grid grid-cols-3 gap-6 shadow-xl shadow-gray-200">
          {OUTCOMES.map((o) => {
            const Icon = o.icon;
            return (
              <div key={o.label} className="text-center">
                <Icon className="w-5 h-5 text-cyan-300 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  {o.stat}
                </div>
                <div className="text-[11px] sm:text-xs text-gray-400 mt-1.5 leading-snug">
                  {o.label}
                </div>
              </div>
            );
          })}
        </Reveal>
      </section>

      {/* ── Zigzag connecting-line timeline (signature element) ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Built for your team
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-4">
              Follow the path that matches your role
            </h2>
          </Reveal>

          <div ref={timelineRef} className="relative">
            {/* Connecting line track */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 bg-gray-100 rounded-full hidden sm:block" />
            {/* Filled progress line */}
            <div
              className="absolute left-1/2 top-0 w-[3px] -translate-x-1/2 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full hidden sm:block transition-all duration-300"
              style={{ height: `${progress * 100}%` }}
            />

            <div className="flex flex-col gap-14 sm:gap-20">
              {TIMELINE.map((step, i) => {
                const Icon = step.icon;
                const c = COLOR_MAP[step.color];
                const isLeft = i % 2 === 0;
                return (
                  <div
                    key={step.key}
                    className="relative grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 items-center"
                  >
                    {/* Center node */}
                    <div
                      className={`hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full ${c.bg} ${c.text} ring-4 ring-white items-center justify-center z-10 shadow-md`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Card slot (alternates side) */}
                    {isLeft ? (
                      <>
                        <Reveal as="div" className="sm:pr-14 reveal-left" delay={i * 40}>
                          <SolutionCard step={step} c={c} />
                        </Reveal>
                        <div className="hidden sm:block" />
                      </>
                    ) : (
                      <>
                        <div className="hidden sm:block" />
                        <Reveal as="div" className="sm:pl-14 reveal-right" delay={i * 40}>
                          <SolutionCard step={step} c={c} />
                        </Reveal>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Industries — 3D tilt cards ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Trusted across industries
            </h2>
           <p className="text-gray-500 mt-3 text-sm sm:text-base">
  Wherever documents are critical to business operations, DMS provides
  the control, security, and efficiency organizations need.
</p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {INDUSTRIES.map((ind, i) => {
              const Icon = ind.icon;
              return (
                <Reveal key={ind.title} delay={i * 70}>
                  <TiltCard className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-2xl hover:shadow-blue-100 h-full">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center ring-4 ring-blue-100 mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-base mb-2">
                      {ind.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {ind.desc}
                    </p>
                  </TiltCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Quote / proof strip ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-4xl mx-auto text-center relative">
          <Quote className="w-9 h-9 text-blue-200 mx-auto mb-5 drift" />
          <p className="text-xl sm:text-2xl font-medium text-gray-800 leading-relaxed">
  "Approval cycles that once took days are now completed within hours,
  while every stakeholder can track document status from a single platform."
</p>
          <p className="text-sm text-gray-400 mt-4">
            — Operations Lead, Manufacturing Enterprise
          </p>
        </Reveal>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-5xl mx-auto relative bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl px-8 sm:px-16 py-14 text-center shadow-xl shadow-blue-200 overflow-hidden">
          <Sparkles className="absolute top-6 left-8 w-6 h-6 text-white/30 drift" />
          <Sparkles
            className="absolute bottom-8 right-10 w-5 h-5 text-white/20 drift"
            style={{ animationDelay: "1.5s" }}
          />
          <h2 className="relative text-3xl font-bold text-white mb-3">
            Find the right fit for your team
          </h2>
          <p className="relative text-blue-50 mb-7 max-w-xl mx-auto">
  Start configuring DMS to meet the unique needs of your department today.
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

/* ── Sub-component: one timeline card ────────────────────────────── */
function SolutionCard({ step, c }) {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-md shadow-gray-100 p-6 sm:p-7 hover:shadow-xl transition-shadow duration-300">
      <span className={`inline-block text-xs font-bold ${c.text} ${c.bg} px-3 py-1 rounded-full mb-3`}>
        {step.role}
      </span>
      <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
        {step.headline}
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-4">
        {step.pain}
      </p>
      <div className="flex flex-col gap-2">
        {step.points.map((p) => (
          <div key={p} className="flex items-start gap-2.5">
            <CheckCircle2 className={`w-4 h-4 ${c.text} flex-shrink-0 mt-0.5`} />
            <span className="text-sm text-gray-700 font-medium leading-relaxed">
              {p}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}