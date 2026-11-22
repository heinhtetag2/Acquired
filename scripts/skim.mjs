import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://www.acquired.fm/episodes', { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
await p.click('.discover-nav.desktop-only .list-btn'); await p.waitForTimeout(1000);
await p.screenshot({ path: 'reference/episodes/1440-skim.png' });
console.log(JSON.stringify(await p.evaluate(() => {
  const r = document.querySelector('.playlist-block-item'); const c = getComputedStyle(r); const l = getComputedStyle(document.querySelector('.playlist-grid-list'));
  const g = (s) => { const e = r.querySelector(s); if (!e) return null; const k = getComputedStyle(e); const b = e.getBoundingClientRect(); return { box: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)], display: k.display, fs: k.fontSize, lh: k.lineHeight, opacity: k.opacity }; };
  return { cls: document.querySelector('.playlist-grid-list').className, row: [r.offsetWidth, r.offsetHeight, c.padding, c.gap, c.borderBottom], grid: l.gridTemplateColumns, gridGap: l.gap,
    media: g('.episode-item-media'), title: g('.playlist-block-header'), meta: g('.font-display.flex-row-left'), extra: g('.episode-item-extra'), audio: g('.audio-btn'),
    toggles: [...document.querySelectorAll('.discover-nav.desktop-only .filter-btn')].map(e => [e.className, getComputedStyle(e).backgroundColor]) };
}), null, 1));
// hover state in browse mode
await p.click('.discover-nav.desktop-only .grid-btn'); await p.waitForTimeout(600);
await p.hover('.playlist-block-item'); await p.waitForTimeout(600);
console.log('hover', JSON.stringify(await p.evaluate(() => { const r = document.querySelector('.playlist-block-item');
  return { bg: getComputedStyle(r).backgroundColor, border: getComputedStyle(r).border, links: getComputedStyle(r.querySelector('.podcast-link-wrap')).opacity, img: getComputedStyle(r.querySelector('img')).transform, audio: getComputedStyle(r.querySelector('.audio-btn')).backgroundColor, trans: getComputedStyle(r).transition }; })));
await b.close();
