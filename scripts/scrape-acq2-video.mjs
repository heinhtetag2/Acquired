import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://www.acquired.fm/acq2', { waitUntil: 'load', timeout: 90000 }); await p.waitForTimeout(3000);
const flags = await p.evaluate(() => [...document.querySelectorAll('.acq2-item')].map(it => {
  const row = it.querySelector('.flex-row-left.font-display'); const icon = row && [...row.querySelectorAll('.icon, svg')].find(e => { const r = e.getBoundingClientRect(); return r.width > 0 && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden'; });
  return [it.querySelector('a.playlist-block-link')?.getAttribute('href')?.split('/').pop(), !!icon];
}));
const c = JSON.parse(fs.readFileSync('content/acq2.json')); const f = Object.fromEntries(flags);
c.forEach(e => e.video = !!f[e.slug]); fs.writeFileSync('content/acq2.json', JSON.stringify(c, null, 1));
console.log(c.filter(e => e.video).length, 'video:', c.filter(e => e.video).map(e => e.slug).slice(0, 8).join(', '));
await b.close();
