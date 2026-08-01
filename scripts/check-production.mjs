#!/usr/bin/env node
/**
 * Production verification — asserts the deployed site, not the build output.
 *
 * Every other gate in this repository inspects `dist/`. None of them prove
 * anything about what a user actually receives, because the two can differ in
 * ways that matter enormously:
 *
 *   - `vercel.json` headers only exist if Vercel is reading that file. A
 *     misconfigured project, a different host, or a moved file leaves the CSP
 *     and HSTS silently absent while every local check stays green.
 *   - Deployment Protection puts an auth wall in front of the site. The owner,
 *     already logged in, sees it working. Everyone else sees a login screen.
 *     This check runs unauthenticated, so it catches that.
 *   - A build can succeed and still be served from a stale or wrong deployment.
 *
 * Runs from GitHub Actions rather than a developer machine because the runner
 * has unrestricted egress and is not logged into anything — which is exactly
 * the vantage point of a real visitor.
 *
 * Usage:
 *   PROD_URL=https://upsy-ma.vercel.app node scripts/check-production.mjs
 */

const URL_BASE = (process.env.PROD_URL || "").replace(/\/$/, "");
if (!URL_BASE) {
  console.error("PROD_URL is not set. Nothing to verify.");
  process.exit(1);
}

const failures = [];
const warnings = [];
const notes = [];

/** Headers that must be present. Absence means vercel.json is not being applied. */
const REQUIRED_HEADERS = {
  "content-security-policy": {
    why: "XSS containment. Absent means vercel.json headers are not live.",
    expect: (v) => v.includes("frame-ancestors") && v.includes("default-src"),
  },
  "strict-transport-security": {
    why: "Forces HTTPS. Absent leaves a downgrade window on first visit.",
    expect: (v) => /max-age=\d{6,}/.test(v),
  },
  "x-content-type-options": {
    why: "Blocks MIME sniffing.",
    expect: (v) => v.toLowerCase() === "nosniff",
  },
  "referrer-policy": {
    why: "Stops URLs leaking to third parties — URLs can identify a patient.",
    expect: (v) => v.length > 0,
  },
  "permissions-policy": {
    why: "Restricts camera/mic to same-origin for video sessions.",
    expect: (v) => v.length > 0,
  },
};

async function fetchDoc(path) {
  const res = await fetch(URL_BASE + path, {
    redirect: "manual",
    headers: { "user-agent": "upsy-production-check" },
  });
  return res;
}

console.log(`Verifying ${URL_BASE}\n`);

// --- 1. Is the site reachable and public? -----------------------------------
let root;
try {
  root = await fetchDoc("/");
} catch (e) {
  console.error(`Cannot reach ${URL_BASE}: ${e.message}`);
  process.exit(1);
}

console.log(`  status ${root.status}`);

// Vercel's Deployment Protection answers 401 to unauthenticated visitors. The
// owner's browser is authenticated and sees a working site, so this failure is
// invisible from the dashboard — and total for everyone else.
const location = root.headers.get("location") || "";
const isProtectionWall =
  root.status === 401 ||
  root.status === 403 ||
  /vercel\.com\/sso-api|\/\.well-known\/vercel\/protection/.test(location);

if (isProtectionWall) {
  // Diagnose the actual cause and stop. Continuing would measure headers on
  // Vercel's SSO redirect rather than on the app, and report five confusing
  // "missing header" failures whose real cause is this one line. A gate that
  // misdiagnoses gets distrusted, then ignored.
  console.error("\nPRODUCTION VERIFICATION FAILED\n");
  console.error(
    `  - The site is behind an authentication wall.\n` +
      `    Root returned ${root.status}${location ? ` -> ${location.slice(0, 80)}` : ""}\n\n` +
      `    This is Vercel Deployment Protection. The owner's browser is already\n` +
      `    signed in and sees a working site; every patient and psychologist sees\n` +
      `    a login screen. Nothing behind it can be verified.\n\n` +
      `    Fix: Vercel -> Settings -> Deployment Protection -> Disabled\n` +
      `    (or "Only Preview Deployments" to keep previews private).\n`
  );
  process.exit(1);
}

if (root.status >= 400) {
  failures.push(`Root returned ${root.status}`);
} else if (root.status >= 300) {
  notes.push(`Root redirects to ${location}`);
}

// --- 2. Are the security headers actually being served? ---------------------
console.log("\n  security headers");
for (const [name, spec] of Object.entries(REQUIRED_HEADERS)) {
  const value = root.headers.get(name);
  if (!value) {
    failures.push(`Missing "${name}" — ${spec.why}`);
    console.log(`    MISSING  ${name}`);
  } else if (!spec.expect(value)) {
    warnings.push(`"${name}" present but unexpected: ${value.slice(0, 80)}`);
    console.log(`    odd      ${name}`);
  } else {
    console.log(`    ok       ${name}`);
  }
}

// Headers that should NOT be present.
if (root.headers.get("x-powered-by")) {
  warnings.push("x-powered-by is exposed — unnecessary implementation detail.");
}

// --- 3. Is caching configured so repeat visits are cheap? -------------------
const html = await root.text().catch(() => "");
const assetMatch = html.match(/(?:src|href)="(\/assets\/[^"]+\.js)"/);
if (assetMatch) {
  const asset = await fetch(URL_BASE + assetMatch[1]).catch(() => null);
  const cc = asset?.headers.get("cache-control") || "";
  console.log(`\n  asset cache-control: ${cc || "(none)"}`);
  if (!cc.includes("immutable")) {
    warnings.push(
      `Hashed assets are not served immutable (${cc || "no cache-control"}). ` +
        `Repeat visitors re-download the bundle on every visit.`
    );
  }
} else {
  warnings.push("Could not find a hashed asset in the served HTML.");
}

// --- 4. Do the routes a pilot user needs actually respond? ------------------
const ROUTES = ["/", "/psychologists", "/services", "/pricing", "/auth", "/contact", "/apply"];
console.log("\n  routes");
for (const r of ROUTES) {
  try {
    const res = await fetchDoc(r);
    const ok = res.status < 400;
    if (!ok) failures.push(`${r} returned ${res.status}`);
    console.log(`    ${String(res.status).padEnd(4)} ${r}`);
  } catch (e) {
    failures.push(`${r} threw: ${e.message}`);
  }
}

// --- 5. Crawler-facing files ------------------------------------------------
for (const f of ["/robots.txt", "/sitemap.xml"]) {
  const res = await fetchDoc(f).catch(() => null);
  if (!res || res.status >= 400) warnings.push(`${f} returned ${res?.status ?? "error"}`);
}

// --- report -----------------------------------------------------------------
console.log();
if (notes.length) {
  console.log("Notes");
  for (const n of notes) console.log(`  - ${n}`);
  console.log();
}
if (warnings.length) {
  console.log("Warnings");
  for (const w of warnings) console.log(`  - ${w}`);
  console.log();
}
if (failures.length) {
  console.error("PRODUCTION VERIFICATION FAILED\n");
  for (const f of failures) console.error(`  - ${f}`);
  console.error();
  process.exit(1);
}
console.log("Production verified — reachable unauthenticated, headers served, routes responding.");
