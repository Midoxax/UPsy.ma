/**
 * Content-Security-Policy invariants.
 *
 * The CSP in vercel.json and the third-party services in .env are two halves of
 * one decision that nothing keeps together. Configure a service and forget the
 * policy, and the browser blocks every request to it — silently, in production
 * only, with no build error and no server-side symptom. Error reporting fails
 * this way especially quietly: the tool whose job is to tell you something
 * broke is the thing that is broken, so the first sign is an eerily clean
 * dashboard.
 *
 * That is not hypothetical here. `VITE_SENTRY_DSN` was configured while
 * `connect-src` still had no Sentry host, which would have dropped every event.
 *
 * These tests hold the policy to two properties: the origins the app is
 * configured to call are allowed, and the directives that make the policy worth
 * having are still present.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");

const csp: string = (() => {
  const vercel = JSON.parse(readFileSync(resolve(ROOT, "vercel.json"), "utf8"));
  for (const entry of vercel.headers ?? []) {
    const header = (entry.headers ?? []).find(
      (h: { key: string }) => h.key.toLowerCase() === "content-security-policy"
    );
    if (header) return header.value as string;
  }
  throw new Error("No Content-Security-Policy header defined in vercel.json");
})();

/** The origins a directive allows, e.g. directiveOf("connect-src"). */
function directiveOf(name: string): string[] {
  const found = csp
    .split(";")
    .map((d) => d.trim())
    .find((d) => d === name || d.startsWith(`${name} `));
  return found ? found.split(/\s+/).slice(1) : [];
}

/**
 * True when `origin` is permitted, accounting for CSP's single-label wildcard:
 * `https://*.posthog.com` matches `https://eu.posthog.com` but not a bare
 * `https://posthog.com`.
 */
function allows(directive: string, origin: string): boolean {
  const host = new URL(origin).host;
  return directiveOf(directive).some((source) => {
    if (source === "'self'" || source === "*") return source === "*";
    let candidate = source;
    if (candidate.startsWith("https://") || candidate.startsWith("wss://")) {
      candidate = candidate.replace(/^(https|wss):\/\//, "");
    }
    if (candidate.startsWith("*.")) {
      const suffix = candidate.slice(1); // ".posthog.com"
      return host.endsWith(suffix) && host.length > suffix.length;
    }
    return candidate === host;
  });
}

/** Origins the app is configured to talk to, read from the tracked .env. */
function configuredOrigins(): Array<{ key: string; origin: string }> {
  const env = readFileSync(resolve(ROOT, ".env"), "utf8");
  const out: Array<{ key: string; origin: string }> = [];
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"\n]+)"?/);
    if (!m) continue;
    // A DSN embeds credentials before the host; a URL does not. Both reduce to
    // an origin the browser will be asked to reach.
    const value = m[2].trim();
    const url = value.match(/https:\/\/(?:[^@\s/]*@)?([^/\s]+)/);
    if (url) out.push({ key: m[1], origin: `https://${url[1]}` });
  }
  return out;
}

describe("CSP covers configured services", () => {
  it("allows every external origin configured in .env", () => {
    for (const { key, origin } of configuredOrigins()) {
      expect(
        allows("connect-src", origin),
        `${key} points at ${origin}, which connect-src does not allow. The browser ` +
          `will block every request to it in production. Add it to the CSP in vercel.json.`
      ).toBe(true);
    }
  });

  it("allows Supabase over both HTTPS and websockets", () => {
    // Realtime subscriptions use wss://; allowing only https:// breaks them in
    // a way that looks like a Supabase outage rather than a policy problem.
    expect(allows("connect-src", "https://vuawmihxcaewzmkuarkr.supabase.co")).toBe(true);
    expect(
      directiveOf("connect-src").some((s) => s.startsWith("wss://")),
      "connect-src has no wss:// source — Supabase Realtime cannot connect"
    ).toBe(true);
  });
});

describe("CSP keeps its load-bearing directives", () => {
  it("denies framing entirely", () => {
    // Clickjacking protection for an authenticated clinical surface.
    expect(directiveOf("frame-ancestors")).toEqual(["'none'"]);
  });

  it("blocks plugin content and restricts form targets", () => {
    expect(directiveOf("object-src")).toEqual(["'none'"]);
    expect(directiveOf("form-action")).toEqual(["'self'"]);
  });

  it("defaults to same-origin", () => {
    expect(directiveOf("default-src")).toEqual(["'self'"]);
  });

  it("never allows a wildcard origin in connect-src", () => {
    expect(directiveOf("connect-src")).not.toContain("*");
  });
});
