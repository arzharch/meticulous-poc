# Deployment Readiness Assessor

A small prototype built while exploring the Forward Deployed Engineer role at
Meticulous: walk through a customer's setup — auth, environments, feature
flags, third-party services, test infrastructure, and realtime behaviour —
and get back the likely deployment risks, concrete validation steps, and the
questions an FDE should ask first.

The rule engine runs entirely client-side and there's no database — reports
can be shared as a link (the answers are encoded into the URL) or exported
as Markdown / PDF. The one exception: the AI synthesis layer (compound
risks + deployment brief) sends the customer profile and rule findings to
an LLM via a server route (`src/app/api/analyze/route.ts`) to generate
analysis the rule engine can't produce on its own. Nothing is persisted —
the profile isn't stored anywhere after that request completes.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, all in one app so it
deploys as a single static-friendly site on Vercel.

- `src/lib/types.ts` — the intake schema
- `src/lib/rules.ts` — the deployment-risk rule engine (40+ rules across 7 categories, including a dedicated Meticulous integration category)
- `src/lib/scoring.ts` — readiness score + severity rollups
- `src/lib/share.ts` — base64url encode/decode of answers for shareable links
- `src/lib/sampleAnswers.ts` — a seeded demo profile for the "View sample report" link
- `src/components/Wizard.tsx`, `src/components/steps/*` — the intake flow
- `src/components/Report.tsx` — the generated report
- `src/app/api/analyze/route.ts` — AI synthesis layer (compound risks, deployment brief, prioritized actions)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new) —
no environment variables or config needed.
