// Usage: node scripts/measure-open.mjs <width> <route> <clickSel> <rootSel>
import { chromium } from 'playwright';
const [w, route, click, root] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto('https://www.acquired.fm' + route, { waitUntil: 'load' }); await p.waitForTimeout(3000);
await p.click(click); await p.waitForTimeout(1200);
console.log(await p.evaluate((root) => {
  const out = []; const P = ['padding', 'gap', 'border-top', 'border-bottom', 'border-left', 'border-radius', 'background-color', 'font-size', 'line-height', 'backdrop-filter', 'transform', 'height', 'top', 'bottom'];
  const walk = (el, d) => { if (d > 7) return; const cs = getComputedStyle(el); if (cs.display === 'none' || el.tagName === 'svg') return; const r = el.getBoundingClientRect(); if (!r.width) return;
    const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').slice(0, 30);
    const st = Object.fromEntries(P.map(k => [k, cs.getPropertyValue(k)]).filter(([k, v]) => !/^(0px|none|normal|auto|rgba\(0, 0, 0, 0\)|0px none.*|18px)$/.test(v)));
    out.push(`${'  '.repeat(d)}.${[...el.classList].join('.')} [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]${t ? ' "' + t + '"' : ''} ${JSON.stringify(st)}`);
    for (const c of el.children) walk(c, d + 1); };
  walk(document.querySelector(root), 0); return out.slice(0, 60).join('\n');
}, root));
await b.close();
