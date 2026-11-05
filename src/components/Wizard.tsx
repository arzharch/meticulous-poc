"use client";

import { useState } from "react";
import { Answers } from "@/lib/types";
import { Button, Card, FieldGroup, FieldLabel, TextInput } from "@/components/ui";
import { AuthStep } from "@/components/steps/AuthStep";
import { EnvironmentsStep } from "@/components/steps/EnvironmentsStep";
import { FeatureFlagsStep } from "@/components/steps/FeatureFlagsStep";
import { ThirdPartyStep } from "@/components/steps/ThirdPartyStep";
import { TestInfraStep } from "@/components/steps/TestInfraStep";
import { RealtimeStep } from "@/components/steps/RealtimeStep";
import { MeticulousStep } from "@/components/steps/MeticulousStep";

const STEPS = [
  { key: "basics", label: "Customer" },
  { key: "auth", label: "Auth & Identity" },
  { key: "environments", label: "Environments" },
  { key: "feature-flags", label: "Feature Flags" },
  { key: "third-party", label: "Third-Party Services" },
  { key: "test-infra", label: "Test Infrastructure" },
  { key: "realtime", label: "Realtime Behaviour" },
  { key: "meticulous", label: "Meticulous Integration" },
] as const;

export function Wizard({
  initial,
  onComplete,
  onCancel,
}: {
  initial: Answers;
  onComplete: (answers: Answers) => void;
  onCancel: () => void;
}) {
  const [answers, setAnswers] = useState<Answers>(initial);
  const [stepIndex, setStepIndex] = useState(0);

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      onComplete(answers);
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const prev = () => {
    if (isFirst) {
      onCancel();
    } else {
      setStepIndex((i) => i - 1);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
          <span>
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          <span>{step.label}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">{step.label}</h2>
        <p className="text-sm text-slate-500 mb-6">{stepDescription(step.key)}</p>

        {step.key === "basics" && (
          <FieldGroup>
            <FieldLabel hint="Used only to label the report — nothing is sent anywhere.">
              Customer / deployment name
            </FieldLabel>
            <TextInput
              value={answers.customerName}
              onChange={(v) => setAnswers({ ...answers, customerName: v })}
              placeholder="e.g. Acme Corp — EU rollout"
            />
          </FieldGroup>
        )}

        {step.key === "auth" && (
          <AuthStep value={answers.auth} onChange={(v) => setAnswers({ ...answers, auth: v })} />
        )}
        {step.key === "environments" && (
          <EnvironmentsStep
            value={answers.environments}
            onChange={(v) => setAnswers({ ...answers, environments: v })}
          />
        )}
        {step.key === "feature-flags" && (
          <FeatureFlagsStep
            value={answers.featureFlags}
            onChange={(v) => setAnswers({ ...answers, featureFlags: v })}
          />
        )}
        {step.key === "third-party" && (
          <ThirdPartyStep
            value={answers.thirdParty}
            onChange={(v) => setAnswers({ ...answers, thirdParty: v })}
          />
        )}
        {step.key === "test-infra" && (
          <TestInfraStep
            value={answers.testInfra}
            onChange={(v) => setAnswers({ ...answers, testInfra: v })}
          />
        )}
        {step.key === "realtime" && (
          <RealtimeStep
            value={answers.realtime}
            onChange={(v) => setAnswers({ ...answers, realtime: v })}
          />
        )}
        {step.key === "meticulous" && (
          <MeticulousStep
            value={answers.meticulous}
            onChange={(v) => setAnswers({ ...answers, meticulous: v })}
          />
        )}

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <Button variant="secondary" onClick={prev}>
            {isFirst ? "Cancel" : "Back"}
          </Button>
          <Button onClick={next}>{isLast ? "Generate report" : "Continue"}</Button>
        </div>
      </Card>
    </div>
  );
}

function stepDescription(key: (typeof STEPS)[number]["key"]): string {
  switch (key) {
    case "basics":
      return "A label for the report you're about to generate.";
    case "auth":
      return "How users get in, and how identity is managed.";
    case "environments":
      return "Where this runs, and how production is isolated from everything else.";
    case "feature-flags":
      return "How changes get gated and rolled out independently of deploys.";
    case "third-party":
      return "Everything this deployment depends on, or is depended on by, outside the core app.";
    case "test-infra":
      return "What actually proves a deploy is safe before it ships.";
    case "realtime":
      return "Live, push-based behaviour and how it degrades under real-world conditions.";
    case "meticulous":
      return "How this app's frontend architecture interacts with Meticulous's recorder, replay engine, and screenshot comparison.";
  }
}
