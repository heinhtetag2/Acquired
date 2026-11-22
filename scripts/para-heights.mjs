import { chromium } from 'playwright';
const [route, sel, base = 'http://localhost:3100'] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(base + route, { waitUntil: 'load' }); await p.waitForTimeout(1500);
console.log(await p.evaluate((sel) => [...document.querySelectorAll(sel)].map(e => Math.round(e.getBoundingClientRect().height)).join(' '), sel));
await b.close();
