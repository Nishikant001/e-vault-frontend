// src/features/aiAssistant/components/MarkdownMessage.jsx
//
// Deliberately dependency-free: the project doesn't already ship a
// markdown renderer, and pulling one in for a handful of tags (headers,
// bold, lists, tables, code, links) isn't worth a new dependency. This
// covers what summaryService / chatService actually produce.

import { memo } from "react";

function renderInline(text, keyPrefix) {
  // Order matters: code spans first (so ** inside `code` isn't touched),
  // then bold, then italic, then links.
  const nodes = [];
  const tokenRe = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;
  let i = 0;
  while ((match = tokenRe.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="px-1 py-0.5 rounded bg-slate-100 text-[0.85em] font-mono text-slate-800">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("[")) {
      const m = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      nodes.push(
        <a key={key} href={m[2]} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-700">
          {m[1]}
        </a>
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    lastIndex = tokenRe.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
}

function splitTableRow(line) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
}

export default memo(function MarkdownMessage({ content, className = "" }) {
  if (!content) return null;
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;
  let listBuffer = null; // { type: 'ul'|'ol', items: [] }

  const flushList = () => {
    if (listBuffer) {
      blocks.push(listBuffer);
      listBuffer = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line)) {
      flushList();
      const lang = line.replace(/^```/, "").trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push({ type: "code", lang, content: codeLines.join("\n") });
      continue;
    }

    // Table (header row + separator row)
    if (line.includes("|") && lines[i + 1] && isTableSeparator(lines[i + 1])) {
      flushList();
      const header = splitTableRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headerMatch) {
      flushList();
      blocks.push({ type: "header", level: headerMatch[1].length, text: headerMatch[2] });
      i++;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (olMatch) {
      if (!listBuffer || listBuffer.type !== "ol") {
        flushList();
        listBuffer = { type: "ol", items: [] };
      }
      listBuffer.items.push(olMatch[1]);
      i++;
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^\s*[-*•]\s+(.*)$/);
    if (ulMatch) {
      if (!listBuffer || listBuffer.type !== "ul") {
        flushList();
        listBuffer = { type: "ul", items: [] };
      }
      listBuffer.items.push(ulMatch[1]);
      i++;
      continue;
    }

    flushList();

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph — gather consecutive non-empty, non-special lines
    const paraLines = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^```/.test(lines[i]) &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^\s*[-*•]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", text: paraLines.join(" ") });
  }
  flushList();

  return (
    <div className={`text-[13.5px] leading-relaxed space-y-2 ${className}`}>
      {blocks.map((block, idx) => {
        const key = `b-${idx}`;
        if (block.type === "header") {
          const Tag = `h${Math.min(block.level + 2, 6)}`;
          return (
            <Tag key={key} className="font-semibold text-slate-900 mt-3 first:mt-0">
              {renderInline(block.text, key)}
            </Tag>
          );
        }
        if (block.type === "p") {
          return <p key={key}>{renderInline(block.text, key)}</p>;
        }
        if (block.type === "ul") {
          return (
            <ul key={key} className="list-disc pl-5 space-y-1">
              {block.items.map((it, j) => (
                <li key={`${key}-${j}`}>{renderInline(it, `${key}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={key} className="list-decimal pl-5 space-y-1">
              {block.items.map((it, j) => (
                <li key={`${key}-${j}`}>{renderInline(it, `${key}-${j}`)}</li>
              ))}
            </ol>
          );
        }
        if (block.type === "code") {
          return (
            <pre key={key} className="bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto text-[12.5px] font-mono">
              {block.lang && <div className="text-slate-400 text-[10px] mb-1 uppercase tracking-wide">{block.lang}</div>}
              <code>{block.content}</code>
            </pre>
          );
        }
        if (block.type === "table") {
          return (
            <div key={key} className="overflow-x-auto">
              <table className="min-w-full border border-slate-200 rounded-md overflow-hidden text-[12.5px]">
                <thead className="bg-slate-100">
                  <tr>
                    {block.header.map((h, j) => (
                      <th key={j} className="px-2.5 py-1.5 text-left font-semibold text-slate-700 border-b border-slate-200">
                        {renderInline(h, `${key}-h${j}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, r) => (
                    <tr key={r} className="odd:bg-white even:bg-slate-50">
                      {row.map((cell, c) => (
                        <td key={c} className="px-2.5 py-1.5 border-b border-slate-100 align-top">
                          {renderInline(cell, `${key}-r${r}c${c}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
});
