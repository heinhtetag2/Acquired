// Prints rects of the first N visible <img> in main, live vs clone. Usage: node scripts/img-rects.mjs <width> <route> [n]
import { chromium } from 'playwright';
const [w, route, n = '8'] = process.argv.slice(2);
const b = await chromium.launch();
for (const [name, base] of [['live', 'https://www.acquired.fm'], ['clone', 'http://localhost:3100']]) {
  const p = await b.newPage({ viewport: { width: +w, height: 900 } });
  await p.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(2500);
  console.log(name, await p.evaluate((n) => [...document.querySelectorAll('main img')].filter((i) => i.getBoundingClientRect().width > 20).slice(0, n).map((i) => { const r = i.getBoundingClientRect(), c = getComputedStyle(i); return `${Math.round(r.x * 10) / 10},${Math.round((r.y + scrollY) * 10) / 10} ${Math.round(r.width * 10) / 10}x${Math.round(r.height * 10) / 10} ${c.objectFit}/${c.objectPosition}`; }).join('\n      '), +n));
  await p.close();
}
await b.close();
