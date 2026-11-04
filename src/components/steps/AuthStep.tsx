"use client";

import { AuthAnswers } from "@/lib/types";
import { FieldGroup, FieldLabel, RadioCards, TextInput, Toggle } from "@/components/ui";

export function AuthStep({
  value,
  onChange,
}: {
  value: AuthAnswers;
  onChange: (v: AuthAnswers) => void;
}) {
  const set = <K extends keyof AuthAnswers>(key: K, v: AuthAnswers[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div>
      <FieldGroup>
        <FieldLabel hint="How end users authenticate into this deployment.">
          Authentication method
        </FieldLabel>
        <RadioCards
          value={value.method}
          onChange={(v) => set("method", v)}
          options={[
            { value: "oauth", label: "OAuth 2.0 / OIDC" },
            { value: "saml-sso", label: "SAML / Enterprise SSO" },
            { value: "basic", label: "Username & password" },
            { value: "custom", label: "Custom / in-house" },
            { value: "multiple", label: "Multiple methods" },
            { value: "none", label: "None (public / unauthenticated)" },
          ]}
        />
      </FieldGroup>

      {value.method === "saml-sso" && (
        <FieldGroup>
          <FieldLabel hint="e.g. Okta, Azure AD, Ping, OneLogin, Google Workspace">
            Identity provider (if known)
          </FieldLabel>
          <TextInput value={value.idp} onChange={(v) => set("idp", v)} placeholder="e.g. Okta" />
        </FieldGroup>
      )}

      <FieldGroup>
        <FieldLabel>Session strategy</FieldLabel>
        <RadioCards
          value={value.sessionStrategy}
          onChange={(v) => set("sessionStrategy", v)}
          options={[
            { value: "cookie", label: "Server-set cookie" },
            { value: "jwt", label: "Client-held JWT" },
            { value: "server-session", label: "Server-side session store" },
            { value: "unknown", label: "Not yet confirmed" },
          ]}
        />
      </FieldGroup>

      <FieldGroup>
        <Toggle
          checked={value.multiTenant}
          onChange={(v) => set("multiTenant", v)}
          label="Multi-tenant deployment"
          hint="Multiple customer organizations or workspaces share this deployment."
        />
      </FieldGroup>

      <FieldGroup>
        <Toggle
          checked={value.mfaEnabled}
          onChange={(v) => set("mfaEnabled", v)}
          label="MFA enforced"
          hint="Multi-factor auth is required, either by us or the customer's IdP."
        />
      </FieldGroup>

      <FieldGroup>
        <Toggle
          checked={value.tokenRefreshHandled}
          onChange={(v) => set("tokenRefreshHandled", v)}
          label="Token refresh flow confirmed"
          hint="Silent refresh or re-auth on token expiry has been explicitly tested."
        />
      </FieldGroup>
    </div>
  );
}
