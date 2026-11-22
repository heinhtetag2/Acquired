import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://www.acquired.fm/episodes', { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
const flags = await p.evaluate(() => [...document.querySelectorAll('.playlist-block-item')].map(r => {
  const m = r.querySelector('.font-display.flex-row-left'); const ic = m?.querySelector('.icon');
  return [r.querySelector('a.playlist-block-link')?.getAttribute('href')?.split('/').pop(), !!(ic && getComputedStyle(ic).display !== 'none')];
}));
const d = JSON.parse(fs.readFileSync('reference/episodes/data.json'));
const f = Object.fromEntries(flags); d.rows.forEach(r => r.video = !!f[r.slug]);
fs.writeFileSync('reference/episodes/data.json', JSON.stringify(d, null, 1));
console.log(d.rows.filter(r => r.video).map(r => r.slug).join(', '));
await b.close();
