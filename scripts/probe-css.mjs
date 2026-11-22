import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:3100/?listen=1'); await p.waitForTimeout(2500);
console.log(await p.evaluate(() => { const s = document.querySelector('.listen-section'); const c = getComputedStyle(s);
  let anc = []; for (let e = s.parentElement; e; e = e.parentElement) { const k = getComputedStyle(e); if (k.filter !== 'none' || k.backdropFilter !== 'none' || k.opacity !== '1' || k.transform !== 'none' || k.willChange !== 'auto' || k.mixBlendMode !== 'normal') anc.push(e.tagName + '.' + e.className + ' ' + [k.filter, k.opacity, k.transform, k.willChange].join('|')); }
  const hero = getComputedStyle(document.querySelector('.hero')); 
  return { bf: c.backdropFilter, webkit: c.webkitBackdropFilter, op: c.opacity, anc, heroZ: hero.zIndex, heroPos: hero.position }; }));
await b.close();
