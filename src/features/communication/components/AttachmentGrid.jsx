// src/features/communication/components/AttachmentGrid.jsx
//
// Renders a message's attachments: inline previews for images, a
// professional file card (icon/name/type/size + open/download) for
// everything else. Images are fetched as authenticated blobs on demand
// (never a public URL) and cached for the component's lifetime.

import { useEffect, useRef, useState } from "react";
import { FileText, FileSpreadsheet, FileArchive, FileAudio, FileVideo, File, Download, Loader2, ImageOff } from "lucide-react";
import CommunicationApi from "../api/communicationApi";

const ICONS = {
  PDF: FileText,
  WORD: FileText,
  EXCEL: FileSpreadsheet,
  POWERPOINT: FileText,
  TEXT: FileText,
  ARCHIVE: FileArchive,
  AUDIO: FileAudio,
  VIDEO: FileVideo,
  OTHER: File,
};

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ImageAttachment({ attachment, mine }) {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [url, setUrl] = useState(null);
  const urlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    CommunicationApi.fetchAttachmentBlobUrl(attachment.id, { inline: true })
      .then((u) => {
        if (cancelled) return;
        urlRef.current = u;
        setUrl(u);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment.id]);

  if (status === "error") {
    return (
      <div className="flex h-32 w-48 items-center justify-center rounded-app-sm border border-dashed border-default bg-surface-muted text-ink-400">
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex h-32 w-48 items-center justify-center rounded-app-sm border border-subtle bg-surface-muted">
        <Loader2 className="h-4 w-4 animate-spin text-ink-400" />
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="block max-w-[280px] overflow-hidden rounded-app-sm border border-subtle">
      <img src={url} alt={attachment.originalName} className="max-h-64 w-full object-cover" />
    </a>
  );
}

function FileCard({ attachment, mine }) {
  const [downloading, setDownloading] = useState(false);
  const Icon = ICONS[attachment.fileCategory] || File;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = await CommunicationApi.fetchAttachmentBlobUrl(attachment.id);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className={`flex w-64 items-center gap-2.5 rounded-app-sm border px-3 py-2 text-left transition ${
        mine
          ? "border-white/20 bg-white/10 hover:bg-white/15"
          : "border-subtle bg-surface-muted hover:bg-surface-card-hover"
      }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-app-sm ${mine ? "bg-white/15" : "bg-brand-50"}`}>
        <Icon className={`h-4.5 w-4.5 ${mine ? "text-white" : "text-brand-600"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-xs font-medium ${mine ? "text-white" : "text-ink-900"}`}>{attachment.originalName}</p>
        <p className={`text-[11px] ${mine ? "text-white/70" : "text-ink-400"}`}>{formatSize(attachment.fileSize)}</p>
      </div>
      {downloading ? (
        <Loader2 className={`h-4 w-4 shrink-0 animate-spin ${mine ? "text-white/80" : "text-ink-400"}`} />
      ) : (
        <Download className={`h-4 w-4 shrink-0 ${mine ? "text-white/80" : "text-ink-400"}`} />
      )}
    </button>
  );
}

export default function AttachmentGrid({ attachments, mine }) {
  if (!attachments?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {attachments.map((a) =>
        a.fileCategory === "IMAGE" ? (
          <ImageAttachment key={a.id} attachment={a} mine={mine} />
        ) : (
          <FileCard key={a.id} attachment={a} mine={mine} />
        )
      )}
    </div>
  );
}
