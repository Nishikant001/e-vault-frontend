// src/Pages/Home/Resources/VideoTutorials.jsx
import { useState } from "react";
import {
  Clapperboard, Play, Star, Clock, Eye, Rocket, FolderOpen, Settings,
  ShieldCheck, Plug, Search, Shield, FolderTree, Webhook, KeyRound,
  Crown, ClipboardList,
} from "lucide-react";

const CATEGORIES = ["All", "Beginner", "Advanced", "Admin", "API", "Security"];

const VIDEOS = [
  { id: 1, title: "Getting Started with DMS", duration: "8:24", category: "Beginner", views: "12.4K", thumbnail: Rocket, level: "Beginner", new: true },
  { id: 2, title: "Uploading & Organizing Documents", duration: "11:05", category: "Beginner", views: "9.8K", thumbnail: FolderOpen, level: "Beginner", new: false },
  { id: 3, title: "Setting Up Approval Workflows", duration: "15:30", category: "Advanced", views: "7.2K", thumbnail: Settings, level: "Advanced", new: false },
  { id: 4, title: "Role-Based Access Control Deep Dive", duration: "18:45", category: "Admin", views: "5.6K", thumbnail: ShieldCheck, level: "Admin", new: false },
  { id: 5, title: "Using the REST API — Basics", duration: "22:10", category: "API", views: "4.3K", thumbnail: Plug, level: "Advanced", new: false },
  { id: 6, title: "Advanced Search & Filters", duration: "9:55", category: "Advanced", views: "6.7K", thumbnail: Search, level: "Advanced", new: true },
  { id: 7, title: "Configuring SSO & LDAP", duration: "24:30", category: "Security", views: "3.1K", thumbnail: Shield, level: "Admin", new: false },
  { id: 8, title: "Version Control Explained", duration: "13:15", category: "Beginner", views: "8.9K", thumbnail: FolderTree, level: "Beginner", new: false },
  { id: 9, title: "Webhook Integration Tutorial", duration: "20:00", category: "API", views: "2.8K", thumbnail: Webhook, level: "Advanced", new: true },
  { id: 10, title: "Two-Factor Authentication Setup", duration: "6:40", category: "Security", views: "5.2K", thumbnail: KeyRound, level: "Beginner", new: false },
  { id: 11, title: "Managing Tenants as SuperAdmin", duration: "17:20", category: "Admin", views: "2.4K", thumbnail: Crown, level: "Admin", new: false },
  { id: 12, title: "Audit Logs & Compliance", duration: "14:50", category: "Security", views: "3.9K", thumbnail: ClipboardList, level: "Advanced", new: false },
];

const LEVEL_COLORS = {
  Beginner: "bg-emerald-100 text-emerald-600",
  Advanced: "bg-purple-100 text-purple-600",
  Admin: "bg-orange-100 text-orange-600",
};

export default function VideoTutorials() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = VIDEOS.filter((v) => activeCategory === "All" || v.category === activeCategory);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-4">
          <Clapperboard className="w-3.5 h-3.5" /> Video Tutorials
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Learn by Watching</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Step-by-step video tutorials covering everything from basics to advanced features.
        </p>
      </div>

      {/* Featured video */}
      <div className="mb-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden flex flex-col lg:flex-row items-center gap-0 shadow-2xl">
        <div className="w-full lg:w-1/2 flex items-center justify-center min-h-[220px] relative bg-gradient-to-br from-blue-600/30 to-cyan-500/20 p-10">
          {(() => { const FeaturedIcon = VIDEOS[0].thumbnail; return <FeaturedIcon className="w-24 h-24 text-white/80" strokeWidth={1.2} />; })()}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 cursor-pointer hover:bg-white/30 transition-all">
              <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
            </div>
          </div>
        </div>
        <div className="p-8 text-white flex-1">
          <span className="inline-flex items-center gap-1.5 bg-blue-500/30 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full border border-blue-400/30"><Star className="w-3 h-3 fill-current" /> Featured</span>
          <h2 className="text-2xl font-bold mt-3 mb-2">{VIDEOS[0].title}</h2>
          <p className="text-slate-300 text-sm mb-4">The perfect starting point — learn the essentials of DMS in under 10 minutes.</p>
          <div className="flex gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {VIDEOS[0].duration}</span>
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {VIDEOS[0].views} views</span>
          </div>
          <button className="mt-6 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold px-5 py-2.5 rounded-xl hover:from-blue-600 hover:to-cyan-500 transition-all flex items-center gap-2">
            <Play className="w-4 h-4" fill="currentColor" />
            Watch Now
          </button>
        </div>
      </div>

      {/* Category filter */}
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

      {/* Video grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((v) => (
          <div key={v.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-blue-200 transition-all group cursor-pointer">
            {/* Thumbnail */}
            <div className="h-36 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
              <v.thumbnail className="w-14 h-14 text-white/70" strokeWidth={1.2} />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                  <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                </div>
              </div>
              {v.new && (
                <span className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>
              )}
              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-md">{v.duration}</span>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[v.level]}`}>{v.level}</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors leading-snug">{v.title}</p>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {v.views} views</p>
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      <div className="mt-10 text-center">
        <button className="border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 font-semibold px-8 py-3 rounded-xl transition-all bg-white hover:bg-blue-50">
          Load More Videos
        </button>
      </div>
    </main>
  );
}