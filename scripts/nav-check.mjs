// Captures the nav strip of the clone at each width and reports logo/search/actions boxes and overlaps.
// Usage: node scripts/nav-check.mjs <outDir> <route...>
import { chromium } from 'playwright';
const [out, ...routes] = process.argv.slice(2);
const b = await chromium.launch();
for (const route of routes) for (const w of [1440, 1024, 768, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: 800 } });
  await p.goto('http://localhost:3100' + route, { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(3000);
  const r = await p.evaluate(() => { const box = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(r.width)]; };
    const logo = box('.nav__wordmark'), search = box('.search-section'), acts = box('.nav__actions');
    const hit = (a, c) => a && c && a[0] < c[1] && c[0] < a[1];
    return { text: document.querySelector('.nav__wordmark text')?.textContent, logo, search, acts, overlap: hit(logo, search) || hit(logo, acts) || hit(search, acts) }; });
  console.log(route.padEnd(16), w, JSON.stringify(r));
  await p.screenshot({ path: `${out}/nav-${route.replace(/\W+/g, '_')}-${w}.png`, clip: { x: 0, y: 0, width: w, height: 80 } });
  await p.close();
}
await b.close();
