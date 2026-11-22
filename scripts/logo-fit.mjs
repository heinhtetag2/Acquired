import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('https://www.acquired.fm/', { waitUntil: 'load' }); await p.waitForTimeout(2000);
console.log(await p.evaluate(() => { const s = document.querySelector('.nav-logo .logo-full svg'); const r = s.getBoundingClientRect(); return { box: [r.width, r.height], viewBox: s.getAttribute('viewBox'), paths: s.querySelectorAll('path').length }; }));
await p.screenshot({ path: 'qa/states/logo-live.png', clip: { x: 30, y: 25, width: 150, height: 30 } });
const p2 = await b.newPage();
await p2.setContent(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Geist:wght@600;700&family=Archivo:wdth,wght@125,700&family=Unbounded:wght@600&display=block"><body style="margin:0;background:#fffcf5">
${['Montserrat|700', 'Montserrat|600', 'Geist|700', 'Archivo|700'].map(([f]) => '').join('')}
${['Montserrat;700', 'Montserrat;600', 'Geist;700', 'Archivo;700'].map((x, i) => { const [f, w] = x.split(';'); return `<div style="position:absolute;left:36px;top:${10 + i * 40}px;font-family:'${f}';font-weight:${w};font-size:22px;letter-spacing:.06em;line-height:1;color:#1b1915${f === 'Archivo' ? ';font-stretch:125%' : ''}" data-f="${x}">ACQUIRED</div>`; }).join('')}</body>`);
await p2.waitForTimeout(3000);
console.log(await p2.evaluate(() => [...document.querySelectorAll('[data-f]')].map(e => { const c = document.createElement('canvas').getContext('2d'); const cs = getComputedStyle(e); c.font = `${cs.fontWeight} 100px '${cs.fontFamily.replace(/["']/g, '')}'`; const m = c.measureText('H'); return `${e.dataset.f} w=${Math.round(e.getBoundingClientRect().width)} cap/em=${(m.actualBoundingBoxAscent / 100).toFixed(3)}`; })));
await p2.screenshot({ path: 'qa/states/logo-cands.png', clip: { x: 30, y: 5, width: 200, height: 165 } });
await b.close();
