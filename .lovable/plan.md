## 1. What actually exists (verified by reading the code and querying the database)

**Routing** — `src/App.tsx` declares every page once inside a shared `AppRoutes()` fragment, mounted twice: at `/` and at `/:locale`. Public pages are plain `<Route path="x" element={<PageTransition><X/></PageTransition>} />`; authenticated ones wrap in `<ProtectedRoute>`, admin ones in `<AdminRoute>`. All pages are `lazy()` imports. `AppShell` gives every non-`/ops` route the Header, AuroraBackground, Breadcrumb and Footer. So a public Observatoire route is a two-line addition, no new shell needed.

**Signup / return context** — `src/pages/Auth.tsx` already reads `?redirect=` from the query string in three places (post-session effect, password login, OAuth) and `AuthContext.signUp(email, password, fullName, redirectAfter)` bakes it into the email confirmation link (`/auth?verified=1&redirect=...`). OAuth stashes it in `sessionStorage` under `upsy:post-oauth-redirect`. **The signup flow can already carry a return URL end-to-end, including across email verification and OAuth.** What it cannot do today is prefill the signup form (email/name are local `useState` initialised empty) — that is a small, contained change.

**growth_leads** — no service layer. Two direct client inserts: `src/pages/FreeScore.tsx` (source `free_score`, computes `score_total` 0-100 and `score_breakdown {answers, pillars}`) and `src/pages/campaigns/CampaignLanding.tsx` (source per-campaign, `score_breakdown` holds audience + UTM attribution). RLS: anon+authenticated INSERT with `WITH CHECK (nurture_stage = 'd0' AND converted_user_id IS NULL)`; SELECT/UPDATE admin-only. `converted_user_id` exists but nothing writes it.

**psychologist_applications** — 48 columns, but only `email` and `full_name` are NOT NULL without a default. RLS already has a `Public can submit applications` INSERT policy for anon (status pending, unreviewed). `ApplyWizard.tsx` is the heavy multi-step form and is behind `<ProtectedRoute>`. `accreditation_decisions` is written only by admins via `AccreditationManager`.

**organization_applications** vs **proposal_requests** — both accept anon inserts. `organization_applications` is a formal B2B onboarding record (ICE, RC, IF, desired_seats, approved_org_id, review workflow, fed by `/apply/organization`). `proposal_requests` is a lightweight commercial enquiry (organization_name, contact_name, email, message, status pending), fed by `ProposalRequestModal`.

**referrals** — real and reusable: `generate_referral_code()` RPC, `ReferralCard` creates a user's code, `/invite/:code` validates it and stashes it in `sessionStorage` as `upsy_referral_code`. It is user-scoped (`referrer_id = auth.uid()`), so it works for *user* ambassadors but not for anonymous printed codes.

**Admin** — `/admin` → `src/pages/admin/Dashboard.tsx`, a single `<Tabs>` shell (overview, psychologists, bookings, users, accreditation, org-applications, pricing, transactions, translations, learning, support, live-views), protected by `<AdminRoute>` → `useAdminAuth` → `has_role(uid,'admin')`. `/admin/growth-leads` is a separate page.

**i18n** — `LocaleContext` + `src/lib/i18n/translations.ts`, locales `en | fr | ar | ber`, URL-prefixed, cookie `lng`, DB overrides from `translation_overrides`, and it already sets `document.documentElement.dir = 'rtl'` for Arabic. Long-form marketing copy lives in per-page modules like `src/lib/i18n/homeCopy.ts`. **We reuse this; we do not import the research app's i18n.**

**Design system** — semantic tokens in `src/index.css`, `.marketing-night` for public pages, Fraunces/Cormorant/Manrope/Amiri/JetBrains Mono, shadcn components, `glass-card`, `rounded-u-card`. The Observatoire will be rebuilt against these tokens, not styled from the source app's CSS.

## 2. Proposed mapping

**`survey_responses` — the one new table.** Ported verbatim (track, language, referral_source, ambassador_code, answers jsonb, completed, last_step, total_steps, duration_seconds, device_type, vw_coherent, created_at, completed_at) plus a client-generated `session_token uuid` used only to resume/complete one's own in-progress response. RLS: `INSERT` to anon+authenticated with a `WITH CHECK` forbidding any completed/reviewed flags; `UPDATE` to anon only on the row matching the session token and only while `completed = false`; **no SELECT policy at all for anon or authenticated**. Admin reads go through a `SECURITY DEFINER` aggregate RPC that returns counts and distributions, never raw rows. GRANT INSERT, UPDATE to anon+authenticated, GRANT ALL to service_role. The `leads`, `pipeline_events`, `ambassadors`, `waitlist` tables are not ported.

**Patient opt-in → `growth_leads`.** Columns set: `email`, `full_name` (optional), `phone` (optional), `source = 'observatoire_patient'`, `locale`, `consent_marketing = true` (required, unchecked by default), `nurture_stage = 'd0'` (forced — the RLS check requires it), `converted_user_id = null`, `score_total`, `score_breakdown`.

`score_total` (0-100, intent score, weighted): timeline 35 pts (now=35 / 3 months=22 / later=8 / unsure=4), intention Likert 25 pts (linear 1-5), NPS 20 pts (0-10 scaled), willingness-to-pay coherence 20 pts (Van Westendorp `vw_coherent` true and acceptable price at/above the platform floor = 20, coherent but below floor = 10, incoherent = 0). Band A ≥ 70, B 40-69, C < 40.

`score_breakdown`: `{ band, timeline, intention, nps, wtp: { too_cheap, bargain, expensive, too_expensive, coherent }, payment_model, top_barriers: [...], org_interest, org_name, track: 'patient', utm: {...} }` — the barrier Likert items and derived signals only, **never the free-text answer and never the survey_responses id**.

**Psychologist interested → `psychologist_applications`, as a light expression of interest, not the 48-column wizard.** Insert `email`, `full_name`, `preferred_locale`, `city`, `years_experience`, plus the survey-derived commission band / preferred model / timeline packed into an existing notes-style text column, `status = 'pending'`. The existing anon INSERT policy already permits this. They then receive the normal path to `/apply` → `/apply/wizard` to complete the real dossier once signed in. Reusing the wizard directly at the end of a survey would demand account creation plus document upload and would collapse the funnel.

**Organisation declared → `proposal_requests`, not `organization_applications`.** A survey respondent who ticks "my employer might be interested" cannot supply ICE, RC, IF or seat counts, and creating a half-empty `organization_applications` row would pollute the review queue that `OrgApplicationsManager` drives and could reach `approved_org_id` provisioning. `proposal_requests` is exactly a commercial enquiry with a pending status — the right shape.

**Attribution — do not invent an ambassador table.** `survey_responses.ambassador_code` is kept as a free-text field for anonymous research analysis only. For real acquisition attribution, reuse `referrals`: if `sessionStorage.upsy_referral_code` (set by `/invite/:code`) is present, mirror it into `growth_leads.score_breakdown.referral_code` and resolve it at signup. No new attribution table.

## 3. Acquisition path for Band A

Band A patients skip the lead form. The results screen shows their personalised readout and a primary CTA "Créer mon espace / إنشاء حسابي" that navigates to:

`/auth?redirect=%2Fget-matched%3Fsource%3Dobservatoire&mode=signup`

That works today: `Auth.tsx` reads `?redirect=` on password signup, on OAuth (via `upsy:post-oauth-redirect`) and on the email-verification round trip through `AuthContext.signUp`. So after signup they land in the existing `/get-matched` funnel rather than `/my-space`.

**What the signup flow cannot do today, plainly:** it cannot prefill anything — `signupData` starts empty and there is no tab-preselect param. Smallest change to enable it: (a) initialise `signupData.email/fullName` from `?email=` / `?name=` query params, and (b) honour a `?mode=signup` param to open the signup tab. Both are local to `Auth.tsx` state initialisation and touch no auth logic.

**The anonymity constraint applies here too:** Band A prefill is only offered *after* the respondent has typed their email into the separate opt-in box. We never carry survey answers into the URL, into signup metadata, or into the created profile. What crosses the boundary is: email, name, and a coarse `source=observatoire` marker — nothing else.

## 4. The anonymity wall

Respected as follows, and these are hard rules in the implementation:

- `survey_responses` gets **no** `email`, `user_id`, `lead_id`, `growth_leads` FK, or any hash of an identifier. The `session_token` is client-side only, never stored alongside any person record, and is dropped from client memory on completion.
- The opt-in is a **separate step after** the results screen, with an unchecked checkbox and its own submit — never pre-checked, never bundled into the survey submit.
- The `growth_leads` insert is a **separate network call** carrying no reference to the survey row. `score_breakdown` carries derived scores only (band, Likert values, WTP numbers), never the free-text answer and never the response id.
- No admin UI ever joins the two. The research section reads aggregates through a `SECURITY DEFINER` RPC; there is no raw-row export.

**Where it is at risk, flagged honestly:** (1) *Timing correlation* — a survey INSERT and a `growth_leads` INSERT seconds apart are trivially joinable by an admin with database access. Mitigation: coarsen `survey_responses.created_at` to the hour (or add a randomised delay to `completed_at`) and never expose second-level timestamps in the research view. This is a real residual risk and the only one I can't fully eliminate without dropping timestamps entirely. (2) *Low-cardinality demographics* — a psychologist track row with city + years of practice can be near-unique. Mitigation: bucket city into region and years into bands before storage or before display. (3) *`score_breakdown` scope creep* — the easiest future mistake is dumping the whole answers object into the lead row. This must be an explicit allow-list, not a spread.

## 5. Risk assessment — what this touches and what could regress

| Touched | Risk |
|---|---|
| `src/App.tsx` routes | Low. Adding routes to `AppRoutes()` affects both locale mounts. A wrong path could shadow `/:locale`; keep the segment unambiguous (`observatoire`). |
| `growth_leads` writes | Medium. Shared with FreeScore and campaigns. A different `score_total` scale (intent vs wellbeing) makes the admin `GrowthLeads` list mix incomparable scores. Must filter/label by `source`. |
| `src/pages/Auth.tsx` | **Highest risk.** This is the live login for every user. The prefill/mode change must be state-init only, with no change to `signIn`, `signUp`, OAuth or the redirect logic, and must be verified against normal login, OAuth, and the email-verification round trip. |
| `psychologist_applications` | Medium. Thin rows enter the same admin review queue `AccreditationManager` drives. Needs a distinguishable marker so reviewers know a dossier is missing. |
| `proposal_requests` | Low. Additive; `ProposalRequestModal` unaffected. |
| Admin dashboard | Low if added as a new tab in the existing `<Tabs>`; the tab list is already long, so watch mobile overflow. |
| i18n (`translations.ts` / new `observatoireCopy.ts`) | Low-medium. Adding to the shared `translations.ts` risks the whole locale bundle; use a separate copy module like `homeCopy.ts`. |
| RTL | Low. `dir` is already handled globally; the survey needs RTL-safe layout (logical spacing, no hard-coded left/right) but no new system. |
| Bundle size | Low. Lazy route. Keep the survey free of 3D. |

### Recommended staging

1. **Stage 1 — research only, zero commercial coupling.** `survey_responses` migration + RLS, public `/observatoire` survey (FR/AR/RTL, consent gate, both tracks), personalised results screen. Nothing writes to `growth_leads`. Ships and proves the anonymity wall in isolation.
2. **Stage 2 — admin research view.** Aggregate RPC + a new admin tab. Read-only, no schema churn.
3. **Stage 3 — CRM feed.** The separate opt-in step → `growth_leads` / `psychologist_applications` / `proposal_requests`, with the allow-listed `score_breakdown`.
4. **Stage 4 — the Auth prefill change and Band A routing.** Deliberately last and alone, because it is the only stage that modifies a live authentication surface. Ship it separately so a regression is unambiguously attributable.

### Assumptions I'm making, correct me if wrong
- The Observatoire lives at `/observatoire` (with `/fr/observatoire`, `/ar/observatoire`) and is linked from the footer + a Founder/Press context, not the main nav.
- English is not required for the survey itself (source app is FR/AR only); EN visitors see the FR version. If you want EN, it's additive copy work.
- The survey content itself is ported faithfully — I am not redesigning the instrument, only its presentation.
