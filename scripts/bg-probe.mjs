// Prints background colours of body/main/sections at a point on a live route. Usage: node scripts/bg-probe.mjs <route> [x] [y]
import { chromium } from 'playwright';
const [route, x = '700', y = '250'] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto((process.env.BASE || 'https://www.acquired.fm') + route, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(2500);
console.log(await p.evaluate(([x, y]) => { const out = []; for (let e = document.elementFromPoint(+x, +y); e; e = e.parentElement) { const c = getComputedStyle(e); out.push(`${e.tagName.toLowerCase()}.${[...e.classList].slice(0, 3).join('.')} bg:${c.backgroundColor} img:${c.backgroundImage.slice(0, 60)}`); } return out.join('\n'); }, [x, y]));
await b.close();
