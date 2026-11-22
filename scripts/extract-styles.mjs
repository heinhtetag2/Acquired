// Dumps resolved CSS vars + an annotated DOM outline (box + computed styles) per width.
// Usage: node scripts/extract-styles.mjs <route> <name>
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const route = process.argv[2] || '/'; const name = process.argv[3] || 'home';
const PROPS = ['font-family','font-size','line-height','letter-spacing','font-weight','font-style','text-transform','color','background-color','background-image','padding','margin','gap','border','border-radius','box-shadow','max-width','width','height','display','position','grid-template-columns','flex-direction','justify-content','align-items','opacity','transform','transition','backdrop-filter','object-fit','z-index','overflow'];
const DEFAULTS = {'padding':'0px','margin':'0px','gap':'normal','border':'0px none','border-radius':'0px','box-shadow':'none','max-width':'none','background-color':'rgba(0, 0, 0, 0)','background-image':'none','opacity':'1','transform':'none','transition':'all','backdrop-filter':'none','object-fit':'fill','z-index':'auto','overflow':'visible','grid-template-columns':'none','flex-direction':'row','justify-content':'normal','align-items':'normal','position':'static','font-style':'normal','text-transform':'none','letter-spacing':'normal'};
const b = await chromium.launch();
const out = {};
for (const w of [1440, 1024, 768, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  try { await p.goto('https://www.acquired.fm' + route, { waitUntil: 'networkidle', timeout: 60000 }); } catch {}
  await p.waitForTimeout(2500);
  out[w] = await p.evaluate(({ PROPS, DEFAULTS }) => {
    const root = getComputedStyle(document.documentElement);
    const vars = {};
    for (const sheet of document.styleSheets) { try { for (const r of sheet.cssRules) { const s = r.style; if (!s) continue; for (const k of s) if (k.startsWith('--')) vars[k] = root.getPropertyValue(k).trim(); } } catch {} }
    const lines = [];
    const walk = (el, depth) => {
      if (depth > 14) return;
      const cs = getComputedStyle(el); if (cs.display === 'none' || ['SCRIPT','STYLE','svg','path','NOSCRIPT'].includes(el.tagName)) return;
      const r = el.getBoundingClientRect();
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').replace(/\s+/g,' ').slice(0, 80);
      const st = {}; for (const k of PROPS) { const v = cs.getPropertyValue(k); if (DEFAULTS[k] === undefined || !v.startsWith(DEFAULTS[k])) st[k] = v; }
      if (!own) { for (const k of ['font-family','font-size','line-height','letter-spacing','font-weight','color','text-transform','font-style']) delete st[k]; }
      const attrs = el.tagName === 'A' ? ` href=${el.getAttribute('href')}` : el.tagName === 'IMG' ? ` src=${(el.currentSrc||el.src).split('/').pop().slice(0,60)} alt="${el.alt}"` : el.tagName==='INPUT' ? ` placeholder="${el.placeholder}"` : '';
      lines.push(`${'  '.repeat(depth)}<${el.tagName.toLowerCase()} .${[...el.classList].join('.')}${attrs}> [${Math.round(r.x)},${Math.round(r.y + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)}]${own ? ` "${own}"` : ''} ${JSON.stringify(st)}`);
      for (const c of el.children) walk(c, depth + 1);
    };
    walk(document.body, 0);
    return { vars, outline: lines.join('\n') };
  }, { PROPS, DEFAULTS });
  await p.close();
}
await fs.mkdir(`reference/${name}`, { recursive: true });
for (const w of Object.keys(out)) await fs.writeFile(`reference/${name}/outline-${w}.txt`, out[w].outline);
await fs.writeFile(`reference/${name}/vars.json`, JSON.stringify(Object.fromEntries(Object.keys(out).map(w => [w, out[w].vars])), null, 1));
await b.close();
console.log('done');
