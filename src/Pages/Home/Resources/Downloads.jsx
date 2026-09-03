// src/Pages/Home/Resources/Downloads.jsx
import {
  Download, Monitor, Smartphone, Plug, Terminal, Info,
  Laptop, Globe, FileText, Mail, Package, Code2, Wrench, HardDrive,
} from "lucide-react";

const DOWNLOADS = [
  {
    category: "Desktop Apps",
    icon: Monitor,
    items: [
      { name: "DMS Desktop — Windows", version: "v3.2.1", size: "84 MB", os: "Windows 10/11", ext: ".exe" },
      { name: "DMS Desktop — macOS", version: "v3.2.1", size: "91 MB", os: "macOS 12+", ext: ".dmg" },
      { name: "DMS Desktop — Linux", version: "v3.2.0", size: "78 MB", os: "Ubuntu 20.04+", ext: ".AppImage" },
    ],
  },
  {
    category: "Mobile Apps",
    icon: Smartphone,
    items: [
      { name: "DMS for Android", version: "v2.8.4", size: "32 MB", os: "Android 9+", ext: "Play Store" },
      { name: "DMS for iOS", version: "v2.8.4", size: "41 MB", os: "iOS 15+", ext: "App Store" },
    ],
  },
  {
    category: "Plugins & Extensions",
    icon: Plug,
    items: [
      { name: "Chrome Extension", version: "v1.4.0", size: "2.1 MB", os: "Chrome 110+", ext: ".crx" },
      { name: "MS Office Add-in", version: "v1.2.0", size: "15 MB", os: "Office 365", ext: ".msi" },
      { name: "Outlook Add-in", version: "v1.1.2", size: "8 MB", os: "Outlook 2019+", ext: ".msi" },
    ],
  },
  {
    category: "SDK & CLI Tools",
    icon: Terminal,
    items: [
      { name: "DMS JavaScript SDK", version: "v4.0.2", size: "1.2 MB", os: "Node.js 16+", ext: "npm" },
      { name: "DMS Python SDK", version: "v3.1.0", size: "0.8 MB", os: "Python 3.8+", ext: "pip" },
      { name: "DMS CLI Tool", version: "v2.3.0", size: "22 MB", os: "Cross-platform", ext: ".zip" },
    ],
  },
];

const OS_ICON = {
  Windows: Monitor,
  macOS: Laptop,
  Linux: Terminal,
  Android: Smartphone,
  iOS: Smartphone,
  Chrome: Globe,
  Office: FileText,
  Outlook: Mail,
  Node: Package,
  Python: Code2,
  Cross: Wrench,
};

function getOsIcon(os) {
  for (const key of Object.keys(OS_ICON)) {
    if (os.includes(key)) return OS_ICON[key];
  }
  return HardDrive;
}

export default function Downloads() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-4">
          <Download className="w-3.5 h-3.5" /> Downloads
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Download DMS</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Get the latest versions of our desktop apps, mobile apps, plugins, and developer tools.
        </p>
      </div>

      {/* System requirements banner */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-5 mb-12 flex flex-col sm:flex-row items-center gap-4">
        <span className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0"><Info className="w-5 h-5" /></span>
        <div>
          <p className="font-semibold text-gray-800">Before you download</p>
          <p className="text-sm text-gray-500">Make sure your system meets the minimum requirements. All downloads include a 30-day free trial for new accounts.</p>
        </div>
        <button className="ml-auto shrink-0 text-sm font-semibold text-blue-600 hover:underline whitespace-nowrap">System Requirements →</button>
      </div>

      {/* Download sections */}
      <div className="space-y-12">
        {DOWNLOADS.map((section) => (
          <div key={section.category}>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><section.icon className="w-5 h-5" /></span>
              <h2 className="text-xl font-bold text-gray-800">{section.category}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((item) => (
                <div key={item.name} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-blue-200 transition-all flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm leading-snug">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.version}</p>
                    </div>
                    <span className="w-9 h-9 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center flex-shrink-0">
                      {(() => { const OsIcon = getOsIcon(item.os); return <OsIcon className="w-4.5 h-4.5" />; })()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{item.os}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{item.size}</span>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">{item.ext}</span>
                  </div>
                  <button className="mt-1 w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white text-sm font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Checksums */}
      <div className="mt-14 bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
        <p className="text-gray-600 font-semibold mb-1">Verify your download</p>
        <p className="text-sm text-gray-400 mb-4">All files include SHA-256 checksums for integrity verification.</p>
        <button className="text-sm font-semibold text-blue-600 hover:underline">View Checksums File →</button>
      </div>
    </main>
  );
}