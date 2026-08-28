# Super UPsy.ma — Guidelines

## Components

The design system exports these components — import them from `@ws-9vaqrt7ygjuypbzkz2gn/355cf905-7152-433f-b59d-dda69a853e16` and compose them before building anything from scratch:

`BookingDetailDrawer`, `ChapterItem`, `Chapter`, `ContinueLearningCard`, `CourseEditDrawer`, `CrisisModal`, `DailyCheckinDialog`, `Ember`, `HeroScene`, `HomeFAQSection`, `HomePricingSection`, `JournalPanel`, `LearningHubManager`, `MentalPerformanceScore`, `ModuleListEditor`, `NotificationPreferencesCard`, `ProtocolRunner`, `PsychologistEditDrawer`, `Pulse`, `ReadinessRing`, `RecommendationsRail`, `ReferralCard`, `RolePreviewFrame`, `SessionStatusTimeline`, `SessionsTimeline`, `TodaysStateCard`, `UserDetailDrawer`

Per-component details (import stanzas, props, variants, examples) live in `.lovable/rules/libraries/{slug}/components.md` — on disk, not auto-loaded. Read that file or the component source when the name alone isn't enough.

## Theme Files

The design system's theme is delivered through the following files. The author's original source files carry the full wiring the design system needs — variable declarations, framework-specific directives, provider objects, etc. — and are the canonical import target.

- `@ws-9vaqrt7ygjuypbzkz2gn/355cf905-7152-433f-b59d-dda69a853e16/lib/motion/tokens` (source — preferred import)
- `@ws-9vaqrt7ygjuypbzkz2gn/355cf905-7152-433f-b59d-dda69a853e16/styles.css` (source — preferred import)
- `@ws-9vaqrt7ygjuypbzkz2gn/355cf905-7152-433f-b59d-dda69a853e16/dist/tokens.css` (auto-generated flat list of CSS custom properties — a raw-values fallback only; does NOT carry framework-specific wiring that the source files above provide)

