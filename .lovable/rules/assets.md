---
description: "Brand assets shipped by the Super UPsy.ma design system (logos, icons, illustrations, photography, fonts, videos) with exact import paths. Read before adding any logo, icon, illustration, image, video, or font to the app: use these real assets instead of placeholders, stock photos, or generated images."
---

# Super UPsy.ma — Assets

These files are copied into `src/design-system/{slug}/assets/` in this project — never generate, placeholder, or substitute an asset that exists here.

Raw files import directly, e.g. `import logo from "@/design-system/{slug}/assets/logos/logo.svg"`.
R2 pointer files (`.asset.json`) are imported as JSON — use the `url` property, e.g. `import hero from "@/design-system/{slug}/assets/hero.png.asset.json"` then `<img src={hero.url} />`.
The full machine-readable catalog lives in this library's `design-system.json` (`assets` array).

## Logos

- `@/design-system/{slug}/assets/logo.webp` (webp)
- `@/design-system/{slug}/assets/moroccan-umbrella-logo.png` (png)
- `@/design-system/{slug}/assets/umbrella-logo.png` (png)
- `@/design-system/{slug}/assets/upsy-logo-hero.png` (png)
- `@/design-system/{slug}/assets/upsy-logo.png.asset.json` (png, R2 pointer)

## Images

- `@/design-system/{slug}/assets/blog/anxiety.jpg` (jpg)
- `@/design-system/{slug}/assets/blog/depression.jpg` (jpg)
- `@/design-system/{slug}/assets/blog/find-psychologist.jpg` (jpg)
- `@/design-system/{slug}/assets/blog/mental-health-work.jpg` (jpg)
- `@/design-system/{slug}/assets/blog/mindfulness.jpg` (jpg)
- `@/design-system/{slug}/assets/blog/need-therapy.jpg` (jpg)
- `@/design-system/{slug}/assets/blog/online-therapy.jpg` (jpg)
- `@/design-system/{slug}/assets/blog/support-loved-one.jpg` (jpg)
- `@/design-system/{slug}/assets/mehdi-felji.png` (png)
- `@/design-system/{slug}/assets/neural-network-bg.jpg` (jpg)
- `@/design-system/{slug}/assets/neural-network-bg.webp` (webp)

