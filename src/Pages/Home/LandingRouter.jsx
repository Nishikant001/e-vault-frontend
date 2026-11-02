// src/Pages/Home/LandingRouter.jsx
// ──────────────────────────────────────────────────────────────────────────────
// YEH FILE App.jsx mein DMSLanding ki jagah use karo.
// Yeh landing ka apna mini-router hai — About, Contact pages
// navbar se navigate hone par alag full page ki tarah dikhenge,
// same navbar ke saath.
//
// App.jsx mein SIRF YEH CHANGE KARO:
//
//   PURANA:
//     import DMSLanding from "../src/Pages/Home/LandingPage";
//     ...
//     if (showLanding && !user) {
//       return <DMSLanding onGetStarted={() => setShowLanding(false)} />;
//     }
//
//   NAYA:
//     import LandingRouter from "../src/Pages/Home/LandingRouter";
//     ...
//     if (showLanding && !user) {
//       return <LandingRouter onGetStarted={() => setShowLanding(false)} />;
//     }
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import {
  ChevronDown, Check, Menu as MenuIcon, X as XIcon, Globe,
  FileText, BookOpen, Download, PlayCircle, BarChart3, Puzzle,
  Code2, ShieldCheck, FileClock, HelpCircle,
} from "lucide-react";
import logo from "../../assets/e-vault-background-c.png";
import DMSLanding from "./LandingPage";
import About from "./About";
import Contact from "./Contact";
import { useLanguage } from "../Home/LanguageContext";
import Features from "./Features";
import Solutions from "./Solutions";
import Documentation from "./Resources/Documentation";
import KnowledgeBase from "./Resources/KnowledgeBase";
import Downloads from "./Resources/Downloads";
import VideoTutorials from "./Resources/VideoTutorials";
import CaseStudies from "./Resources/CaseStudies";
import Integrations from "./Resources/Integrations";
import ApiDocumentation from "./Resources/ApiDocumentation";
import Security from "./Resources/Security";
import ReleaseNotes from "./Resources/ReleaseNotes";
import SupportCenter from "./Resources/SupportCenter";

const NAV_LINKS = [
  "Home",
  "Features",
  "Solutions",
  "Resources",
  "About Us",
  "Contact",
];

// ── Shared Navbar (same style as LandingPage navbar) ──
function SharedNavbar({ activePage, onNavigate, onGetStarted }) {
  const { t, lang, setLang, languages } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activePage]);

  const handleNavClick = (e, link) => {
    e.preventDefault();
    setMenuOpen(false);
    if (link === "Home") onNavigate("home");
    if (link === "Features") onNavigate("features");
    if (link === "Solutions") onNavigate("solutions");

    if (link === "About Us") onNavigate("about");
    if (link === "Contact") onNavigate("contact");
    // Features, Solutions, Resources — same landing page pe scroll (optional)
  };
  //   const handleResourceClick = (page) => {
  //   onNavigate(page);
  // };

  const isActive = (link) => {
    if (link === "Home" && activePage === "home") return true;
    if (link === "Features" && activePage === "features") return true;
    if (link === "Solutions" && activePage === "solutions") return true;

    if (link === "About Us" && activePage === "about") return true;
    if (link === "Contact" && activePage === "contact") return true;
    return false;
  };

  return (
    <nav
className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/70 backdrop-blur-xl p-3 border-b border-gray-200/70 shadow-[0_4px_30px_rgba(37,99,235,0.06)]" : "bg-transparent border-b border-transparent"
        }`}    >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 group"
        >
          <img
            src={logo}
            alt="e-Vault"
            className="h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
          />
        </button>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => {
            if (link === "Resources") {
              return (
                <div key={link} className="relative">
                  <button
                    onClick={() => setResourcesOpen(!resourcesOpen)}
                    className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 py-1"
                  >
                    Resources
                    <ChevronDown
                      className={`w-3.5 h-3.5 mt-0.5 transition-transform duration-300 ${resourcesOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Backdrop */}
                  {resourcesOpen && (
                    <div
                      className="fixed inset-0 top-16 bg-black/10 backdrop-blur-sm z-40"
                      onClick={() => setResourcesOpen(false)}
                    />
                  )}

                  {/* Dropdown panel */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-112 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-2xl shadow-blue-100/50 z-50 overflow-hidden transition-all duration-300 ${
                      resourcesOpen
                        ? "opacity-100 visible translate-y-0"
                        : "opacity-0 invisible translate-y-2"
                    }`}
                  >
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                        Resources
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Documentation & support
                      </p>
                    </div>

                    <div className="p-3 grid grid-cols-3 gap-3 mb-5">
                      {[
                        { label: "Documentation", icon: FileText, page: "documentation" },
                        { label: "Knowledge Base", icon: BookOpen, page: "knowledge" },
                        { label: "Downloads", icon: Download, page: "downloads" },
                        { label: "Video Tutorials", icon: PlayCircle, page: "tutorials" },
                        { label: "Case Studies", icon: BarChart3, page: "casestudies" },
                        { label: "Integrations", icon: Puzzle, page: "integrations" },
                        { label: "API Docs", icon: Code2, page: "api" },
                        { label: "Security", icon: ShieldCheck, page: "security" },
                        { label: "Release Notes", icon: FileClock, page: "releases" },
                      ].map(({ label, icon: Icon, page }) => (
                        <button
                          key={page}
                          onClick={() => {
                            onNavigate(page);
                            setResourcesOpen(false);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left hover:bg-blue-50 group/item transition-all duration-200 hover:scale-[1.02]"
                        >
                          <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover/item:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors duration-200">
                            <Icon className="w-3.5 h-3.5 text-gray-500 group-hover/item:text-blue-600 transition-colors" />
                          </div>
                          <span className="text-xs font-medium text-gray-700 group-hover/item:text-blue-600 transition-colors leading-tight">
                            {label}
                          </span>
                        </button>
                      ))}

                      {/* Support Center — col-span-3 center mein */}
                      <div className="col-span-3 flex justify-center">
                        <button
                          onClick={() => {
                            onNavigate("support");
                            setResourcesOpen(false);
                          }}
                          className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-left hover:bg-blue-50 group/item transition-all duration-200 hover:scale-[1.02]"
                        >
                          <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover/item:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors duration-200">
                            <HelpCircle className="w-3.5 h-3.5 text-gray-500 group-hover/item:text-blue-600 transition-colors" />
                          </div>
                          <span className="text-xs font-medium text-gray-700 group-hover/item:text-blue-600 transition-colors leading-tight">
                            Support Center
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50/50 border-t border-gray-100">
                      <p className="text-xs text-gray-400 text-center">
                        Need help?{" "}
                        <button
                          onClick={() => {
                            onNavigate("support");
                            setResourcesOpen(false);
                          }}
                          className="text-blue-500 hover:text-blue-700 font-medium"
                        >
                          Visit Support Center →
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <a
                key={link}
                href="#"
                onClick={(e) => handleNavClick(e, link)}
                className={`text-sm font-medium transition-all duration-200 relative group ${
                  isActive(link)
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                {link}
              </a>
            );
          })}
        </div>

        {/* Desktop Right — Language Switcher + Get Started */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Switcher */}
          {/* <div className="relative group">
            <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:border-gray-300 transition-colors">
              <Globe className="w-4 h-4" />
              <span>{languages.find((l) => l.code === lang)?.flag}</span>
              <span className="hidden lg:inline">
                {languages.find((l) => l.code === lang)?.label}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button> */}

            {/* Dropdown */}
            {/* <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/60 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 max-h-72 overflow-y-auto">
              {languages.map((lng) => (
                <button
                  key={lng.code}
                  onClick={() => setLang(lng.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                    lang === lng.code
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  <span className="text-base">{lng.flag}</span>
                  <span>{lng.label}</span>
                  {lang === lng.code && (
                    <Check className="w-3.5 h-3.5 ml-auto text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          </div> */}

          {/* Get Started button */}
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
          {menuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="bg-white border-t border-gray-100 px-4 pb-4 pt-2 flex flex-col gap-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              onClick={(e) => handleNavClick(e, link)}
              className={`text-sm font-medium transition-colors py-1 ${
                isActive(link)
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {link}
            </a>
          ))}

          {/* Mobile Language Switcher */}
          <div className="border-t border-gray-100 pt-3 mt-1">
            <div className="text-xs text-gray-400 mb-2 font-medium">
              Language
            </div>
            <div className="grid grid-cols-3 gap-2">
              {languages.map((lng) => (
                <button
                  key={lng.code}
                  onClick={() => setLang(lng.code)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    lang === lng.code
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "text-gray-600 hover:bg-gray-50 border border-gray-100"
                  }`}
                >
                  <span>{lng.flag}</span>
                  <span className="truncate">{lng.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold px-5 py-2 rounded-lg mt-1"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

// ── Footer (same as LandingPage) ──
function SharedFooter({ onNavigate }) {
  return (
    <footer className="border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 group"
        >
          <img
            src={logo}
            alt="e-Vault"
            className="h-9 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
          />
        </button>
        <div className="flex gap-6 text-sm text-gray-500">
          {["Privacy Policy", "Terms of Service", "Support"].map((l) => (
            <a
              key={l}
              href="#"
              className="hover:text-blue-600 transition-colors relative group"
            >
              {l}
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full rounded-full"></span>
            </a>
          ))}
          <button
            onClick={() => onNavigate("contact")}
            className="hover:text-blue-600 transition-colors relative group"
          >
            Contact
            <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full rounded-full"></span>
          </button>
        </div>
        <div className="text-sm text-gray-400">
          © 2026 DMS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// ── MAIN EXPORT ──
export default function LandingRouter({ onGetStarted, onWatchDemo }) {
  const [activePage, setActivePage] = useState("home");

  const navigate = (page) => setActivePage(page);

  // Home — full LandingPage as-is (with its own navbar/footer)
  // but we pass onNavigate so its nav links work too
 if (activePage === "home") {
  return <DMSLanding onGetStarted={onGetStarted} onNavigate={navigate} onWatchDemo={onWatchDemo} />;
}

  // About page — shared navbar + About content + shared footer
  if (activePage === "about") {
    return (
      <div className="font-sans bg-white min-h-screen">
        <SharedNavbar
          activePage={activePage}
          onNavigate={navigate}
          onGetStarted={onGetStarted}
        />
        <About onNavigate={navigate} />
        <SharedFooter onNavigate={navigate} />
      </div>
    );
  }

  if (activePage === "documentation") {
    return (
      <div className="font-sans bg-white min-h-screen">
        <SharedNavbar
          activePage={activePage}
          onNavigate={navigate}
          onGetStarted={onGetStarted}
        />

        <Documentation />

        <SharedFooter onNavigate={navigate} />
      </div>
    );
  }

  if (activePage === "knowledge") {
    return (
      <div className="font-sans bg-white min-h-screen">
        <SharedNavbar
          activePage={activePage}
          onNavigate={navigate}
          onGetStarted={onGetStarted}
        />

        <KnowledgeBase />

        <SharedFooter onNavigate={navigate} />
      </div>
    );
  }

  // Features page — shared navbar + Features content + shared footer
  if (activePage === "features") {
    return (
      <div className="font-sans bg-white min-h-screen">
        <SharedNavbar
          activePage={activePage}
          onNavigate={navigate}
          onGetStarted={onGetStarted}
        />
        <Features onNavigate={navigate} />
        <SharedFooter onNavigate={navigate} />
      </div>
    );
  }
  if (activePage === "downloads") {
    return (
      <div className="font-sans bg-white min-h-screen">
        <SharedNavbar
          activePage={activePage}
          onNavigate={navigate}
          onGetStarted={onGetStarted}
        />
        <Downloads />
        <SharedFooter onNavigate={navigate} />
      </div>
    );
  }
  if (activePage === "tutorials") {
    return (
      <div className="font-sans bg-white min-h-screen">
        <SharedNavbar
          activePage={activePage}
          onNavigate={navigate}
          onGetStarted={onGetStarted}
        />
        <VideoTutorials />
        <SharedFooter onNavigate={navigate} />
      </div>
    );
  }

  if (activePage === "casestudies") {
    return (
      <div className="font-sans bg-white min-h-screen">
        <SharedNavbar
          activePage={activePage}
          onNavigate={navigate}
          onGetStarted={onGetStarted}
        />
        <CaseStudies />
        <SharedFooter onNavigate={navigate} />
      </div>
    );
  }

  if (activePage === "integrations") {
    return (
      <div className="font-sans bg-white min-h-screen">
        <SharedNavbar
          activePage={activePage}
          onNavigate={navigate}
          onGetStarted={onGetStarted}
        />
        <Integrations />
        <SharedFooter onNavigate={navigate} />
      </div>
    );
  }

  if (activePage === "api") {
    return (
      <div className="font-sans bg-white min-h-screen">
        <SharedNavbar
          activePage={activePage}
          onNavigate={navigate}
          onGetStarted={onGetStarted}
        />
        <ApiDocumentation />
        <SharedFooter onNavigate={navigate} />
      </div>
    );
  }

  if (activePage === "security") {
    return (
      <div className="font-sans bg-white min-h-screen">
        <SharedNavbar
          activePage={activePage}
          onNavigate={navigate}
          onGetStarted={onGetStarted}
        />
        <Security />
        <SharedFooter onNavigate={navigate} />
      </div>
    );
  }

  if (activePage === "releases") {
    return (
      <div className="font-sans bg-white min-h-screen">
        <SharedNavbar
          activePage={activePage}
          onNavigate={navigate}
          onGetStarted={onGetStarted}
        />
        <ReleaseNotes />
        <SharedFooter onNavigate={navigate} />
      </div>
    );
  }

  if (activePage === "support") {
    return (
      <div className="font-sans bg-white min-h-screen">
        <SharedNavbar
          activePage={activePage}
          onNavigate={navigate}
          onGetStarted={onGetStarted}
        />
        <SupportCenter />
        <SharedFooter onNavigate={navigate} />
      </div>
    );
  }

  // Main export mein naya block:
  if (activePage === "solutions") {
    return (
      <div className="font-sans bg-white min-h-screen">
        <SharedNavbar
          activePage={activePage}
          onNavigate={navigate}
          onGetStarted={onGetStarted}
        />
        <Solutions onNavigate={navigate} />
        <SharedFooter onNavigate={navigate} />
      </div>
    );
  }
  // Contact page — shared navbar + Contact content + shared footer
  if (activePage === "contact") {
    return (
      <div className="font-sans bg-white min-h-screen">
        <SharedNavbar
          activePage={activePage}
          onNavigate={navigate}
          onGetStarted={onGetStarted}
        />
        <Contact onNavigate={navigate} />
        <SharedFooter onNavigate={navigate} />
      </div>
    );
  }

  // Fallback
return <DMSLanding onGetStarted={onGetStarted} onNavigate={navigate} onWatchDemo={onWatchDemo} />;}
