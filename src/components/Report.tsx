"use client";

import { useState } from "react";
import { AssessmentResult, Answers, CATEGORY_LABELS, Category, RiskFinding, Severity } from "@/lib/types";
import { SEVERITY_LABEL, SEVERITY_ORDER, readinessLabel, readinessTone } from "@/lib/scoring";
import { resultToMarkdown } from "@/lib/markdown";
import { encodeAnswers } from "@/lib/share";
import { Button, Card, copyToClipboard } from "@/components/ui";

const SEVERITY_STYLES: Record<Severity, { dot: string; badge: string; ring: string }> = {
  critical: { dot: "bg-rose-600", badge: "bg-rose-50 text-rose-700 ring-rose-200", ring: "ring-rose-200" },
  high: { dot: "bg-orange-500", badge: "bg-orange-50 text-orange-700 ring-orange-200", ring: "ring-orange-200" },
  medium: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 ring-amber-200", ring: "ring-amber-200" },
  low: { dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600 ring-slate-200", ring: "ring-slate-200" },
};

const TONE_STYLES = {
  good: "text-emerald-600",
  warn: "text-amber-600",
  bad: "text-orange-600",
  critical: "text-rose-600",
};

export function Report({
  answers,
  result,
  onRestart,
  onEdit,
}: {
  answers: Answers;
  result: AssessmentResult;
  onRestart: () => void;
  onEdit: () => void;
}) {
  const [copied, setCopied] = useState<"link" | "markdown" | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const tone = readinessTone(result.score);

  const copyLink = async () => {
    const encoded = encodeAnswers(answers);
    const url = `${window.location.origin}${window.location.pathname}?d=${encoded}`;
    const ok = await copyToClipboard(url);
    setCopyFailed(!ok);
    setCopied("link");
    setTimeout(() => setCopied(null), 2000);
  };

  const copyMarkdown = async () => {
    const ok = await copyToClipboard(resultToMarkdown(answers.customerName, result));
    setCopyFailed(!ok);
    setCopied("markdown");
    setTimeout(() => setCopied(null), 2000);
  };

  const categories = Object.keys(CATEGORY_LABELS) as Category[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {answers.customerName.trim() || "Deployment Readiness Report"}
          </h1>
          <p className="text-sm text-slate-500">
            {result.findings.length} finding{result.findings.length === 1 ? "" : "s"} across{" "}
            {categories.filter((c) => result.categoryCounts[c] > 0).length} areas
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onEdit}>
            Edit answers
          </Button>
          <Button variant="secondary" onClick={copyLink}>
            {copied === "link" ? (copyFailed ? "Copy failed" : "Link copied") : "Copy shareable link"}
          </Button>
          <Button variant="secondary" onClick={copyMarkdown}>
            {copied === "markdown" ? (copyFailed ? "Copy failed" : "Copied") : "Copy as Markdown"}
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            Print / Save PDF
          </Button>
          <Button variant="ghost" onClick={onRestart}>
            New assessment
          </Button>
        </div>
      </div>

      <Card className="p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 flex-shrink-0">
              <ScoreRing score={result.score} tone={tone} />
              <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-slate-900">
                {result.score}
              </div>
            </div>
            <div>
              <div className={`text-sm font-semibold ${TONE_STYLES[tone]}`}>
                {readinessLabel(result.score)}
              </div>
              <div className="text-xs text-slate-500">Readiness score out of 100</div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SEVERITY_ORDER.map((sev) => (
              <div key={sev} className="rounded-lg border border-slate-100 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${SEVERITY_STYLES[sev].dot}`} />
                  <span className="text-xs text-slate-500">{SEVERITY_LABEL[sev]}</span>
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {result.severityCounts[sev]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {result.findings.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-600">
            No risk factors matched based on the answers given. That likely means either this is a
            genuinely low-risk deployment, or some inputs are worth double-checking.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => {
            const items = result.findings.filter((f) => f.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                  {CATEGORY_LABELS[cat]}
                </h2>
                <div className="space-y-3">
                  {items.map((f) => (
                    <FindingCard key={f.id} finding={f} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FindingCard({ finding }: { finding: RiskFinding }) {
  const s = SEVERITY_STYLES[finding.severity];
  return (
    <Card className={`p-5 ring-1 ${s.ring}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-medium text-slate-900">{finding.title}</h3>
        <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${s.badge}`}>
          {SEVERITY_LABEL[finding.severity]}
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-4">{finding.explanation}</p>

      {finding.validationSteps.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
            Validation steps
          </div>
          <ul className="space-y-1">
            {finding.validationSteps.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="text-slate-400">—</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {finding.fdeQuestions.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
            Ask the customer
          </div>
          <ul className="space-y-1">
            {finding.fdeQuestions.map((q, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="text-indigo-400">?</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function ScoreRing({ score, tone }: { score: number; tone: keyof typeof TONE_STYLES }) {
  const circumference = 2 * Math.PI * 34;
  const offset = circumference * (1 - score / 100);
  const stroke = {
    good: "#059669",
    warn: "#d97706",
    bad: "#ea580c",
    critical: "#e11d48",
  }[tone];

  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
      <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle
        cx="40"
        cy="40"
        r="34"
        fill="none"
        stroke={stroke}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}
