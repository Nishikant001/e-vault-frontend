// src/Pages/Home/Resources/ApiDocumentation.jsx
import { useState } from "react";
import { Plug, CheckCircle2, ShieldCheck, Globe, KeyRound, Braces, Package, Download, Webhook } from "lucide-react";

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/documents", desc: "List all documents with filters and pagination." },
  { method: "POST", path: "/api/v1/documents", desc: "Upload a new document to a specified folder." },
  { method: "GET", path: "/api/v1/documents/:id", desc: "Retrieve metadata and download URL for a document." },
  { method: "PUT", path: "/api/v1/documents/:id", desc: "Update document metadata or replace the file." },
  { method: "DELETE", path: "/api/v1/documents/:id", desc: "Soft-delete a document (recoverable within 30 days)." },
  { method: "GET", path: "/api/v1/folders", desc: "Get the full folder tree for the authenticated tenant." },
  { method: "POST", path: "/api/v1/folders", desc: "Create a new folder in the hierarchy." },
  { method: "GET", path: "/api/v1/users", desc: "List all users in the tenant with their roles." },
  { method: "POST", path: "/api/v1/approvals", desc: "Submit a document for approval workflow." },
  { method: "GET", path: "/api/v1/audit-logs", desc: "Retrieve audit log entries with date filters." },
];

const METHOD_COLORS = {
  GET: "bg-emerald-100 text-emerald-700",
  POST: "bg-blue-100 text-blue-700",
  PUT: "bg-orange-100 text-orange-700",
  DELETE: "bg-red-100 text-red-600",
  PATCH: "bg-purple-100 text-purple-700",
};

const SAMPLE_CODE = {
  javascript: `const response = await fetch('https://api.yourdms.com/api/v1/documents', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
});
const data = await response.json();
console.log(data.documents);`,
  python: `import requests

headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}

response = requests.get(
    "https://api.yourdms.com/api/v1/documents",
    headers=headers
)
print(response.json())`,
  curl: `curl -X GET "https://api.yourdms.com/api/v1/documents" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
};

export default function ApiDocumentation() {
  const [activeTab, setActiveTab] = useState("javascript");

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-4">
          <Plug className="w-3.5 h-3.5" /> API Documentation
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">DMS REST API</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Integrate DMS into your own applications with our fully-documented REST API.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /> REST API v1.0</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full"><ShieldCheck className="w-3.5 h-3.5" /> Bearer Token Auth</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold rounded-full"><Globe className="w-3.5 h-3.5" /> JSON Responses</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Info cards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><KeyRound className="w-4 h-4 text-gray-500" /> Authentication</h3>
            <p className="text-sm text-gray-500 mb-3">All API requests require a Bearer token in the Authorization header.</p>
            <div className="bg-gray-900 rounded-xl p-3 text-xs text-emerald-400 font-mono">
              Authorization: Bearer YOUR_API_KEY
            </div>
            <button className="mt-3 text-sm text-blue-600 hover:underline font-semibold">Generate API Key →</button>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-gray-500" /> Base URL</h3>
            <div className="bg-gray-900 rounded-xl p-3 text-xs text-cyan-400 font-mono">
              https://api.yourdms.com/api/v1
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Braces className="w-4 h-4 text-gray-500" /> Rate Limits</h3>
            <ul className="text-sm text-gray-500 space-y-2">
              <li className="flex justify-between"><span>Free Plan</span><span className="font-medium">100 req/hour</span></li>
              <li className="flex justify-between"><span>Pro Plan</span><span className="font-medium">1,000 req/hour</span></li>
              <li className="flex justify-between"><span>Enterprise</span><span className="font-medium">Unlimited</span></li>
            </ul>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-gray-500" /> SDKs</h3>
            <div className="space-y-2">
              {["JavaScript / Node.js", "Python", "PHP", "Ruby"].map((sdk) => (
                <button key={sdk} className="w-full text-left text-sm text-gray-600 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  {sdk}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Endpoints + Code example */}
        <div className="lg:col-span-2 space-y-6">
          {/* Code example */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
              <span className="text-sm text-gray-400 font-semibold">Quick Example</span>
              <div className="flex gap-1">
                {Object.keys(SAMPLE_CODE).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      activeTab === tab ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <pre className="p-5 text-xs text-emerald-300 font-mono overflow-x-auto leading-relaxed">
              {SAMPLE_CODE[activeTab]}
            </pre>
          </div>

          {/* Endpoints */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">API Endpoints</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {ENDPOINTS.map((ep) => (
                <div key={ep.path} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg w-16 text-center shrink-0 ${METHOD_COLORS[ep.method]}`}>
                    {ep.method}
                  </span>
                  <code className="text-sm text-gray-700 font-mono shrink-0 hidden sm:block">{ep.path}</code>
                  <span className="text-xs text-gray-400 flex-1 hidden md:block">{ep.desc}</span>
                  <button className="text-xs text-blue-600 hover:underline shrink-0">Try →</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Webhook section */}
      <div className="mt-10 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-5">
        <span className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0"><Webhook className="w-7 h-7 text-indigo-600" /></span>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 text-lg mb-1">Webhooks</h3>
          <p className="text-gray-500 text-sm">Get real-time HTTP notifications when documents are uploaded, approved, or deleted. Configure webhook endpoints in Settings.</p>
        </div>
        <button className="shrink-0 border border-indigo-300 text-indigo-600 font-semibold px-5 py-2 rounded-xl hover:bg-indigo-50 transition-all text-sm">
          Webhook Guide →
        </button>
      </div>
    </main>
  );
}