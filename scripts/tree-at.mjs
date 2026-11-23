// Dumps the box tree (tag.class, size, padding, margin, font) of the card containing a given text, live vs clone.
import { chromium } from 'playwright';
const [w, route, text, up = '4', cloneRoute = route] = process.argv.slice(2);
const b = await chromium.launch();
for (const [name, url] of [['live', 'https://www.acquired.fm' + route], ['clone', 'http://localhost:3100' + cloneRoute]]) {
  const p = await b.newPage({ viewport: { width: +w, height: 900 } });
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(2500);
  const out = await p.evaluate(([text, up]) => {
    const shown = (e) => { for (let a = e; a; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.opacity === '0' || cs.display === 'none') return false; } return true; };
    const t = [...document.querySelectorAll('body *')].find((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.toLowerCase().includes(text)) && e.getBoundingClientRect().width && shown(e));
    if (!t) return 'not found'; let root = t; for (let i = 0; i < +up && root.parentElement; i++) root = root.parentElement;
    const lines = []; const walk = (e, d) => { const r = e.getBoundingClientRect(); if (!r.width && !r.height) return; const c = getComputedStyle(e);
      lines.push(`${'  '.repeat(d)}${e.tagName.toLowerCase()}.${[...e.classList].slice(0, 3).join('.')} ${Math.round(r.width)}x${Math.round(r.height)} y${Math.round(r.y + scrollY)} p[${c.padding}] m[${c.margin}] g[${c.gap}] ${c.fontSize}/${c.lineHeight}${[...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) ? ' "' + e.textContent.trim().slice(0, 30) + '"' : ''}`);
      if (d < 9) [...e.children].forEach((x) => walk(x, d + 1)); };
    walk(root, 0); return lines.join('\n'); }, [text, up]);
  console.log(`=== ${name}\n${out}`); await p.close();
}
await b.close();
