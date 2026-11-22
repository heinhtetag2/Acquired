import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch(); const out = {};
for (const w of [1440, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto('https://www.acquired.fm/', { waitUntil: 'load' }); await p.waitForTimeout(3500);
  if (w < 768) await p.click('.search-bar'); else await p.click('.search-input');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `qa/states/search-open-${w}.png` });
  const outline = await p.evaluate(() => {
    const root = document.querySelector('.search-section') || document.querySelector('.search-popup');
    const lines = []; const P = ['font-size','line-height','font-family','color','background-color','padding','gap','border','border-radius','box-shadow','backdrop-filter','opacity','transition','text-transform'];
    const walk = (el, d) => { if (d > 9) return; const cs = getComputedStyle(el); if (cs.display === 'none') return; const r = el.getBoundingClientRect();
      const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').slice(0, 50);
      const st = Object.fromEntries(P.map(k => [k, cs.getPropertyValue(k)]).filter(([k, v]) => !['0px', 'none', 'normal', 'rgba(0, 0, 0, 0)', 'all', '1'].includes(v) && !(k.startsWith('font') && !t) && !(k === 'color' && !t) && !(k === 'line-height' && !t) && !(k === 'text-transform' && !t)));
      lines.push(`${'  '.repeat(d)}<${el.tagName.toLowerCase()} .${[...el.classList].join('.')}> [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]${t ? ` "${t}"` : ''} ${JSON.stringify(st)}`);
      for (const c of el.children) walk(c, d + 1); };
    walk(root, 0); return lines.join('\n') + '\n\nBG: ' + JSON.stringify(Object.fromEntries(['background-color','backdrop-filter','opacity','transition'].map(k => [k, getComputedStyle(document.querySelector('.search-popup-bg')).getPropertyValue(k)])));
  });
  fs.writeFileSync(`reference/home/search-outline-${w}.txt`, outline);
  await p.keyboard.type('disney', { delay: 60 }); await p.waitForTimeout(1500);
  await p.screenshot({ path: `qa/states/search-results-${w}.png` });
  const res = await p.evaluate(() => document.querySelector('.search-results')?.innerHTML.slice(0, 1500));
  fs.writeFileSync(`reference/home/search-results-${w}.html`, res || '');
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(300);
  await p.screenshot({ path: `qa/states/search-active-${w}.png` });
  await p.fill('.search-input', 'zzqxv'); await p.waitForTimeout(1200);
  await p.screenshot({ path: `qa/states/search-empty-${w}.png` });
  await p.close();
}
await b.close(); console.log('ok');
