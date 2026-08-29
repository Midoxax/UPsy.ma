# Compliance, ops surfacing, CRM funnels, CI safety & experiment auto-promotion

## Where we stopped

The database layer for the previous compliance/CRM wave is fully applied and
live: `audit_log` (append-only, 6-yr retention), `app_logs` + `log_app_event`
+ `app_logs_search`/`app_logs_stats`, `data_subject_requests` +
`dsr_submit`/`dsr_export_my_data`, `crm_consents` + `crm_record_consent`/
`crm_consent_evidence`, and the full CRM ops set (`crm_staff`,
`crm_automation_rules`, `crm_notifications`, `crm_email_*`,
`crm_pipeline_forecast`, `crm_next_best_actions`). The experiments framework
(`home_hero_v1` with control/clarity/offer, SSR-sticky cookie assignment, GTM
exposure events) is also live.

What is **not** built yet is everything that *surfaces* this to admins and the
outside world — the UI, the HTTP endpoints, the CI safety nets, and the
funnel/ experiment analytics. The eight requests below close that gap.

## Group A — Ops & compliance surfacing

### 1. Deploy health-check route
- New `src/routes/api/public/health.ts` (public, no auth): verifies
  `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are
  non-empty server-side, that the publishable client can reach the DB
  (`SELECT 1`), build version (`VITE_APP_VERSION`/git sha), and returns
  `{ status: "ok"|"degraded", checks, version, timestamp }`.
- Simple `/api/public/healthz` → `200 ok` text for uptime monitors.
- `scripts/check-production.mjs` already pings the site; it will start using
  `/api/public/health` for a structured signal.

### 2. Structured server-side logging + admin log viewer (CSV)
- `log_app_event()` already exists. Wire it into: the health route
  (`deploy_check` events), `src/lib/error-capture.ts` (runtime errors →
  `runtime_error`), and a new public **client-side error ingest**
  `/api/public/runtime-logs` (rate-limited by IP via `edge_rate_limits`, no
  PII, writes via service role inside the handler) so browser errors land in
  `app_logs` too.
- New admin tab **Operations log** inside `/admin/audit` (AuditTrail.tsx):
  filters (level/source/env/search/date), table view, stats tiles from
  `app_logs_stats`, and CSV export reusing `rowsToCsv`. Hook
  `src/hooks/admin/useAppLogs.ts` calling `app_logs_search`/`app_logs_stats`.
- Deployment events retained 6 years, runtime errors 13 months (retention
  already enforced by the existing cron purge job).

### 3. DNS cutover checklist page
- New admin route `/admin/dns` (`src/pages/admin/DnsChecklist.tsx`):
  - Static reference: records to update (apex + `www` A/AAAA → Cloudflare,
    MX for transactional email, SPF/DKIM/DMARC TXT, CNAMEs), TTL guidance
    (drop to 300 s pre-cutover, raise to 3600 s after stable), and success
    signals (HTTP 200 on `/` and `/api/public/health`, valid TLS cert, DNS
    propagation via DoH, email deliverability check).
  - Live panel: pings `/api/public/health` and a DNS-over-HTTPS resolver
    against the apex + www, showing current resolved IPs and cert status so
    the page doubles as a cutover dashboard.

## Group B — CRM funnels & Observatoire report

### 4. Campaign funnel performance metrics (by variant & source/utm)
- **New table** `public.funnel_events`:
  `id, experiment_id, variant, step, utm_source, utm_medium, utm_campaign,
  utm_content, session_token, contact_id, user_id, created_at` + GRANTs +
  RLS (anon INSERT for tracking pixel, authenticated SELECT for admins via
  `has_role`). Migration follows the 4-step GRANT/RLS pattern.
- Capture points (server-side, no browser PII): hero CTA → `/get-matched`,
  FreeScore completion, Observatoire opt-in, proposal request, signup, booking
  confirm. Each writes a `funnel_events` row tagged with the resolved variant
  (from the cookie) + utm params.
- **New RPC** `funnel_metrics(_from, _to)`: per-variant and per-utm-source
  counts at each step + conversion rate. Admin-only (`has_role('admin')`).
- New **Funnels** tab in `CrmManager.tsx` (`CrmFunnelPanel.tsx`): variant
  comparison bars + source/utm breakdown + CSV export.

### 5. Observatoire funnel report (last 7 days)
- **New RPC** `observatoire_funnel_report(_days)`: counts (anonymity-safe,
  no answers) of starts (`survey_responses` created), in-progress
  (`completed=false`), completions (`completed=true`), opt-ins
  (`growth_leads` source='observatoire'), and CRM-tagged leads
  (`crm_contacts` from observatoire), with step→step conversion rates.
- Admin widget inside the Funnels tab (or a dedicated card on the CRM
  overview): 7-day funnel with rates, plus a CSV export.

## Group C — CI safety & security

### 6. Automated rollback workflow (one click)
- New `.github/workflows/rollback.yml` (`workflow_dispatch` with
  `environment` choice): lists the last successful Worker version via
  `wrangler versions list --config dist/server/wrangler.json` (built from the
  repo on the runner), then rolls traffic to the previous version with
  `wrangler versions deploy --version-id <prev>`. Falls back to redeploying
  the last green commit if no prior version is found. Posts the result to
  `app_logs` (`deploy_rollback`) via the health/ingest endpoint.

### 7. Scheduled security scans in CI + admin surface
- New `.github/workflows/security-scan.yml`: cron (daily 04:00 UTC) + on PR.
  Runs `bun audit` and the Supabase DB linter
  (`supabase db lint --linked`, via `SUPABASE_ACCESS_TOKEN` secret) + the
  existing `scripts/check-supabase-sync.mjs`. Posts a JSON findings snapshot
  to a protected endpoint `/api/public/security-scan` (shared
  `SECURITY_SCAN_WEBHOOK_SECRET`), stored in `app_logs`
  (`source='security_scan'`). Fails the job only on new critical findings;
  opens/updates a tracking GitHub issue on regression.
- Admin **Security** tab in `/admin/audit`: reads `app_logs` where
  `source='security_scan'`, shows last-run summary, critical/ warning counts,
  deep-link to the GitHub Actions run, and a "re-run scan" note. CSV export.

## Group D — Experiment auto-promotion

### 8. Automatic promotion to the winning Home hero variant
- **New table** `public.experiment_winners`:
  `experiment_id, winning_variant, decided_at, traffic_per_arm,
  control_rate, winner_rate, lift_pct, confidence, promoted_by, auto`.
  GRANTs + RLS (admin manage, authenticated read).
- **New RPC** `home_hero_winner()`: reads `funnel_events` for
  `home_hero_v1`, computes per-variant conversion (signup/booking as the
  conversion), runs a two-proportion z-test, returns a decision only when
  each arm has ≥ 500 exposures AND lift ≥ 10% at 95% confidence — otherwise
  "inconclusive".
- **New RPC** `home_hero_forced_variant()`: returns the promoted winner if
  one exists, else NULL. `resolveExperiments` consults it and, when set,
  forces **all** visitors into the winning variant (test ended) — safer than
  editing config files at runtime.
- **pg_cron** nightly job calls `promote_home_hero_winner()` which, on a
  conclusive result, inserts into `experiment_winners` (auto=true).
- Admin **Experiments** panel (in CRM or audit): live variant conversion
  table, traffic counts, confidence, and a manual "Promote now" button
  (`promote_home_hero_winner(_auto:=false)`).

## Implementation order & waves

1. **Wave 1 — migrations** (one `supabase--migration` call): `funnel_events`,
   `experiment_winners`, the four RPCs (`funnel_metrics`,
   `observatoire_funnel_report`, `home_hero_winner`, `home_hero_forced_variant`,
   `promote_home_hero_winner`), and the pg_cron auto-promote schedule. RLS +
   GRANTs on every new table.
2. **Wave 2 — ops surfacing** (Group A): health route, runtime-logs ingest,
   admin Operations-log tab + hook, DNS checklist page + route.
3. **Wave 3 — CRM funnels** (Group B): capture wiring, `CrmFunnelPanel`,
   Observatoire report widget.
4. **Wave 4 — CI** (Group C): rollback + security-scan workflows, the
   security-scan ingest endpoint, admin Security tab.
5. **Wave 5 — experiment analytics** (Group D): `resolveExperiments` winner
   check, admin Experiments panel, manual-promote button.

## Notes & secrets you'll need to add
- `SECURITY_SCAN_WEBHOOK_SECRET` — random value for the CI → admin scan
  pipeline (I'll generate it via the secrets tool).
- `SUPABASE_ACCESS_TOKEN` — for `supabase db lint --linked` in CI (GitHub
  repo secret; I cannot set GitHub secrets, only flag it).
- Rollback + deploy workflows already need `CLOUDFLARE_*` secrets (existing).

## Out of scope (explicitly)
- No new Supabase Edge Functions (all server logic via `createServerFn` /
  server routes per the TanStack stack).
- No client-side analytics SDK changes beyond the existing GTM dataLayer.
- Observatoire answers never leave the anonymity wall — reports are counts
  only.
