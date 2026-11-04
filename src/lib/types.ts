export type Severity = "critical" | "high" | "medium" | "low";

export type Category =
  | "auth"
  | "environments"
  | "feature-flags"
  | "third-party"
  | "test-infra"
  | "realtime";

export const CATEGORY_LABELS: Record<Category, string> = {
  auth: "Authentication & Identity",
  environments: "Environments & Infrastructure",
  "feature-flags": "Feature Flags & Rollout",
  "third-party": "Third-Party Services",
  "test-infra": "Test Infrastructure",
  realtime: "Realtime Behaviour",
};

export interface ThirdPartyService {
  id: string;
  name: string;
  type: "payment" | "analytics" | "auth" | "webhook" | "email" | "data" | "other";
  criticality: "critical" | "important" | "nice-to-have";
}

export interface AuthAnswers {
  method: "none" | "basic" | "oauth" | "saml-sso" | "custom" | "multiple";
  idp: string;
  mfaEnabled: boolean;
  sessionStrategy: "cookie" | "jwt" | "server-session" | "unknown";
  multiTenant: boolean;
  tokenRefreshHandled: boolean;
}

export interface EnvironmentAnswers {
  hasPreviewEnvs: boolean;
  envParity: "identical" | "mostly-similar" | "divergent" | "unknown";
  infraType: "serverless" | "kubernetes" | "vm" | "on-prem" | "hybrid";
  regionTopology: "single-region" | "multi-region" | "unknown";
  dataResidencyConstraints: boolean;
  secretsManagement: "vault" | "platform-env" | "manual" | "unknown";
}

export interface FeatureFlagAnswers {
  usesFeatureFlags: boolean;
  provider: "launchdarkly" | "split" | "unleash" | "custom" | "none";
  rolloutStrategy: "percentage" | "user-targeted" | "big-bang" | "unknown";
  staleFlagCleanup: boolean;
}

export interface ThirdPartyAnswers {
  services: ThirdPartyService[];
  inboundWebhooks: boolean;
  rateLimitsKnown: boolean;
  outagePlaybook: boolean;
}

export interface TestInfraAnswers {
  ciCdPlatform: string;
  e2eCoverage: "none" | "smoke" | "partial" | "comprehensive";
  stagingMirrorsProd: boolean;
  testDataStrategy: "synthetic" | "anonymized-prod" | "shared-prod" | "unknown";
  loadTested: boolean;
}

export interface RealtimeAnswers {
  usesRealtime: boolean;
  mechanism: "websockets" | "sse" | "polling" | "queue" | "none";
  reconnectHandling: boolean;
  idempotencyHandled: boolean;
  loadCharacteristics: "steady" | "bursty" | "unknown";
}

export interface Answers {
  customerName: string;
  auth: AuthAnswers;
  environments: EnvironmentAnswers;
  featureFlags: FeatureFlagAnswers;
  thirdParty: ThirdPartyAnswers;
  testInfra: TestInfraAnswers;
  realtime: RealtimeAnswers;
}

export interface RiskFinding {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  explanation: string;
  validationSteps: string[];
  fdeQuestions: string[];
}

export interface AssessmentResult {
  findings: RiskFinding[];
  score: number;
  severityCounts: Record<Severity, number>;
  categoryCounts: Record<Category, number>;
}

export const defaultAnswers: Answers = {
  customerName: "",
  auth: {
    method: "oauth",
    idp: "",
    mfaEnabled: false,
    sessionStrategy: "cookie",
    multiTenant: false,
    tokenRefreshHandled: false,
  },
  environments: {
    hasPreviewEnvs: true,
    envParity: "mostly-similar",
    infraType: "serverless",
    regionTopology: "single-region",
    dataResidencyConstraints: false,
    secretsManagement: "platform-env",
  },
  featureFlags: {
    usesFeatureFlags: false,
    provider: "none",
    rolloutStrategy: "unknown",
    staleFlagCleanup: false,
  },
  thirdParty: {
    services: [],
    inboundWebhooks: false,
    rateLimitsKnown: false,
    outagePlaybook: false,
  },
  testInfra: {
    ciCdPlatform: "",
    e2eCoverage: "partial",
    stagingMirrorsProd: false,
    testDataStrategy: "synthetic",
    loadTested: false,
  },
  realtime: {
    usesRealtime: false,
    mechanism: "none",
    reconnectHandling: false,
    idempotencyHandled: false,
    loadCharacteristics: "unknown",
  },
};
