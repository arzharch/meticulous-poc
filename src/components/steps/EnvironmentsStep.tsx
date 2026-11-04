"use client";

import { EnvironmentAnswers } from "@/lib/types";
import { FieldGroup, FieldLabel, RadioCards, Toggle } from "@/components/ui";

export function EnvironmentsStep({
  value,
  onChange,
}: {
  value: EnvironmentAnswers;
  onChange: (v: EnvironmentAnswers) => void;
}) {
  const set = <K extends keyof EnvironmentAnswers>(key: K, v: EnvironmentAnswers[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div>
      <FieldGroup>
        <Toggle
          checked={value.hasPreviewEnvs}
          onChange={(v) => set("hasPreviewEnvs", v)}
          label="Preview / staging environment exists"
          hint="A non-production environment is available before rollout."
        />
      </FieldGroup>

      {value.hasPreviewEnvs && (
        <FieldGroup>
          <FieldLabel>How closely does it mirror production?</FieldLabel>
          <RadioCards
            value={value.envParity}
            onChange={(v) => set("envParity", v)}
            options={[
              { value: "identical", label: "Identical config & scale" },
              { value: "mostly-similar", label: "Mostly similar" },
              { value: "divergent", label: "Significantly different" },
              { value: "unknown", label: "Not sure yet" },
            ]}
          />
        </FieldGroup>
      )}

      <FieldGroup>
        <FieldLabel>Infrastructure type</FieldLabel>
        <RadioCards
          value={value.infraType}
          onChange={(v) => set("infraType", v)}
          options={[
            { value: "serverless", label: "Serverless / managed cloud" },
            { value: "kubernetes", label: "Kubernetes" },
            { value: "vm", label: "VMs / bare instances" },
            { value: "on-prem", label: "On-premises" },
            { value: "hybrid", label: "Hybrid (cloud + on-prem)" },
          ]}
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Region topology</FieldLabel>
        <RadioCards
          value={value.regionTopology}
          onChange={(v) => set("regionTopology", v)}
          options={[
            { value: "single-region", label: "Single region" },
            { value: "multi-region", label: "Multi-region" },
            { value: "unknown", label: "Not sure yet" },
          ]}
        />
      </FieldGroup>

      <FieldGroup>
        <Toggle
          checked={value.dataResidencyConstraints}
          onChange={(v) => set("dataResidencyConstraints", v)}
          label="Data residency constraints apply"
          hint="Regulatory or contractual requirements on where data is stored/processed."
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Secrets management</FieldLabel>
        <RadioCards
          value={value.secretsManagement}
          onChange={(v) => set("secretsManagement", v)}
          options={[
            { value: "vault", label: "Dedicated secrets manager" },
            { value: "platform-env", label: "Platform env vars" },
            { value: "manual", label: "Manual / shared files" },
            { value: "unknown", label: "Not sure yet" },
          ]}
        />
      </FieldGroup>
    </div>
  );
}
