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

const allRules: Rule[] = [
  ...authRules,
  ...envRules,
  ...flagRules,
  ...thirdPartyRules,
  ...testInfraRules,
  ...realtimeRules,
];

export function evaluateRules(answers: Answers): RiskFinding[] {
  return allRules
    .map((r) => r(answers))
    .filter((f): f is RiskFinding => f !== null);
}
