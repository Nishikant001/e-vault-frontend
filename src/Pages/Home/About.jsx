// src/Pages/Home/About.jsx
// ──────────────────────────────────────────────────────────────────────────────
// HOW TO USE:
//   Import and add to your LandingPage.jsx like this:
//
//   import About from "./About";
//
//   Then place <About /> as a section inside your DMSLanding return:
//     ...after the WHY TEAMS section, before the CTA section...
//     <About />
//
//   Or add "about" to NAV_LINKS and scroll to <section id="about"> with anchor.
// ──────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useState } from "react";
import { FileText, Users, Globe, ShieldCheck, Sparkles, Zap, Rocket, Target, Eye } from "lucide-react";
import { FaLinkedin } from "react-icons/fa6";
import { useLanguage } from "../Home/LanguageContext";

// ── Reuse the same InView hook pattern as LandingPage ──
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

// ── Animated counter (same as LandingPage) ──
function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView(0.3);
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ""));
  const suffix = value.replace(/[0-9.,]/g, "");

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1500;
    const step = numericValue / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= numericValue) { setCount(numericValue); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, numericValue]);

  return (
    <span ref={ref}>
      {numericValue > 999
        ? Math.floor(count).toLocaleString() + suffix
        : count < 100
        ? count.toFixed(1) + suffix
        : Math.floor(count) + suffix}
    </span>
  );
}

// ── Team members ──
const TEAM = [
  {
    name: "Jiban Jena",
    role: "Co-founder & CEO",
    avatar: "AM",
    gradient: "from-blue-500 to-cyan-500",
    bio: "10+ years in enterprise software. Previously at TCS and Infosys.",
    linkedin: "#",
  },
  {
    name: "Dharmendra Sharama",
    role: "CTO",
    avatar: "PS",
    gradient: "from-emerald-500 to-teal-500",
    bio: "Expert in distributed systems and cloud architecture. IIT Bombay alumna.",
    linkedin: "#",
  },
  {
    name: "Akshya Kumar Mahanta",
    role: "Head of Design",
    avatar: "RN",
    gradient: "from-purple-500 to-pink-500",
    bio: "Crafting intuitive UX for complex enterprise tools since 2015.",
    linkedin: "#",
  },
  {
    name: "Nishikant Sahoo",
    role: "VP Engineering",
    avatar: "SP",
    gradient: "from-orange-500 to-rose-500",
    bio: "Leads a team of 25 engineers. Security and compliance specialist.",
    linkedin: "#",
  },
];

// ── Timeline ──
const TIMELINE = [
  { year: "2020", event: "DMS founded", detail: "Started with a team of 3 in Mumbai." },
  { year: "2021", event: "First 100 customers", detail: "Reached 100 enterprise clients within 12 months." },
  { year: "2022", event: "Series A funding", detail: "Raised ₹50 Cr to scale engineering & sales." },
  { year: "2023", event: "Pan-India expansion", detail: "Opened offices in Bangalore, Delhi, and Hyderabad." },
  { year: "2024", event: "ISO 27001 certified", detail: "Achieved international security certification." },
  { year: "2025", event: "Global launch", detail: "Expanded to 12+ countries across 3 continents." },
];

export default function About() {
  const { t } = useLanguage();
  const [heroRef, heroInView] = useInView(0.1);
  const [valuesRef, valuesInView] = useInView(0.1);
  const [teamRef, teamInView] = useInView(0.1);
  const [timelineRef, timelineInView] = useInView(0.1);
  const [statsRef, statsInView] = useInView(0.2);

  const STATS = [
    { value: "2,548+", label: t("about.stat1"), icon: FileText, gradient: "from-blue-500 to-cyan-500" },
    { value: "156+",   label: t("about.stat2"), icon: Users, gradient: "from-emerald-500 to-teal-500" },
    { value: "12+",    label: t("about.stat3"), icon: Globe, gradient: "from-purple-500 to-pink-500" },
    { value: "99.9%",  label: t("about.stat4"), icon: ShieldCheck, gradient: "from-orange-500 to-rose-500" },
  ];

  const VALUES = [
    {
      icon: ShieldCheck,
      title: t("about.security"),
      desc: t("about.securityDesc"),
      color: "text-blue-600 bg-blue-50 border-blue-100",
      bar: "from-blue-500 to-cyan-500",
    },
    {
      icon: Sparkles,
      title: t("about.simplicity"),
      desc: t("about.simplicityDesc"),
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      bar: "from-emerald-500 to-teal-500",
    },
    {
      icon: Zap,
      title: t("about.reliability"),
      desc: t("about.reliabilityDesc"),
      color: "text-purple-600 bg-purple-50 border-purple-100",
      bar: "from-purple-500 to-pink-500",
    },
    {
      icon: Rocket,
      title: t("about.innovation"),
      desc: t("about.innovationDesc"),
      color: "text-orange-600 bg-orange-50 border-orange-100",
      bar: "from-orange-500 to-rose-500",
    },
  ];

  return (
    <div id="about" className="font-sans">

      {/* ── HERO BANNER ── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-24 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div
          ref={heroRef}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
        >
          <span className={`inline-block bg-blue-500/10 text-blue-300 text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-500/20 mb-4 transition-all duration-700 ${heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {t("about.badge")}
          </span>
          <h1 className={`text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4 transition-all duration-700 delay-100 ${heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {t("about.title")}{" "}
            <span
              style={{
                background: "linear-gradient(135deg,#3B82F6 0%,#06B6D4 50%,#10B981 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t("about.titleHighlight")}
            </span>
          </h1>
          <p className={`text-blue-200 text-lg max-w-2xl mx-auto transition-all duration-700 delay-200 ${heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {t("about.subtitle")}
          </p>
        </div>
      </section>

      {/* ── STATS ROW ── */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div ref={statsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-500 ${statsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <span className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center mb-2">
                <s.icon className="w-5 h-5 text-gray-700" />
              </span>
              <div
                style={{
                  background: `linear-gradient(135deg, ${s.gradient.includes("blue") ? "#3B82F6,#06B6D4" : s.gradient.includes("emerald") ? "#10B981,#14B8A6" : s.gradient.includes("purple") ? "#8B5CF6,#EC4899" : "#F59E0B,#F43F5E"})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
                className="text-3xl font-extrabold"
              >
                {statsInView ? <AnimatedCounter value={s.value} /> : "0"}
              </div>
              <div className="text-sm font-semibold text-gray-600 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MISSION & VISION ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
        {/* Mission */}
        <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 border border-blue-100 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full translate-x-8 -translate-y-8"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
<Target className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">{t("about.mission")}</h2>
            <p className="text-gray-600 text-base leading-relaxed">{t("about.missionText")}</p>
          </div>
        </div>

        {/* Vision */}
        <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-100 overflow-hidden">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-200/30 rounded-full -translate-x-8 translate-y-8"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
<Eye className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">{t("about.vision")}</h2>
            <p className="text-gray-600 text-base leading-relaxed">{t("about.visionText")}</p>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="bg-gradient-to-br from-gray-50 to-blue-50/30 border-y border-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-blue-600 text-sm font-semibold tracking-wide uppercase">
              <span className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></span>
              {t("about.values")}
              <span className="w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></span>
            </span>
          </div>
          <div ref={valuesRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <div
                key={v.title}
                className={`group bg-white rounded-2xl p-6 border ${v.color.split(" ").slice(2).join(" ")} shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1 ${valuesInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={`mb-3 w-12 h-12 rounded-xl flex items-center justify-center border ${v.color}`}>
                  <v.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                <div className={`mt-4 h-0.5 w-0 group-hover:w-full bg-gradient-to-r ${v.bar} rounded-full transition-all duration-500`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900">Our Journey</h2>
        </div>
        <div ref={timelineRef} className="relative">
          {/* vertical line */}
          <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-cyan-200 to-emerald-200"></div>

          {TIMELINE.map((item, i) => (
            <div
              key={item.year}
              className={`relative flex items-start gap-6 mb-10 transition-all duration-700 ${timelineInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              {/* Content */}
              <div className={`flex-1 ${i % 2 === 0 ? "text-right pr-8" : "text-left pl-8"}`}>
                <div className="inline-block bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:shadow-md transition-shadow">
                  <div
                    style={{
                      background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                    className="text-sm font-bold mb-1"
                  >
                    {item.year}
                  </div>
                  <div className="font-semibold text-gray-800 text-sm">{item.event}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.detail}</div>
                </div>
              </div>

              {/* Dot */}
              <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-white shadow-md mt-4"></div>

              {/* Spacer */}
              <div className="flex-1"></div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="bg-gradient-to-br from-gray-50 to-blue-50/20 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-3">{t("about.team")}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t("about.teamSubtitle")}</p>
          </div>
          <div ref={teamRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((member, i) => (
              <div
                key={member.name}
                className={`group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${teamInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Avatar */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {member.avatar}
                </div>
                <h3 className="font-bold text-gray-900 text-base">{member.name}</h3>
                <div
                  style={{
                    background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                  className="text-xs font-semibold mb-2"
                >
                  {member.role}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{member.bio}</p>
                <a
                  href={member.linkedin}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <FaLinkedin className="w-3.5 h-3.5" />
                  LinkedIn
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}