"use client";

import { ThirdPartyAnswers, ThirdPartyService } from "@/lib/types";
import { Button, FieldGroup, FieldLabel, Select, TextInput, Toggle } from "@/components/ui";

const SERVICE_TYPES: { value: ThirdPartyService["type"]; label: string }[] = [
  { value: "payment", label: "Payment" },
  { value: "analytics", label: "Analytics" },
  { value: "auth", label: "Auth / Identity" },
  { value: "webhook", label: "Webhook source" },
  { value: "email", label: "Email / SMS" },
  { value: "data", label: "Data / storage" },
  { value: "other", label: "Other" },
];

const CRITICALITY: { value: ThirdPartyService["criticality"]; label: string }[] = [
  { value: "critical", label: "Critical — blocks core flow" },
  { value: "important", label: "Important" },
  { value: "nice-to-have", label: "Nice to have" },
];

export function ThirdPartyStep({
  value,
  onChange,
}: {
  value: ThirdPartyAnswers;
  onChange: (v: ThirdPartyAnswers) => void;
}) {
  const set = <K extends keyof ThirdPartyAnswers>(key: K, v: ThirdPartyAnswers[K]) =>
    onChange({ ...value, [key]: v });

  const addService = () => {
    const service: ThirdPartyService = {
      id: Math.random().toString(36).slice(2),
      name: "",
      type: "other",
      criticality: "important",
    };
    set("services", [...value.services, service]);
  };

  const updateService = (id: string, patch: Partial<ThirdPartyService>) => {
    set(
      "services",
      value.services.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const removeService = (id: string) => {
    set("services", value.services.filter((s) => s.id !== id));
  };

  return (
    <div>
      <FieldGroup>
        <FieldLabel hint="Anything external the deployment calls out to or receives calls from.">
          Third-party services
        </FieldLabel>
        <div className="space-y-2">
          {value.services.map((s) => (
            <div
              key={s.id}
              className="flex flex-col sm:flex-row gap-2 rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex-1">
                <TextInput
                  value={s.name}
                  onChange={(v) => updateService(s.id, { name: v })}
                  placeholder="Service name, e.g. Stripe"
                />
              </div>
              <div className="w-full sm:w-44">
                <Select
                  value={s.type}
                  onChange={(v) => updateService(s.id, { type: v })}
                  options={SERVICE_TYPES}
                />
              </div>
              <div className="w-full sm:w-56">
                <Select
                  value={s.criticality}
                  onChange={(v) => updateService(s.id, { criticality: v })}
                  options={CRITICALITY}
                />
              </div>
              <Button variant="ghost" onClick={() => removeService(s.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-2">
          <Button variant="secondary" onClick={addService}>
            + Add service
          </Button>
        </div>
      </FieldGroup>

      <FieldGroup>
        <Toggle
          checked={value.inboundWebhooks}
          onChange={(v) => set("inboundWebhooks", v)}
          label="Accepts inbound webhooks"
          hint="A third party calls into this deployment (e.g. payment or messaging webhooks)."
        />
      </FieldGroup>

      <FieldGroup>
        <Toggle
          checked={value.rateLimitsKnown}
          onChange={(v) => set("rateLimitsKnown", v)}
          label="Rate limits are known"
          hint="Documented limits for both outbound calls and inbound traffic from these services."
        />
      </FieldGroup>

      <FieldGroup>
        <Toggle
          checked={value.outagePlaybook}
          onChange={(v) => set("outagePlaybook", v)}
          label="Outage playbook exists"
          hint="There's a defined degraded-mode behaviour if a critical dependency goes down."
        />
      </FieldGroup>
    </div>
  );
}
