// Prints flex/width CSS of the children of the live footer main. Usage: W=.. node scripts/flex-of.mjs <route> <parentSel>
import { chromium } from 'playwright';
const [route, sel] = process.argv.slice(2);
const b = await chromium.launch();
for (const w of (process.env.W || '1440,1024').split(',').map(Number)) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto((process.env.BASE || 'https://www.acquired.fm') + route, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(2000);
  console.log(w, await p.evaluate((sel) => { const e = [...document.querySelectorAll(sel)].find((x) => x.getBoundingClientRect().height > 0);
    return [...e.children].map((x) => { const c = getComputedStyle(x); return `${[...x.classList].slice(0, 2).join('.')} w${Math.round(x.getBoundingClientRect().width * 10) / 10} flex:${c.flex} width:${c.width} max:${c.maxWidth} min:${c.minWidth}`; }).join('\n  '); }, sel));
  await p.close();
}
await b.close();
