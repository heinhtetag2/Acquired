// Matches text blocks between live and clone by their first words and prints font-size / line-height / height mismatches.
import { chromium } from 'playwright';
const [w, liveRoute, cloneRoute = liveRoute] = process.argv.slice(2);
const b = await chromium.launch(); const out = {};
for (const [name, url] of [['live', 'https://www.acquired.fm' + liveRoute], ['clone', 'http://localhost:3100' + cloneRoute]]) {
  const p = await b.newPage({ viewport: { width: +w, height: 900 } });
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(2500);
  out[name] = await p.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; for (let a = e; a; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.opacity === '0') return false; } return [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 3); })
    .map((e) => { const c = getComputedStyle(e), r = e.getBoundingClientRect(); return { k: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 30).toLowerCase(), fs: c.fontSize, lh: c.lineHeight, h: Math.round(r.height), y: Math.round(r.y + scrollY), w: Math.round(r.width) }; }));
  await p.close();
}
await b.close();
const clone = new Map(out.clone.map((x) => [x.k, x]));
let prev = null; for (const l of out.live) { const c = clone.get(l.k); if (!c) continue; const d = c.y - l.y; if (process.env.DELTA) { if (prev === null || Math.abs(d - prev) > 4) console.log(`Δ${d}`.padEnd(7), l.k.padEnd(32), `live y${l.y} h${l.h} ${l.fs}/${l.lh}`, `clone y${c.y} h${c.h} ${c.fs}/${c.lh}`); prev = d; continue; } if (c.fs !== l.fs || c.lh !== l.lh || Math.abs(c.h - l.h) > 3) console.log(l.k.padEnd(32), `live ${l.fs}/${l.lh} h${l.h} w${l.w} y${l.y}`.padEnd(40), `clone ${c.fs}/${c.lh} h${c.h} w${c.w} y${c.y}`); }
