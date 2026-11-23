// Dumps logo + search box styles in the nav of a route, live vs clone. Usage: node scripts/nav-probe.mjs <route> <width>
import { chromium } from 'playwright';
const [route, w = '1440'] = process.argv.slice(2);
const b = await chromium.launch();
for (const [name, base] of [['live', 'https://www.acquired.fm'], ['clone', 'http://localhost:3100']]) {
  const p = await b.newPage({ viewport: { width: +w, height: 900 } });
  await p.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(3000);
  const r = await p.evaluate(() => {
    const d = (e) => { if (!e) return null; const c = getComputedStyle(e), b = e.getBoundingClientRect(); return `${e.tagName.toLowerCase()}.${[...e.classList].join('.')} x${Math.round(b.x)} y${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)} color:${c.color} bg:${c.backgroundColor} border:${c.borderTopWidth} ${c.borderTopColor} op:${c.opacity}`; };
    const inp = document.querySelector('input[type=search], input[placeholder*="Search" i]');
    const out = ['input ' + d(inp)]; for (let e = inp?.parentElement, i = 0; e && i < 3; e = e.parentElement, i++) out.push('  ^ ' + d(e));
    const svgs = [...document.querySelectorAll('svg')].filter((s) => { const b = s.getBoundingClientRect(); return b.y < 60 && b.x < 200 && b.width > 30; });
    svgs.forEach((s) => { out.push('logo ' + d(s)); out.push('  ^ ' + d(s.parentElement)); out.push('  fill ' + [...s.querySelectorAll('path')].slice(0, 2).map((x) => getComputedStyle(x).fill).join(',')); });
    return out.join('\n'); });
  console.log(`=== ${name}\n${r}`); await p.close();
}
await b.close();
