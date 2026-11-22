import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://www.acquired.fm/artifacts', { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
const d = await p.evaluate(() => [...document.querySelectorAll('.ep-artifacts-grid > *')].map(g => ({
  slug: g.querySelector('a.ep-artifacts-link')?.getAttribute('href')?.split('/').pop(),
  title: g.querySelector('a.ep-artifacts-link')?.textContent.trim(),
  frames: [...g.querySelectorAll('.ep-artifacts-strip > *')].map(f => { const i = f.querySelector('img'); const r = f.getBoundingClientRect(); return { src: i && (i.currentSrc || i.src), w: Math.round(r.width), h: Math.round(r.height), video: !!f.querySelector('video') }; }),
})));
fs.writeFileSync('reference/artifacts/data.json', JSON.stringify(d, null, 1));
console.log(d.map(g => `${g.slug}: ${g.frames.length} frames, first ${g.frames[0]?.w}x${g.frames[0]?.h}`).join('\n'));
await b.close();
