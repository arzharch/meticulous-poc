# Deployment Readiness Assessor

A small prototype built while exploring the Forward Deployed Engineer role at
Meticulous: walk through a customer's setup — auth, environments, feature
flags, third-party services, test infrastructure, and realtime behaviour —
and get back the likely deployment risks, concrete validation steps, and the
questions an FDE should ask first.

Everything runs client-side. Nothing is sent to a server; there's no backend
and no database. Reports can be shared as a link (the answers are encoded
into the URL) or exported as Markdown / PDF.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, all in one app so it
deploys as a single static-friendly site on Vercel.

- `src/lib/types.ts` — the intake schema
- `src/lib/rules.ts` — the deployment-risk rule engine (~25 rules across 6 categories)
- `src/lib/scoring.ts` — readiness score + severity rollups
- `src/lib/share.ts` — base64url encode/decode of answers for shareable links
- `src/components/Wizard.tsx`, `src/components/steps/*` — the intake flow
- `src/components/Report.tsx` — the generated report

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new) —
no environment variables or config needed.
