import { chromium } from 'playwright';
const [w, route, liveSels, cloneSels] = process.argv.slice(2);
const b = await chromium.launch();
for (const [base, sels] of [['https://www.acquired.fm', liveSels], ['http://localhost:3100', cloneSels]]) {
  const p = await b.newPage({ viewport: { width: +w, height: 900 } });
  await p.goto(base + route, { waitUntil: 'load' }); await p.waitForTimeout(2500);
  console.log(base.includes('localhost') ? 'clone' : 'live ', await p.evaluate((sels) => sels.split('|').map(s => { const e = document.querySelector(s); if (!e) return 'null'; const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return `${Math.round(r.y + scrollY)}/${Math.round(r.height)}(fs${c.fontSize} lh${c.lineHeight} mb${c.marginBottom})`; }).join('  '), sels));
  await p.close();
}
await b.close();
