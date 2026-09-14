// src/features/aiAssistant/components/DiffView.jsx
//
// Simple LCS-based word diff — no new dependency. Used to visually
// highlight added/removed/modified spans between two text blocks (e.g.
// two AI-generated comparison summaries, or raw extracted text if the
// backend later exposes it). Good enough for a first pass; swap for a
// dedicated diff library later if line-level diffing is needed.

function diffWords(a, b) {
  const aWords = a.split(/(\s+)/);
  const bWords = b.split(/(\s+)/);
  const m = aWords.length;
  const n = bWords.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = aWords[i] === bWords[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (aWords[i] === bWords[j]) {
      ops.push({ type: "same", text: aWords[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "removed", text: aWords[i] });
      i++;
    } else {
      ops.push({ type: "added", text: bWords[j] });
      j++;
    }
  }
  while (i < m) { ops.push({ type: "removed", text: aWords[i] }); i++; }
  while (j < n) { ops.push({ type: "added", text: bWords[j] }); j++; }
  return ops;
}

export default function DiffView({ textA, textB, labelA = "Document A", labelB = "Document B" }) {
  const ops = diffWords(textA || "", textB || "");
  const added = ops.filter((o) => o.type === "added").length;
  const removed = ops.filter((o) => o.type === "removed").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-[11.5px]">
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-success-100 border border-success-300" /> Added ({added})</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-danger-100 border border-danger-300" /> Removed ({removed})</span>
        <span className="text-slate-400">{labelA} → {labelB}</span>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-[13px] leading-relaxed whitespace-pre-wrap">
        {ops.map((op, idx) => {
          if (op.type === "same") return <span key={idx}>{op.text}</span>;
          if (op.type === "added")
            return (
              <span key={idx} className="bg-success-50 text-success-700 rounded px-0.5">
                {op.text}
              </span>
            );
          return (
            <span key={idx} className="bg-danger-50 text-danger-700 rounded px-0.5 line-through">
              {op.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
