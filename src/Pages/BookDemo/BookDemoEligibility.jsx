// src/Pages/BookDemo/BookDemoEligibility.jsx
//
// Step 3 of the Book Demo funnel — 3 quick selectable questions.
// Answers are passed up via onContinue(answers); this component holds
// no persistence logic of its own (kept simple, per request).

import { useState } from "react";
import {
  Users, Building2, Workflow, ShieldCheck, FileStack, Rocket, CalendarClock,
  Hourglass, Compass, ArrowRight, ChevronRight, Check,
} from "lucide-react";
import ProgressSteps from "./ProgressSteps";

const QUESTIONS = [
  {
    key: "teamSize",
    label: "How big is your team?",
    icon: Users,
    options: [
      { value: "1-10", label: "1–10 people" },
      { value: "11-50", label: "11–50 people" },
      { value: "51-200", label: "51–200 people" },
      { value: "200+", label: "200+ people" },
    ],
  },
  {
    key: "useCase",
    label: "What are you looking to solve?",
    icon: Workflow,
    options: [
      { value: "storage", label: "Document storage & search", icon: FileStack },
      { value: "workflow", label: "Approval workflow automation", icon: Workflow },
      { value: "sap", label: "SAP integration", icon: Building2 },
      { value: "compliance", label: "Compliance & audit trails", icon: ShieldCheck },
    ],
  },
  {
    key: "timeline",
    label: "When are you looking to get started?",
    icon: CalendarClock,
    options: [
      { value: "now", label: "Immediately", icon: Rocket },
      { value: "month", label: "Within a month", icon: Hourglass },
      { value: "quarter", label: "1–3 months", icon: CalendarClock },
      { value: "exploring", label: "Just exploring", icon: Compass },
    ],
  },
];

export default function BookDemoEligibility({ onContinue, onBack, stepIndex = 2, totalSteps = ["Welcome", "Policies", "Eligibility"] }) {
  const [answers, setAnswers] = useState({});

  const allAnswered = QUESTIONS.every((q) => answers[q.key]);

  function select(qKey, value) {
    setAnswers((prev) => ({ ...prev, [qKey]: value }));
  }

  return (
    <div className="font-sans min-h-screen bg-gradient-to-b from-[#F8FAFC] to-white">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={onBack} className="text-sm font-semibold text-gray-600 hover:text-[#2563EB] flex items-center gap-1.5">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back
          </button>
          <ProgressSteps steps={totalSteps} currentIndex={stepIndex} />
          <span className="w-14" />
        </div>
      </div>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-14 pb-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Help us tailor your demo</h1>
        <p className="text-gray-500">Three quick questions — this takes about 20 seconds.</p>
      </section>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">
        {QUESTIONS.map((q) => (
          <div key={q.key}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center"><q.icon className="w-4 h-4" /></span>
              <h2 className="font-bold text-gray-900">{q.label}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((opt) => {
                const selected = answers[q.key] === opt.value;
                const OptIcon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => select(q.key, opt.value)}
                    className={`relative flex items-center gap-2.5 text-left px-4 py-3.5 rounded-xl border text-sm font-semibold transition-all ${
                      selected
                        ? "border-[#2563EB] bg-blue-50 text-[#2563EB] shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50/40"
                    }`}
                  >
                    {OptIcon && <OptIcon className="w-4 h-4 shrink-0" />}
                    {opt.label}
                    {selected && <Check className="w-4 h-4 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <div className="sticky bottom-0 z-40 bg-white/90 backdrop-blur-xl border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex justify-end">
          <button
            onClick={() => onContinue(answers)}
            disabled={!allAnswered}
            className={`flex items-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all ${
              allAnswered
                ? "bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white hover:shadow-lg hover:-translate-y-0.5"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
