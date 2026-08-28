# Fix the GitHub Actions pipelines (CI, Deploy, Production check)

All three workflows fail for the same underlying reason: they were written for the old Vite + React Router + npm/Vercel setup, and the project has since moved to TanStack Start (server-rendered), bun, and Cloudflare Workers. The workflows were never updated, so they fail on the very first steps.

## What is actually broken (verified)

1. **`npm ci` fails in every job.** There is no `package-lock.json` in the repository — the project uses `bun.lock`. Both CI jobs, the deploy job, and the production check all run `npm ci` before anything else, so every run dies immediately. This alone explains 100% of the red runs.
2. **Type check points at a file that no longer exists.** CI runs `npx tsc --noEmit -p tsconfig.app.json`; only `tsconfig.json` exists now.
3. **Build-output gates assume the old SPA layout.** `scripts/verify-build.mjs` and `scripts/check-bundle-size.mjs` both require `dist/index.html`. The server-rendered build now emits `dist/client/` (assets) and `dist/server/` (the Worker) — there is no `index.html`.
4. **The browser audit serves the wrong thing.** CI starts `vite preview` on port 4173, which does not serve the Worker build, so the accessibility audit runs against a dead or wrong server.
5. **Production check has no live site to check.** `https://www.upsy.ma/` currently returns **404** (nothing published/deployed to it yet), so that workflow will stay red regardless of code quality. It also still contains Vercel-era assumptions (deployment_status events, preview URLs, `vercel.json` headers).

## The fix

**Track A — make the pipeline run at all (unblocks everything)**
- Switch all three workflows from `npm ci` to bun (`oven-sh/setup-bun` + `bun install --frozen-lockfile`), and run the scripts with bun/node consistently.
- Point the type check at `tsconfig.json`.
- Keep the existing ratchets (`continue-on-error` on lint and Deno checks) exactly as they are.

**Track B — teach the gates about the new build**
- Update `verify-build.mjs` to validate the server-rendered output: `dist/server/` Worker entry present, `dist/client/assets/` non-empty, `robots.txt` / `sitemap.xml` present, no unreplaced `{{TOKEN}}` placeholders.
- Update `check-bundle-size.mjs` to measure the client asset directory (entry JS + CSS budget) instead of parsing `index.html`, re-pinning budgets to today's real output.
- Replace `vite preview` in the audit job with `wrangler dev` against the built Worker (or the Nitro server output), then run the existing Playwright/axe audit against it unchanged.

**Track C — production check**
- Drop the Vercel-specific branches (deployment_status filter, per-deployment URL warnings) and target the Cloudflare origin.
- Make the scheduled run fail loudly only when a deploy has actually happened; until the first successful Cloudflare deploy, the workflow should be triggered manually rather than on a daily cron that is guaranteed red.
- Once the Deploy workflow succeeds, re-enable the daily schedule.

**Order of work:** A first (one commit, turns CI green through the install step), then B (build gates), then C (production check). Each track is verified locally by running the same commands the workflow runs before pushing.

## Note on secrets

The Deploy workflow needs `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and the `VITE_*` values set as repository secrets. I cannot set those — they have to be added in the GitHub repository settings. If they are not set yet, the deploy job will still fail at the Cloudflare step even after this fix, and I will flag exactly which one is missing.
