import { Answers, RiskFinding } from "./types";

type Rule = (a: Answers) => RiskFinding | null;

const rule = (f: Rule): Rule => f;

// ---------- Auth & Identity ----------

const authRules: Rule[] = [
  rule((a) =>
    a.auth.method === "saml-sso" && !a.auth.idp.trim()
      ? {
          id: "auth-sso-idp-unknown",
          category: "auth",
          severity: "high",
          title: "SSO is in use but the identity provider isn't identified",
          explanation:
            "SAML/SSO integrations vary significantly between IdPs (Okta, Azure AD, Ping, OneLogin, etc.) in claim formats, clock-skew tolerance, and metadata refresh behaviour. Without knowing the IdP, assertion-mapping bugs are discovered in the customer's environment instead of ahead of time.",
          validationSteps: [
            "Get a sample SAML assertion or OIDC token from the customer's IdP and diff attribute names against what the app expects.",
            "Confirm metadata URL vs. uploaded XML, and who owns rotating it on expiry.",
          ],
          fdeQuestions: [
            "Which IdP, and is this SP-initiated or IdP-initiated SSO?",
            "Who on the customer side can issue a test SSO user without touching production identities?",
          ],
        }
      : null
  ),
  rule((a) =>
    a.auth.multiTenant && a.auth.sessionStrategy === "unknown"
      ? {
          id: "auth-multitenant-session-unknown",
          category: "auth",
          severity: "critical",
          title: "Multi-tenant deployment with unconfirmed session isolation strategy",
          explanation:
            "If session/JWT scoping isn't explicitly tenant-bound, a misconfigured deployment can leak session or data access across tenants — one of the most severe classes of deployment risk.",
          validationSteps: [
            "Trace a request end-to-end to confirm tenant ID is derived server-side from the verified session, never from a client-supplied header or path param alone.",
            "Write a test that attempts cross-tenant access with a valid session for tenant A against tenant B's resource.",
          ],
          fdeQuestions: [
            "Is tenant isolation enforced at the auth layer, the data layer, or both?",
            "Has this customer previously flagged data-isolation as a procurement/security requirement?",
          ],
        }
      : null
  ),
  rule((a) =>
    !a.auth.mfaEnabled && (a.auth.method === "saml-sso" || a.auth.method === "oauth")
      ? {
          id: "auth-no-mfa",
          category: "auth",
          severity: "medium",
          title: "No MFA enforced on an SSO/OAuth-based deployment",
          explanation:
            "Enterprise customers increasingly require MFA as a contractual security control. Discovering this gap mid-rollout usually causes a late-stage compliance blocker rather than a technical one.",
          validationSteps: [
            "Check whether MFA is enforced at the IdP level (often sufficient) vs. expected at the application level.",
          ],
          fdeQuestions: [
            "Does the customer's security team require MFA to be enforced by us, or is it satisfied by their IdP's policy?",
          ],
        }
      : null
  ),
  rule((a) =>
    !a.auth.tokenRefreshHandled && (a.auth.method === "oauth" || a.auth.sessionStrategy === "jwt")
      ? {
          id: "auth-token-refresh-unhandled",
          category: "auth",
          severity: "high",
          title: "Token/JWT refresh flow not confirmed",
          explanation:
            "Unhandled token expiry is one of the most common sources of intermittent 'random logout' bug reports in the first weeks after a deployment — hard to reproduce, easy to miss in a demo-length test window.",
          validationSteps: [
            "Force a token expiry in a preview environment and confirm silent refresh vs. forced re-auth behaviour.",
            "Check expiry window against the customer's expected session length for long-running workflows.",
          ],
          fdeQuestions: [
            "What's the longest uninterrupted session a real user workflow requires?",
          ],
        }
      : null
  ),
  rule((a) =>
    a.auth.method === "custom"
      ? {
          id: "auth-custom-method",
          category: "auth",
          severity: "medium",
          title: "Custom authentication implementation",
          explanation:
            "Custom auth means none of the standard OAuth/SAML library guarantees apply — every edge case (password reset, lockout, rate limiting on login) needs to be independently verified against this specific implementation.",
          validationSteps: [
            "Request the auth flow diagram or walk through login, logout, and password-reset end-to-end with the customer's engineers.",
          ],
          fdeQuestions: [
            "Is there documentation for the custom auth flow, or does it live only in the customer's codebase?",
          ],
        }
      : null
  ),
];

// ---------- Environments & Infrastructure ----------

const envRules: Rule[] = [
  rule((a) =>
    !a.environments.hasPreviewEnvs
      ? {
          id: "env-no-preview",
          category: "environments",
          severity: "high",
          title: "No preview/staging environment before production",
          explanation:
            "Without an environment that mirrors production topology, the first real validation of a change happens against live customer traffic — removing the single biggest safety net in a deployment.",
          validationSteps: [
            "Propose a minimal preview environment (even a single ephemeral instance) scoped to this rollout before go-live.",
          ],
          fdeQuestions: [
            "Is the absence of a preview environment a budget/infra constraint or has it just not been set up yet?",
          ],
        }
      : null
  ),
  rule((a) =>
    a.environments.hasPreviewEnvs && a.environments.envParity === "divergent"
      ? {
          id: "env-parity-divergent",
          category: "environments",
          severity: "high",
          title: "Preview environment diverges significantly from production",
          explanation:
            "A preview environment that differs in scale, data shape, network topology, or third-party sandbox behaviour gives false confidence — things that pass in preview fail in production for environment-specific reasons.",
          validationSteps: [
            "List the specific divergences (data volume, network policy, external service sandboxes) and assess which are most likely to hide bugs.",
          ],
          fdeQuestions: [
            "What's different between preview and production that the customer's team already knows about?",
          ],
        }
      : null
  ),
  rule((a) =>
    a.environments.infraType === "on-prem" || a.environments.infraType === "hybrid"
      ? {
          id: "env-on-prem",
          category: "environments",
          severity: "high",
          title: "On-prem or hybrid infrastructure in play",
          explanation:
            "On-prem/hybrid deployments introduce network egress rules, firewall allowlisting, and air-gapped update mechanisms that don't exist in a pure-cloud rollout — these are frequently the actual blocker, not application logic.",
          validationSteps: [
            "Confirm outbound connectivity requirements (ports, domains) are documented and pre-approved by the customer's network/security team.",
            "Confirm how updates/patches reach the on-prem component, and how often.",
          ],
          fdeQuestions: [
            "Who owns the firewall/network change request process on the customer side, and what's the typical lead time?",
          ],
        }
      : null
  ),
  rule((a) =>
    a.environments.regionTopology === "multi-region" && a.environments.dataResidencyConstraints
      ? {
          id: "env-data-residency",
          category: "environments",
          severity: "critical",
          title: "Multi-region deployment with data residency constraints",
          explanation:
            "Data residency requirements (GDPR, sector-specific regulation, contractual terms) can be violated by default multi-region replication, caching, or logging — a compliance failure that's expensive to discover post-launch.",
          validationSteps: [
            "Map every place data is written, cached, or logged and confirm each honours the residency boundary.",
            "Check third-party services (analytics, error tracking, email) for residency compliance too — not just the core app.",
          ],
          fdeQuestions: [
            "What's the specific regulatory or contractual basis for the residency requirement, and which data types does it cover?",
          ],
        }
      : null
  ),
  rule((a) =>
    a.environments.secretsManagement === "manual" || a.environments.secretsManagement === "unknown"
      ? {
          id: "env-secrets-unmanaged",
          category: "environments",
          severity: "medium",
          title: "No formal secrets management confirmed",
          explanation:
            "Manually-managed secrets (shared docs, .env files passed around) lead to stale credentials, accidental exposure, and painful rotation during incident response.",
          validationSteps: [
            "Confirm where secrets will live for this deployment and who has rotation access.",
          ],
          fdeQuestions: [
            "Does the customer have a preferred secrets manager we need to integrate with (Vault, AWS Secrets Manager, etc.)?",
          ],
        }
      : null
  ),
];

// ---------- Feature Flags ----------

const flagRules: Rule[] = [
  rule((a) =>
    a.featureFlags.usesFeatureFlags && a.featureFlags.rolloutStrategy === "big-bang"
      ? {
          id: "flags-big-bang",
          category: "feature-flags",
          severity: "high",
          title: "Feature flags exist but rollout is all-or-nothing",
          explanation:
            "Having flag infrastructure without using it for gradual rollout forfeits the main benefit — the ability to catch a regression against 1% of traffic instead of 100%.",
          validationSteps: [
            "Propose a percentage-based or cohort-based rollout plan using the existing flag infrastructure for this specific deployment.",
          ],
          fdeQuestions: [
            "Is big-bang rollout a deliberate choice (e.g. feature requires full consistency) or just how it's always been done?",
          ],
        }
      : null
  ),
  rule((a) =>
    !a.featureFlags.usesFeatureFlags
      ? {
          id: "flags-none",
          category: "feature-flags",
          severity: "medium",
          title: "No feature flag system in place",
          explanation:
            "Without flags, the only rollback mechanism for a bad deploy is a full redeploy or revert — slower than toggling a flag, and riskier under time pressure during an incident.",
          validationSteps: [
            "Assess whether this specific rollout has a high-risk component that would benefit from a flag-gated release, even a lightweight one.",
          ],
          fdeQuestions: [
            "If this deployment needs to be rolled back fast, what's the actual mechanism and how long does it take today?",
          ],
        }
      : null
  ),
  rule((a) =>
    a.featureFlags.usesFeatureFlags && !a.featureFlags.staleFlagCleanup
      ? {
          id: "flags-no-cleanup",
          category: "feature-flags",
          severity: "low",
          title: "No process for retiring stale feature flags",
          explanation:
            "Accumulated dead flags create combinatorial state no one is testing — a frequent source of 'this worked before, why did it break' incidents unrelated to the current change.",
          validationSteps: [
            "Check whether any flags relevant to this deployment are actually dead code paths that should be removed first.",
          ],
          fdeQuestions: [],
        }
      : null
  ),
];

// ---------- Third-Party Services ----------

const thirdPartyRules: Rule[] = [
  rule((a) => {
    const criticalCount = a.thirdParty.services.filter((s) => s.criticality === "critical").length;
    return criticalCount >= 2 && !a.thirdParty.outagePlaybook
      ? {
          id: "tp-multiple-critical-no-playbook",
          category: "third-party",
          severity: "high",
          title: `${criticalCount} business-critical third-party dependencies with no outage playbook`,
          explanation:
            "Each critical external dependency is a correlated failure point outside the team's control. Without a documented degradation plan, an outage in any one of them becomes an unplanned incident instead of a known, rehearsed scenario.",
          validationSteps: [
            "For each critical service, define what 'degraded mode' looks like for the customer-facing product if it goes down.",
          ],
          fdeQuestions: [
            "Which of these services has had an incident in the last 12 months, and what happened to the product during it?",
          ],
        }
      : null;
  }),
  rule((a) =>
    a.thirdParty.inboundWebhooks && !a.thirdParty.rateLimitsKnown
      ? {
          id: "tp-webhooks-no-rate-limits",
          category: "third-party",
          severity: "medium",
          title: "Inbound webhooks accepted without known rate limits",
          explanation:
            "Inbound webhooks from a third party are effectively untrusted, variable-rate traffic. Without known limits, a retry storm or a traffic spike from the provider's side can overwhelm the deployment with no application-level cause.",
          validationSteps: [
            "Confirm the webhook provider's documented retry/backoff behaviour and burst limits.",
            "Verify webhook signature validation is in place before any processing.",
          ],
          fdeQuestions: [
            "Does the webhook endpoint need to be idempotent — can the same event be delivered twice?",
          ],
        }
      : null
  ),
  rule((a) => {
    const paymentServices = a.thirdParty.services.filter((s) => s.type === "payment");
    return paymentServices.length > 0
      ? {
          id: "tp-payment-present",
          category: "third-party",
          severity: "high",
          title: "Payment processing is part of this deployment",
          explanation:
            "Payment flows carry compliance (PCI scope), idempotency (double-charge risk), and reconciliation requirements that are disproportionately expensive to retrofit after launch.",
          validationSteps: [
            "Confirm PCI scope boundary — is card data ever touched directly, or fully delegated to the processor?",
            "Verify payment operations are idempotent against retries (duplicate webhook delivery, client double-submit).",
          ],
          fdeQuestions: [
            "Who reconciles payment records between us and the processor, and how often?",
          ],
        }
      : null;
  }),
  rule((a) =>
    a.thirdParty.services.length === 0
      ? {
          id: "tp-none-listed",
          category: "third-party",
          severity: "low",
          title: "No third-party services listed",
          explanation:
            "Either this deployment genuinely has no external dependencies, or they haven't been inventoried yet — worth confirming explicitly before go-live.",
          validationSteps: [
            "Double-check with the customer's engineering contact that there's truly no external service in the request path (SSO IdP, analytics, error tracking, email/SMS, etc.).",
          ],
          fdeQuestions: [],
        }
      : null
  ),
];

// ---------- Test Infrastructure ----------

const testInfraRules: Rule[] = [
  rule((a) =>
    a.testInfra.e2eCoverage === "none"
      ? {
          id: "test-no-e2e",
          category: "test-infra",
          severity: "critical",
          title: "No end-to-end test coverage",
          explanation:
            "Without E2E coverage, deployment validation falls entirely on manual testing — slow, inconsistent, and the first thing skipped under deadline pressure.",
          validationSteps: [
            "Identify the 3-5 highest-value user workflows and write smoke-level E2E coverage for those before this deployment, even if full coverage isn't feasible yet.",
          ],
          fdeQuestions: [
            "What does the customer currently do to validate a deploy worked, if not automated tests?",
          ],
        }
      : null
  ),
  rule((a) =>
    a.testInfra.e2eCoverage === "smoke" || a.testInfra.e2eCoverage === "partial"
      ? {
          id: "test-partial-e2e",
          category: "test-infra",
          severity: "medium",
          title: "E2E coverage is partial",
          explanation:
            "Partial coverage is a known-risk gap, not an unknown one — the main task is confirming the uncovered paths aren't the ones this specific deployment touches.",
          validationSteps: [
            "Cross-reference the change's affected code paths against existing test coverage to find gaps specific to this rollout.",
          ],
          fdeQuestions: [],
        }
      : null
  ),
  rule((a) =>
    !a.testInfra.stagingMirrorsProd
      ? {
          id: "test-staging-mismatch",
          category: "test-infra",
          severity: "high",
          title: "Staging does not mirror production configuration",
          explanation:
            "Config drift between staging and production (feature flags, infra scale, third-party sandbox vs. live keys) is one of the most common reasons 'it worked in staging' deploys fail in production.",
          validationSteps: [
            "Diff environment variables and infra config between staging and production for anything relevant to this deployment.",
          ],
          fdeQuestions: [
            "What's the known list of differences between staging and production today?",
          ],
        }
      : null
  ),
  rule((a) =>
    a.testInfra.testDataStrategy === "shared-prod"
      ? {
          id: "test-shared-prod-data",
          category: "test-infra",
          severity: "critical",
          title: "Tests run against shared production data",
          explanation:
            "Testing against live production data risks both data corruption from test runs and exposure of real customer data in test output/logs — a serious operational and compliance risk.",
          validationSteps: [
            "Identify a path to synthetic or properly anonymized test data before this deployment proceeds further.",
          ],
          fdeQuestions: [
            "Is this a temporary stopgap or the customer's long-term testing approach?",
          ],
        }
      : null
  ),
  rule((a) =>
    !a.testInfra.loadTested && a.realtime.loadCharacteristics === "bursty"
      ? {
          id: "test-no-load-test-bursty",
          category: "test-infra",
          severity: "high",
          title: "Bursty traffic pattern with no load testing performed",
          explanation:
            "Bursty workloads (batch jobs, scheduled syncs, flash-traffic events) expose capacity and backpressure issues that steady-state testing never surfaces.",
          validationSteps: [
            "Run a load test that simulates the actual burst shape (not just peak RPS) against a preview environment before go-live.",
          ],
          fdeQuestions: [
            "What triggers the burst — a scheduled job, a customer-side batch process, an external event?",
          ],
        }
      : null
  ),
];

// ---------- Realtime Behaviour ----------

const realtimeRules: Rule[] = [
  rule((a) =>
    a.realtime.usesRealtime && !a.realtime.reconnectHandling
      ? {
          id: "rt-no-reconnect",
          category: "realtime",
          severity: "high",
          title: "Realtime connections with no confirmed reconnect handling",
          explanation:
            "Network blips, load balancer rotations, and deploys themselves all drop long-lived connections (WebSocket/SSE). Without graceful reconnect, every one of those ordinary events becomes a visible user-facing failure.",
          validationSteps: [
            "Simulate a dropped connection (kill the server process, rotate a load balancer node) and confirm the client reconnects and resyncs state.",
          ],
          fdeQuestions: [
            "What should the UI show during a reconnect — is a few seconds of staleness acceptable for this use case?",
          ],
        }
      : null
  ),
  rule((a) =>
    a.realtime.usesRealtime && !a.realtime.idempotencyHandled
      ? {
          id: "rt-no-idempotency",
          category: "realtime",
          severity: "high",
          title: "Realtime message handling is not confirmed idempotent",
          explanation:
            "At-least-once delivery is the norm for most realtime transports and queues. Without idempotent handling, reconnects and retries can cause duplicate side effects (double notifications, duplicate writes).",
          validationSteps: [
            "Trace what happens if the same realtime event is delivered twice in a row to the handler.",
          ],
          fdeQuestions: [],
        }
      : null
  ),
  rule((a) =>
    a.realtime.mechanism === "polling" && a.realtime.loadCharacteristics !== "steady"
      ? {
          id: "rt-polling-non-steady",
          category: "realtime",
          severity: "medium",
          title: "Polling-based realtime under a non-steady load pattern",
          explanation:
            "Polling scales linearly with connected clients and degrades poorly under bursty concurrent usage (e.g. everyone opening the app at 9am) compared to push-based mechanisms.",
          validationSteps: [
            "Estimate peak concurrent pollers for this customer and check the poll interval against backend capacity.",
          ],
          fdeQuestions: [
            "Is there a concrete event (shift start, scheduled report, alert) that causes everyone to load the app at once?",
          ],
        }
      : null
  ),
  rule((a) =>
    a.realtime.usesRealtime && a.realtime.loadCharacteristics === "unknown"
      ? {
          id: "rt-load-unknown",
          category: "realtime",
          severity: "medium",
          title: "Realtime feature's load characteristics are unknown",
          explanation:
            "Realtime infrastructure is usually sized around connection count and message fan-out, not request throughput — an unknown load profile here is a capacity-planning blind spot, not just a testing gap.",
          validationSteps: [
            "Get a rough estimate of concurrent connected users and message rate per connection from the customer before go-live.",
          ],
          fdeQuestions: [
            "How many users are expected to have the realtime feature open simultaneously at peak?",
          ],
        }
      : null
  ),
];

// ---------- Meticulous Integration ----------

const meticulousRules: Rule[] = [
  // Recorder injection & CSP
  rule((a) =>
    a.meticulous.hasStrictCsp
      ? {
          id: "met-csp-blocks-recorder",
          category: "meticulous",
          severity: "critical",
          title: "Strict CSP will block the Meticulous recorder snippet",
          explanation:
            "Meticulous injects a recorder script from snippet.meticulous.ai. A strict Content-Security-Policy that doesn't allowlist this origin will silently block session recording — no sessions means no replay tests. The CSP must also allow frame-src and connect-src for Meticulous domains, and script-src for their Sentry CDN dependency.",
          validationSteps: [
            "Check the deployed CSP header for script-src, frame-src, and connect-src directives.",
            "Add snippet.meticulous.ai to script-src and frame-src, browser.sentry-cdn.com to script-src, and the Cognito identity endpoint to connect-src.",
            "Deploy in report-only mode (Content-Security-Policy-Report-Only) first to verify nothing else breaks.",
          ],
          fdeQuestions: [
            "Who owns the CSP configuration — is it set at the app level, CDN/edge, or WAF?",
            "Is there an approval process for adding external script origins, and what's the lead time?",
          ],
        }
      : null
  ),

  // Next.js App Router + streaming SSR
  rule((a) =>
    a.meticulous.framework === "next-app" && a.meticulous.renderingMode === "streaming"
      ? {
          id: "met-nextjs-streaming",
          category: "meticulous",
          severity: "high",
          title: "Next.js App Router with streaming SSR — recorder timing is critical",
          explanation:
            "Streaming SSR sends partial HTML to the client before server components finish rendering. The Meticulous recorder must be placed in the root layout before any other scripts to capture the full hydration sequence. If the recorder loads after a Suspense boundary resolves, the initial server-streamed content won't be recorded, producing incomplete session replays and unreliable screenshot baselines.",
          validationSteps: [
            "Verify the recorder snippet is in app/layout.tsx, not in a nested layout or page component.",
            "Test recording on a page with a slow server component behind Suspense — confirm the full resolved state is captured.",
            "Check that Next.js is version 14+ if any server component uses Math.random() (requires the seedrandom instrumentation patch).",
          ],
          fdeQuestions: [
            "Are there server components with heavy data fetching behind Suspense boundaries?",
            "Does the app use Math.random() or Date.now() in server components for layout decisions?",
          ],
        }
      : null
  ),

  // Math.random in SSR
  rule((a) =>
    a.meticulous.mathRandomInSSR &&
    (a.meticulous.framework === "next-app" || a.meticulous.framework === "next-pages")
      ? {
          id: "met-math-random-ssr",
          category: "meticulous",
          severity: "high",
          title: "Math.random() in server-rendered components breaks replay determinism",
          explanation:
            "Meticulous replays recorded sessions to generate screenshots. If server components use Math.random() for layout decisions (random IDs, key generation, A/B bucketing), each replay produces different HTML, making screenshot comparison meaningless. Meticulous requires Next.js 14+ and the seedrandom instrumentation patch to make Math.random() deterministic during replay.",
          validationSteps: [
            "Grep the codebase for Math.random() in server components and API routes that affect rendered output.",
            "Install the seedrandom package and add the instrumentation.ts hook per Meticulous docs.",
            "Contact Meticulous support for a custom replay configuration if the random usage is complex.",
          ],
          fdeQuestions: [
            "Is Math.random() used for visual layout decisions, or just for non-visible things like request IDs?",
          ],
        }
      : null
  ),

  // Next.js Pages Router — different snippet placement
  rule((a) =>
    a.meticulous.framework === "next-pages"
      ? {
          id: "met-nextjs-pages-setup",
          category: "meticulous",
          severity: "low",
          title: "Next.js Pages Router requires _document.tsx snippet placement",
          explanation:
            "For Pages Router apps, the Meticulous recorder snippet must go in _document.tsx, not _app.tsx or individual pages. The recommended deployment approach is building a Docker image and using Meticulous's upload-container GitHub Action rather than serving from a preview URL.",
          validationSteps: [
            "Confirm the recorder snippet is in pages/_document.tsx in the <Head> section.",
            "Verify the app can be containerised with a working Dockerfile for the upload-container action.",
          ],
          fdeQuestions: [
            "Is there an existing Dockerfile for this Next.js app, or will one need to be created?",
          ],
        }
      : null
  ),

  // Heavy animations — CSS vs JS-driven
  rule((a) =>
    a.meticulous.hasAnimations && a.meticulous.animationTypes.includes("js-driven")
      ? {
          id: "met-js-animations",
          category: "meticulous",
          severity: "high",
          title: "JavaScript-driven animations will cause flaky visual diffs",
          explanation:
            "Meticulous freezes CSS animation timers during replay to stabilise screenshots, but JavaScript-driven animations (requestAnimationFrame loops, GSAP, Framer Motion spring physics) aren't fully controlled by timer freezing. Each replay frame can capture a different animation state, producing false-positive diffs that erode team trust in the test suite.",
          validationSteps: [
            "Inventory JS-driven animations and test whether they produce stable screenshots in Meticulous replay.",
            "For animations that flake, configure CSS selector-based ignore regions in the Meticulous config to exclude them from comparison.",
            "Consider adding a prefers-reduced-motion media query path that disables heavy animations — Meticulous can replay with this preference.",
          ],
          fdeQuestions: [
            "Are the JS animations in the critical user flow, or decorative? Can they be disabled via a reduced-motion query?",
            "Is the team open to maintaining ignore-region selectors for animated areas?",
          ],
        }
      : null
  ),

  // Lottie / WebGL animations
  rule((a) =>
    a.meticulous.hasAnimations && a.meticulous.animationTypes.includes("lottie-webgl")
      ? {
          id: "met-webgl-lottie",
          category: "meticulous",
          severity: "high",
          title: "WebGL/Lottie content produces non-deterministic renders",
          explanation:
            "WebGL and Lottie animations render on a canvas element outside the DOM diffing Meticulous relies on. The Meticulous docs explicitly note that heavy use of WebGL can produce false positive diffs. These areas need to be excluded from visual comparison or they'll generate noise on every PR.",
          validationSteps: [
            "Identify all canvas/WebGL/Lottie elements and their CSS selectors.",
            "Add them to the Meticulous ignore-region configuration.",
            "Verify that excluding these regions doesn't mask real regressions in adjacent UI.",
          ],
          fdeQuestions: [
            "Are WebGL/Lottie elements embedded throughout the app or confined to specific pages?",
          ],
        }
      : null
  ),

  // CSS-only animations — lower severity since Meticulous handles these
  rule((a) =>
    a.meticulous.hasAnimations &&
    a.meticulous.animationTypes.includes("css-transitions") &&
    !a.meticulous.animationTypes.includes("js-driven") &&
    !a.meticulous.animationTypes.includes("lottie-webgl")
      ? {
          id: "met-css-animations-ok",
          category: "meticulous",
          severity: "low",
          title: "CSS animations present — Meticulous handles these but verify",
          explanation:
            "Meticulous freezes CSS animation and transition timers during replay, which handles most CSS-only animations. However, animations tied to scroll position or IntersectionObserver may still produce timing-dependent states.",
          validationSteps: [
            "Run a test replay and check that CSS animations produce stable screenshots.",
            "Watch for scroll-triggered animations that might behave differently under Meticulous's simulated viewport.",
          ],
          fdeQuestions: [],
        }
      : null
  ),

  // Dynamic content — dates, user-specific, random IDs
  rule((a) =>
    a.meticulous.hasDynamicContent && a.meticulous.dynamicContentTypes.includes("dates")
      ? {
          id: "met-dynamic-dates",
          category: "meticulous",
          severity: "medium",
          title: "Date/time display in the UI will differ between recording and replay",
          explanation:
            "Meticulous mocks network responses during replay but rendered dates that come from Date.now() or new Date() in client code will reflect the replay time, not the recording time. Elements like 'Last updated 3 minutes ago' or 'Today's schedule' will differ on every replay, producing false positives unless the time source is controlled.",
          validationSteps: [
            "Identify date/time rendering that uses client-side Date rather than server-provided timestamps.",
            "For relative time displays ('3 minutes ago'), configure ignore-region selectors or verify Meticulous's timer stubbing covers them.",
          ],
          fdeQuestions: [
            "Are timestamps server-rendered or computed client-side?",
          ],
        }
      : null
  ),

  // Dynamic content — user-specific data
  rule((a) =>
    a.meticulous.hasDynamicContent && a.meticulous.dynamicContentTypes.includes("user-specific")
      ? {
          id: "met-dynamic-user-data",
          category: "meticulous",
          severity: "medium",
          title: "User-specific content will vary across recorded sessions",
          explanation:
            "Since Meticulous records real user sessions and mocks their responses during replay, different sessions will show different user data. This is generally handled well — each session's own data is replayed consistently. The risk is when building baselines: if baseline sessions show user A's dashboard and comparison sessions show user B's, the diff is all user data, not regressions.",
          validationSteps: [
            "Understand how Meticulous selects which recorded sessions to replay — confirm baselines are session-stable across comparisons.",
            "Check that the 'base' and 'head' replay use the same recorded session with only the code changed.",
          ],
          fdeQuestions: [
            "Are there pages where the visual layout changes significantly based on the user's data volume or account type?",
          ],
        }
      : null
  ),

  // Dynamic content — live data feeds
  rule((a) =>
    a.meticulous.hasDynamicContent && a.meticulous.dynamicContentTypes.includes("live-data")
      ? {
          id: "met-dynamic-live-data",
          category: "meticulous",
          severity: "medium",
          title: "Live data feeds need careful handling during replay",
          explanation:
            "Meticulous mocks network responses by replaying recorded data. But if the app uses WebSockets, SSE, or polling for live updates, those real-time data channels may not be fully captured or may introduce non-determinism during replay. The Meticulous docs note that WebSocket connections can introduce non-determinism through inline script tags.",
          validationSteps: [
            "Identify all real-time data channels (WebSocket, SSE, polling endpoints).",
            "Verify Meticulous captures and replays WebSocket/SSE traffic, or configure blocking for non-essential live feeds.",
            "Test replay stability on pages with live data — check for flickering or missing data states.",
          ],
          fdeQuestions: [
            "Which pages show live-updating data, and is that data critical to the visual layout or just supplementary?",
          ],
        }
      : null
  ),

  // Third-party embeds — chat widgets, analytics, ads
  rule((a) =>
    a.meticulous.hasThirdPartyEmbeds &&
    a.meticulous.embedTypes.some((t) => t !== "none")
      ? {
          id: "met-third-party-embeds",
          category: "meticulous",
          severity: "high",
          title: "Third-party embeds will cause visual noise in screenshots",
          explanation:
            "Meticulous's docs recommend blocking third-party services during replay — analytics tools, error monitors, payment processors, CAPTCHAs, chat widgets, and ad scripts all inject visible UI elements or overlays that change between runs. Some embed scripts also introduce non-determinism through service workers, WebSockets, or inline script tags that bypass Meticulous's network mocking.",
          validationSteps: [
            "Add all third-party embed domains to the Meticulous blocked-requests configuration.",
            "Verify that blocking these scripts doesn't break the app's core functionality during replay.",
            "For embeds that can't be blocked (e.g., payment form iframes that are part of the critical flow), configure ignore-region selectors.",
          ],
          fdeQuestions: [
            "Which third-party embeds are load-bearing for the core user flow vs. supplementary?",
            "Are there cookie consent banners or chat widgets that overlay the main content?",
          ],
        }
      : null
  ),

  // Auth-gated pages
  rule((a) =>
    a.meticulous.authGatedPages
      ? {
          id: "met-auth-gated-recording",
          category: "meticulous",
          severity: "high",
          title: "Auth-gated content requires authenticated recording sessions",
          explanation:
            "Meticulous needs to record sessions behind login to build test coverage of the authenticated experience. The recorder runs in the user's browser, so it captures authenticated sessions naturally. But replay needs to reconstruct these sessions — if the recorded responses include short-lived auth tokens or session cookies that are validated server-side, replay may fail when the app is served from a container rather than using mocked responses.",
          validationSteps: [
            "Confirm Meticulous's default response mocking handles the auth flow — if the app validates tokens server-side during replay, the mocked responses must include valid token exchange sequences.",
            "Test replay of an authenticated session on a containerised build to verify the auth flow doesn't block page rendering.",
            "Check that session recording captures the full login-to-dashboard flow, not just post-login pages.",
          ],
          fdeQuestions: [
            "Does the app make server-side token validation calls that could fail during replay?",
            "Are there pages that redirect to login if the session is stale — could this happen during a Meticulous replay?",
          ],
        }
      : null
  ),

  // Service workers
  rule((a) =>
    a.meticulous.usesServiceWorkers
      ? {
          id: "met-service-workers",
          category: "meticulous",
          severity: "high",
          title: "Service workers can intercept and modify requests during replay",
          explanation:
            "Service workers sit between the app and the network, caching responses and potentially serving stale data. During Meticulous replay, service workers may serve cached content instead of the mocked responses Meticulous provides, breaking determinism. Meticulous's docs flag service workers as a known source of non-determinism.",
          validationSteps: [
            "Determine which requests the service worker intercepts (asset caching, API responses, offline fallbacks).",
            "Configure the Meticulous replay environment to disable or bypass the service worker, or ensure the service worker doesn't intercept the requests Meticulous mocks.",
          ],
          fdeQuestions: [
            "Is the service worker used for offline support, push notifications, or API response caching?",
            "Can it be disabled in the build used for Meticulous replay without affecting the test's validity?",
          ],
        }
      : null
  ),

  // WebGL (separate from animations — for data viz, 3D content)
  rule((a) =>
    a.meticulous.usesWebGL && !a.meticulous.animationTypes.includes("lottie-webgl")
      ? {
          id: "met-webgl-rendering",
          category: "meticulous",
          severity: "high",
          title: "WebGL content renders non-deterministically across runs",
          explanation:
            "WebGL rendering depends on GPU driver behaviour and timing that Meticulous can't control. The docs explicitly warn that WebGL can produce false positive diffs. Any page with WebGL-based data visualisation (3D charts, maps, canvas-rendered dashboards) needs ignore regions.",
          validationSteps: [
            "Identify all WebGL-rendered content and its CSS selectors or container elements.",
            "Add these to the ignore-region configuration.",
          ],
          fdeQuestions: [
            "Is the WebGL content a core part of the product (e.g., a 3D viewer) or supplementary?",
          ],
        }
      : null
  ),

  // Font loading strategy
  rule((a) =>
    a.meticulous.fontStrategy === "google-fonts" || a.meticulous.fontStrategy === "typekit"
      ? {
          id: "met-external-fonts",
          category: "meticulous",
          severity: "medium",
          title: "External font CDN may cause font-loading flakes in replay",
          explanation:
            "When fonts are loaded from external CDNs (Google Fonts, Typekit), the replay environment may experience different loading times or font availability than the recording environment. If a font fails to load or loads after the screenshot is captured, text renders in the fallback font, creating a diff on every run. Self-hosting fonts eliminates this variable entirely.",
          validationSteps: [
            "Check whether fonts load reliably in the Meticulous replay environment — run a few test replays and compare font rendering.",
            "If flakes appear, recommend self-hosting fonts or adding the font CDN domains to the allowed list in Meticulous's blocked-requests config.",
          ],
          fdeQuestions: [
            "Are the fonts loaded via <link> in the head, or via @import in CSS? (link is more reliable for preloading)",
            "Would the team consider self-hosting fonts to eliminate this variable?",
          ],
        }
      : null
  ),

  // No existing visual tests — baseline strategy
  rule((a) =>
    !a.meticulous.existingVisualTests
      ? {
          id: "met-no-existing-visual-tests",
          category: "meticulous",
          severity: "medium",
          title: "No existing visual testing — baseline capture strategy needed",
          explanation:
            "The first Meticulous run generates screenshot baselines that all future PRs compare against. If the initial baselines are captured from a buggy or incomplete state, every fix will show as a 'regression' that needs approval. Getting the first baseline right — from a known-good state with representative session coverage — is critical to avoiding a flood of false positives that kills adoption before it starts.",
          validationSteps: [
            "Plan the baseline capture: identify the known-good commit/state to capture baselines from.",
            "Ensure the recorded sessions cover the critical user flows, not just the homepage.",
            "Define who approves baseline updates — this is an ongoing process, not a one-time setup.",
          ],
          fdeQuestions: [
            "Is there a 'golden' state of the app that the team considers the visual source of truth right now?",
            "Who should have approval authority for baseline updates when the design intentionally changes?",
          ],
        }
      : null
  ),

  // Migrating from existing visual test tool
  rule((a) =>
    a.meticulous.existingVisualTests && a.meticulous.existingTestTool !== "none"
      ? {
          id: "met-existing-tool-migration",
          category: "meticulous",
          severity: "medium",
          title: `Migrating from ${a.meticulous.existingTestTool} — parallel-run period recommended`,
          explanation:
            "Switching visual testing tools mid-flight risks losing the existing baseline coverage and team trust. A parallel-run period where both tools run on PRs lets the team build confidence in Meticulous's results before decommissioning the existing tool. It also surfaces any gaps in Meticulous's coverage that the previous tool handled.",
          validationSteps: [
            "Set up Meticulous to run alongside the existing tool on PRs for 2-4 weeks.",
            "Compare findings: are there regressions one tool catches that the other misses?",
            "Plan the cutover: when does the old tool's PR check become optional, then removed?",
          ],
          fdeQuestions: [
            `What's the team's experience with ${a.meticulous.existingTestTool} — is it well-liked or a pain point?`,
            "Is there budget/CI-time to run both tools in parallel for a few weeks?",
          ],
        }
      : null
  ),

  // Internationalization — multiple baselines needed
  rule((a) =>
    a.meticulous.internationalized && a.meticulous.localeCount > 3
      ? {
          id: "met-i18n-baselines",
          category: "meticulous",
          severity: "high",
          title: `${a.meticulous.localeCount} locales — visual baselines multiply with each locale`,
          explanation:
            `Each locale can produce different text lengths, text direction (RTL), date formats, and number formats, all of which change the visual layout. With ${a.meticulous.localeCount} locales, the baseline set is ${a.meticulous.localeCount}x larger, and a layout change needs approval across all locales. Without a locale-aware testing strategy, regressions in non-default locales go undetected until a customer reports them.`,
          validationSteps: [
            "Decide which locales are critical enough to maintain Meticulous baselines for — testing all locales may not be practical.",
            "Configure Meticulous to capture sessions across at least the default locale and the most-different locale (e.g., English + Arabic for RTL, or English + German for text-length extremes).",
            "Ensure recorded sessions exist for non-default locales — if all recordings are in English, other locales won't be tested.",
          ],
          fdeQuestions: [
            "Which locales have the most users, and which have the most visual layout differences from the default?",
            "Is RTL layout support in play?",
          ],
        }
      : null
  ),

  // Low locale count i18n
  rule((a) =>
    a.meticulous.internationalized && a.meticulous.localeCount >= 2 && a.meticulous.localeCount <= 3
      ? {
          id: "met-i18n-small",
          category: "meticulous",
          severity: "low",
          title: "Small number of locales — manageable but plan baseline coverage",
          explanation:
            "With 2-3 locales, the baseline overhead is manageable. The main risk is that all recorded sessions happen in the default locale and non-default locale regressions go undetected.",
          validationSteps: [
            "Verify that at least some recorded sessions are in the non-default locale(s).",
          ],
          fdeQuestions: [],
        }
      : null
  ),

  // Feature flags for UI — visual variants
  rule((a) =>
    a.meticulous.usesFeatureFlagsForUI
      ? {
          id: "met-feature-flag-visual-variants",
          category: "meticulous",
          severity: "high",
          title: "Feature flags create visual variants that need separate baselines",
          explanation:
            "If feature flags change the visual UI (different layouts, components, or styles per flag state), each flag combination is a different visual state. A session recorded with flag A=on will look different from one with A=off, and Meticulous will flag the difference as a regression. Without a flag-aware strategy, every A/B experiment or gradual rollout generates false positives.",
          validationSteps: [
            "Identify which feature flags affect the visual UI (not just backend logic).",
            "Determine whether Meticulous sessions need to be segmented by flag state, or whether the team is comfortable with the 'latest' flag state as the baseline.",
            "Check if the feature flag provider can force a consistent state during Meticulous replay.",
          ],
          fdeQuestions: [
            "How many active feature flags change the visual UI at any given time?",
            "Would the team prefer to test the 'flag-on' state, 'flag-off' state, or both?",
          ],
        }
      : null
  ),

  // Container deployment — needed for SSR apps
  rule((a) =>
    !a.meticulous.containerDeployable &&
    (a.meticulous.renderingMode === "ssr" ||
      a.meticulous.renderingMode === "streaming" ||
      a.meticulous.renderingMode === "isr" ||
      a.meticulous.renderingMode === "mixed")
      ? {
          id: "met-no-container-ssr",
          category: "meticulous",
          severity: "critical",
          title: "Server-rendered app can't be containerised — blocks Meticulous replay",
          explanation:
            "Meticulous replays sessions against a running instance of the app. For server-rendered apps (SSR, ISR, streaming), the recommended approach is uploading a container image via the upload-container GitHub Action. If the app can't be containerised (complex native dependencies, external service requirements, on-prem-only databases), Meticulous replay may need an alternative deployment strategy like a tunnel to a preview environment.",
          validationSteps: [
            "Assess what's blocking containerisation — missing Dockerfile, native dependencies, required network access?",
            "Explore the tunnel/preview-URL alternative if containerisation is not feasible in the short term.",
          ],
          fdeQuestions: [
            "Is there a Dockerfile or can one be created? What blocks containerisation?",
            "Is there a preview environment URL that Meticulous could test against instead?",
          ],
        }
      : null
  ),

  // Web workers (WASM) — source of false positives
  rule((a) =>
    a.meticulous.usesWebWorkers
      ? {
          id: "met-web-workers",
          category: "meticulous",
          severity: "medium",
          title: "Web Workers / WASM may produce non-deterministic results",
          explanation:
            "Meticulous's docs note that heavy use of Web Workers and WASM can produce false positive diffs. Web Workers run in a separate thread with independent timing, and their output may arrive at slightly different moments during replay, causing visual state differences in screenshots.",
          validationSteps: [
            "Identify what the Web Workers compute and whether their output affects the visible UI.",
            "Run test replays to measure the flake rate on pages using Web Workers.",
            "If flakes appear, add ignore-region selectors for UI areas that depend on Worker output.",
          ],
          fdeQuestions: [
            "Are Web Workers used for heavy computation (data processing, WASM) that affects the rendered UI, or just background tasks?",
          ],
        }
      : null
  ),
];

const allRules: Rule[] = [
  ...authRules,
  ...envRules,
  ...flagRules,
  ...thirdPartyRules,
  ...testInfraRules,
  ...realtimeRules,
  ...meticulousRules,
];

export function evaluateRules(answers: Answers): RiskFinding[] {
  return allRules
    .map((r) => r(answers))
    .filter((f): f is RiskFinding => f !== null);
}
