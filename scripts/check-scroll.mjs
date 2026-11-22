import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:3100/'); await p.waitForTimeout(4500);
for (const y of [0, 90, 300, 500, 700]) {
  await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(150);
  console.log(y, await p.evaluate(() => ({ ops: [...document.querySelectorAll('.hero__item')].map(e => (+e.style.opacity || 0).toFixed(2)).join(' '), scrim: (+getComputedStyle(document.querySelector('.hero__scrim')).opacity).toFixed(2), cta: (+getComputedStyle(document.querySelector('.hero__cta')).opacity).toFixed(2) })));
}
await b.close();
