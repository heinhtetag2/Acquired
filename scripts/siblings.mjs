// Lists the children (class, y, h, margin) of the parent of the first visible element matching a selector on live (or BASE).
// Usage: W=390 node scripts/siblings.mjs <route> <selector> [levelsUp]
import { chromium } from 'playwright';
const [route, sel, up = '1'] = process.argv.slice(2);
const b = await chromium.launch();
for (const w of (process.env.W || '390').split(',').map(Number)) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto((process.env.BASE || 'https://www.acquired.fm') + route, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(2500);
  console.log(w, await p.evaluate(([sel, up]) => { let e = [...document.querySelectorAll(sel)].find((x) => x.getBoundingClientRect().height > 0); for (let i = 0; i < +up; i++) e = e.parentElement;
    const d = (x) => { const r = x.getBoundingClientRect(), c = getComputedStyle(x); return `${x.tagName.toLowerCase()}.${[...x.classList].slice(0, 3).join('.')} y${Math.round(r.y + scrollY)} h${Math.round(r.height)} w${Math.round(r.width)} m[${c.margin}] p[${c.padding}] g[${c.gap}] ${c.display}`; };
    return d(e) + '\n  ' + [...e.children].filter((x) => x.getBoundingClientRect().height > 0 || x.className.includes('spacer')).map(d).join('\n  '); }, [sel, up]));
  await p.close();
}
await b.close();
