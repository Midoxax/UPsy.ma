# U.Psy — Architecture

Orientation for an engineer joining this codebase. It documents what is
actually here, including the parts that need work, rather than an idealised
version of the system.

## Stack

| Concern | Choice |
|---|---|
| Build | Vite 5 + `@vitejs/plugin-react-swc` |
| Language | TypeScript (strict off — see Debt) |
| UI | React 18, SPA, `react-router-dom` v6 |
| Styling | Tailwind + CSS custom properties, shadcn/ui (Radix) |
| Data | Supabase (Postgres, Auth, Storage, Realtime) |
| Server state | TanStack Query |
| Motion | framer-motion, GSAP, Lenis; Three.js via react-three-fiber |
| Hosting | Vercel (`vercel.json`) |
| Errors / analytics | Sentry, PostHog, GTM — all optional, gated on env vars |

This is a **client-rendered SPA**, not Next.js. There is no SSR and no
server-side rendering path. Every route ships as JavaScript and renders in the
browser. That is the single most consequential architectural fact here: it sets
the performance ceiling (see Debt) and means SEO depends on the prerendered
`index.html` plus `SEOHead`, not on server output.

## Layout

```
src/
  pages/          route components, one per screen; lazy-loaded from App.tsx
  components/
    ui/           shadcn primitives — treat as vendored, avoid editing
    home/         homepage sections
    <domain>/     feature components grouped by domain
  contexts/       AuthContext, LocaleContext, ThemeContext
  lib/
    i18n/         translations.ts (all locales), utils, homeCopy
    motion/       animation tokens, variants, motion components
    analytics/    sentry.ts, posthog.ts — both lazy, both optional
  integrations/
    supabase/     generated client + database types
    lovable/      OAuth wrapper — see "Lovable coupling"
  hooks/          shared hooks
  ops/            internal operations console (lazy, separate entry)
tests/
  audit/run.mjs   browser audit: a11y, overflow, tap targets, i18n leaks
  visual/run.ts   screenshot regression harness (needs Playwright installed)
scripts/
  check-env-safety.mjs   blocks committing secrets to a tracked .env
  generate-sitemap.ts    runs automatically on predev/prebuild
```

## Routing and layout

All 78 routes are declared in `src/App.tsx`. Every page except `Index` is
`React.lazy`-loaded, so each route is its own chunk. Locale-prefixed paths
(`/fr/...`, `/ar/...`) resolve through `stripLocalePrefix` / `addLocalePrefix`
in `lib/i18n/utils`.

Provider order matters and is intentional:

```
ThemeProvider → LocaleProvider → AuthProvider → QueryClientProvider → Router
```

Route protection is composed rather than centralised: `ProtectedRoute`
(authenticated), `AdminRoute` (admin), and `RoleRouter` (dispatch by role).
Dashboards additionally sit behind an `ErrorBoundary` with
`DashboardErrorFallback`.

## Theming

Three preferences — `light`, `dark`, `system` — defaulting to `system`.

- Tokens are CSS custom properties in `src/index.css` under `:root` and `.dark`
- `ThemeContext` exposes `theme` (the preference) and `resolvedTheme` (what is
  actually painted). **Anything that needs a concrete palette must use
  `resolvedTheme`** — `"system"` is not a colour
- The class is applied by a **blocking snippet in `index.html`**, before first
  paint. React's first commit happens after the browser paints, so applying it
  in an effect flashes the light palette at dark-mode users on every cold load.
  That snippet and `ThemeContext` share a storage key and must stay in sync
- Never hardcode palette classes (`text-u-white`, `text-u-gray-300`). They do
  not adapt, and shipping them is what put white-on-white text in the language
  switcher. Use semantic tokens: `text-foreground`, `text-muted-foreground`,
  `bg-background`, `border-border`

## Internationalisation

Four locales (`en`, `fr`, `ar`, `ber`) in a single `lib/i18n/translations.ts`.

`t(key)` resolves **requested locale → English → empty string**. It returns
empty, not the key, on a total miss. That is deliberate: 326 of 404 call sites
are written `t("some.key") || "Inline default"`, and returning the key made
every one of those fallbacks unreachable, because a key is truthy. Missing keys
warn in development.

Arabic sets `dir="rtl"` on `<html>`. Use logical CSS properties (`ms-`, `me-`,
`start-`, `end-`) rather than `ml-`/`mr-` so layouts mirror correctly.

## Security model

Access control lives in **Postgres row-level security**, not in the client. All
127 tables have RLS enabled across 413 policies. This is the strongest part of
the system and the reason the Supabase anon key being public is not a problem —
it grants nothing on its own.

`.env` is tracked and must contain **only `VITE_`-prefixed values**, which Vite
inlines into the client bundle and are public by definition. Real secrets go in
Vercel's environment settings or `.env.local` (gitignored).
`scripts/check-env-safety.mjs` enforces this in CI.

Security headers — CSP, HSTS with preload, `frame-ancestors 'none'`,
Permissions-Policy — are in `vercel.json`. Adding a third-party script or API
means updating the CSP there.

## Performance model

Two rules carry most of the weight:

1. **Decorative work must never block or break content.** The homepage's 3D
   backdrop loads on `requestIdleCallback` and is skipped entirely when the
   client signals Data Saver, sub-4g, or under 4 GB of memory — 847 KB, 44% of
   homepage JS, that constrained visitors never pay for. It also sits behind
   its own `ErrorBoundary`; a failed asset fetch previously replaced the whole
   landing page with an error screen.
2. **Measure, do not assume.** An attempt at manual vendor chunking here made
   first-paint JS *worse* (1.1 MB → 2.4 MB) by breaking the lazy boundary that
   kept Three.js out of the entry. Vite's automatic chunking beat it. Always
   compare a production build before and after.

## Lovable coupling

This repository originated in Lovable. Remaining ties:

| Reference | Impact |
|---|---|
| `@lovable.dev/cloud-auth-js` in `integrations/lovable` | **Hard runtime dependency — OAuth sign-in** |
| `lovable-tagger` in `vite.config.ts` | Dev-only, harmless |
| `ai.gateway.lovable.dev` in the CSP | Allowlist entry |
| `lovableproject.com` hostname check in `main.tsx` | Environment detection |

Only the first matters. OAuth routes through Lovable's cloud auth while
everything else uses Supabase Auth — two auth systems for one product. Migrating
to `supabase.auth.signInWithOAuth` removes the dependency, but **requires the
OAuth providers to be configured in the Supabase dashboard first**; changing the
code before that breaks sign-in.

## Verification

```bash
npm run verify      # secret check + typecheck + build
npm run lint
npm run test:audit  # needs a preview server on :4173
```

The audit drives a real browser over the public routes in both themes at
multiple widths, reporting WCAG 2.1 A/AA violations, horizontal overflow,
sub-minimum tap targets, page errors and leaked translation keys. It exits
non-zero on critical/serious findings and gates CI (`.github/workflows/ci.yml`).

To run it locally:

```bash
npm run build
npx vite preview --host 127.0.0.1 --port 4173 &
npm install --no-save playwright @axe-core/playwright
npm run test:audit
```

Audit tooling is intentionally **not** in `package.json`: the repo carries both
`bun.lock` and `package-lock.json`, and adding devDependencies without being
able to regenerate `bun.lock` risks breaking the deploy install. Resolving that
to one package manager is the prerequisite for making it a normal devDependency.

## Known debt

Ordered by impact.

1. **~1 MB entry chunk, FCP ~3.2s** on throttled mobile. The largest identified
   cause is `lib/i18n/translations.ts` — 78 KB gzipped of all four locales
   shipped to every visitor. Splitting per locale saves ~52 KB gz for English
   readers. Blocked on five files reading `translations[locale]` synchronously
   for arrays, plus an admin panel needing all locales at once; naive async
   loading risks a flash of English or an LTR→RTL flip on Arabic.
2. **Light-mode `--primary` is gold at 1.74:1 on ivory.** Every `text-primary`
   on a light surface fails WCAG AA. Fixing it means deciding whether gold
   survives as a text colour, which repaints CTAs platform-wide — a brand
   decision.
3. **No unit or integration tests.** The audit covers rendered output only.
   `t()`, `ThemeContext` and the auth guards are the highest-value first targets.
4. **~450 lint problems**, ~400 of them `any`. CI reports but does not fail on
   these yet; ratchet to blocking once cleared.
5. **Header nav links measure 20px** against the 24px WCAG 2.2 target minimum,
   despite padding that should clear it. Cause not yet identified.
6. **Three lockfiles** (`bun.lock`, `bun.lockb`, `package-lock.json`).
7. **`/pricing` has no French or Arabic copy** — falls back to English.
8. **68 of 78 routes unaudited.** The audit covers 10 public routes; the
   authenticated dashboards and the ops console are untested.
