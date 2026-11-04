"use client";

import { TestInfraAnswers } from "@/lib/types";
import { FieldGroup, FieldLabel, RadioCards, TextInput, Toggle } from "@/components/ui";

export function TestInfraStep({
  value,
  onChange,
}: {
  value: TestInfraAnswers;
  onChange: (v: TestInfraAnswers) => void;
}) {
  const set = <K extends keyof TestInfraAnswers>(key: K, v: TestInfraAnswers[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div>
      <FieldGroup>
        <FieldLabel hint="e.g. GitHub Actions, CircleCI, Jenkins, GitLab CI">
          CI/CD platform
        </FieldLabel>
        <TextInput
          value={value.ciCdPlatform}
          onChange={(v) => set("ciCdPlatform", v)}
          placeholder="e.g. GitHub Actions"
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>End-to-end test coverage</FieldLabel>
        <RadioCards
          value={value.e2eCoverage}
          onChange={(v) => set("e2eCoverage", v)}
          options={[
            { value: "none", label: "None" },
            { value: "smoke", label: "Smoke tests only" },
            { value: "partial", label: "Partial coverage" },
            { value: "comprehensive", label: "Comprehensive" },
          ]}
        />
      </FieldGroup>

      <FieldGroup>
        <Toggle
          checked={value.stagingMirrorsProd}
          onChange={(v) => set("stagingMirrorsProd", v)}
          label="Staging mirrors production config"
          hint="Same env vars, scale assumptions, and third-party sandbox/live split where it matters."
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Test data strategy</FieldLabel>
        <RadioCards
          value={value.testDataStrategy}
          onChange={(v) => set("testDataStrategy", v)}
          options={[
            { value: "synthetic", label: "Synthetic / generated" },
            { value: "anonymized-prod", label: "Anonymized prod data" },
            { value: "shared-prod", label: "Shared live prod data" },
            { value: "unknown", label: "Not sure yet" },
          ]}
        />
      </FieldGroup>

      <FieldGroup>
        <Toggle
          checked={value.loadTested}
          onChange={(v) => set("loadTested", v)}
          label="Load tested"
          hint="A load test has been run against realistic traffic shapes, not just steady RPS."
        />
      </FieldGroup>
    </div>
  );
}
