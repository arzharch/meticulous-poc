import { Answers } from "./types";

/**
 * A fictional, internally-consistent customer profile used for the
 * "View sample report" entry point. Tuned to produce at least one finding
 * in every category (including a couple of deliberate strengths, like
 * self-hosted fonts and a payment outage playbook) rather than maxing out
 * every rule — a real intake rarely trips every wire at once.
 */
export const sampleAnswers: Answers = {
  customerName: "Northwind Logistics — EU Rollout (Sample Profile)",
  auth: {
    method: "saml-sso",
    idp: "Okta",
    mfaEnabled: false,
    sessionStrategy: "jwt",
    multiTenant: true,
    tokenRefreshHandled: true,
  },
  environments: {
    hasPreviewEnvs: true,
    envParity: "mostly-similar",
    infraType: "kubernetes",
    regionTopology: "single-region",
    dataResidencyConstraints: false,
    secretsManagement: "manual",
  },
  featureFlags: {
    usesFeatureFlags: true,
    provider: "launchdarkly",
    rolloutStrategy: "percentage",
    staleFlagCleanup: false,
  },
  thirdParty: {
    services: [
      { id: "svc-stripe", name: "Stripe", type: "payment", criticality: "critical" },
      { id: "svc-okta", name: "Okta", type: "auth", criticality: "critical" },
      { id: "svc-segment", name: "Segment", type: "analytics", criticality: "important" },
    ],
    inboundWebhooks: true,
    rateLimitsKnown: false,
    outagePlaybook: true,
  },
  testInfra: {
    ciCdPlatform: "GitHub Actions",
    e2eCoverage: "comprehensive",
    stagingMirrorsProd: false,
    testDataStrategy: "synthetic",
    loadTested: false,
  },
  realtime: {
    usesRealtime: true,
    mechanism: "websockets",
    reconnectHandling: true,
    idempotencyHandled: true,
    loadCharacteristics: "unknown",
  },
  meticulous: {
    framework: "next-app",
    renderingMode: "ssr",
    hasStrictCsp: true,
    hasAnimations: true,
    animationTypes: ["js-driven"],
    hasDynamicContent: false,
    dynamicContentTypes: ["none"],
    hasThirdPartyEmbeds: false,
    embedTypes: ["none"],
    authGatedPages: false,
    usesServiceWorkers: false,
    usesWebWorkers: false,
    usesWebGL: false,
    fontStrategy: "self-hosted",
    existingVisualTests: false,
    existingTestTool: "none",
    internationalized: true,
    localeCount: 5,
    usesFeatureFlagsForUI: false,
    containerDeployable: true,
    mathRandomInSSR: false,
  },
};
