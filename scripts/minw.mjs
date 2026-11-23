// Lists descendants of a live element with explicit min-width / width / white-space that could set min-content. Usage: node scripts/minw.mjs <route> <sel> [w]
import { chromium } from 'playwright';
const [route, sel, w = '1024'] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto('https://www.acquired.fm' + route, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(2000);
console.log(await p.evaluate((sel) => { const root = [...document.querySelectorAll(sel)].find((x) => x.getBoundingClientRect().height > 0);
  return [root, ...root.querySelectorAll('*')].map((x) => { const c = getComputedStyle(x); return `${x.tagName.toLowerCase()}.${[...x.classList].slice(0, 3).join('.')} w${Math.round(x.getBoundingClientRect().width)} min:${c.minWidth} max:${c.maxWidth} flex:${c.flex} ws:${c.whiteSpace} disp:${c.display}`; }).join('\n'); }, sel));
await b.close();
