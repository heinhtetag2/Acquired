// Scrapes header metrics (once) and ordered episode slugs for every sidebar filter page.
import { chromium } from 'playwright';
import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('reference/episodes/data.json'));
const hrefs = d.groups.flatMap(g => g.links.map(l => l.href)).filter(h => h.startsWith('/') && h !== '/episodes' && h !== '/acq2');
const b = await chromium.launch();
const out = {};
const one = async (href, measure) => {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('https://www.acquired.fm' + href, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
  out[href] = await p.evaluate((measure) => {
    const slugs = [...document.querySelectorAll('.playlist-block-item a.playlist-block-link')].filter(a => getComputedStyle(a.closest('.playlist-block-item')).display !== 'none').map(a => a.getAttribute('href').split('/').pop());
    const head = document.querySelector('.discover-nav.desktop-only') || document.querySelector('.playlist-main h1')?.parentElement;
    const res = { title: document.querySelector('.playlist-main h1')?.textContent.trim(), slugs, status: document.title };
    if (measure && head) {
      const box = (e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return { cls: e.className, box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], fs: c.fontSize, lh: c.lineHeight, color: c.color, ff: c.fontFamily.split(',')[0], pad: c.padding, bb: c.borderBottom, pos: c.position, text: e.children.length ? '' : e.textContent.trim().slice(0, 30) }; };
      res.head = [head, ...head.querySelectorAll('*')].slice(0, 12).map(box);
      res.firstRow = box(document.querySelector('.playlist-block-item'));
      res.prev = [...document.querySelectorAll('.playlist-main > *')].slice(0, 4).map(box);
      res.desc = document.querySelector('.playlist-main .w-richtext, .playlist-main p')?.textContent.trim().slice(0, 60);
    }
    return res;
  }, measure);
  await p.close();
  console.log(href, out[href].slugs.length);
};
await one('/features/must-listen', true);
await one('/industry/software', true);
const rest = hrefs.filter(h => !out[h]);
for (let i = 0; i < rest.length; i += 3) await Promise.all(rest.slice(i, i + 3).map(h => one(h, false)));
fs.writeFileSync('reference/episodes/filters.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify({ head: out['/features/must-listen'].head, prev: out['/features/must-listen'].prev, firstRow: out['/features/must-listen'].firstRow, desc: out['/features/must-listen'].desc }, null, 1));
await b.close();
