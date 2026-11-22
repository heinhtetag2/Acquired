// Usage: node scripts/rect.mjs <width> <route> <sel...>
import { chromium } from 'playwright';
const [w, route, ...sels] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto('http://localhost:3100' + route, { waitUntil: 'load' }); await p.waitForTimeout(2000);
for (const s of sels) console.log(s, await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return `[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] pos=${c.position} left=${c.left} translate=${c.translate} w=${c.width}`; }, s));
await b.close();
