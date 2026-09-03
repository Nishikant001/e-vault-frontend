// src/Pages/Home/Resources/Documentation.jsx

import { Rocket, FolderOpen, ShieldCheck, Settings, Link2, BarChart3, BookOpen, Search } from "lucide-react";

export default function Documentation() {
  const sections = [
    {
      icon: Rocket,
      title: "Getting Started",
      color: "border-blue-200 bg-blue-50",
      iconBg: "bg-blue-100 text-blue-600",
      articles: [
        { title: "Introduction to DMS", time: "5 min read" },
        { title: "Setting up your account", time: "3 min read" },
        { title: "Uploading your first document", time: "4 min read" },
        { title: "Inviting team members", time: "2 min read" },
      ],
    },
    {
      icon: FolderOpen,
      title: "Document Management",
      color: "border-emerald-200 bg-emerald-50",
      iconBg: "bg-emerald-100 text-emerald-600",
      articles: [
        { title: "Folder structure & organization", time: "6 min read" },
        { title: "Version control explained", time: "5 min read" },
        { title: "Metadata & tagging", time: "4 min read" },
        { title: "Bulk upload & import", time: "3 min read" },
      ],
    },
    {
      icon: ShieldCheck,
      title: "Security & Access",
      color: "border-purple-200 bg-purple-50",
      iconBg: "bg-purple-100 text-purple-600",
      articles: [
        { title: "Role-based access control", time: "7 min read" },
        { title: "Two-factor authentication", time: "3 min read" },
        { title: "Audit logs overview", time: "5 min read" },
        { title: "Data encryption details", time: "4 min read" },
      ],
    },
    {
      icon: Settings,
      title: "Workflow & Approvals",
      color: "border-orange-200 bg-orange-50",
      iconBg: "bg-orange-100 text-orange-600",
      articles: [
        { title: "Creating approval workflows", time: "6 min read" },
        { title: "Setting up notifications", time: "3 min read" },
        { title: "Workflow automation rules", time: "7 min read" },
        { title: "Managing pending approvals", time: "4 min read" },
      ],
    },
    {
      icon: Link2,
      title: "Integrations",
      color: "border-cyan-200 bg-cyan-50",
      iconBg: "bg-cyan-100 text-cyan-600",
      articles: [
        { title: "REST API overview", time: "8 min read" },
        { title: "Webhook configuration", time: "5 min read" },
        { title: "Third-party app connections", time: "6 min read" },
        { title: "SSO / LDAP setup", time: "9 min read" },
      ],
    },
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      color: "border-rose-200 bg-rose-50",
      iconBg: "bg-rose-100 text-rose-600",
      articles: [
        { title: "Dashboard overview", time: "4 min read" },
        { title: "Custom report builder", time: "6 min read" },
        { title: "Exporting report data", time: "3 min read" },
        { title: "Scheduled reports", time: "5 min read" },
      ],
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-4">
          <BookOpen className="w-3.5 h-3.5" /> Documentation
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Everything you need to know
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Comprehensive guides, references, and tutorials to help you get the most out of DMS.
        </p>

        {/* Search bar */}
        <div className="mt-8 max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search documentation..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 text-sm"
          />
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3 justify-center mb-12">
        {["Getting Started", "API Reference", "Security", "Workflow", "Integrations", "FAQ"].map((tag) => (
          <button key={tag} className="px-4 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors bg-white">
            {tag}
          </button>
        ))}
      </div>

      {/* Sections grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((sec) => (
          <div key={sec.title} className={`rounded-2xl border ${sec.color} p-6 hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-3 mb-5">
              <span className={`w-10 h-10 flex items-center justify-center rounded-xl ${sec.iconBg}`}><sec.icon className="w-5 h-5" /></span>
              <h2 className="font-bold text-gray-800 text-lg">{sec.title}</h2>
            </div>
            <ul className="space-y-3">
              {sec.articles.map((a) => (
                <li key={a.title}>
                  <a href="#" className="flex items-center justify-between group">
                    <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">{a.title}</span>
                    <span className="text-xs text-gray-400 ml-2 shrink-0">{a.time}</span>
                  </a>
                </li>
              ))}
            </ul>
            <button className="mt-5 text-sm font-semibold text-blue-600 hover:underline">View all →</button>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 text-center text-white">
        <h3 className="text-2xl font-bold mb-2">Can't find what you're looking for?</h3>
        <p className="text-blue-100 mb-6">Our support team is ready to help you.</p>
        <button className="bg-white text-blue-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-colors">
          Contact Support
        </button>
      </div>
    </main>
  );
}