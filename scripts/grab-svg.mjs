// Saves the outerHTML of the first live SVG matching a selector. Usage: node scripts/grab-svg.mjs <route> <selector> <out>
import { chromium } from 'playwright';
import fs from 'node:fs';
const [route, sel, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://www.acquired.fm' + route, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(2000);
const html = await p.evaluate((sel) => { const s = [...document.querySelectorAll(sel)].find((x) => x.getBoundingClientRect().width > 0); return s && s.outerHTML; }, sel);
fs.writeFileSync(out, html); console.log(html?.length, html?.slice(0, 300)); await b.close();
