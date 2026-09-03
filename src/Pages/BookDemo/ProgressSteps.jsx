// src/Pages/BookDemo/ProgressSteps.jsx
//
// Small shared step indicator used across the Book Demo onboarding funnel.
// currentIndex is 0-based into `steps`.

import { Check } from "lucide-react";

export default function ProgressSteps({ steps, currentIndex }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {steps.map((label, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={label} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-[0_0_0_4px_rgba(37,99,235,0.15)]"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={`hidden sm:inline text-xs font-semibold ${active ? "text-[#2563EB]" : done ? "text-gray-500" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className={`h-0.5 w-6 sm:w-10 rounded-full transition-colors ${done ? "bg-emerald-500" : "bg-gray-100"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
