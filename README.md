# acquired.fm study clone

A local, non-indexed study replica of acquired.fm, built with Next.js (App Router), TypeScript, Tailwind and GSAP 3.12.
Keep it local: it reproduces a real brand's site and imagery. `robots` is set to `noindex`.

## Run

```bash
npm install
npm run dev -- -p 3100
```

## Where things live

| Path | What |
|---|---|
| `reference/design-spec.md` | Source of truth: measured type, colour, spacing, layout and motion values from the live site |
| `reference/<page>/<width>.png` | Live reference screenshots (1440 / 1024 / 768 / 390) and DOM/style outlines |
| `styles/tokens.css` | All design tokens (colour, type, spacing, radii, shadows, z-index, motion, per-episode themes) |
| `styles/*.css` | Component styles; values only via tokens |
| `content/*.json` | Episodes (215), filters, ACQ2 feed, artifacts, WSJ articles, site settings, search index |
| `components/` | Nav, search, hero wall + vinyl player, playlist, episode page, footer, etc. |
| `scripts/` | Playwright research + QA tooling (capture, extract, pixel diff, interaction checks) |
| `qa/diff/` | Pixel-diff images from the last QA run; `qa/results.json` has the percentages |

## QA

```bash
node scripts/qa.mjs home,episodes,episode-seinfeld   # screenshot clone + pixelmatch vs reference
node scripts/check-nav.mjs 1440                      # menu / listen / logo popup / search
node scripts/check-episode.mjs                       # sheets, art zoom, player, slider
```

## Placeholders and known differences

- **Fonts:** free stand-ins scaled to the live cap heights with `font-size-adjust` (Sofia Sans Condensed, Libre Caslon Condensed, PT Serif; Archivo for the logo). Drop the licensed files into `public/fonts/` and swap the declarations in `app/layout.tsx`.
- **Copy:** episode overviews, transcripts, testimonials, press quotes and About/Press body text are placeholders; facts such as titles, dates, links, tags and chapter titles come from the live site.
- **Redirects:** `/media-kit`, `/sponsor` and `/slack` redirect (301) like the live site.
- **Extra routes:** `/artifacts/[slug]`, `/acq2-episodes/[slug]`, `/series/*` and `/season/*` exist so every link resolves; they reuse existing layouts and aren't from the reference set.
