# Fix the Vercel deployment failure (invalid rewrite pattern)

## What Vercel is complaining about

The build is rejected before it runs because one rewrite rule uses a regex negative lookahead:

```text
/(?!assets/|api/|robots.txt|sitemap.xml|sw.js|manifest.json|_next/|public/)(.*)
```

Vercel's route matcher (path-to-regexp) does not support `(?!...)` lookaheads in `source`. Any config containing it fails validation at deploy time.

## Where that rule is (and is not)

The `vercel.json` currently in this repository does **not** contain that pattern. Its single rewrite is the correct SPA fallback:

```json
{ "source": "/(.*)", "destination": "/index.html" }
```

So the invalid rule is coming from outside this checkout — most likely one of:

1. A rewrite added manually in the Vercel dashboard (Project Settings > Rewrites), which is merged with `vercel.json`.
2. The Git branch/commit Vercel is actually building is not the branch this checkout reflects (an older or divergent commit that still has the lookahead rule).

I cannot read your Vercel project settings from here, so step 1 of the fix is a check you run.

## Plan

1. **Confirm the source.** Open the failed deployment in Vercel and check which commit it built, then check Project Settings for any dashboard-defined rewrite. If the rule is in the dashboard, delete it — `vercel.json` already handles SPA routing correctly and no lookahead rule is needed.
2. **Harden `vercel.json` so the lookahead is never needed.** Vercel already serves real static files (anything in `public/` and the built `assets/`) before applying rewrites, so excluding them by regex is unnecessary. I will keep the SPA fallback as-is and add an explicit negative-free guard only if you want belt-and-braces: instead of a lookahead, use ordered rewrites that leave known static paths untouched, e.g. pass-through entries for `/robots.txt`, `/sitemap.xml`, `/sw.js`, `/manifest.webmanifest` placed before the catch-all.
3. **Add a config validation step** to `scripts/check-production.mjs` that fails locally/CI if any `source` in `vercel.json` contains `(?!` or `(?=`, so this class of error is caught before a deploy attempt instead of at Vercel.
4. **Redeploy** and confirm the build passes and deep links (e.g. `/observatoire`, `/psychologists/...`) still resolve through `index.html`.

## Technical notes

- Supported Vercel `source` syntax: literal paths, `:param`, `:param*`, and a limited `(regex)` inside a segment. Lookaheads/lookbehinds are rejected.
- Exclusion is expressed with `has`/`missing` conditions or ordered routes, not with negative regex.
- `cleanUrls: true` and `trailingSlash: false` stay unchanged; they do not interact with this failure.
- No application code, CSP headers, or cache headers change.
