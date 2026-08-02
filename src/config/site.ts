/**
 * The public origin this site is served from.
 *
 * WHY THIS EXISTS
 *
 * Every canonical tag, `og:url`, hreflang alternate and sitemap entry has to
 * agree on one origin, and until this file they did not agree with reality:
 * all of them pointed at `https://upsy.ma`, which has **no DNS record**. The
 * site is served from Vercel.
 *
 * That is not a cosmetic mismatch. A canonical tag is an instruction to search
 * engines — "the real version of this page lives here" — so pointing it at a
 * host that does not resolve tells Google the indexable version of every page
 * is unreachable. The likely outcome is not "indexed under the wrong domain",
 * it is "not indexed". The same literal in `og:image` and `og:url` is why link
 * previews do not render.
 *
 * ONE VALUE, NOT TWENTY-ONE
 *
 * The origin was hardcoded in 21 files, so correcting it meant finding all of
 * them and moving the domain later meant finding them again. It resolves here
 * instead, and moving to the real domain is one environment variable.
 *
 * SWITCHING TO upsy.ma
 *
 * When the domain is registered and pointed at Vercel:
 *
 *   1. Add the domain in Vercel → Settings → Domains, and wait for DNS.
 *   2. Confirm it serves the site: `PROD_URL=https://upsy.ma npm run check:production`
 *   3. Set `VITE_SITE_URL=https://upsy.ma` in `.env` (it is a public value) and
 *      `homepage` in package.json to match.
 *   4. Only then submit the sitemap to Search Console. Submitting a sitemap
 *      full of non-resolving URLs teaches Google the site is broken, and that
 *      impression is slow to undo.
 *
 * Do not point this at a domain before it serves the site. A canonical pointing
 * somewhere dead is worse than one pointing at an ugly-but-working URL.
 */

/**
 * Public origin, no trailing slash.
 *
 * Defaults to the Vercel deployment because it is the only origin that
 * currently resolves. `VITE_SITE_URL` overrides it without a code change.
 */
export const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined) || "https://upsy-ma.vercel.app"
).replace(/\/$/, "");

/** Absolute URL for a root-relative path. */
export const absoluteUrl = (path: string): string =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
