// Prints the live body class + background for a list of routes.
import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
for (const r of process.argv.slice(2)) {
  try { await p.goto('https://www.acquired.fm' + r, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(800);
    console.log(r.padEnd(40), await p.evaluate(() => document.body.className + ' | ' + getComputedStyle(document.body).backgroundColor)); } catch (e) { console.log(r, 'ERR', e.message.slice(0, 60)); }
}
await b.close();
