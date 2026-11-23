// Prints computed display/size of every element matching a selector on the live site at given widths (first N).
// Usage: W=1440,1024 node scripts/sel-styles.mjs <route> <selector> [n]
import { chromium } from 'playwright';
const [route, sel, n = '3'] = process.argv.slice(2);
const b = await chromium.launch();
for (const w of (process.env.W || '1440,1024,768,390').split(',').map(Number)) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto((process.env.BASE || 'https://www.acquired.fm') + route, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(2500);
  const r = await p.evaluate(([sel, n]) => { const all = [...document.querySelectorAll(sel)]; return [all.length, ...all.slice(-n).map((e) => { const c = getComputedStyle(e), b = e.getBoundingClientRect(); return `${c.display} x${Math.round(b.x)} bd:${c.borderTopColor} bg:${c.backgroundColor} ${Math.round(b.width)}x${Math.round(b.height)} y${Math.round(b.y + scrollY)} vis:${c.visibility} op:${c.opacity}`; })]; }, [sel, +n]);
  console.log(w, r.join(' | ')); await p.close();
}
await b.close();
