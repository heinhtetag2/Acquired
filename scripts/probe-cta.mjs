import { chromium } from 'playwright';
const w = +(process.argv[2] || 1440);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: 900 } });
await p.goto('https://www.acquired.fm/', { waitUntil: 'load' }); await p.waitForTimeout(3500);
const snap = (label) => p.evaluate((label) => { const c = document.querySelector('.fixed-cta-block'); const r = c.getBoundingClientRect(); const s = getComputedStyle(c); const pill = c.querySelector('.cta-pill');
  return `${label} y=${Math.round(scrollY)} cls="${c.className}" box=[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] radius=${s.borderRadius} pad=${s.padding} opacity=${s.opacity} transform=${s.transform} transition=${s.transition.slice(0, 120)} pillOp=${pill && getComputedStyle(pill).opacity} bg=${s.backgroundColor} shadow=${s.boxShadow}`; }, label);
console.log(await snap('top'));
for (const y of [700, 1000, 1300, 2000, 2400, 3300, 3600]) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(900); console.log(await snap('s')); }
await p.click('.cta-pill'); await p.waitForTimeout(1000); console.log(await snap('after pill click'));
await b.close();
