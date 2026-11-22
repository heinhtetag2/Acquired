import { chromium } from 'playwright';
const w = +(process.argv[2] || 1440);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: 900 } });
await p.goto('http://localhost:3100/'); await p.waitForTimeout(3500);
const snap = (l) => p.evaluate((l) => { const c = document.querySelector('.fcta'); const r = c.getBoundingClientRect(); const s = getComputedStyle(c); return `${l} y=${Math.round(scrollY)} cls="${c.className}" box=[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] r=${s.borderRadius} op=${(+s.opacity).toFixed(2)}`; }, l);
console.log(await snap('top'));
for (const y of [700, 1300, 2000, 3300]) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(1400); console.log(await snap('s')); }
await p.evaluate(() => window.scrollTo(0, 2000)); await p.waitForTimeout(1400);
await p.click('.fcta__pill'); await p.waitForTimeout(1000); console.log(await snap('after pill'));
await b.close();
