// src/Pages/Home/Resources/SupportCenter.jsx
import { useState } from "react";
import { Headset, Search, MessageCircle, Mail, Phone, Clock, ChevronDown } from "lucide-react";

const FAQS = [
  { q: "How do I reset my password?", a: "Go to the login page and click 'Forgot Password'. You'll receive a reset link via email within 2 minutes." },
  { q: "Can I recover a deleted document?", a: "Yes — deleted documents are soft-deleted and recoverable within 30 days from the Trash section in your dashboard." },
  { q: "How do I add more users to my organization?", a: "Go to Settings → User Management → Invite User. You can invite users by email and assign them a role." },
  { q: "What file formats does DMS support?", a: "DMS supports PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), images (JPG, PNG), and 50+ other formats." },
  { q: "Can I access DMS offline?", a: "Yes — the desktop app supports offline mode. Documents you've opened recently are cached locally for access without internet." },
  { q: "How do I upgrade my plan?", a: "Go to Settings → Billing → Upgrade Plan. Changes take effect immediately and are prorated for the current billing cycle." },
];

const SUPPORT_OPTIONS = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    desc: "Chat with a support agent in real-time.",
    availability: "Mon–Fri, 9 AM – 6 PM IST",
    action: "Start Chat",
    color: "border-blue-200 bg-blue-50",
    btnColor: "bg-blue-600 hover:bg-blue-700",
  },
  {
    icon: Mail,
    title: "Email Support",
    desc: "Send us a detailed message and we'll respond within 24 hours.",
    availability: "Response within 24 hours",
    action: "Send Email",
    color: "border-emerald-200 bg-emerald-50",
    btnColor: "bg-emerald-600 hover:bg-emerald-700",
  },
  {
    icon: Phone,
    title: "Phone Support",
    desc: "Talk to our enterprise support team directly.",
    availability: "Enterprise plans only",
    action: "Schedule Call",
    color: "border-purple-200 bg-purple-50",
    btnColor: "bg-purple-600 hover:bg-purple-700",
  },
];

const TICKET_PRIORITIES = [
  { label: "Critical", desc: "System down / data loss", color: "text-red-600 bg-red-50 border-red-200", sla: "1 hour" },
  { label: "High", desc: "Core features not working", color: "text-orange-600 bg-orange-50 border-orange-200", sla: "4 hours" },
  { label: "Medium", desc: "Feature degraded / workaround available", color: "text-yellow-600 bg-yellow-50 border-yellow-200", sla: "24 hours" },
  { label: "Low", desc: "Question or minor issue", color: "text-blue-600 bg-blue-50 border-blue-200", sla: "3 business days" },
];

export default function SupportCenter() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-4">
          <Headset className="w-3.5 h-3.5" /> Support Center
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">We're Here to Help</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Get help from our team or browse answers to common questions.
        </p>
        {/* Search */}
        <div className="mt-8 max-w-lg mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search support articles..." className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm" />
        </div>
      </div>

      {/* Contact options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
        {SUPPORT_OPTIONS.map((opt) => (
          <div key={opt.title} className={`border rounded-2xl p-6 flex flex-col gap-4 ${opt.color}`}>
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center"><opt.icon className="w-6 h-6 text-gray-700" /></div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">{opt.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{opt.desc}</p>
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {opt.availability}</p>
            </div>
            <button className={`w-full text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mt-auto ${opt.btnColor}`}>
              {opt.action}
            </button>
          </div>
        ))}
      </div>

      {/* SLA table */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Support Response SLAs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TICKET_PRIORITIES.map((p) => (
            <div key={p.label} className={`border rounded-2xl p-5 ${p.color}`}>
              <div className="font-bold text-lg">{p.label}</div>
              <div className="text-xs mt-1 opacity-80">{p.desc}</div>
              <div className="mt-4 text-2xl font-extrabold">{p.sla}</div>
              <div className="text-xs opacity-70 mt-0.5">Response time</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="font-semibold text-gray-800 text-sm">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 shrink-0 ml-4 ${openFaq === i ? "rotate-180" : ""}`}
                />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submit ticket */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Submit a Support Ticket</h2>
          <p className="text-slate-300 text-sm">Can't find your answer? Fill out the form below and our team will get back to you.</p>
        </div>
        <div className="max-w-xl mx-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Your Name" className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 col-span-1" />
            <input type="email" placeholder="Email Address" className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 col-span-1" />
          </div>
          <select className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="" className="text-gray-800">Select Priority</option>
            <option value="low" className="text-gray-800">Low</option>
            <option value="medium" className="text-gray-800">Medium</option>
            <option value="high" className="text-gray-800">High</option>
            <option value="critical" className="text-gray-800">Critical</option>
          </select>
          <textarea rows={4} placeholder="Describe your issue in detail..." className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"></textarea>
          <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg">
            Submit Ticket
          </button>
        </div>
      </div>
    </main>
  );
}