# U.Psy Independence & Platform Runbook

You asked for documentation only — no code changes in this pass. The output is a
set of runbooks committed to the repo (`docs/runbooks/`) that you, or Claude Code
working directly on the GitHub repo, can execute step by step.

## What gets written

### 1. `00-exit-and-ownership.md` — leaving Lovable mediation
- Connect the project to GitHub, clone locally, and point Claude Code at the repo
  (full read/write, no Lovable in the loop).
- Deploy the TanStack Start app from that repo to Vercel or Cloudflare; move
  `upsy.ma` / `www.upsy.ma` DNS off Lovable.
- Migrate Lovable Cloud → your own Supabase org: schema dump, data dump, auth
  users, storage buckets, the 33 edge functions, every runtime secret, and the
  env-var swap. Includes the ordered cutover with a rollback point and the parts
  that need reconfiguring by hand (Google/Apple OAuth, Resend sending domain,
  cron schedules).

### 2. `01-compliance-and-audit.md` — HIPAA / GDPR / Law 09-08
- Data classification: clinical vs marketing vs operational, and which tables
  hold each.
- Encryption at rest (column-level for notes, already partly in place via the
  encrypt/decrypt functions) and in transit (TLS, no PII in URLs or logs).
- Privacy tiers: client / specialist / assistant / admin, and the exact RLS and
  role-check pattern each tier uses.
- **Audit trail**: an append-only `audit_log` table (who, what record, what
  action, when, from where), written by database triggers so it cannot be
  bypassed by application code, retained 6 years, readable only by admins, and
  never updatable or deletable.
- A signed BAA/DPA checklist for every subprocessor (hosting, database, email,
  AI, video) — HIPAA in particular is a contract question before it is a code
  question.

### 3. `02-crm-and-back-channels.md`
- Data model for the CRM layer: contacts, organisations, pipeline stages,
  activities, consent state, source attribution.
- Back-channel design: server-side event bus so the site never talks to third
  parties directly from the browser; every outbound call runs through the server
  and is logged.
- Where the existing pieces plug in (growth leads, proposal requests, intake,
  bookings, quiz results).

### 4. `03-payments-and-legal.md`
- Direct bank-transfer flow under auto-entrepreneur status: invoice issuance,
  payment reference matching, reconciliation, and what the platform may and may
  not hold.
- VAT/tax notes for auto-entrepreneur, invoice numbering rules, retention.
- Contract set: client T&C, specialist agreement, organisation contract,
  DPA/privacy notice, consent forms — where each is surfaced and stored with
  proof of acceptance.

### 5. `04-growth-seo-content.md`
- Professional-targeting keyword map and the blog/landing structure that serves
  it, building on the pages already live.
- Automatic social distribution and internal-link maintenance.
- Newsletter: list model, consent and unsubscribe, AI-assisted drafting with a
  human approval step before anything sends.

### 6. `05-data-and-training.md`
- Separating clinical data (never leaves the boundary, never trains anything)
  from marketing and operational data.
- What a supervision / performance dataset for psychologists would need:
  de-identification, explicit opt-in, an ethics gate, and the legal basis. This
  section is deliberately conservative — it documents the conditions, not a
  green light.

### 7. `06-design-system-consolidation.md`
- One audit pass listing every layout inconsistency across marketing, dashboard
  and OPS surfaces, and the single set of tokens/components each should use.
- The order to fix them in so nothing regresses.

### 8. `07-clinical-training-platform.md`
- Course, cohort, assessment, supervision-hours and certification model, and how
  it extends what already exists in the learning pages.

### 9. `README.md` — index, execution order, and a checklist you can tick off.

## Order the runbooks assume

Ownership (1) → compliance foundations (2) → CRM/back-channels (3) → payments and
legal (4) → growth (5) → design consolidation (6) → training platform (7).
Compliance comes second on purpose: the audit-log and privacy-tier decisions
shape every table the later phases add, and retrofitting them is far more
expensive.

## Honest notes

- HIPAA does not apply automatically to a Moroccan operation; it matters if you
  serve US-covered entities. The runbook writes it as a target standard and flags
  where GDPR and Law 09-08 are the binding ones.
- The full exit has real downtime and real risk on the database step. The runbook
  includes a dry-run rehearsal against a scratch Supabase project before the live
  cutover.
- Contracts and tax treatment need a Moroccan lawyer/accountant to sign off. The
  runbook prepares the drafts and the checklist; it does not replace that review.

## Technical detail

Files land under `docs/runbooks/`. No source, schema, config or dependency
changes in this pass — nothing deploys and nothing in the live app moves. Each
runbook lists the exact files, tables and env vars its phase touches, so the work
can be handed to Claude Code or executed here later, phase by phase.
