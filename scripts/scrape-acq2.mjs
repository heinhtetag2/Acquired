import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://www.acquired.fm/acq2', { waitUntil: 'load', timeout: 90000 }); await p.waitForTimeout(3000);
const d = await p.evaluate(() => [...document.querySelectorAll('.acq2-item')].map(it => ({
  slug: it.querySelector('a.playlist-block-link')?.getAttribute('href')?.split('/').pop(),
  title: it.querySelector('h2, h3')?.textContent.trim(),
  date: [...it.querySelectorAll('.font-display div, .font-display')].map(e => e.textContent.trim()).find(t => /\d{4}$/.test(t)),
  img: it.querySelector('img.acq2-img')?.currentSrc,
  video: !!it.querySelector('.font-display .icon, .font-display svg'),
  zone: it.closest('.acq2-discover-left') ? 'featured' : it.closest('.acq2-discover-right') ? 'side' : 'grid',
})));
fs.mkdirSync('reference/acq2', { recursive: true });
fs.writeFileSync('reference/acq2/data.json', JSON.stringify(d, null, 1));
console.log(d.length, 'items', d.filter(x => x.zone === 'featured').length, 'featured', d.filter(x => x.zone === 'side').length, 'side');
console.log(JSON.stringify(d.slice(0, 2)));
await b.close();
