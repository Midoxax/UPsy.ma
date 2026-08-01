# Deployment

Clone to production with no undocumented steps. If something here does not
work, that is a bug in this document — fix it in the same PR.

## Runtime contract

One set of assumptions, enforced in four places so they cannot drift apart:

| | Value | Declared in |
|---|---|---|
| Node | 20.x | `.nvmrc`, `engines.node` |
| Package manager | npm 10 | `packageManager`, `engines.npm` |
| Install | `npm ci` | `vercel.json`, CI workflow |
| Build | `npm run build` | `vercel.json`, CI workflow |

**npm only.** `bun.lock` and `bun.lockb` were removed: Vercel auto-detects a
bun lockfile when present, so production was installing through bun while CI
installed through npm — two different resolvers, neither written down. If you
reintroduce bun, do it everywhere at once and update this table.

`vercel.json` now sets `installCommand` and `buildCommand` explicitly rather
than relying on auto-detection, so the deploy runs the same commands CI proves
on every pull request.

## Local setup

```bash
nvm use                 # reads .nvmrc
npm ci                  # not `npm install` — ci respects the lockfile exactly
cp .env.example .env    # if you do not already have one
npm run dev             # http://localhost:8080
```

`npm run predev` regenerates `public/sitemap.xml` automatically. On a machine
without IPv6, `npm run dev -- --host 127.0.0.1` (the default `host: "::"` fails
with `EAFNOSUPPORT` in some containers).

## Environment variables

Only `VITE_`-prefixed variables reach the client. Vite inlines them into the
bundle, so **every one of them is public** — including the Supabase anon key,
which is safe because row-level security is what actually protects the data.

| Variable | Required | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | yes | Anon key (public by design) |
| `VITE_SUPABASE_PROJECT_ID` | yes | Project identifier |
| `VITE_SENTRY_DSN` | no | Error tracking; SDK is not bundled without it |
| `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` | no | Analytics; both required together |
| `VITE_APP_VERSION` | no | Release tag on Sentry events |

**Secrets never go in `.env`.** That file is tracked. A service-role key, Stripe
secret or Resend key committed there is in git history permanently. Put them in
Vercel's environment settings, or in `.env.local` for local work — that file is
gitignored. `npm run check:env` fails the build on any non-`VITE_` key in a
tracked `.env`, and runs first in CI.

## Verify before pushing

```bash
npm run verify
```

Runs, in order: committed-secret check → type check → production build →
bundle budget → build verification. Same steps CI runs, so a green `verify`
means a green pipeline for everything except lint and the browser audit.

For the full browser audit:

```bash
npm run build
npx vite preview --host 127.0.0.1 --port 4173 &
npm install --no-save playwright @axe-core/playwright
npm run test:audit
```

## CI

`.github/workflows/ci.yml`, on every pull request. Two parallel jobs:

**Types, lint, secrets** — committed-secret check, `tsc --noEmit`, ESLint,
`npm audit`.

**Build and browser audit** — production build, bundle budget, build
verification, then the browser audit against a real preview server.

### Quality gates and how to tighten them

Each gate blocks at a level the codebase currently meets, and is designed to be
ratcheted. This is deliberate: a gate that is red the day it lands gets
switched off, and everything it would have caught later goes with it.

| Gate | Blocks on now | Tighten by |
|---|---|---|
| Committed secrets | any non-`VITE_` key | already strict |
| Type check | any error | already strict |
| Security audit | high/critical in prod deps | `--audit-level=moderate` |
| Bundle budget | >1% or 2 KB over `bundle-budget.json` | lower the numbers |
| Build verification | missing assets, placeholders, robots/sitemap | already strict |
| Browser audit | critical findings | `AUDIT_FAIL_ON=serious` |
| Lint | nothing (~450 pre-existing problems) | drop `continue-on-error` |

**The bundle budget is the one to understand.** It is pinned to what the build
produces today, not to a target. Landing an optimisation means lowering the
number in the same PR, so the win cannot be quietly spent later. Growing the
bundle means raising it in the same PR, so the cost is visible in review.

```bash
UPDATE_BUDGET=1 node scripts/check-bundle-size.mjs   # after an intentional change
```

## Production deploy

Vercel builds from `main`. Pull requests get preview deployments using the same
`installCommand` and `buildCommand`, so a preview is a faithful rehearsal.

Already configured in `vercel.json`, no action needed:

- **Security headers** — CSP, HSTS (`preload`), `frame-ancestors 'none'`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- **Caching** — `/assets/*` and fonts immutable for a year (safe: filenames are
  content-hashed); `/api/*` `no-store`
- **Compression** — Vercel negotiates Brotli/gzip at the edge automatically
- **`cleanUrls`**, no trailing slash

Adding a third-party script, font or API host means adding it to the CSP in
`vercel.json`, or the browser will block it in production while it works fine
locally.

### Rollback

Vercel keeps every deployment. Promote the last good one from the dashboard —
instant, no rebuild. Because assets are content-hashed and immutable, a
rollback cannot serve a mismatched bundle.

If a bad deploy reached users, also consider the service worker: `registerType:
"autoUpdate"` means clients pick up the new build on next navigation, but a
client mid-session may hold the old one until then.

## Health checks

`.github/workflows/smoke-test.yml` runs daily and on demand, checking that key
routes return 200 against `SMOKE_URL` (defaults to the Lovable preview domain —
**point this at the real production domain**). It runs after deploy, so treat
it as monitoring, not a gate.

## Known deployment gaps

1. **No staging environment.** Preview deployments are per-PR; there is no
   long-lived pre-production environment against production-like data.
2. **No uptime or performance monitoring.** Sentry captures errors when a DSN
   is set; nothing watches availability or Core Web Vitals in the field.
3. **No automated rollback trigger.** Rollback is a human action.
4. **Smoke test targets the preview domain** by default.
5. **The daily smoke test is the only post-deploy verification.** No synthetic
   check of authenticated flows.
