// src/Pages/BookDemo/BookDemoPolicies.jsx
//
// Step 2 of the Book Demo funnel — short policy cards + FAQ accordion +
// the "I Agree" checkbox that unlocks Continue.

import { useState } from "react";
import { ShieldCheck, Clock3, MailX, Plus, ArrowRight, ChevronRight } from "lucide-react";
import ProgressSteps from "./ProgressSteps";

const POLICIES = [
  { icon: ShieldCheck, title: "Your data stays private", desc: "Anything you share on the call is used only to tailor the demo, never sold or shared with third parties." },
  { icon: Clock3, title: "30 minutes, no pressure", desc: "The session is scoped to your questions. You can end it early, and there's no obligation to buy." },
  { icon: MailX, title: "Easy opt-out", desc: "You can cancel or reschedule anytime, and unsubscribe from follow-ups with one click." },
];

const FAQ = [
  { q: "Do I need to prepare anything before the call?", a: "No preparation required. Come with any questions about your document workflows, and we'll tailor the walkthrough on the spot." },
  { q: "Who will I be speaking with?", a: "A product specialist who works with teams in your industry, not a general sales rep." },
  { q: "Can I bring teammates to the call?", a: "Yes, you can add attendees when you book. Most teams bring one or two people from IT and operations." },
  { q: "What happens after the demo?", a: "You'll get a short recap and, if it's a fit, a trial workspace already configured to what you saw." },
];

function AccordionItem({ item, isOpen, onClick }) {
  return (
    <div className="border border-gray-100 rounded-2xl bg-white overflow-hidden">
      <button onClick={onClick} className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 hover:bg-blue-50/50 transition-colors">
        <span className="font-semibold text-gray-900 text-sm">{item.q}</span>
        <span className={`shrink-0 w-7 h-7 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>
          <Plus className="w-3.5 h-3.5" />
        </span>
      </button>
      <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: isOpen ? "200px" : "0px" }}>
        <p className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">{item.a}</p>
      </div>
    </div>
  );
}

export default function BookDemoPolicies({ onContinue, onBack, stepIndex = 1, totalSteps = ["Welcome", "Policies", "Eligibility"] }) {
  const [agreed, setAgreed] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

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

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">A few things before you book</h1>
        <p className="text-gray-500 max-w-xl mx-auto">Quick policies and common questions, so there are no surprises.</p>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {POLICIES.map((p) => (
            <div key={p.title} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
                <p.icon className="w-4.5 h-4.5 text-[#2563EB]" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-1">{p.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-extrabold text-gray-900 mb-4">Frequently asked</h2>
        <div className="flex flex-col gap-2.5 mb-10">
          {FAQ.map((item, i) => (
            <AccordionItem key={item.q} item={item} isOpen={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)} />
          ))}
        </div>

        {/* agreement */}
        <label className={`flex items-start gap-3 rounded-2xl border p-5 cursor-pointer transition-colors ${agreed ? "border-[#2563EB] bg-blue-50/50" : "border-gray-200 bg-white"}`}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-gray-300 text-[#2563EB] focus:ring-[#2563EB]/30"
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            I've read the policies above and agree to be contacted about scheduling this demo, in line with the{" "}
            <a href="/privacy" className="font-semibold text-[#2563EB] hover:underline">Privacy Policy</a> and{" "}
            <a href="/terms" className="font-semibold text-[#2563EB] hover:underline">Terms of Service</a>.
          </span>
        </label>
      </section>

      <div className="sticky bottom-0 z-40 bg-white/90 backdrop-blur-xl border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex justify-end">
          <button
            onClick={onContinue}
            disabled={!agreed}
            className={`flex items-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all ${
              agreed
                ? "bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white hover:shadow-lg hover:-translate-y-0.5"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            I Agree &amp; Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
