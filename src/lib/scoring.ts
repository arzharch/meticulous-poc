import { AssessmentResult, Category, RiskFinding, Severity } from "./types";

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 22,
  high: 12,
  medium: 5,
  low: 2,
};

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function buildResult(findings: RiskFinding[]): AssessmentResult {
  const severityCounts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  const categoryCounts: Record<Category, number> = {
    auth: 0,
    environments: 0,
    "feature-flags": 0,
    "third-party": 0,
    "test-infra": 0,
    realtime: 0,
  };

  let deduction = 0;
  for (const f of findings) {
    severityCounts[f.severity] += 1;
    categoryCounts[f.category] += 1;
    deduction += SEVERITY_WEIGHT[f.severity];
  }

  const score = Math.max(0, Math.round(100 - deduction));

  const sorted = [...findings].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );

  return { findings: sorted, score, severityCounts, categoryCounts };
}

export function readinessLabel(score: number): string {
  if (score >= 85) return "Low Risk";
  if (score >= 60) return "Moderate Risk";
  if (score >= 35) return "High Risk";
  return "Critical Risk";
}

export function readinessTone(score: number): "good" | "warn" | "bad" | "critical" {
  if (score >= 85) return "good";
  if (score >= 60) return "warn";
  if (score >= 35) return "bad";
  return "critical";
}
