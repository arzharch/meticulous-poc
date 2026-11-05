"use client";

import { MeticulousAnswers } from "@/lib/types";
import { FieldGroup, FieldLabel, RadioCards, Toggle } from "@/components/ui";

export function MeticulousStep({
  value,
  onChange,
}: {
  value: MeticulousAnswers;
  onChange: (v: MeticulousAnswers) => void;
}) {
  const set = <K extends keyof MeticulousAnswers>(key: K, v: MeticulousAnswers[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div>
      <FieldGroup>
        <FieldLabel hint="The primary frontend framework this app is built with.">
          Framework
        </FieldLabel>
        <RadioCards
          value={value.framework}
          onChange={(v) => set("framework", v)}
          options={[
            { value: "next-app", label: "Next.js (App Router)" },
            { value: "next-pages", label: "Next.js (Pages Router)" },
            { value: "react-spa", label: "React SPA (CRA / Vite)" },
            { value: "vue", label: "Vue / Nuxt" },
            { value: "angular", label: "Angular" },
            { value: "svelte", label: "Svelte / SvelteKit" },
            { value: "other", label: "Other" },
          ]}
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel hint="How the app renders HTML — affects how Meticulous captures and replays sessions.">
          Primary rendering mode
        </FieldLabel>
        <RadioCards
          value={value.renderingMode}
          onChange={(v) => set("renderingMode", v)}
          options={[
            { value: "csr", label: "Client-side only", hint: "SPA, JS renders everything" },
            { value: "ssr", label: "Server-side rendered", hint: "HTML generated per request" },
            { value: "ssg", label: "Static site generation", hint: "HTML built at deploy time" },
            { value: "isr", label: "Incremental static", hint: "Static + on-demand revalidation" },
            { value: "streaming", label: "Streaming SSR", hint: "Partial HTML streams to client" },
            { value: "mixed", label: "Mixed / hybrid" },
            { value: "unknown", label: "Not sure" },
          ]}
        />
      </FieldGroup>

      <FieldGroup>
        <Toggle
          checked={value.hasStrictCsp}
          onChange={(v) => set("hasStrictCsp", v)}
          label="Strict Content Security Policy"
          hint="The app enforces script-src, frame-src, or connect-src restrictions."
        />
      </FieldGroup>

      <FieldGroup>
        <Toggle
          checked={value.authGatedPages}
          onChange={(v) => set("authGatedPages", v)}
          label="Pages behind authentication"
          hint="Key user flows require login to access."
        />
      </FieldGroup>

      <FieldGroup>
        <Toggle
          checked={value.hasAnimations}
          onChange={(v) => {
            set("hasAnimations", v);
            if (!v) set("animationTypes", ["none"]);
          }}
          label="UI animations"
          hint="Page transitions, loading skeletons, micro-interactions, animated charts."
        />
      </FieldGroup>

      {value.hasAnimations && (
        <FieldGroup>
          <FieldLabel hint="Select all that apply — different animation types need different handling.">
            Animation types
          </FieldLabel>
          <div className="space-y-2">
            {(
              [
                { value: "css-transitions", label: "CSS transitions / keyframes", hint: "Handled well by Meticulous" },
                { value: "js-driven", label: "JS-driven (GSAP, Framer Motion, rAF)", hint: "Likely source of flakes" },
                { value: "lottie-webgl", label: "Lottie / WebGL / Canvas", hint: "Non-deterministic — needs ignore regions" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const current = value.animationTypes.filter((t) => t !== "none");
                  const next = current.includes(opt.value)
                    ? current.filter((t) => t !== opt.value)
                    : [...current, opt.value];
                  set("animationTypes", next.length ? next : ["none"]);
                }}
                className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                  value.animationTypes.includes(opt.value)
                    ? "border-indigo-500 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="block font-medium">{opt.label}</span>
                {opt.hint && <span className="block text-xs text-slate-500 mt-0.5">{opt.hint}</span>}
              </button>
            ))}
          </div>
        </FieldGroup>
      )}

      <FieldGroup>
        <Toggle
          checked={value.hasDynamicContent}
          onChange={(v) => {
            set("hasDynamicContent", v);
            if (!v) set("dynamicContentTypes", ["none"]);
          }}
          label="Dynamic / non-deterministic content"
          hint="Dates, relative timestamps, random IDs, user-specific data, live feeds."
        />
      </FieldGroup>

      {value.hasDynamicContent && (
        <FieldGroup>
          <FieldLabel hint="Select all that apply.">
            Dynamic content types
          </FieldLabel>
          <div className="space-y-2">
            {(
              [
                { value: "dates", label: "Dates / relative timestamps", hint: "'3 minutes ago', 'Today'" },
                { value: "user-specific", label: "User-specific data", hint: "Profile info, personalised dashboards" },
                { value: "random-ids", label: "Random IDs in UI", hint: "UUIDs, order numbers shown on screen" },
                { value: "live-data", label: "Live data feeds", hint: "Stock prices, notification counts, chat" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const current = value.dynamicContentTypes.filter((t) => t !== "none");
                  const next = current.includes(opt.value)
                    ? current.filter((t) => t !== opt.value)
                    : [...current, opt.value];
                  set("dynamicContentTypes", next.length ? next : ["none"]);
                }}
                className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                  value.dynamicContentTypes.includes(opt.value)
                    ? "border-indigo-500 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="block font-medium">{opt.label}</span>
                {opt.hint && <span className="block text-xs text-slate-500 mt-0.5">{opt.hint}</span>}
              </button>
            ))}
          </div>
        </FieldGroup>
      )}

      <FieldGroup>
        <Toggle
          checked={value.hasThirdPartyEmbeds}
          onChange={(v) => {
            set("hasThirdPartyEmbeds", v);
            if (!v) set("embedTypes", ["none"]);
          }}
          label="Third-party UI embeds"
          hint="Chat widgets, analytics overlays, cookie banners, CAPTCHAs, ad units."
        />
      </FieldGroup>

      {value.hasThirdPartyEmbeds && (
        <FieldGroup>
          <FieldLabel hint="Select all present — these need to be blocked or ignored during replay.">
            Embed types
          </FieldLabel>
          <div className="space-y-2">
            {(
              [
                { value: "chat-widget", label: "Chat widget (Intercom, Drift, etc.)" },
                { value: "analytics-overlay", label: "Analytics overlay (Hotjar, FullStory badge)" },
                { value: "cookie-banner", label: "Cookie consent banner" },
                { value: "captcha", label: "CAPTCHA (reCAPTCHA, hCaptcha)" },
                { value: "ads", label: "Ad units" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const current = value.embedTypes.filter((t) => t !== "none");
                  const next = current.includes(opt.value)
                    ? current.filter((t) => t !== opt.value)
                    : [...current, opt.value];
                  set("embedTypes", next.length ? next : ["none"]);
                }}
                className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                  value.embedTypes.includes(opt.value)
                    ? "border-indigo-500 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="block font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </FieldGroup>
      )}

      <FieldGroup>
        <FieldLabel hint="External fonts can cause flaky diffs if they fail to load during replay.">
          Font loading strategy
        </FieldLabel>
        <RadioCards
          value={value.fontStrategy}
          onChange={(v) => set("fontStrategy", v)}
          options={[
            { value: "self-hosted", label: "Self-hosted", hint: "Most reliable for replay" },
            { value: "google-fonts", label: "Google Fonts" },
            { value: "typekit", label: "Adobe Typekit" },
            { value: "system", label: "System fonts only" },
            { value: "mixed", label: "Mix of sources" },
            { value: "unknown", label: "Not sure" },
          ]}
        />
      </FieldGroup>

      <FieldGroup>
        <Toggle
          checked={value.usesServiceWorkers}
          onChange={(v) => set("usesServiceWorkers", v)}
          label="Uses service workers"
          hint="PWA offline support, background sync, push notifications."
        />
      </FieldGroup>

      <FieldGroup>
        <Toggle
          checked={value.usesWebWorkers}
          onChange={(v) => set("usesWebWorkers", v)}
          label="Uses Web Workers / WASM"
          hint="Heavy computation offloaded to workers, or WebAssembly modules."
        />
      </FieldGroup>

      <FieldGroup>
        <Toggle
          checked={value.usesWebGL}
          onChange={(v) => set("usesWebGL", v)}
          label="Uses WebGL / Canvas rendering"
          hint="3D visualisations, canvas-based charts, map renderers."
        />
      </FieldGroup>

      <FieldGroup>
        <Toggle
          checked={value.existingVisualTests}
          onChange={(v) => {
            set("existingVisualTests", v);
            if (!v) set("existingTestTool", "none");
          }}
          label="Has existing visual regression tests"
          hint="Currently using another visual testing tool."
        />
      </FieldGroup>

      {value.existingVisualTests && (
        <FieldGroup>
          <FieldLabel>Current visual testing tool</FieldLabel>
          <RadioCards
            value={value.existingTestTool}
            onChange={(v) => set("existingTestTool", v)}
            options={[
              { value: "chromatic", label: "Chromatic" },
              { value: "percy", label: "Percy" },
              { value: "applitools", label: "Applitools" },
              { value: "backstop", label: "BackstopJS" },
              { value: "other", label: "Other" },
            ]}
          />
        </FieldGroup>
      )}

      <FieldGroup>
        <Toggle
          checked={value.internationalized}
          onChange={(v) => {
            set("internationalized", v);
            if (!v) set("localeCount", 1);
          }}
          label="Internationalized (i18n)"
          hint="App supports multiple languages or locales."
        />
      </FieldGroup>

      {value.internationalized && (
        <FieldGroup>
          <FieldLabel>How many locales?</FieldLabel>
          <RadioCards
            value={
              value.localeCount <= 3
                ? "2-3"
                : value.localeCount <= 10
                ? "4-10"
                : "10+"
            }
            onChange={(v) =>
              set(
                "localeCount",
                v === "2-3" ? 2 : v === "4-10" ? 6 : 15
              )
            }
            options={[
              { value: "2-3", label: "2–3 locales" },
              { value: "4-10", label: "4–10 locales" },
              { value: "10+", label: "10+ locales" },
            ]}
          />
        </FieldGroup>
      )}

      <FieldGroup>
        <Toggle
          checked={value.usesFeatureFlagsForUI}
          onChange={(v) => set("usesFeatureFlagsForUI", v)}
          label="Feature flags change the visual UI"
          hint="Flags control which components, layouts, or styles users see."
        />
      </FieldGroup>

      {(value.renderingMode === "ssr" ||
        value.renderingMode === "streaming" ||
        value.renderingMode === "isr" ||
        value.renderingMode === "mixed") && (
        <>
          <FieldGroup>
            <Toggle
              checked={value.containerDeployable}
              onChange={(v) => set("containerDeployable", v)}
              label="App can be containerised (Docker)"
              hint="Meticulous hosts a container image of SSR apps for replay."
            />
          </FieldGroup>

          <FieldGroup>
            <Toggle
              checked={value.mathRandomInSSR}
              onChange={(v) => set("mathRandomInSSR", v)}
              label="Uses Math.random() in server components"
              hint="Random values in server-rendered output break replay determinism."
            />
          </FieldGroup>
        </>
      )}
    </div>
  );
}
