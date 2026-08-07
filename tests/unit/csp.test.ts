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
import { readFileSync, existsSync } from "node:fs";
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

/**
 * Third-party origins the app is configured to talk to, read from the tracked
 * .env.
 *
 * The site's own origin is excluded: `connect-src 'self'` already covers
 * same-origin requests, and requiring an explicit entry for it would demand a
 * redundant CSP source that changes every time the domain does.
 */
function configuredOrigins(): Array<{ key: string; origin: string }> {
  const env = readFileSync(resolve(ROOT, ".env"), "utf8");
  const ownOrigin = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8")).homepage;
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
    if (!url) continue;
    const origin = `https://${url[1]}`;
    if (origin === ownOrigin) continue; // covered by 'self'
    out.push({ key: m[1], origin });
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

/**
 * SEO origin consistency.
 *
 * The canonical origin was hardcoded in 21 files and pointed at a host with no
 * DNS record. A canonical tag is an instruction to search engines — naming an
 * unreachable host tells Google the indexable version of every page does not
 * exist, which suppresses indexing rather than merely misattributing it. The
 * same literal in og:image is why link previews did not render.
 *
 * Nothing in a build catches this: the site renders perfectly, and the damage
 * is entirely off-site and invisible until traffic never arrives.
 */
describe("SEO origin is internally consistent", () => {
  const html = readFileSync(resolve(ROOT, "index.html"), "utf8");
  const robots = readFileSync(resolve(ROOT, "public/robots.txt"), "utf8");
  const homepage: string = JSON.parse(
    readFileSync(resolve(ROOT, "package.json"), "utf8")
  ).homepage;

  it("package.json declares a homepage", () => {
    expect(homepage, "homepage drives the sitemap, robots and production check").toMatch(
      /^https:\/\/[^/]+$/
    );
  });

  it("the static canonical and og:url match the declared homepage", () => {
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
    const ogUrl = html.match(/property="og:url" content="([^"]+)"/)?.[1];
    for (const [name, value] of [["canonical", canonical], ["og:url", ogUrl]] as const) {
      expect(value, `${name} is absent from index.html`).toBeTruthy();
      expect(
        new URL(value!).origin,
        `${name} points at ${value}, but the site is served from ${homepage}`
      ).toBe(homepage);
    }
  });

  it("robots.txt advertises the sitemap on that same origin", () => {
    const advertised = robots.match(/^Sitemap:\s*(\S+)/m)?.[1];
    expect(advertised, "robots.txt has no Sitemap line").toBeTruthy();
    expect(new URL(advertised!).origin).toBe(homepage);
  });

  it("no absolute URL in index.html points at a different origin than the site", () => {
    // Third-party hosts are expected; a *different* first-party origin is the bug.
    const origins = [...html.matchAll(/https:\/\/[a-z0-9.-]+/g)].map((m) => m[0]);
    const strayFirstParty = origins.filter((o) => /upsy/i.test(o) && o !== homepage);
    expect(strayFirstParty, "a stale first-party origin is still hardcoded").toEqual([]);
  });
});

/**
 * The social preview image must exist and be what it claims to be.
 *
 * Two separate faults lived here. The og:image pointed at a Lovable-published
 * path absent from the Vercel build, so every share requested a 404. And the
 * asset that *should* have been used, public/og-image.png, is a JPEG carrying a
 * .png extension — served as image/png under `X-Content-Type-Options: nosniff`,
 * which tells the client not to correct the mismatch.
 *
 * Neither is visible from the app: link previews are rendered by other people's
 * crawlers, so the only symptom is that shares look broken somewhere you never
 * look.
 */
describe("og:image is real and correctly typed", () => {
  const html = readFileSync(resolve(ROOT, "index.html"), "utf8");
  const ogImage = html.match(/property="og:image" content="([^"]+)"/)?.[1] ?? "";
  const declaredType = html.match(/property="og:image:type" content="([^"]+)"/)?.[1] ?? "";

  /** Magic bytes, because the extension has already lied once. */
  function sniff(buf: Buffer): "png" | "jpeg" | "unknown" {
    if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
    return "unknown";
  }

  it("points at a file that ships in public/", () => {
    expect(ogImage, "index.html declares no og:image").toBeTruthy();
    const path = new URL(ogImage).pathname;
    expect(
      existsSync(resolve(ROOT, "public", path.replace(/^\//, ""))),
      `og:image points at ${path}, which is not in public/ — every share will request a 404`
    ).toBe(true);
  });

  it("declares the content type the bytes actually are", () => {
    const path = new URL(ogImage).pathname.replace(/^\//, "");
    const actual = sniff(readFileSync(resolve(ROOT, "public", path)));
    const declared = declaredType.split("/")[1]?.replace("jpg", "jpeg");
    expect(
      actual,
      `${path} contains ${actual} bytes but og:image:type says ${declaredType}. ` +
        `nosniff is set, so the client is told not to correct this.`
    ).toBe(declared);
  });

  it("has an extension matching its bytes, so the server sends the right MIME", () => {
    const path = new URL(ogImage).pathname.replace(/^\//, "");
    const actual = sniff(readFileSync(resolve(ROOT, "public", path)));
    const ext = path.split(".").pop()?.replace("jpg", "jpeg");
    expect(actual, `${path} is ${actual} data — rename it so its extension matches`).toBe(ext);
  });
});
