"use client";

import { RealtimeAnswers } from "@/lib/types";
import { FieldGroup, FieldLabel, RadioCards, Toggle } from "@/components/ui";

export function RealtimeStep({
  value,
  onChange,
}: {
  value: RealtimeAnswers;
  onChange: (v: RealtimeAnswers) => void;
}) {
  const set = <K extends keyof RealtimeAnswers>(key: K, v: RealtimeAnswers[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div>
      <FieldGroup>
        <Toggle
          checked={value.usesRealtime}
          onChange={(v) =>
            onChange({
              ...value,
              usesRealtime: v,
              mechanism: v ? (value.mechanism === "none" ? "websockets" : value.mechanism) : "none",
            })
          }
          label="Realtime behaviour is part of this deployment"
          hint="Live updates, notifications, collaborative editing, dashboards, etc."
        />
      </FieldGroup>

      {value.usesRealtime && (
        <>
          <FieldGroup>
            <FieldLabel>Mechanism</FieldLabel>
            <RadioCards
              value={value.mechanism}
              onChange={(v) => set("mechanism", v)}
              options={[
                { value: "websockets", label: "WebSockets" },
                { value: "sse", label: "Server-Sent Events" },
                { value: "polling", label: "Polling" },
                { value: "queue", label: "Message queue / pub-sub" },
              ]}
            />
          </FieldGroup>

          <FieldGroup>
            <Toggle
              checked={value.reconnectHandling}
              onChange={(v) => set("reconnectHandling", v)}
              label="Reconnect handling confirmed"
              hint="Client gracefully reconnects and resyncs after a dropped connection."
            />
          </FieldGroup>

          <FieldGroup>
            <Toggle
              checked={value.idempotencyHandled}
              onChange={(v) => set("idempotencyHandled", v)}
              label="Message handling is idempotent"
              hint="Receiving the same event twice doesn't cause duplicate side effects."
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Load characteristics</FieldLabel>
            <RadioCards
              value={value.loadCharacteristics}
              onChange={(v) => set("loadCharacteristics", v)}
              options={[
                { value: "steady", label: "Steady" },
                { value: "bursty", label: "Bursty / spiky" },
                { value: "unknown", label: "Not sure yet" },
              ]}
            />
          </FieldGroup>
        </>
      )}
    </div>
  );
}
