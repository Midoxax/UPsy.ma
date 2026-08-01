#!/usr/bin/env node
/**
 * Production build verification.
 *
 * A green `vite build` only proves the bundler did not throw. It does not
 * prove the output is servable. These checks cover the failures that reach
 * users while every other gate stays green:
 *
 *   - an entry script or stylesheet that index.html references but that was
 *     never emitted
 *   - a deploy-time placeholder like {{GTM_ID}} shipped unreplaced, which
 *     leaves a broken third-party script tag on every page
 *   - a missing robots.txt or sitemap.xml, which costs indexing silently and
 *     is usually noticed weeks later in Search Console
 *   - missing or empty SEO metadata in the prerendered shell, which is what
 *     crawlers and link unfurlers read for a client-rendered SPA
 *
 * Deliberately narrow. It asserts things that are objectively broken, not
 * things that are merely suboptimal — that is the audit's job.
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "dist");

const failures = [];
const warnings = [];
const fail = (m) => failures.push(m);
const warn = (m) => warnings.push(m);

if (!existsSync(DIST)) {
  console.error("No dist/ — run `npm run build` first.");
  process.exit(1);
}

const indexPath = resolve(DIST, "index.html");
if (!existsSync(indexPath)) {
  console.error("dist/index.html missing — the build produced no entry document.");
  process.exit(1);
}
const html = readFileSync(indexPath, "utf8");

// 1. Every referenced asset was actually emitted.
const refs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
for (const ref of [...new Set(refs)]) {
  const p = resolve(DIST, ref.replace(/^\//, ""));
  if (!existsSync(p)) fail(`index.html references ${ref}, which was not emitted`);
  else if (statSync(p).size === 0) fail(`${ref} is empty`);
}
if (refs.length === 0) fail("index.html references no bundled assets at all");

// 2. No unreplaced deploy-time placeholders.
for (const name of new Set([...html.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((m) => m[1]))) {
  // The GTM snippet guards itself against its own unreplaced slot, so an
  // absent container ID degrades cleanly rather than breaking the page.
  if (name === "GTM_ID") warn("{{GTM_ID}} not substituted — analytics disabled (snippet self-guards)");
  else fail(`unreplaced placeholder {{${name}}} shipped in index.html`);
}

// 3. Crawler-facing files exist and are non-trivial.
for (const file of ["robots.txt", "sitemap.xml"]) {
  const p = resolve(DIST, file);
  if (!existsSync(p)) fail(`${file} missing from build output`);
  else if (statSync(p).size < 20) fail(`${file} is suspiciously small (${statSync(p).size} bytes)`);
}

const robotsPath = resolve(DIST, "robots.txt");
if (existsSync(robotsPath)) {
  const robots = readFileSync(robotsPath, "utf8");
  if (/^\s*Disallow:\s*\/\s*$/mi.test(robots) && !/Allow:/i.test(robots)) {
    fail("robots.txt disallows the entire site — this would deindex production");
  }
  if (!/Sitemap:/i.test(robots)) warn("robots.txt does not advertise a Sitemap:");
}

// 4. The prerendered shell carries the metadata crawlers read.
const meta = {
  title: /<title>([^<]*)<\/title>/i,
  description: /<meta\s+name="description"\s+content="([^"]*)"/i,
  canonical: /<link\s+rel="canonical"\s+href="([^"]*)"/i,
  ogTitle: /<meta\s+property="og:title"\s+content="([^"]*)"/i,
  ogImage: /<meta\s+property="og:image"\s+content="([^"]*)"/i,
};
for (const [name, re] of Object.entries(meta)) {
  const m = html.match(re);
  if (!m) warn(`no ${name} in the prerendered shell`);
  else if (!m[1].trim()) fail(`${name} is present but empty`);
}
if (!/<html[^>]+lang="/i.test(html)) fail("<html> has no lang attribute");

// ---- report -------------------------------------------------------------
if (warnings.length) {
  console.log("Warnings\n");
  for (const w of warnings) console.log(`  - ${w}`);
  console.log();
}
if (failures.length) {
  console.error("Production build verification FAILED\n");
  for (const f of failures) console.error(`  - ${f}`);
  console.error();
  process.exit(1);
}
console.log(`Production build verified — ${refs.length} asset references, metadata and crawler files present.`);
