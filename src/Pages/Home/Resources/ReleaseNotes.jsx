// src/Pages/Home/Resources/ReleaseNotes.jsx
import { ClipboardList, Bell } from "lucide-react";

const RELEASES = [
  {
    version: "v3.2.1",
    date: "June 10, 2026",
    type: "Patch",
    typeColor: "bg-gray-100 text-gray-600",
    changes: [
      { kind: "fix", text: "Fixed occasional PDF preview blank page issue on Safari." },
      { kind: "fix", text: "Resolved notification email delay for approval reminders." },
      { kind: "fix", text: "Corrected folder permission inheritance for nested sub-folders." },
    ],
  },
  {
    version: "v3.2.0",
    date: "May 22, 2026",
    type: "Minor",
    typeColor: "bg-blue-100 text-blue-600",
    changes: [
      { kind: "new", text: "Introduced AI-powered document tagging — automatically suggests metadata tags on upload." },
      { kind: "new", text: "Added bulk document move & copy across folders." },
      { kind: "new", text: "New Resources section: API Documentation, Security, and Release Notes pages." },
      { kind: "improvement", text: "Improved mobile responsive layout for document viewer." },
      { kind: "improvement", text: "Faster full-text search — results now appear 40% faster on large tenants." },
      { kind: "fix", text: "Fixed duplicate audit log entries for concurrent edits." },
    ],
  },
  {
    version: "v3.1.0",
    date: "April 8, 2026",
    type: "Minor",
    typeColor: "bg-blue-100 text-blue-600",
    changes: [
      { kind: "new", text: "Webhook support — receive real-time HTTP events for document actions." },
      { kind: "new", text: "DocuSign e-signature integration is now available for all Pro and Enterprise plans." },
      { kind: "new", text: "Custom fields on documents — add project codes, client IDs, or any metadata." },
      { kind: "improvement", text: "Revamped notification center with grouped alerts." },
      { kind: "fix", text: "Resolved issue where deleted users' documents became inaccessible to admins." },
    ],
  },
  {
    version: "v3.0.0",
    date: "February 14, 2026",
    type: "Major",
    typeColor: "bg-purple-100 text-purple-600",
    changes: [
      { kind: "new", text: "Complete UI redesign with improved accessibility and dark mode support." },
      { kind: "new", text: "Multi-tenant architecture — manage multiple organizations from a single SuperAdmin account." },
      { kind: "new", text: "Advanced workflow engine with conditional approval steps and SLA timers." },
      { kind: "new", text: "REST API v1.0 — full programmatic access to all DMS features." },
      { kind: "improvement", text: "Storage limit increased: Free plan now includes 5 GB (up from 1 GB)." },
      { kind: "breaking", text: "Legacy API v0 endpoints have been removed. Please migrate to v1." },
    ],
  },
  {
    version: "v2.9.3",
    date: "January 5, 2026",
    type: "Patch",
    typeColor: "bg-gray-100 text-gray-600",
    changes: [
      { kind: "fix", text: "Fixed XSS vulnerability in document comment field (CVE-2026-0012). Please update immediately." },
      { kind: "fix", text: "Resolved LDAP authentication timeout for large organizations." },
    ],
  },
];

const KIND_STYLES = {
  new: { label: "New", color: "bg-emerald-100 text-emerald-700" },
  improvement: { label: "Improved", color: "bg-blue-100 text-blue-700" },
  fix: { label: "Fix", color: "bg-orange-100 text-orange-600" },
  breaking: { label: "Breaking", color: "bg-red-100 text-red-600" },
};

export default function ReleaseNotes() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-4">
          <ClipboardList className="w-3.5 h-3.5" /> Release Notes
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">What's New in DMS</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Stay up to date with every improvement, new feature, and bug fix across all DMS versions.
        </p>
      </div>

      {/* Subscribe banner */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 mb-12">
        <span className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0"><Bell className="w-5 h-5 text-blue-600" /></span>
        <div className="flex-1">
          <p className="font-semibold text-gray-800">Get notified on new releases</p>
          <p className="text-sm text-gray-500">Subscribe and we'll email you when a new version drops.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="email"
            placeholder="you@company.com"
            className="flex-1 sm:w-52 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold px-4 py-2 rounded-xl whitespace-nowrap">
            Subscribe
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-gray-100 hidden sm:block"></div>

        <div className="space-y-10">
          {RELEASES.map((release) => (
            <div key={release.version} className="relative sm:pl-14">
              {/* Dot */}
              <div className="hidden sm:flex absolute left-2.5 top-2 w-5 h-5 rounded-full bg-white border-2 border-blue-400 items-center justify-center shadow-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <span className="font-extrabold text-gray-900 text-lg font-mono">{release.version}</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${release.typeColor}`}>{release.type}</span>
                  <span className="text-xs text-gray-400 ml-auto">{release.date}</span>
                </div>
                {/* Changes */}
                <ul className="divide-y divide-gray-50">
                  {release.changes.map((change, i) => (
                    <li key={i} className="px-6 py-3 flex items-start gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 shrink-0 ${KIND_STYLES[change.kind].color}`}>
                        {KIND_STYLES[change.kind].label}
                      </span>
                      <span className="text-sm text-gray-600 leading-relaxed">{change.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Older releases */}
      <div className="mt-10 text-center">
        <button className="border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 font-semibold px-8 py-3 rounded-xl transition-all bg-white hover:bg-blue-50">
          View Older Releases
        </button>
      </div>
    </main>
  );
}