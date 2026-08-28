# Observatoire as an internal, CRM-backed acquisition surface

Ship the Observatoire research funnel with a real CRM behind it. The public
survey at `/observatoire` stays live exactly as it is (anonymity wall intact).
What gets built is the internal side: a tailored landing/console for the team,
and a proper contact model that every funnel feeds.

## What you get

1. **A CRM core** — one row per human, with a timeline, consent record, deals
   and organisations. Built from Phase 2 of the runbooks.
2. **An internal Observatoire landing** at `/admin/crm` — the working surface:
   a hero-style command view with live acquisition numbers, then contacts,
   pipeline, and contact detail. Cinematic in the app's editorial-luxe language,
   not a bare admin table.
3. **All existing funnels wired in** — Observatoire opt-ins, growth leads,
   quiz results, proposal requests, intake forms, bookings, specialist
   applications and registered profiles all resolve to one contact.

## The anonymity rule stays

Survey answers keep their wall. The CRM never links a `survey_responses` row to
a contact — only the opt-in step (a separate screen, separate call) creates a
contact, and the Observatoire aggregates page stays aggregate-only. The internal
landing shows "N leads came from the Observatoire this week", never "this person
answered X".

## Build steps

### 1. Schema (one migration)

- `crm_contacts` — email (unique, lowercased), name, phone, locale, country,
  `contact_type`, `lifecycle`, `source`, `first_touch` jsonb, `user_id` once they
  register.
- `crm_organisations` — B2B counterparty, linked to contacts.
- `crm_stages` + `crm_deals` — pipelines `b2c_first_session`, `b2b_program`,
  `specialist_onboarding`, `training_enrolment`; stages editable without a
  migration.
- `crm_activities` — the timeline: `form_submitted`, `quiz_completed`,
  `booking_created`, `email_sent`, `note`, `payment_received`, …
- `crm_consents` — purpose, granted, legal basis, evidence blob (form, url, ts,
  wording version). No marketing send without a matching granted row.
- GRANTs on every table, RLS on, admin-only write plus "read own contact row".

### 2. Backfill + ingestion

- One-time backfill from `growth_leads`, `proposal_requests`,
  `organization_applications`, `psychologist_applications`, `contact_submissions`
  and `profiles`, deduped on lowercased email, each producing a seed activity.
- A single `crm_upsert_contact` security-definer RPC that every funnel calls:
  resolves-or-creates the contact, records the activity, records consent when
  given. Observatoire's opt-in and the quiz lead capture switch to it.
- Trigger on `profiles` insert so registration attaches `user_id` to the
  existing lead row instead of forking a second identity.

### 3. The internal landing `/admin/crm`

Admin-gated, four views behind one shell:

- **Overview (the landing)** — hero band with the week's numbers: new contacts,
  Observatoire completions → opt-ins → conversion, leads by source, pipeline
  value, consent coverage. Source breakdown chart and a live activity stream.
- **Contacts** — filterable table (type, lifecycle, source, consent state,
  date), search, bulk select, CSV export via the existing `src/lib/admin/csv.ts`.
- **Contact detail** — identity, consent state, full activity timeline, linked
  deals, bookings, invoices. Note composer writing a `note` activity.
- **Pipeline** — board per pipeline, drag between stages, each move writing an
  activity row.

Reads go through authenticated server functions (`src/lib/crm/*.functions.ts`)
with an admin role check, not direct client queries.

### 4. Navigation

Add a CRM entry to the admin dashboard tabs and keep the existing
Observatoire aggregates tab where it is — they answer different questions
(research vs pipeline) and must stay separate for the anonymity wall.

## Out of scope for this pass

Event outbox and automated outbound sends (runbook Phase 2, Part 2) — the
consent table lands now so sends can be gated later, but no dispatcher is built
yet.

## Technical notes

- New tables follow the project's RLS conventions: `has_role(auth.uid(),'admin')`
  for admin access, `user_id = auth.uid()` for self-read; GRANTs in the same
  migration; no `anon` grant anywhere on CRM tables.
- Funnel writes stay possible for anonymous visitors only through the
  security-definer `crm_upsert_contact` RPC — no direct anon insert on
  `crm_contacts`.
- Source funnel tables are kept as the record of each submission; the CRM row is
  the identity that ties them together.
