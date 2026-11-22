import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 900 } });
await p.goto('https://www.acquired.fm/about', { waitUntil: 'load' }); await p.waitForTimeout(2500);
const H = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < H; y += 400) { await p.mouse.wheel(0, 400); await p.waitForTimeout(100); }
await p.waitForTimeout(2000);
console.log(await p.evaluate(() => {
  const out = []; const P = ['display', 'grid-template-columns', 'gap', 'padding', 'font-size', 'height', 'flex-direction'];
  const walk = (el, d) => { if (d > 6) return; const cs = getComputedStyle(el); if (cs.display === 'none') return; const r = el.getBoundingClientRect(); if (!r.width) return;
    const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').slice(0, 40);
    out.push(`${'  '.repeat(d)}.${[...el.classList].join('.')} [${Math.round(r.x)},${Math.round(r.y + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)}]${t ? ' "' + t + '"' : ''} ${P.map(k => cs.getPropertyValue(k)).join(' | ')} bg=${cs.backgroundColor}`);
    for (const c of el.children) walk(c, d + 1); };
  walk(document.querySelector('.is-geo-chart'), 0); out.push('----'); walk(document.querySelector('.is-role-chart .audience-row'), 0);
  return out.join('\n');
}));
await b.close();
