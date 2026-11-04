"use client";

import { FeatureFlagAnswers } from "@/lib/types";
import { FieldGroup, FieldLabel, RadioCards, Toggle } from "@/components/ui";

export function FeatureFlagsStep({
  value,
  onChange,
}: {
  value: FeatureFlagAnswers;
  onChange: (v: FeatureFlagAnswers) => void;
}) {
  const set = <K extends keyof FeatureFlagAnswers>(key: K, v: FeatureFlagAnswers[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div>
      <FieldGroup>
        <Toggle
          checked={value.usesFeatureFlags}
          onChange={(v) =>
            onChange({
              ...value,
              usesFeatureFlags: v,
              provider: v ? (value.provider === "none" ? "custom" : value.provider) : "none",
            })
          }
          label="Feature flags are in use"
          hint="Any mechanism for gating functionality independent of deploys."
        />
      </FieldGroup>

      {value.usesFeatureFlags && (
        <>
          <FieldGroup>
            <FieldLabel>Provider</FieldLabel>
            <RadioCards
              value={value.provider}
              onChange={(v) => set("provider", v)}
              options={[
                { value: "launchdarkly", label: "LaunchDarkly" },
                { value: "split", label: "Split" },
                { value: "unleash", label: "Unleash" },
                { value: "custom", label: "Custom / in-house" },
              ]}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Rollout strategy</FieldLabel>
            <RadioCards
              value={value.rolloutStrategy}
              onChange={(v) => set("rolloutStrategy", v)}
              options={[
                { value: "percentage", label: "Percentage-based" },
                { value: "user-targeted", label: "User / cohort targeted" },
                { value: "big-bang", label: "All-or-nothing" },
                { value: "unknown", label: "Not decided yet" },
              ]}
            />
          </FieldGroup>

          <FieldGroup>
            <Toggle
              checked={value.staleFlagCleanup}
              onChange={(v) => set("staleFlagCleanup", v)}
              label="Stale flags get cleaned up"
              hint="There's a process for retiring flags once a rollout is complete."
            />
          </FieldGroup>
        </>
      )}
    </div>
  );
}
