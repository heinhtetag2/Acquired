import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://www.acquired.fm/about', { waitUntil: 'load', timeout: 90000 }); await p.waitForTimeout(2500);
const H = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < H; y += 300) { await p.mouse.wheel(0, 300); await p.waitForTimeout(120); }
await p.waitForTimeout(2500);
const d = await p.evaluate(() => {
  const src = (i) => i && (i.currentSrc || i.src);
  const rows = [...document.querySelectorAll('.is-role-chart .audience-row')].map(r => ({ label: r.querySelector('.audience-label')?.textContent.trim(), value: r.querySelector('.audience-bar-value')?.textContent.trim(), w: r.querySelector('.audience-bar-fill').getBoundingClientRect().width, wrap: r.querySelector('.audience-bar-wrap').getBoundingClientRect().width, bg: getComputedStyle(r.querySelector('.audience-bar-fill')).backgroundColor }));
  const geo = [...document.querySelectorAll('.geo-bars .audience-bar-fill')].map(f => ({ value: f.textContent.trim(), w: f.getBoundingClientRect().width, bg: getComputedStyle(f).backgroundColor, t: getComputedStyle(f).transition }));
  const partners = [...document.querySelectorAll('[class*=partner] a, [class*=partner] img, [class*=logo-grid] > *')].slice(0, 30).map(e => ({ tag: e.tagName, href: e.getAttribute?.('href'), img: e.tagName === 'IMG' ? src(e) : src(e.querySelector?.('img')), svg: !!e.querySelector?.('svg'), cls: e.className, alt: e.querySelector?.('img')?.alt || e.alt || e.textContent.trim().slice(0, 20) }));
  const imgs = [...document.querySelectorAll('img')].map(i => ({ alt: i.alt, src: src(i), cls: i.className })).filter(i => i.src && !i.src.includes('cover') && !i.src.includes('website-files.com/68575598833e9d27c4de294b/6'));
  const audHead = [...document.querySelectorAll('.aud-stat-grid')][0]?.parentElement?.innerText.slice(0, 300);
  const fillT = getComputedStyle(document.querySelector('.audience-bar-fill')).transition;
  return { rows, geo, partners, imgs, audHead, fillT };
});
fs.writeFileSync('reference/about/data.json', JSON.stringify(d, null, 1));
console.log(JSON.stringify({ rows: d.rows.map(r => `${r.label} ${r.value} ${Math.round(r.w)}/${Math.round(r.wrap)} ${r.bg}`), geo: d.geo, fillT: d.fillT, partners: d.partners.length, p0: d.partners.slice(0, 3), imgs: d.imgs }, null, 1));
await b.close();
