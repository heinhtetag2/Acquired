// Usage: node scripts/states-one.mjs <width> <route> <clickSel> <name> [extraWaitMs]
import { chromium } from 'playwright';
const [w, route, sel, name, extra = '1200'] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto('http://localhost:3100' + route, { waitUntil: 'load' }); await p.waitForTimeout(2500);
if (sel !== '-') await p.click(sel); await p.waitForTimeout(+extra);
await p.screenshot({ path: `qa/states/${w}/${name}-clone.png` }); await b.close();
