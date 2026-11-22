// Measures computed font sizes / spacer heights for utility classes on the live site at each width.
import { chromium } from 'playwright';
const route = process.argv[2] || '/';
const SELS = { 'font-body': '.font-body', 'text-xs': '.text-xs', 'text-sm': '.text-sm', 'text-lg': '.text-lg', 'text-2xl': '.text-2xl', 'text-4xl': '.text-4xl', 'text-6xl': '.text-6xl', 'text-8xl': '.text-8xl', 'text-9xl': '.text-9xl',
  'space-4xs': '.spacer-x.space-4xs', 'space-3xs': '.spacer-x.space-3xs', 'space-2xs': '.spacer-x.space-2xs', 'space-xs': '.spacer-x.space-xs', 'space-sm': '.spacer-x.space-sm', 'space-base': '.spacer-x.space-base', 'space-lg': '.spacer-x.space-lg', 'space-xl': '.spacer-x.space-xl', 'space-2xl': '.spacer-x.space-2xl', 'space-3xl': '.spacer-x.space-3xl', 'space-4xl': '.spacer-x.space-4xl', 'page-section-pad': '.page-section' };
const b = await chromium.launch(); const rows = {};
for (const w of [1440, 1024, 768, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto('https://www.acquired.fm' + route, { waitUntil: 'load' }); await p.waitForTimeout(2500);
  const r = await p.evaluate((SELS) => Object.fromEntries(Object.entries(SELS).map(([k, s]) => { const e = [...document.querySelectorAll(s)].find(x => x.getBoundingClientRect().width > 0); if (!e) return [k, '-']; const c = getComputedStyle(e);
    return [k, k.startsWith('space') ? Math.round(e.getBoundingClientRect().height) : k === 'page-section-pad' ? c.paddingLeft : c.fontSize]; })), SELS);
  for (const [k, v] of Object.entries(r)) (rows[k] ||= {})[w] = v;
  await p.close();
}
console.table(rows); await b.close();
