import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://www.acquired.fm/episodes', { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
const data = await p.evaluate(() => {
  const groups = [...document.querySelectorAll('.playlist-sidebar > .flex-col-left')].map(g => ({
    heading: g.querySelector('.sidebar-group-header')?.textContent.trim(),
    links: [...g.querySelectorAll('a.playlist-sidebar-link')].map(a => ({ label: a.textContent.trim(), href: a.getAttribute('href') })),
  }));
  const rows = [...document.querySelectorAll('.playlist-block-item')].map(r => {
    const img = r.querySelector('img'); const media = r.querySelector('.episode-item-media');
    const meta = r.querySelector('.font-display.flex-row-left');
    const ab = r.querySelector('.audio-btn');
    return {
      slug: r.querySelector('a.playlist-block-link')?.getAttribute('href')?.split('/').pop(),
      title: r.querySelector('.playlist-block-header')?.textContent.trim(),
      meta: meta?.innerText.replace(/\s+/g, ' ').trim(),
      img: img?.currentSrc || img?.src, bg: media && getComputedStyle(media).backgroundColor,
      spotify: r.querySelector('a[href*="spotify"]')?.href, apple: r.querySelector('a[href*="apple"]')?.href,
      audio: ab && [...ab.attributes].filter(a => a.name.startsWith('data-')).map(a => `${a.name}=${a.value.slice(0, 120)}`),
      hidden: getComputedStyle(r).display === 'none',
    };
  });
  return { groups, rows };
});
fs.writeFileSync('reference/episodes/data.json', JSON.stringify(data, null, 1));
console.log(data.groups.map(g => `${g.heading}: ${g.links.map(l => l.label).join(', ')}`).join('\n'));
console.log(data.rows.length, 'rows; hidden', data.rows.filter(r => r.hidden).length);
console.log(JSON.stringify(data.rows.slice(0, 2), null, 1));
// skim mode
await p.click('.filter-btn.list-btn'); await p.waitForTimeout(800);
await p.screenshot({ path: 'reference/episodes/1440-skim.png' });
const skim = await p.evaluate(() => { const r = document.querySelector('.playlist-block-item'); const c = getComputedStyle(r); const l = getComputedStyle(document.querySelector('.playlist-grid-list'));
  return { row: [r.offsetWidth, r.offsetHeight, c.padding, c.gap], grid: l.gridTemplateColumns, media: getComputedStyle(r.querySelector('.episode-item-media')).display, extra: getComputedStyle(r.querySelector('.episode-item-extra')).display }; });
console.log('skim', JSON.stringify(skim));
await b.close();
