// src/Pages/Home/Resources/KnowledgeBase.jsx
import { useState } from "react";
import { Lightbulb, Search, FileText, Eye, ThumbsUp, ChevronRight } from "lucide-react";

const CATEGORIES = ["All", "Documents", "Security", "Workflow", "Users", "Billing", "Integrations"];

const ARTICLES = [
  { id: 1, cat: "Documents", title: "How to upload documents in bulk?", views: 1240, helpful: 94, badge: "Popular" },
  { id: 2, cat: "Security", title: "How do I reset my password?", views: 980, helpful: 97, badge: "Top Rated" },
  { id: 3, cat: "Workflow", title: "Setting up an approval chain for contracts", views: 754, helpful: 88, badge: null },
  { id: 4, cat: "Users", title: "Difference between roles: Manager vs DeptHead", views: 632, helpful: 91, badge: null },
  { id: 5, cat: "Documents", title: "How to restore a previous version of a document?", views: 587, helpful: 93, badge: "Popular" },
  { id: 6, cat: "Integrations", title: "Connecting DMS to Google Drive", views: 541, helpful: 85, badge: null },
  { id: 7, cat: "Billing", title: "How to upgrade or downgrade my plan?", views: 490, helpful: 89, badge: null },
  { id: 8, cat: "Security", title: "Enabling two-factor authentication (2FA)", views: 478, helpful: 96, badge: "Top Rated" },
  { id: 9, cat: "Documents", title: "What file formats does DMS support?", views: 410, helpful: 92, badge: null },
  { id: 10, cat: "Workflow", title: "Can I send reminders for pending approvals?", views: 388, helpful: 87, badge: null },
  { id: 11, cat: "Users", title: "How to deactivate a user without deleting them?", views: 344, helpful: 90, badge: null },
  { id: 12, cat: "Integrations", title: "Webhook setup step-by-step guide", views: 312, helpful: 83, badge: null },
];

const BADGE_COLORS = {
  Popular: "bg-blue-100 text-blue-600",
  "Top Rated": "bg-emerald-100 text-emerald-600",
};

export default function KnowledgeBase() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = ARTICLES.filter((a) => {
    const matchCat = activeCategory === "All" || a.cat === activeCategory;
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-4">
          <Lightbulb className="w-3.5 h-3.5" /> Knowledge Base
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">How can we help you?</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Browse answers to the most common questions from DMS users.
        </p>
        <div className="mt-7 max-w-lg mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search articles..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mb-10">
        {[{ label: "Articles", value: "120+" }, { label: "Avg. Helpfulness", value: "92%" }, { label: "Updated", value: "Weekly" }].map((s) => (
          <div key={s.label} className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              activeCategory === cat
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles list */}
      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-20">No articles found for "{search}"</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((a) => (
            <a
              key={a.id}
              href="#"
              className="flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-500">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 font-medium">{a.cat}</span>
                  {a.badge && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${BADGE_COLORS[a.badge]}`}>{a.badge}</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors leading-snug">{a.title}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {a.views.toLocaleString()} views</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {a.helpful}% helpful</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 shrink-0 mt-1 transition-colors" />
            </a>
          ))}
        </div>
      )}

      {/* Bottom */}
      <div className="mt-14 text-center bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-100">
        <p className="text-gray-600 font-semibold mb-2">Still have questions?</p>
        <p className="text-gray-400 text-sm mb-5">Our team responds within 24 hours on business days.</p>
        <button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-md">
          Submit a Request
        </button>
      </div>
    </main>
  );
}