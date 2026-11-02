// src/Pages/Home/Resources/CaseStudies.jsx
import {
  TrendingUp, Building2, FileText, Wallet, Globe,
  Landmark, Hospital, HardHat, GraduationCap, Truck, Scale,
} from "lucide-react";

const CASE_STUDIES = [
  {
    company: "Indus Finance Corp",
    industry: "Banking & Finance",
    emoji: Landmark,
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 border-blue-100",
    stat1: { value: "68%", label: "Faster Document Retrieval" },
    stat2: { value: "₹42L", label: "Annual Cost Saved" },
    summary:
      "Indus Finance replaced manual filing with DMS and reduced retrieval time from hours to minutes, achieving full RBI compliance with automated audit logs.",
    tags: ["Compliance", "Audit Logs", "Multi-branch"],
  },
  {
    company: "Veda Healthcare",
    industry: "Healthcare",
    emoji: Hospital,
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 border-emerald-100",
    stat1: { value: "99.9%", label: "Uptime Achieved" },
    stat2: { value: "3x", label: "Faster Patient Record Access" },
    summary:
      "Veda Healthcare centralized over 2 million patient records, enabling doctors to access files securely from any device while maintaining HIPAA-level data controls.",
    tags: ["Healthcare", "Role-Based Access", "Cloud"],
  },
  {
    company: "BuildRight Infrastructure",
    industry: "Construction",
    emoji: HardHat,
    color: "from-orange-500 to-rose-600",
    bg: "bg-orange-50 border-orange-100",
    stat1: { value: "12K+", label: "Docs Managed Per Month" },
    stat2: { value: "40%", label: "Less Approval Delays" },
    summary:
      "BuildRight streamlined cross-department contract approvals using DMS workflows, reducing signature delays that previously caused project cost overruns.",
    tags: ["Workflow", "Approvals", "Teams"],
  },
  {
    company: "EduFirst University",
    industry: "Education",
    emoji: GraduationCap,
    color: "from-purple-500 to-pink-600",
    bg: "bg-purple-50 border-purple-100",
    stat1: { value: "5,000+", label: "Faculty & Staff Users" },
    stat2: { value: "80%", label: "Paper Reduction" },
    summary:
      "EduFirst onboarded all 5,000 faculty onto DMS, eliminating paper-based admissions and moving academic records to a fully searchable digital archive.",
    tags: ["Education", "Digitization", "Search"],
  },
  {
    company: "LogixPro Logistics",
    industry: "Logistics",
    emoji: Truck,
    color: "from-cyan-500 to-sky-600",
    bg: "bg-cyan-50 border-cyan-100",
    stat1: { value: "8 min", label: "Avg. Document Approval Time" },
    stat2: { value: "98%", label: "Driver Compliance Rate" },
    summary:
      "LogixPro used DMS to digitize vehicle and driver compliance documents, enabling real-time status checks and automated renewal reminders.",
    tags: ["Logistics", "Compliance", "Mobile"],
  },
  {
    company: "LexCore Legal",
    industry: "Legal Services",
    emoji: Scale,
    color: "from-gray-500 to-slate-600",
    bg: "bg-gray-50 border-gray-200",
    stat1: { value: "100%", label: "Encrypted Document Storage" },
    stat2: { value: "2x", label: "Faster Case Preparation" },
    summary:
      "LexCore adopted DMS for client document management, with end-to-end encryption and granular access controls satisfying Bar Council confidentiality requirements.",
    tags: ["Legal", "Security", "Encryption"],
  },
];

export default function CaseStudies() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-4">
          <TrendingUp className="w-3.5 h-3.5" /> Case Studies
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Real Results from Real Teams</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          See how organizations across industries use DMS to save time, reduce costs, and stay compliant.
        </p>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
        {[
          { value: "500+", label: "Organizations", icon: Building2 },
          { value: "2M+", label: "Docs Managed", icon: FileText },
          { value: "₹10Cr+", label: "Cost Saved Collectively", icon: Wallet },
          { value: "15+", label: "Industries Served", icon: Globe },
        ].map((s) => (
          <div key={s.label} className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mx-auto mb-1"><s.icon className="w-5 h-5 text-blue-600" /></div>
            <div className="text-2xl font-bold text-blue-600">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Case study cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CASE_STUDIES.map((cs) => (
          <div key={cs.company} className={`border rounded-2xl overflow-hidden hover:shadow-lg transition-all group ${cs.bg}`}>
            {/* Card header */}
            <div className={`bg-gradient-to-r ${cs.color} p-6 text-white`}>
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-3"><cs.emoji className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold">{cs.company}</h3>
              <p className="text-white/70 text-sm mt-1">{cs.industry}</p>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 divide-x divide-white/50 border-b border-white/50">
              {[cs.stat1, cs.stat2].map((stat) => (
                <div key={stat.label} className="p-4 text-center">
                  <div className="text-xl font-extrabold text-gray-800">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
            {/* Body */}
            <div className="p-5">
              <p className="text-sm text-gray-600 leading-relaxed">{cs.summary}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {cs.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
              <button className="mt-4 text-sm font-semibold text-blue-600 hover:underline group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Read Full Story →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 text-center bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-10 text-white">
        <h2 className="text-2xl font-bold mb-3">Your organization could be next</h2>
        <p className="text-blue-100 mb-6 max-w-lg mx-auto">Start a free trial today and see results within the first week.</p>
        <button className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-all shadow-lg">
          Start Free Trial
        </button>
      </div>
    </main>
  );
}