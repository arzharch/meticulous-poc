import { Answers } from "./types";

export function encodeAnswers(answers: Answers): string {
  const json = JSON.stringify(answers);
  const b64 = typeof window !== "undefined"
    ? window.btoa(encodeURIComponent(json))
    : Buffer.from(json, "utf-8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeAnswers(encoded: string): Answers | null {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = typeof window !== "undefined"
      ? decodeURIComponent(window.atob(padded))
      : Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(json) as Answers;
  } catch {
    return null;
  }
}
