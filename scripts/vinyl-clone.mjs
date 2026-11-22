import { chromium } from 'playwright';
const w = +(process.argv[2] || 1440);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
await p.goto('http://localhost:3100/', { waitUntil: 'load' }); await p.waitForTimeout(4000);
// Seinfeld is heroOrder[0] → first DOM item
await p.click('.hero__item >> nth=0 >> .hero__open', { force: true });
const t0 = Date.now();
for (const t of [100, 300, 600, 1000, 1600, 2600]) { await p.waitForTimeout(Math.max(0, t - (Date.now() - t0))); await p.screenshot({ path: `qa/vinyl/clone-${w}-${t}.png` }); }
console.log(await p.evaluate(() => { const r = document.querySelector('.hero-vinyl__record').getBoundingClientRect(); return { vinyl: [Math.round(r.x), Math.round(r.y), Math.round(r.width)], nav: document.querySelector('.nav').className, title: document.querySelector('.hero-vinyl__title').textContent }; }));
await p.keyboard.press('Escape'); await p.waitForTimeout(2200);
await p.screenshot({ path: `qa/vinyl/clone-${w}-closed.png` });
console.log('closed', await p.evaluate(() => [document.documentElement.classList.contains('hero-is-active'), getComputedStyle(document.querySelector('.hero__grid')).transform, document.querySelector('.nav').className]));
console.log('errors', errs); await b.close();
