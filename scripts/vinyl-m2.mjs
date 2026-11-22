import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 900 } });
await p.goto('http://localhost:3100/', { waitUntil: 'load' }); await p.waitForTimeout(4000);
await p.click('.hero__item >> nth=0 >> .hero__open', { force: true }); await p.waitForTimeout(2800);
console.log(await p.evaluate(() => ['.hero-vinyl__record', '.hero-vinyl__back', '.hero-vinyl__title', '.hero-vinyl__sub', '.hero-vinyl__cta .btn', '.hero-vinyl__cta .btn:nth-child(2)'].map(s => { const r = document.querySelector(s).getBoundingClientRect(); return `${s} [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`; }).join('\n')));
await b.close();
