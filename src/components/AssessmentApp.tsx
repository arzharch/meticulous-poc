"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Answers, defaultAnswers } from "@/lib/types";
import { evaluateRules } from "@/lib/rules";
import { buildResult } from "@/lib/scoring";
import { decodeAnswers } from "@/lib/share";
import { Intro } from "@/components/Intro";
import { Wizard } from "@/components/Wizard";
import { Report } from "@/components/Report";

type Mode = "intro" | "wizard" | "report";

function fromSharedLink(encoded: string | null): Answers | null {
  if (!encoded) return null;
  return decodeAnswers(encoded);
}

export function AssessmentApp() {
  const searchParams = useSearchParams();
  const shared = useMemo(() => fromSharedLink(searchParams.get("d")), [searchParams]);

  const [mode, setMode] = useState<Mode>(shared ? "report" : "intro");
  const [answers, setAnswers] = useState<Answers>(shared ?? defaultAnswers);

  const result = useMemo(() => buildResult(evaluateRules(answers)), [answers]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMode("intro")}
            className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition"
          >
            Deployment Readiness Assessor
          </button>
          <span className="text-xs text-slate-400">Prototype</span>
        </div>
      </header>

      <main className="flex-1">
        {mode === "intro" && <Intro onStart={() => setMode("wizard")} />}
        {mode === "wizard" && (
          <Wizard
            initial={answers}
            onComplete={(a) => {
              setAnswers(a);
              setMode("report");
            }}
            onCancel={() => setMode("intro")}
          />
        )}
        {mode === "report" && (
          <Report
            answers={answers}
            result={result}
            onRestart={() => {
              setAnswers(defaultAnswers);
              setMode("intro");
            }}
            onEdit={() => setMode("wizard")}
          />
        )}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>Built by Arsh Chowhan — a prototype exploring the Meticulous FDE role.</span>
          <span className="flex gap-3">
            <a
              href="https://github.com/arzharch"
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-600"
            >
              GitHub
            </a>
            <a
              href="https://arzharch-portfolio.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-600"
            >
              Portfolio
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
