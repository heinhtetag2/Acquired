// Usage: node scripts/anchors.mjs <route> '<json map label->[liveSel, cloneSel]>' [width]
import { chromium } from 'playwright';
const [route, mapJson, w = '1440'] = process.argv.slice(2);
const map = JSON.parse(mapJson);
const b = await chromium.launch({});
const get = async (base, idx) => {
  const p = await b.newPage({ viewport: { width: +w, height: 900 }, reducedMotion: 'reduce' });
  await p.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const r = await p.evaluate(({ map, idx }) => Object.fromEntries(Object.entries(map).map(([k, sels]) => {
    const e = document.querySelector(sels[idx]); if (!e) return [k, null];
    const r = e.getBoundingClientRect(); return [k, `${Math.round(r.x)},${Math.round(r.y + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)}`];
  })), { map, idx });
  await p.close(); return r;
};
const live = await get('https://www.acquired.fm', 0), clone = await get('http://localhost:3100', 1);
console.table(Object.keys(map).map(k => ({ el: k, live: live[k], clone: clone[k] })));
await b.close();
