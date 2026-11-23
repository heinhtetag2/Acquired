// Reports the "you may also enjoy" slider arrow states on live before/after clicking prev. Usage: node scripts/slider-probe.mjs <route>
import { chromium } from 'playwright';
const [route] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1024, height: 900 } });
await p.goto((process.env.BASE || 'https://www.acquired.fm') + route, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(2500);
const state = () => p.evaluate(() => { const h = [...document.querySelectorAll('*')].find((e) => /you may also enjoy/i.test(e.textContent) && e.children.length === 0); let sec = h; for (let i = 0; i < 6 && sec; i++) { if (sec.querySelectorAll('button, a[class*=arrow], [class*=arrow]').length >= 2) break; sec = sec.parentElement; }
  const btns = [...sec.querySelectorAll('button, [class*=arrow]')].filter((x) => { const r = x.getBoundingClientRect(); return r.width > 20 && r.width < 80; });
  const track = sec.querySelector('[class*=track], [class*=slider], [class*=list]');
  return btns.map((x) => { const c = getComputedStyle(x); return `${x.tagName}.${[...x.classList].slice(0, 3).join('.')} op:${c.opacity} bg:${c.backgroundColor} dis:${x.disabled ?? ''} aria:${x.getAttribute('aria-disabled')} pe:${c.pointerEvents}`; }).join('\n') + `\nscrollLeft:${track?.scrollLeft} class:${track?.className}`; });
console.log('initial\n' + await state());
await b.close();
