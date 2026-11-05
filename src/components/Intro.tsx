"use client";

import { Button, Card } from "@/components/ui";

const AREAS = [
  { title: "Auth & Identity", desc: "SSO/IdP quirks, session strategy, multi-tenant isolation." },
  { title: "Environments", desc: "Preview/prod parity, infra type, region topology, secrets." },
  { title: "Feature Flags", desc: "Rollout strategy and whether flag infra is actually used." },
  { title: "Third-Party Services", desc: "Critical dependencies, webhooks, payment, outage plans." },
  { title: "Test Infrastructure", desc: "E2E coverage, staging fidelity, load testing." },
  { title: "Realtime Behaviour", desc: "WebSockets/SSE reconnects, idempotency, load shape." },
];

export function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-3">
          Deployment Readiness Assessor
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 mb-4 leading-tight">
          Walk through a customer&apos;s setup. Get the risks, the validation steps, and the
          questions to ask first.
        </h1>
        <p className="text-slate-600 leading-relaxed">
          A deployment rarely fails because of the feature itself — it fails because of the
          surrounding setup: an untested SSO claim mapping, a staging environment that doesn&apos;t
          match production, a webhook with no rate limit. This tool takes a structured pass through
          six areas, runs deterministic checks, then uses AI to identify compound risks that
          emerge from the interaction of multiple factors — the kind of pattern recognition that
          only comes from experience across many customer environments.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <Card className="p-4 border-indigo-100 bg-indigo-50/30">
          <div className="font-medium text-indigo-900 text-sm mb-1">1. Structured intake</div>
          <div className="text-xs text-slate-600">Walk through six deployment areas in ~3 minutes.</div>
        </Card>
        <Card className="p-4 border-indigo-100 bg-indigo-50/30">
          <div className="font-medium text-indigo-900 text-sm mb-1">2. Rule engine</div>
          <div className="text-xs text-slate-600">25+ deterministic checks surface individual risks with validation steps.</div>
        </Card>
        <Card className="p-4 border-indigo-100 bg-indigo-50/30">
          <div className="font-medium text-indigo-900 text-sm mb-1">3. AI synthesis</div>
          <div className="text-xs text-slate-600">LLM identifies compound risks, writes a deployment brief, and prioritizes actions.</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {AREAS.map((a) => (
          <Card key={a.title} className="p-4">
            <div className="font-medium text-slate-900 text-sm mb-1">{a.title}</div>
            <div className="text-xs text-slate-500">{a.desc}</div>
          </Card>
        ))}
      </div>

      <Button onClick={onStart}>Start assessment</Button>
      <p className="mt-3 text-xs text-slate-400">
        Takes about 3 minutes. Nothing is sent anywhere — everything runs and stays in your browser.
      </p>
    </div>
  );
}
