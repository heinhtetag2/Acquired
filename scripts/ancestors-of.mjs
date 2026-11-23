// Prints the ancestor chain (class, x, width, padding, margin, border) of the first element matching a selector, live vs clone.
// Usage: W=1440,1024 node scripts/ancestors-of.mjs <route> <liveSel> <cloneSel> [cloneRoute]
import { chromium } from 'playwright';
const [route, liveSel, cloneSel, cloneRoute = route] = process.argv.slice(2);
const b = await chromium.launch();
for (const w of (process.env.W || '1440,1024,768,390').split(',').map(Number)) for (const [name, url, sel] of [['live', 'https://www.acquired.fm' + route, liveSel], ['clone', 'http://localhost:3100' + cloneRoute, cloneSel]]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(2500);
  const out = await p.evaluate((sel) => { const lines = []; for (let e = document.querySelector(sel); e && e !== document.body; e = e.parentElement) { const r = e.getBoundingClientRect(), c = getComputedStyle(e); lines.push(`${e.tagName.toLowerCase()}.${[...e.classList].slice(0, 3).join('.')} x${Math.round(r.x)} w${Math.round(r.width)} p[${c.padding}] m[${c.margin}] b[${c.borderLeftWidth}]`); } return lines.join('\n  '); }, sel);
  console.log(`${w} ${name}:\n  ${out}`); await p.close();
}
await b.close();
