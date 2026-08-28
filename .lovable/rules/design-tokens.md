# Design Tokens

Token reference for **Super UPsy.ma**. Use utility classes and CSS variables — never raw values.

## Colors

Apply with any color utility: `bg-<name>`, `text-<name>`, `border-<name>`, `ring-<name>`, `divide-<name>`, etc.

| Name | CSS variable |
|---|---|
| `u-burgundy` | `--color-u-burgundy` |
| `u-charcoal` | `--color-u-charcoal` |
| `u-gold` | `--color-u-gold` |
| `u-gold-highlight` | `--color-u-gold-highlight` |
| `u-crimson` | `--color-u-crimson` |
| `u-clinical` | `--color-u-clinical` |
| `u-clinical-light` | `--color-u-clinical-light` |
| `u-lavender` | `--color-u-lavender` |
| `u-turquoise` | `--color-u-turquoise` |
| `u-white` | `--color-u-white` |
| `u-black` | `--color-u-black` |
| `u-gray-50` | `--color-u-gray-50` |
| `u-gray-100` | `--color-u-gray-100` |
| `u-gray-200` | `--color-u-gray-200` |
| `u-gray-300` | `--color-u-gray-300` |
| `u-gray-400` | `--color-u-gray-400` |
| `u-gray-500` | `--color-u-gray-500` |
| `u-gray-600` | `--color-u-gray-600` |
| `u-gray-700` | `--color-u-gray-700` |
| `u-gray-800` | `--color-u-gray-800` |
| `border` | `--color-border` |
| `input` | `--color-input` |
| `ring` | `--color-ring` |
| `background` | `--color-background` |
| `foreground` | `--color-foreground` |
| `primary` | `--color-primary` |
| `primary-foreground` | `--color-primary-foreground` |
| `secondary` | `--color-secondary` |
| `secondary-foreground` | `--color-secondary-foreground` |
| `destructive` | `--color-destructive` |
| `destructive-foreground` | `--color-destructive-foreground` |
| `muted` | `--color-muted` |
| `muted-foreground` | `--color-muted-foreground` |
| `accent` | `--color-accent` |
| `accent-foreground` | `--color-accent-foreground` |
| `popover` | `--color-popover` |
| `popover-foreground` | `--color-popover-foreground` |
| `card` | `--color-card` |
| `card-foreground` | `--color-card-foreground` |
| `burgundy` | `--burgundy` |
| `charcoal` | `--charcoal` |
| `gold-accent` | `--gold-accent` |
| `gold-highlight` | `--gold-highlight` |
| `crimson` | `--crimson` |
| `clinical-blue` | `--clinical-blue` |
| `clinical-light` | `--clinical-light` |
| `lavender` | `--lavender` |
| `turquoise` | `--turquoise` |
| `white` | `--white` |
| `black` | `--black` |
| `light-blue` | `--light-blue` |
| `light-purple` | `--light-purple` |
| `light-green` | `--light-green` |
| `warm-maroon` | `--warm-maroon` |
| `warm-crimson` | `--warm-crimson` |
| `warm-beige` | `--warm-beige` |
| `warm-gold` | `--warm-gold` |
| `glass-bg` | `--glass-bg` |
| `glass-border-color` | `--glass-border-color` |
| `upsy-beige` | `--upsy-beige` |
| `upsy-maroon` | `--upsy-maroon` |
| `upsy-gold` | `--upsy-gold` |

Standard Tailwind color ramps (gray) are available at steps 50–950 — apply with `bg-<hue>-<step>`, `text-<hue>-<step>`, etc.

## Typography

Typography classes (`font-*` for families, `text-*` for sizes):

| Class | CSS variable |
|---|---|
| `font-sans` | `--font-sans` |
| `font-display` | `--font-display` |
| `font-serif` | `--font-serif` |
| `font-cormorant` | `--font-cormorant` |
| `font-arabic` | `--font-arabic` |
| `font-fraunces` | `--font-fraunces` |
| `font-outfit` | `--font-outfit` |
| `font-manrope` | `--font-manrope` |
| `font-mono` | `--font-mono` |
| `text-display` | `--text-display` |
| `text-h1` | `--text-h1` |
| `text-h1-mobile` | `--text-h1-mobile` |
| `text-h2` | `--text-h2` |
| `text-h2-mobile` | `--text-h2-mobile` |
| `text-h3` | `--text-h3` |
| `text-h3-mobile` | `--text-h3-mobile` |
| `text-body` | `--text-body` |
| `text-body-mobile` | `--text-body-mobile` |
| `text-small` | `--text-small` |
| `font-serif-alt` | `--font-serif-alt` |

## Spacing

Apply with any spacing utility: `p-<name>`, `m-<name>`, `gap-<name>`, `space-<name>`, `w-<name>`, `h-<name>`, etc.

| Name | CSS variable |
|---|---|
| — | `--section-spacing` |
| — | `--section-spacing-mobile` |

## Border Radius

Border-radius classes:

| Class | CSS variable |
|---|---|
| `rounded-md` | `--radius-md` |
| `rounded-sm` | `--radius-sm` |
| `rounded-btn` | `--radius-btn` |
| `rounded-card` | `--radius-card` |
| `rounded-input` | `--radius-input` |
| `rounded` | `--radius` |

## Shadows

Box-shadow classes:

| Class | CSS variable |
|---|---|
| — | `--glass-shadow` |
| — | `--glass-shadow-hover` |
| `shadow-soft` | `--shadow-soft` |
| `shadow-gold` | `--shadow-gold` |

## Other

Reference via `var(--name)` in inline styles or CSS.

| CSS variable |
|---|
| `DUR.instant` |
| `DUR.quick` |
| `DUR.base` |
| `DUR.slow` |
| `DUR.cinema` |
| `DUR.breath` |
| `EASE.exhale` |
| `EASE.think` |
| `EASE.glass` |
| `EASE.soft` |
| `STAGGER.tight` |
| `STAGGER.base` |
| `STAGGER.loose` |
| `--animate-accordion-down` |
| `--animate-accordion-up` |
| `--max-width` |
| `--gutter` |
| `--liquid-atmosphere` |
| `--gradient-gold` |
| `--gradient-burgundy` |
| `--gradient-divider` |
| `--transition-smooth` |
| `--transition-calm` |
| `--duration-ui` |
| `--duration-emphasis` |
| `--duration-ambient` |
| `--ease-calm` |
| `--ease-bounce` |

