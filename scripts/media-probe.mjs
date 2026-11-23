// Lists visible img/video sources in the top viewport of a live route. Usage: node scripts/media-probe.mjs <route> [w]
import { chromium } from 'playwright';
const [route, w = '1024'] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto('https://www.acquired.fm' + route, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(3000);
console.log(await p.evaluate(() => [...document.querySelectorAll('img, video, picture source, canvas')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 100 && r.y < 700; }).map((e) => `${e.tagName} ${Math.round(e.getBoundingClientRect().width)} ${e.currentSrc || e.src || e.srcset || ''} ${e.tagName === 'VIDEO' ? 'loop:' + e.loop + ' autoplay:' + e.autoplay : ''}`).join('\n')));
await b.close();
