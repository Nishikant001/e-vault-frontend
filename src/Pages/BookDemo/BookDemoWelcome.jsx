// src/Pages/BookDemo/BookDemoWelcome.jsx
//
// Step 1 of the Book Demo funnel — "why book a demo" hero, benefits,
// a video preview card, and testimonials. Pure UI, no auth/data logic.

import { useState } from "react";
import {
  Sparkles, ArrowRight, Play, X as XIcon, Clock3, Users2, ShieldCheck,
  Workflow, Star, LayoutDashboard, ChevronRight,
} from "lucide-react";
import ProgressSteps from "./ProgressSteps";

const REASONS = [
  { icon: LayoutDashboard, title: "See your real workflow", desc: "We walk through document, approval, and search flows shaped like your team's, not a generic script." },
  { icon: Users2, title: "Talk to a real person", desc: "No forms-only funnel — a product specialist answers your specific questions live." },
  { icon: ShieldCheck, title: "Get a straight answer on security", desc: "Ask about encryption, roles, retention, and compliance and get specifics, not marketing copy." },
];

const BENEFITS = [
  { icon: Clock3, label: "30-minute session" },
  { icon: Workflow, label: "Tailored to your use case" },
  { icon: ShieldCheck, label: "No obligation, no pressure" },
];

const TESTIMONIALS = [
  { quote: "The demo answered our SAP integration questions in ten minutes flat.", name: "Priya Nair", role: "Head of Operations, Solace Health" },
  { quote: "We knew within the call whether it fit our compliance needs.", name: "Daniel Osei", role: "General Counsel, Northfield Partners" },
  { quote: "No fluff — just a straight walkthrough of what we'd actually use.", name: "Mei Lin Tan", role: "IT Director, Bridgeview Logistics" },
];

function VideoModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center hover:bg-gray-100">
          <XIcon className="w-4 h-4" />
        </button>
        <div className="aspect-video bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-white">
          <div className="text-center px-8">
            <Play className="w-12 h-12 mx-auto mb-3 opacity-90" />
            <p className="font-semibold">Preview video coming soon</p>
            <p className="text-sm text-blue-100 mt-1">Book a live session to see it in action instead.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookDemoWelcome({ onContinue, onExit, stepIndex = 0, totalSteps = ["Welcome", "Policies", "Eligibility"] }) {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <div className="font-sans min-h-screen bg-gradient-to-b from-[#F8FAFC] to-white">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={onExit} className="text-sm font-semibold text-gray-600 hover:text-[#2563EB] flex items-center gap-1.5">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back
          </button>
          <ProgressSteps steps={totalSteps} currentIndex={stepIndex} />
          <span className="w-14" />
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-10 text-center">
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-[#2563EB] text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Book a Demo
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight mb-4">
          See DMS in action,<br className="hidden sm:block" /> built around your workflow
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
          Before we schedule anything, take two minutes to see what a demo covers, and whether it's the right fit for your team.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          {BENEFITS.map((b) => (
            <span key={b.label} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 bg-white border border-gray-100 rounded-full px-4 py-2 shadow-sm">
              <b.icon className="w-4 h-4 text-[#2563EB]" /> {b.label}
            </span>
          ))}
        </div>
      </section>

      {/* video preview card */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-16">
        <button
          onClick={() => setVideoOpen(true)}
          className="group relative w-full aspect-video rounded-3xl overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#60A5FA] shadow-xl flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
          <span className="relative w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-[#2563EB] ml-0.5" />
          </span>
          <span className="absolute bottom-5 left-6 text-white text-sm font-semibold">1-minute preview</span>
        </button>
      </section>

      {/* why book a demo */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-center text-2xl font-extrabold text-gray-900 mb-10">Why teams book a demo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {REASONS.map((r) => (
            <div key={r.title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 flex items-center justify-center mb-4">
                <r.icon className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5">{r.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* testimonials */}
      <section className="bg-[#F8FAFC] border-y border-gray-100 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold text-gray-900 mb-10">What people say after their demo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex gap-0.5 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">"{t.quote}"</p>
                <div className="text-xs font-semibold text-gray-900">{t.name}</div>
                <div className="text-xs text-gray-500">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* sticky continue bar */}
      <div className="sticky bottom-0 z-40 bg-white/90 backdrop-blur-xl border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex justify-end">
          <button
            onClick={onContinue}
            className="flex items-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:shadow-lg text-white font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} />
    </div>
  );
}
