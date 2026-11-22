import { chromium } from 'playwright';
import fs from 'node:fs';
const w = +(process.argv[2] || 1440); const base = process.argv[3] || 'https://www.acquired.fm'; const who = process.argv[4] || 'live';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: 900 } });
await p.goto(base + '/', { waitUntil: 'load' }); await p.waitForTimeout(5000);
fs.mkdirSync('qa/vinyl', { recursive: true });
const sel = who === 'live' ? '.acq-hero-item:has(img[alt="Seinfeld"]) .acq-hero-cover-skin' : '.hero__item:has(img[alt=""]) .hero__open';
await p.click(sel, { force: true });
const t0 = Date.now();
for (const t of [100, 300, 600, 1000, 1600, 2600]) { await p.waitForTimeout(Math.max(0, t - (Date.now() - t0))); await p.screenshot({ path: `qa/vinyl/${who}-${w}-${t}.png` }); }
if (who === 'live') {
  const info = await p.evaluate(() => {
    const ov = document.querySelector('.acq-hero-overlay'); const hero = document.querySelector('.acq-hero');
    const box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return `[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`; };
    const lines = []; const walk = (el, d) => { if (d > 8) return; const cs = getComputedStyle(el); if (cs.display === 'none' || el.tagName === 'svg' || el.tagName === 'path') return; const r = el.getBoundingClientRect(); if (!r.width) return;
      const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').slice(0, 60);
      lines.push(`${'  '.repeat(d)}<${el.tagName.toLowerCase()} .${[...el.classList].join('.')}> ${box(el)}${t ? ' "' + t + '"' : ''} fs=${cs.fontSize} ff=${cs.fontFamily.split(',')[0]} c=${cs.color} bg=${cs.backgroundColor} op=${cs.opacity}`);
      for (const c of el.children) walk(c, d + 1); };
    if (ov) walk(ov, 0);
    return { heroCls: hero.className, heroVars: ['--active-bg', '--active-fg', '--active-400', '--wash-opacity'].map(k => k + '=' + getComputedStyle(hero).getPropertyValue(k)).join(' '), grid: getComputedStyle(document.querySelector('.acq-hero-grid')).transform, vinyl: box(document.querySelector('#acqHeroVinyl, .acq-hero-vinyl-wrap')), vinylImg: document.querySelector('.acq-hero-vinyl-img')?.currentSrc, url: location.href, overlay: lines.join('\n') };
  });
  fs.writeFileSync('qa/vinyl/live-info.json', JSON.stringify(info, null, 1)); console.log(JSON.stringify({ ...info, overlay: undefined }, null, 1)); console.log(info.overlay.slice(0, 4000));
}
await b.close();
