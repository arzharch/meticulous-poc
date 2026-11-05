"use client";

import { useEffect, useState } from "react";
import { Answers, RiskFinding } from "@/lib/types";
import { Card } from "@/components/ui";

interface CompoundRisk {
  title: string;
  involvedCategories: string[];
  explanation: string;
  severity: "critical" | "high" | "medium";
}

interface PrioritizedAction {
  action: string;
  reason: string;
  effort: "quick-win" | "half-day" | "multi-day";
  blocksGoLive: boolean;
}

interface Analysis {
  compoundRisks: CompoundRisk[];
  deploymentNarrative: string;
  prioritizedActions: PrioritizedAction[];
}

const COMPOUND_SEVERITY_STYLES: Record<string, { badge: string; ring: string }> = {
  critical: { badge: "bg-rose-50 text-rose-700 ring-rose-200", ring: "ring-rose-200" },
  high: { badge: "bg-orange-50 text-orange-700 ring-orange-200", ring: "ring-orange-200" },
  medium: { badge: "bg-amber-50 text-amber-700 ring-amber-200", ring: "ring-amber-200" },
};

const EFFORT_STYLES: Record<string, string> = {
  "quick-win": "bg-emerald-50 text-emerald-700",
  "half-day": "bg-amber-50 text-amber-700",
  "multi-day": "bg-rose-50 text-rose-700",
};

export function AIAnalysis({
  answers,
  findings,
}: {
  answers: Answers;
  findings: RiskFinding[];
}) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalysis() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, findings }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed (${res.status})`);
        }

        const data = await res.json();
        if (!cancelled) setAnalysis(data.analysis);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Analysis failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalysis();
    return () => { cancelled = true; };
  }, [answers, findings]);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center gap-3">
          <LoadingDots />
          <div>
            <div className="text-sm font-medium text-slate-900">
              Running AI analysis
            </div>
            <div className="text-xs text-slate-500">
              Identifying compound risks and generating deployment brief...
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">
          AI analysis unavailable: {error}
        </p>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-8">
      {analysis.compoundRisks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Compound Risks
            </h2>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
              AI-identified
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Emergent risks from the interaction of multiple factors — invisible to single-category rules.
          </p>
          <div className="space-y-3">
            {analysis.compoundRisks.map((risk, i) => {
              const styles = COMPOUND_SEVERITY_STYLES[risk.severity] ?? COMPOUND_SEVERITY_STYLES.medium;
              return (
                <Card key={i} className={`p-5 ring-1 ${styles.ring}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-medium text-slate-900">{risk.title}</h3>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${styles.badge}`}>
                      {risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{risk.explanation}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {risk.involvedCategories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Deployment Brief
          </h2>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
            AI-generated
          </span>
        </div>
        <Card className="p-6">
          <div className="prose prose-sm prose-slate max-w-none">
            {analysis.deploymentNarrative.split("\n\n").map((para, i) => (
              <p key={i} className="text-sm text-slate-700 leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        </Card>
      </div>

      {analysis.prioritizedActions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Prioritized Action Plan
            </h2>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
              AI-prioritized
            </span>
          </div>
          <div className="space-y-2">
            {analysis.prioritizedActions.map((action, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm text-slate-900">
                        {action.action}
                      </span>
                      {action.blocksGoLive && (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
                          Blocks go-live
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${EFFORT_STYLES[action.effort] ?? ""}`}>
                        {action.effort}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{action.reason}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex gap-1">
      <span className="h-2 w-2 rounded-full bg-indigo-400 animate-[pulse_1.4s_ease-in-out_infinite]" />
      <span className="h-2 w-2 rounded-full bg-indigo-400 animate-[pulse_1.4s_ease-in-out_0.2s_infinite]" />
      <span className="h-2 w-2 rounded-full bg-indigo-400 animate-[pulse_1.4s_ease-in-out_0.4s_infinite]" />
    </div>
  );
}
