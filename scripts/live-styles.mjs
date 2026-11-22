// Usage: node scripts/live-styles.mjs <width> <route> <sel> <props,comma>
import { chromium } from 'playwright';
const [w, route, sels, props] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto('https://www.acquired.fm' + route, { waitUntil: 'load' }); await p.waitForTimeout(3000);
for (const s of sels.split('|')) console.log(s, await p.evaluate(({ s, props }) => { const e = document.querySelector(s); if (!e) return null; const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return `[${Math.round(r.x)},${Math.round(r.y + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)}] ` + props.split(',').map(k => k + '=' + c.getPropertyValue(k)).join(' '); }, { s, props }));
await b.close();
