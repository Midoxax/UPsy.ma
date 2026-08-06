/**
 * OAuth sign-in must go through Supabase, not Lovable.
 *
 * `@lovable.dev/cloud-auth-js` navigated the browser to `/~oauth/initiate` — a
 * path served by Lovable's own hosting and by nothing else. Once the app moved
 * to Vercel, every Google and Apple sign-in on www.upsy.ma ended on a 404. It
 * was invisible from the code: the call succeeded, the browser navigated, and
 * the failure happened on a URL no test or build ever requested.
 *
 * These assertions are structural on purpose. A real OAuth round trip cannot be
 * exercised here — it needs a browser, an external provider, and Supabase
 * redirect URLs configured in the dashboard — so what is held instead is the
 * property that broke: sign-in must not depend on Lovable's hosting.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");
const read = (p: string) => readFileSync(resolve(ROOT, p), "utf8");

describe("OAuth does not depend on Lovable hosting", () => {
  it("declares no Lovable auth dependency", () => {
    const pkg = JSON.parse(read("package.json"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(
      deps["@lovable.dev/cloud-auth-js"],
      "reinstating this package reintroduces the /~oauth/initiate 404 on any host that is not Lovable"
    ).toBeUndefined();
  });

  it("has no source file importing the Lovable auth wrapper", () => {
    // The wrapper module itself is gone; guard against it coming back.
    expect(existsSync(resolve(ROOT, "src/integrations/lovable/index.ts"))).toBe(false);
  });

  it("routes social sign-in through supabase.auth.signInWithOAuth", () => {
    const auth = read("src/pages/Auth.tsx");
    expect(auth).toMatch(/supabase\.auth\.signInWithOAuth/);
    expect(auth, "Auth.tsx must not call the Lovable wrapper").not.toMatch(
      /lovable\.auth\.signInWithOAuth/
    );
  });

  it("keeps detectSessionInUrl enabled, which completes the round trip", () => {
    // Turning this off makes OAuth fail silently: the user returns from the
    // provider, no session is read from the URL, and nothing errors.
    const client = read("src/integrations/supabase/client.ts");
    expect(client).toMatch(/detectSessionInUrl:\s*true/);
  });
});

/**
 * A social sign-in button must not be shown unless it can succeed.
 *
 * Supabase answered /authorize with 400 `validation_failed — missing OAuth
 * secret`: no client credentials were configured for the provider. That is a
 * dashboard fault, not a code one, and no code change can fix it — but showing
 * a button that always fails is a choice the code does make.
 *
 * Someone arriving to book a first session with a psychologist should not meet
 * a broken door. Email and password sign-in works; the social buttons stay
 * hidden until a provider is deliberately enabled.
 */
describe("social sign-in buttons are gated on real configuration", () => {
  it("shows no provider by default", async () => {
    const { OAUTH_PROVIDERS, hasAnyOAuth } = await import("@/config/auth");
    expect(
      OAUTH_PROVIDERS,
      "an unset VITE_OAUTH_PROVIDERS must render no social buttons — the providers are unconfigured in Supabase"
    ).toEqual([]);
    expect(hasAnyOAuth()).toBe(false);
  });

  it("renders each button behind its own enablement check", () => {
    const auth = read("src/pages/Auth.tsx");
    expect(auth).toMatch(/isOAuthEnabled\("google"\)\s*&&/);
    expect(auth).toMatch(/isOAuthEnabled\("apple"\)\s*&&/);
    expect(auth, "the whole block should disappear when nothing is enabled").toMatch(
      /if\s*\(!hasAnyOAuth\(\)\)\s*return null/
    );
  });
});
