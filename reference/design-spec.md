# acquired.fm — design spec (source of truth)

Measured 2026-11-22 from the live site with Playwright (`scripts/extract-styles.mjs`, `scripts/capture-reference.mjs`)
and read from the site's CSS (`acquiredfm.webflow.shared.ce5843325.min.css`) and inline GSAP 3.12.5 scripts.
Raw dumps: `reference/<page>/outline-<width>.txt` (DOM + box + computed style), `reference/<page>/vars.json`.

> **Important:** the live home page has been redesigned since the brief was written. There is no longer a
> photo hero with a horizontal episode ticker at the top. The top of the page is now a **fixed, full-screen
> 6×3 wall of episode album covers** (`.acq-hero`), and "Every company has a story" moved into a rounded
> photo card *below* it. The clone follows the live site, not the brief.

---

## 1. Fonts

| Role | Live font (licensed, Webflow CDN) | Weights | Clone fallback (free, Google Fonts) |
|---|---|---|---|
| Body serif `--_font---body` | Reckless Standard S | 400, 400i, 500, 500i | **Newsreader** (opsz auto) |
| Display serif `--_font---serif` (uppercase headings) | Reckless Condensed M | 400, 400i | **Instrument Serif** (narrow, upright) |
| Labels/nav `--_font---display` (uppercase) | Founders Grotesk Condensed | 400, 500 | **Barlow Condensed** 400/500 |
| UI sans `--_font---sans` (inputs, search) | Geist | 400 | **Geist** (same font, OFL) |

The licensed files were **not** downloaded. Drop `.woff2` files in `public/fonts/` and flip the
`@font-face` block in `styles/fonts.css` to use them.

Letter-spacing rules (from CSS vars):
- body / serif: `0.01em` (`--_font---body-spacing`, `--_font---serif-spacing`)
- display (grotesk): `0.03em` (`--_font---display-spacing`)
- line-heights: body `145%`, snug `120%`, tight `110%`, none `100%`; components also use `140%`.

## 2. Colour

Root palette (exact hex from CSS):

| Token | Value |
|---|---|
| black / ink | `#1B1915` |
| warm-white / cream (page bg) | `#FFFCF5` |
| vintage-cream / paper (active menu link bg) | `#F7F2EB` |
| neutral-white | `#FFFEFD` |
| teal-1000 / dark teal (footer, primary form button) | `#0C3B3A` |
| acquired-teal-500 (accent; footer headings, default btn hover) | `#28F1C0` |
| acquired-teal-400 / 600 | `#28FFCB` / `#17CB9F` |
| charcoal | `#333333` |

Opacity variants are computed with `color-mix(in srgb, <fg> N%, transparent)`. Used values:
ink 3 / 5 / 7 / 10 / 20 / 30 / 50 / 60 / 70 %, cream 3 / 5 / 10 / 60 / 70 %.
`--foreground-muted` = foreground 60%.

Hero shadow scrim stops (rgb triplets): deep `11,11,12`, mid `24,25,27`, soft `42,39,36`.

Theme palettes per episode (bg / accent) exist for teal, cobalt, coral, orange, sage, brown, charcoal — used by the
episode "vinyl" overlay; see `--_color-root---*-{100,400,500,600,1000}` in the CSS.

## 3. Type scale (desktop ≥992px → measured at 1440)

| Style | Font | Size / LH | Tracking | Case | Where |
|---|---|---|---|---|---|
| hero-title | serif | 48 / 52.8 (110%) | 0.48px | upper | "Every company has a story" (390: 40/44) |
| h2-community | serif | 48 / 48 (100%) | 0.48px | upper | "Still thinking about an episode?" |
| h2-section (text-4xl) | serif | 32 / 38.4 (120%) | 0.32px | upper | "Latest Episodes" |
| menu-link | serif | 32 / 32 | 0.32px | upper | full-screen menu |
| h3-card (text-2xl) | serif | 24 / 28.8 | 0.24px | upper | episode card titles, "Our listeners", listen links |
| body | body serif | 18 / 26.1 (145%) | 0.18px | — | default paragraph |
| body-140 | body serif | 18 / 25.2 (140%) | 0.18px | — | intros, card desc |
| body-sm | body serif | 16 / 22.4 | 0.16px | — | floating CTA copy |
| body-xs | body serif | 14 / 19.6 | 0.14px | — | menu email caption |
| label-lg | display | 18 / 18 (or 25.2) | 0.54px | upper | eyebrows, testimonial names, form btns |
| label | display | 16 / 18 | 0.48px | upper | buttons, nav, meta, footer links (LH 19.2) |
| label-xs | display | 14 / 14 | 0.42px | upper | photo credit |
| input | Geist | 16 | — | — | search, email inputs |

Responsive text tokens (`--_size---text-size--*`) step down on tablet/mobile; e.g. `text-base` 18→17, `text-6xl` 48→40.

## 4. Spacing, sizing, radii

Space scale (desktop): 4xs .25rem · 3xs .5rem · 2xs .75rem · xs 1rem · sm 1.5rem · base 2rem · lg 2.5rem · xl 4rem ·
2xl 5rem · 3xl 6rem · 4xl 8rem. (Tablet/mobile shrink: sm 1.25rem, base 1.5rem, lg 2rem, xl 2.5rem, 2xl 3–4rem, 3xl 4–5rem, 4xl 6–7rem.)

Widths: 3xs 256 · 2xs 288 · xs 320 · sm 384 · base 448 · lg 512 · xl 576 · 2xl 672 · 3xl 768 · 4xl 896 · 5xl 1024 · 6xl 1280 · 7xl 1440.
Page side padding: 96px at 1440 (`page-section`), 20px at 390.

Radii: 3xs 2 · 2xs 4 · xs 6 · sm 8 · base 12 · lg 16 · xl 18 · full 1000px.
Blur: base 6px, lg 12px.

Buttons (`.btn`): height 50, pad-x 20, gap 6, radius full, backdrop-blur 6px, label 16px uppercase.
Sizes: sm-nav 50h pill outlined; lg-rectangle 56h radius 8 (form submit).
Icon button: 50×50 circle, bg ink 5%.

Shadow: floating CTA `2px 2px 32px rgba(0,0,0,.10)`; mobile minimized `0 -2px 32px rgba(0,0,0,.10)`.

Z-index: hero section 0 / main content 11 / nav 30 / popups 40.

## 5. Layout — Home (1440)

```
NAV (fixed, 80h, z30)  logo 168×50 @16,15 | search pill 446×50 centred | MENU 75×50 + LISTEN 82×50 pills, gap 8
HERO (.acq-hero, position:fixed, 100svh, cream bg)
  grid 6 cols × 3 rows, card = min((100vw-2·inset-3·gap)/4, (100svh-80-gap-2·gap)/3) → 245.3px @1440×900
  gap clamp(16px,2vw,28px)=28, inset-x clamp(20px,2.2vw,40px); grid overflows viewport horizontally (cols 1 & 6 clipped)
  padding-top = nav(80) − gap
  scrim: radial-gradient(clamp(1500px,128vw,2400px) clamp(420px,58vh,860px) at 50% calc(100% + 8vh), deep .9 0%, mid .5 34%, soft .18 64%, soft 0 100%)
  "Explore Acquired ↓" pill, bottom 40px, cream bg, black text; hover bg = fg 60%
MAIN (.acq-home-next, relative z11, scrolls over fixed hero; starts at 100vh)
  spacer 80 → photo card: 8px inset, radius 16, height 100svh−? (884 @900), dark-teal bg, top gradient scrim
     content bottom-centred, max-w 448: "Presented by Sierra" logo (87×40) · 24 · H1 · 12 · body · 24 · "About Acquired" btn · 40 · photo credit
  press row: pad 88/0/96, 3 equal blocks max 1440, side pad 40, gap 16 inside (quote → logo 44h). HBS / WSJ / The Times
  Latest Episodes: heading 32px · 4 · intro (max 576) · list max-w 768 (cards 720 wide)
     card: pad 24, radius 8, grid 190px | 466px, gap 16; art 190² radius 4; title 24/28.8; meta 16 label; desc 2-line clamp; actions row (Spotify, Apple icon buttons + play pill right)
     dividers between cards: 1px ink 10% (inset 24)
     hover: card bg ink 3% (0.4s); image scale (0.6s)
  "View all" pill (bg ink 5%, hover ink 10%) · spacer 128
  Our listeners: heading 24 · body · 32 · carousel 3 cols (373.3 each, gap 64), top rule 1px ink 10%, pages cross-fade (opacity .6s cubic-bezier(.2,.8,.2,1))
  spacer 128
FOOTER (dark teal, pad 16, gap 40)
  community CTA: bg photo @30% opacity over ink, eyebrow 18 label cream, H2 48/48 cream, body, "Join our Slack" pill 56h cream
  console card: bg teal-1000 @40%, border cream 3%, radius 12, pad 64/96/40; newsletter (453w) | v-rule | 3 link columns 216w
     column heading: accent teal 16 label; links 16/19.2 cream 70%, pad 12, radius 6, hover bg cream 5%
  bottom row: © 2026 ACQ, LLC  ·  EVERY COMPANY HAS A STORY.   (cream 60%)
  cursor-following radial "blob" (864², teal-1000 90% → 0)
FLOATING CTA (fixed bottom-right 448w, pad 24, radius 12, cream, border ink 10%, shadow) — newsletter; minimises to a pill; hidden over hero/footer regions
```

Responsive: ≥768 desktop grid (6×3); <768 4×4 grid (card 173.5 @390, gap 11.7), nav becomes [search icon] [logo centred] [menu ⊜];
photo card stacks (image then copy below on cream with dark-teal button); press quotes become a single rotating slot (fade .5s cubic-bezier(.37,0,.63,1), delay .35s, hold 4000ms);
episode card grid `75px | 1fr`, pad 20, radius 6, desc + actions full width below; testimonials stack 1-col with rules;
footer links 2-col grid; floating CTA becomes a bottom-docked minimised tab (radius 16 16 0 0).

## 6. Motion (exact values from source)

Easing tokens: `--ease: cubic-bezier(.2,.8,.2,1)`; popup ease `cubic-bezier(.22,1,.36,1)`; input `cubic-bezier(.455,.03,.515,.955)`;
press rotate `cubic-bezier(.37,0,.63,1)`; GSAP: `power2.out`, `power3.out`, `power3.inOut`, `sine.inOut`, `power2.inOut`.

| Effect | Trigger | Properties | Duration / ease / stagger |
|---|---|---|---|
| Hero intro | load (scrollY ≤ 4, covers decoded or 3000ms timeout) | cards opacity 0→1, scale →1 | 0.7s `power2.out`, stagger 0.055s, order top-down inner-first; scroll locked during intro |
| Hero chrome reveal (after intro) | intro end | scrim 0.3→1 (1.6s sine.inOut @0), CTA 0→1 (1.1s sine.inOut @0.5) | timeline |
| Hero card scroll fade | scroll | each card opacity 1→0 with smoothstep `1−t²(3−2t)` over its [a,b] window of progress = (heroBottom − next.top)/heroHeight | windows: row 3 first, outer→inner, [0,.27]…[.43,.70] (see `DESKTOP_STAGGER_TIMINGS`) |
| Hero CTA / scrim fade | scroll | opacity 1→0 | progress 0→0.10 (CTA), 0→0.14 (scrim) |
| Cover hover (fine pointer) | hover | cover `translateX(-18%)`, vinyl record `translateX(28%)` peeks out right | 520ms `cubic-bezier(.2,.8,.2,1)` |
| Edge-clipped cards | settle/resize | cards <15% visible fade to 0 | 0.42s `power2.out` |
| Explore CTA click | click | smooth scroll to `#intro-section` | 1.6s `power2.inOut` (GSAP proxy) |
| Cover click → vinyl player | click | camera zoom grid (800ms power3.out, scale 1.05–2.75), cover→vinyl morph (in 620ms / out 600ms), wash 1s power2.out, scrim .6s sine.inOut delay .45 | **phase 2** |
| Nav theme | IntersectionObserver over `[data-theme]` under nav band | swaps `nav-light-fill`, `nav-dark`, `nav-hidden` (opacity 0, translateY(−4.5rem)) | `transition: .4s` |
| Menu overlay open | click MENU | section opacity 0→1 (.22s cubic-bezier(.22,1,.36,1)), inner opacity (.22s ease-out .04s), each link opacity (.32s ease-out, staggered) | links: bg .4s, padding .42s on hover |
| Listen popover | click LISTEN | section .21s cubic-bezier(.22,1,.36,1); inner .2s ease-out .028s; links .3s ease-out | |
| Search focus | focus | backdrop `.search-popup-bg` ink 10% opacity 0→1 | .2s |
| Buttons | hover | bg → accent teal (default) or fg 5–10% (ghost) | `transition: all .2s` (Webflow default) |
| Discover card | hover | bg; image transform | .4s / .6s |
| Play pill | hover | grid-template-columns 0→auto reveals duration | .45s cubic-bezier(.22,1,.36,1); text opacity .2s |
| Testimonials | auto + controls | page cross-fade | .6s cubic-bezier(.2,.8,.2,1) |
| Press quotes (mobile) | timer 4000ms | cross-fade | .5s cubic-bezier(.37,0,.63,1), in-delay .35s |
| `.text-fade-in` | IO threshold .2, rootMargin bottom −20% | adds `.is-in` | once |
| Footer blob | pointermove inside footer | follows cursor | rAF |
| Reduced motion | `prefers-reduced-motion: reduce` | all transitions/animations off, cards fade linearly over progress 0–0.6, no intro, videos paused | |

## 7. Per-page status

| Page | Reference shots | Deep extraction |
|---|---|---|
| home | ✅ 4 widths | ✅ |
| episode detail | ✅ 4 widths | ✅ (§8) |
| episodes list | ✅ 4 widths (viewport only) | ✅ (§9) |
| features + industry | ✅ 4 widths (4 pages) | ✅ (§10) |
| others | ✅ 4 widths (see `reference/<page>/`) | pending — done page by page |

---

## 8. Episode detail (`/episodes/[slug]`, measured on `/episodes/seinfeld`)

**Theme.** Each episode sets `--theme-light / --theme-dark / --theme-accent-400/500/600` on `:root` (Seinfeld: `#F9F2D4 / #886300 / #FFEA8C / #E2BA00 / #B58C00`).
Derived: player bg `color-mix(dark 70%, accent-500 30%)`; CTA gradient `dark → color-mix(dark 50%, black) @ 60%`; text/borders use light @10/20/80%.
Clone: `[data-ep-theme]` + `:root:has(...)` in `tokens.css` (gold exact; other palettes from the root colour scale).

**Layout (1440 / 1024 / 768 / 390).** Columns left 448/384/320/100%, right 576/432/320/100%, gap 96/80/64/0, top spacer 64/64/40/0.
- Left: "All episodes" pill (36h, pad-x 14, 14px label, cream 5%) · 24 · art 448² r8 1px light-10 · 40 · sticky details (`top: 80px`):
  tag badge (pad 6/7, r4, light-10, 14px) · H1 48/57.6 (390: 40/48) · 12 · season badge + "Episode 3 · October 18, 2026" (14px) · 32 ·
  4 icon buttons (106×50, r6, light-10, hover → light bg / dark fg) · 8 · popup buttons 448×50 (PDF Companion / Transcript / Sources, cream 10%, r6) ·
  32 · "Many thanks to our season partners" + 2×2 sponsor logos (200×50).
- Right: H2 24/28.8 mb 32 · "OVERVIEW" (18/21.6 display, accent-400, pad 8 0, 1px light-10 top+bottom, mb 24) · body 18/26.1 ·
  "Presented by" (pad 24/0/16, borders, mb 24) · artifacts card (label 16 cream 60% + ↗, 12, strip of 156×194 frames gap 4, mb 32) · 32 ·
  "More on the episode" · rich text (h2 20/28 500 accent-400 with borders; ul pad-left 32 gap 8; li 18/27; links light 80% underlined light 20% → hover accent-400) ·
  disclaimer 14/19.6 cream 60%.
- 96 · rule cream 5% (inset 96) · CTA (pad 96, max-w 512, gap 32 before input, button cream bg / theme-dark text, hover accent-400).
- Cream: 80 · "You may also enjoy" (18 label, muted, pad-x 40) · 12 · horizontal track (items 30vw max 432, pad 12, r8, media r4, title 18 label, sub 16/19.2) ·
  24 · progress bar 1px ink 20 (fill ink 60) · 24 · arrows 50 circle teal-1000 · 96 · footer.
- Mobile: "Presented by" moves to the top of the right column; sponsor grid (2×140) sits between two rules after the artifacts strip (frames 97×121).

**Fixed UI.** Player bottom-right (inset 16, 512/448/448/366 wide, pad 12, gap 16, r6, shadow `0 0 32px rgba(0,0,0,.2)`): thumb 60, title/date 16 label,
progress 4h (hover 6h, .25s popup ease), times 16, controls row gap 24 (speed left, skip ±15, play 42 circle light).
Transcript / Sources = bottom sheets (`.popup` r12 12 0 0, translateY(100%) → 0, **0.3s cubic-bezier(.215,.61,.355,1)**, padding-bottom 202 to clear the player),
grid 352 | 576 | 352 with sticky TOC + scroll progress bar. Chapter/section drawers (≤991): height 765, r18, hidden at translateY(110%), **0.3s cubic-bezier(.4,0,.6,1)**, backdrop ink 10% + blur 12.
Note: the drawers sit just below the viewport, so full-page screenshots show the "Sections" drawer at y≈977 — the clone reproduces this.

**Motion.** Player minimise/expand: GSAP height tween **0.25s power2.out**, minimised 75px; controls fade in 0.125s, delay 0.0875s; auto-minimises after scrolling past the episode section (always minimised ≤991).
Art zoom: to 92% of min(vw,vh), in **320ms cubic-bezier(.16,1,.3,1)**, out **250ms cubic-bezier(.4,0,.2,1)**.
Slider: native scroll + `scrollBy({behavior:'smooth'})` per item; item hover bg (0.4s cubic-bezier(.645,.045,.355,1)), image scale 1.01 (600ms).
Hash routing: `#transcript`, `#sources`, `#companion`, `#t=<seconds>` (seeks the player).

---

## 9. Episodes list (`/episodes`; same layout reused for `/features/*`, `/industry/*`)

**App layout.** The page doesn't scroll: nav (80 + 1px ink-10 border, solid cream) then a fixed area with sidebar (288, own scroll, border-right ink-10) and main (own scroll).
Full-page screenshots therefore only capture 900px.
- Sidebar: 24 + 32 top, groups gap 32. Group header 16 label ink 60%, mb 16. Links: pad 12/16, 16/19.2 label, border-left 1px ink-10;
  hover → accent-600 `#17CB9F` text + border; current → paper `#F7F2EB` bg + accent-500 border. Groups: Features (All, Must-Listen, Niche Gems, Interviews, ACQ2 ↗),
  Industry (17), Series (14), Seasons (20).
- Main: content 1024 centered (main padding 64 / 40 @≤1279 / 24 @≤991 / 8 @≤767). 64 spacer · sticky header 80h (H1 32/38.4, border-bottom ink-10)
  with Browse / Skim toggles (75×44, r4, 16 label ink 80%; active = paper bg).
- Browse row: pad 24 (20 @≤991), gap 16, border-bottom ink-10, r8; art 190² r4; title 24/28.8 one-line ellipsis; meta "F26 E3 · OCT 18, 2026" 16 label
  (video-only episodes get a 16px YouTube glyph); desc 18/25.2 2-line clamp; Spotify/Apple buttons fade in on hover (0.4s; always visible on touch/≤991);
  play 50 circle ink 7% bottom-right. Hover: bg ink 5% (0.4s), art scale 1.02 (0.6s).
- Skim: 2 × 512 columns, row pad 16, art 75, no description, play centered right.
- ≤991: header replaced by a bar (80h; 72 @≤767): 42 round filter button, title 18 serif (17 @≤767), toggles 60×34.
  Sidebar becomes a popover: backdrop fades (0.42s cubic-bezier(.2,.8,.2,1)), panel slides from translateX(−28px) + fades.
  Spacer above the list: 40 + 20 @768, 20 @≤767.
- ≤767: rows stack; art 75 (r3) beside title 22/26.4; description + actions full width.

**Nav breakpoints (all pages).** ≥992: centered 446 search, MENU + LISTEN pills. 768–991: logo 128×36 (pad 10/0), search follows the logo (gap 25),
menu becomes a 50px round icon, LISTEN hidden. ≤767: logo centered, 40×42 search icon left, 42px menu icon.

## 10. Filter pages (`/features/*`, `/industry/*`, `/series/*`, `/season/*`)

Same playlist layout as §9, with a different header and no Browse/Skim toggles: 32 spacer · eyebrow (group name, 18/25.2 display, accent-600 `#17CB9F`) ·
title 32/38.4 · 32 spacer · 1px ink-10 rule (not sticky). Episode order is curated per filter (stored in `content/filters.json`, scraped from each live page).
Counts: features 3, industry 17, series 14, seasons 20 (54 pages). Row titles clamp to 2 lines in Browse, 1 line in Skim.

## 11. Remaining routes

**Redirects (not pages on acquired.fm):** `/media-kit` → Dropbox folder, `/sponsor` → partner.acquired.fm, `/slack` → Slack invite. Implemented as 301s in `next.config.ts`.

**Artifacts (`/artifacts`).** 80 top · H1 32/38.4 · 4 · intro 448 · 48 · one group per episode (pad 16, gap 16): label 16 ink-60 + ↗ · 12 · strip of 4:5 frames 218×273, gap 4, r16 strip / r4 frames, horizontal scroll.
Light footer variant: bg `#FFFEFD`, console 1px ink-10 r12, headings accent-600, links ink-70, subscribe teal-1000. `/artifacts/[slug]` (not in references) is a simple grid shelf.

**Library / Email.** No footer. Centered 512 column: H1 32 · 4 · body 140 · 32 · input 56 + 12 + teal button 56 (r8). Library: 3 PDF page previews (165×214, r4, 1px ink-5, gap 8) · 24 · caption label + body-sm muted. Email: preview image 512×385 r8 with "View Email ↗" pill (36h, 14 label) bottom-right inset 16, caption 14/19.6 muted.

**WSJ (`/wsj`).** WSJ wordmark 204×18 · 12 · H1 48/48 · body · 32 · form · 80 · rule (inset 96) · 64 · "All articles" 24 · list max 768: rows pad 24 gap 24, image 175² r4, headline 24/28.8, 8, dek 18/26.1; hover bg ink 5%. Light footer.

**Press (`/press`).** Eyebrow "Acquired Media Kit" 18 muted · 16 · H1 32 (max 448) · body (max 512) · 40 · Media Kit pill 56h teal · 96 · press row (no padding) · 128 ·
article 576: eyebrow + H2 · timeline 3:2 photo carousel (crossfade out 0.5s power2.in, in 0.7s power2.out, overlap 0.15s, auto 7.5s, click to advance) ·
paragraphs gap 32 · callout (16px left pad, 1px accent border, display 20/28 uppercase) · email line · Media Kit button · testimonials · light footer.

**ACQ2 (`/acq2`).** Dark teal page (`#0C3B3A`, text teal-100 `#D7F3F1`), nav dark. Sticky 80h bar (pad 24/40): "ACQ2 by Acquired" 24 + 448 intro.
Frame inset 64 with cream-10 side rules. Top: featured card (sticky, 60%: title 32 sentence-case, 3-line desc @75%, 16:9 image r6, date + 42px play) and 3 side cards (40%).
Then 2-col grid with 1px cream-10 hairlines (`gap:1px` on a cream-10 background), cards pad 40; older episodes have no image. Card hover: bg (0.38s cubic-bezier(.16,1,.3,1)), image scale 1.04 → 1 (0.6s).
Dark console footer (no photo CTA). `/acq2-episodes/[slug]` (not in references) reuse the episode template with the teal theme.

**About (`/about`).** Fixed full-screen photo hero (teal bg, cover photo, scrim), H1 72/72 cream (max 384), body, "Learn more ↓" (scrolls 1.6s power2.inOut), credit 14 label.
Cream main (z 10) slides over: story column 576 gap 32 — H2 32 · lede (display 20/28 uppercase) · paragraphs · 3:2 photo + caption · rule · italic sign-off · two name blocks (211 wide, 90h signature + 18 label).
128 · "Meet the hosts" 24 · 40 · 2 × 496 cards (330h, r6, gradient, name 48/48, 42px social circles) + bios · 128 · testimonials · 128 ·
dark Audience section: H2 + intro · 64 · 3 stat blocks (number 88 + % 48, label display 20, muted copy) · 96 · geography bar (grid columns proportional 72/11/10/7, bars 42h r4, notes with 32px ticks) · 96 ·
role chart (150px labels right-aligned, bars scaled to the 14% maximum, teal-100 → teal-900 by value) — bars grow from 24px when scrolled into view, then values fade in ·
96 · "Made possible by our partners." · 64 · 4 × 302 logo grid (gap 40/24, 55h) · 80 · "Interested in partnering" + outlined "Sponsorships →" · 128 · combo footer.
Floating 100px vinyl (fixed bottom-right 16, fades in after the hero, 0.4s/0.6s).
