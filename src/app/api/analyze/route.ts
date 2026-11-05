import { NextRequest, NextResponse } from "next/server";
import { Answers, CATEGORY_LABELS, Category, RiskFinding } from "@/lib/types";
import { SEVERITY_LABEL } from "@/lib/scoring";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "google/gemini-2.5-flash";

function buildPrompt(answers: Answers, findings: RiskFinding[]): string {
  const customerName = answers.customerName.trim() || "this customer";

  const findingSummaries = findings
    .map(
      (f) =>
        `[${SEVERITY_LABEL[f.severity]}] ${f.title} (${CATEGORY_LABELS[f.category as Category]}): ${f.explanation}`
    )
    .join("\n");

  return `You are a senior Forward Deployed Engineer at Meticulous, a company that provides automated visual regression testing. Meticulous works by recording real user sessions (via a recorder script injected into the customer's app), then replaying those sessions against new code to capture screenshots and detect visual regressions. It integrates into CI to catch UI bugs on every PR.

You understand Meticulous's deployment surface deeply: the recorder needs CSP allowlisting, SSR apps need container deployment, animations/WebGL/service workers cause non-deterministic replays, third-party embeds need blocking, font loading affects screenshot stability, and feature flags can create visual variants that need separate baselines.

You're reviewing a customer deployment profile and the automated risk findings from a rule-based engine. Your job is to go BEYOND the individual findings and provide the kind of analysis that only comes from experience deploying Meticulous across many different customer environments. Pay special attention to how the customer's frontend architecture interacts with Meticulous's recorder and replay engine. Specifically:

## Customer Profile

**Name:** ${customerName}

**Auth:** method=${answers.auth.method}, idp=${answers.auth.idp || "not specified"}, mfa=${answers.auth.mfaEnabled}, session=${answers.auth.sessionStrategy}, multi-tenant=${answers.auth.multiTenant}, token-refresh-handled=${answers.auth.tokenRefreshHandled}

**Environments:** preview-envs=${answers.environments.hasPreviewEnvs}, env-parity=${answers.environments.envParity}, infra=${answers.environments.infraType}, region=${answers.environments.regionTopology}, data-residency=${answers.environments.dataResidencyConstraints}, secrets=${answers.environments.secretsManagement}

**Feature Flags:** uses-flags=${answers.featureFlags.usesFeatureFlags}, provider=${answers.featureFlags.provider}, rollout=${answers.featureFlags.rolloutStrategy}, stale-cleanup=${answers.featureFlags.staleFlagCleanup}

**Third-Party Services:** ${answers.thirdParty.services.length === 0 ? "none listed" : answers.thirdParty.services.map((s) => `${s.name} (${s.type}, ${s.criticality})`).join(", ")}
inbound-webhooks=${answers.thirdParty.inboundWebhooks}, rate-limits-known=${answers.thirdParty.rateLimitsKnown}, outage-playbook=${answers.thirdParty.outagePlaybook}

**Test Infra:** ci-cd=${answers.testInfra.ciCdPlatform || "not specified"}, e2e=${answers.testInfra.e2eCoverage}, staging-mirrors-prod=${answers.testInfra.stagingMirrorsProd}, test-data=${answers.testInfra.testDataStrategy}, load-tested=${answers.testInfra.loadTested}

**Realtime:** uses-realtime=${answers.realtime.usesRealtime}, mechanism=${answers.realtime.mechanism}, reconnect-handling=${answers.realtime.reconnectHandling}, idempotency=${answers.realtime.idempotencyHandled}, load=${answers.realtime.loadCharacteristics}

**Meticulous Integration:** framework=${answers.meticulous.framework}, rendering=${answers.meticulous.renderingMode}, strict-csp=${answers.meticulous.hasStrictCsp}, animations=${answers.meticulous.hasAnimations} (types: ${answers.meticulous.animationTypes.join(", ")}), dynamic-content=${answers.meticulous.hasDynamicContent} (types: ${answers.meticulous.dynamicContentTypes.join(", ")}), third-party-embeds=${answers.meticulous.hasThirdPartyEmbeds} (types: ${answers.meticulous.embedTypes.join(", ")}), auth-gated-pages=${answers.meticulous.authGatedPages}, service-workers=${answers.meticulous.usesServiceWorkers}, web-workers=${answers.meticulous.usesWebWorkers}, webgl=${answers.meticulous.usesWebGL}, fonts=${answers.meticulous.fontStrategy}, existing-visual-tests=${answers.meticulous.existingVisualTests} (tool: ${answers.meticulous.existingTestTool}), i18n=${answers.meticulous.internationalized} (locales: ${answers.meticulous.localeCount}), feature-flags-affect-ui=${answers.meticulous.usesFeatureFlagsForUI}, container-deployable=${answers.meticulous.containerDeployable}, math-random-in-ssr=${answers.meticulous.mathRandomInSSR}

## Rule-Based Findings (${findings.length} total)

${findingSummaries || "No individual findings triggered."}

## Your Task

Produce a JSON response with exactly these three keys:

### 1. "compoundRisks" (array of objects)
Identify 2-4 risks that emerge from the INTERACTION between multiple answers across different categories. These are risks the individual rules can't catch because they only look at one category at a time. Each object has:
- "title": short title (string)
- "involvedCategories": which assessment areas interact to create this risk (string[])
- "explanation": 2-3 sentences explaining why the combination is dangerous and what specifically could go wrong during deployment (string)
- "severity": "critical" | "high" | "medium" (string)

Only include compound risks that are genuinely emergent — don't just restate individual findings. Pay special attention to how Meticulous-specific factors (recorder, replay, screenshots) interact with the customer's general deployment characteristics (auth, environments, feature flags, etc.). If the profile doesn't have meaningful compound risks, return fewer items rather than padding.

### 2. "deploymentNarrative" (string)
Write 2-3 paragraphs as if you're briefing a fellow Meticulous FDE who's about to handle this customer's deployment. Be direct and specific — reference the actual details from the profile, not generic advice. Cover: what kind of deployment this is (complexity shape), what will likely go smoothly with the Meticulous rollout, and where the real danger zones are for both the general deployment and the Meticulous integration specifically. Write conversationally, like an experienced engineer talking to a peer.

### 3. "prioritizedActions" (array of objects, max 5)
The top 3-5 things to do before go-live, ordered by impact. Each object has:
- "action": what specifically to do (string)
- "reason": one sentence on why this is higher priority than other items (string)
- "effort": "quick-win" | "half-day" | "multi-day" (string)
- "blocksGoLive": whether this should gate the deployment (boolean)

Respond ONLY with valid JSON, no markdown fences, no extra text.`;
}

export async function POST(req: NextRequest) {
  if (!OPENROUTER_KEY) {
    return NextResponse.json(
      { error: "OpenRouter API key not configured" },
      { status: 500 }
    );
  }

  let body: { answers: Answers; findings: RiskFinding[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { answers, findings } = body;
  if (!answers || !findings) {
    return NextResponse.json(
      { error: "Missing answers or findings" },
      { status: 400 }
    );
  }

  const prompt = buildPrompt(answers, findings);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 3000,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("OpenRouter error:", res.status, text);
      return NextResponse.json(
        { error: "AI analysis request failed" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? "";

    const cleaned = content
      .replace(/^```json?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    let parsed: {
      compoundRisks: Array<{
        title: string;
        involvedCategories: string[];
        explanation: string;
        severity: string;
      }>;
      deploymentNarrative: string;
      prioritizedActions: Array<{
        action: string;
        reason: string;
        effort: string;
        blocksGoLive: boolean;
      }>;
    };

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", cleaned.slice(0, 500));
      return NextResponse.json(
        { error: "AI response was not valid JSON" },
        { status: 502 }
      );
    }

    return NextResponse.json({ analysis: parsed });
  } catch (e) {
    console.error("Analyze route error:", e);
    return NextResponse.json(
      { error: "Internal error during analysis" },
      { status: 500 }
    );
  }
}
