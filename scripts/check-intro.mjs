import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('console', m => m.type()==='error' && console.log('console:', m.text()));
await p.goto('http://localhost:3100/'); 
for (const t of [300, 800, 1500, 2500]) { await p.waitForTimeout(t === 300 ? 300 : t - [300,800,1500,2500][[300,800,1500,2500].indexOf(t)-1]);
  console.log(t, await p.evaluate(() => ({ ov: document.documentElement.style.overflow, ops: [...document.querySelectorAll('.hero__item')].map(e => (+getComputedStyle(e).opacity).toFixed(2)).join(' '), scrim: getComputedStyle(document.querySelector('.hero__scrim')).opacity, cta: getComputedStyle(document.querySelector('.hero__cta')).opacity }))); }
await b.close();
