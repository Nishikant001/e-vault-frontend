// src/Pages/Home/Resources/Integrations.jsx
import { Link2, Puzzle, Zap, Wrench } from "lucide-react";

const INTEGRATIONS = [
  { name: "Google Drive", category: "Cloud Storage", initials: "GD", color: "from-amber-400 to-yellow-500", desc: "Sync documents between DMS and Google Drive automatically.", status: "Available" },
  { name: "Microsoft OneDrive", category: "Cloud Storage", initials: "OD", color: "from-blue-500 to-sky-600", desc: "Two-way sync with OneDrive for seamless file access.", status: "Available" },
  { name: "Dropbox", category: "Cloud Storage", initials: "DB", color: "from-blue-600 to-indigo-600", desc: "Import and export files directly from your Dropbox.", status: "Available" },
  { name: "Slack", category: "Communication", initials: "SL", color: "from-fuchsia-500 to-purple-600", desc: "Get DMS notifications and share document links in Slack.", status: "Available" },
  { name: "Microsoft Teams", category: "Communication", initials: "MT", color: "from-violet-500 to-purple-700", desc: "Collaborate on documents without leaving Teams.", status: "Available" },
  { name: "Zoom", category: "Communication", initials: "ZM", color: "from-sky-500 to-blue-600", desc: "Share DMS documents during Zoom meetings instantly.", status: "Coming Soon" },
  { name: "Salesforce", category: "CRM", initials: "SF", color: "from-cyan-500 to-sky-500", desc: "Attach and manage documents directly within Salesforce records.", status: "Available" },
  { name: "HubSpot", category: "CRM", initials: "HS", color: "from-orange-500 to-amber-500", desc: "Link client documents to HubSpot deals and contacts.", status: "Available" },
  { name: "Zoho CRM", category: "CRM", initials: "ZC", color: "from-red-500 to-rose-600", desc: "Manage customer documents alongside Zoho CRM workflows.", status: "Coming Soon" },
  { name: "Zapier", category: "Automation", initials: "ZP", color: "from-orange-500 to-red-500", desc: "Connect DMS to 5000+ apps with no-code Zapier workflows.", status: "Available" },
  { name: "Make (Integromat)", category: "Automation", initials: "MK", color: "from-emerald-500 to-green-600", desc: "Build advanced document automation scenarios with Make.", status: "Available" },
  { name: "Microsoft Power Automate", category: "Automation", initials: "PA", color: "from-blue-500 to-indigo-500", desc: "Automate document approvals using Power Automate flows.", status: "Available" },
  { name: "DocuSign", category: "e-Signature", initials: "DS", color: "from-yellow-500 to-amber-600", desc: "Send documents for e-signature directly from DMS.", status: "Available" },
  { name: "Adobe Sign", category: "e-Signature", initials: "AS", color: "from-red-500 to-rose-500", desc: "Request digital signatures via Adobe Sign integration.", status: "Available" },
  { name: "QuickBooks", category: "Finance", initials: "QB", color: "from-emerald-500 to-teal-600", desc: "Attach invoices and receipts to QuickBooks transactions.", status: "Coming Soon" },
  { name: "SAP", category: "ERP", initials: "SAP", color: "from-blue-700 to-slate-700", desc: "Enterprise document management integrated with SAP ERP.", status: "Available" },
];

const CATEGORIES = ["All", "Cloud Storage", "Communication", "CRM", "Automation", "e-Signature", "Finance", "ERP"];

import { useState } from "react";

export default function Integrations() {
  const [active, setActive] = useState("All");

  const filtered = INTEGRATIONS.filter((i) => active === "All" || i.category === active);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-4">
          <Link2 className="w-3.5 h-3.5" /> Integrations
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Connect DMS with Your Favorite Tools</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          DMS integrates with the apps you already use — cloud storage, CRMs, communication tools, and more.
        </p>
      </div>

      {/* Count */}
      <div className="flex flex-wrap justify-center gap-6 mb-10">
        {[
          { value: "50+", label: "Integrations", icon: Puzzle },
          { value: "5000+", label: "Apps via Zapier", icon: Zap },
          { value: "REST API", label: "Custom Integration", icon: Wrench },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-6 py-3">
            <span className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><s.icon className="w-5 h-5 text-blue-600" /></span>
            <div>
              <div className="font-bold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              active === cat
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((item) => (
          <div key={item.name} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-blue-200 transition-all flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>{item.initials}</span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                item.status === "Available" ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-500"
              }`}>
                {item.status}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">{item.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            <button
              disabled={item.status !== "Available"}
              className={`mt-auto text-sm font-semibold py-2 rounded-xl transition-all ${
                item.status === "Available"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {item.status === "Available" ? "Connect →" : "Notify Me"}
            </button>
          </div>
        ))}
      </div>

      {/* Custom integration */}
      <div className="mt-14 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0"><Wrench className="w-8 h-8" /></div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1">Need a Custom Integration?</h3>
          <p className="text-slate-300 text-sm">Use our REST API and webhooks to connect DMS with any system. Full documentation and sandbox access included.</p>
        </div>
        <button className="shrink-0 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold px-6 py-2.5 rounded-xl hover:from-blue-600 hover:to-cyan-500 transition-all">
          View API Docs →
        </button>
      </div>
    </main>
  );
}