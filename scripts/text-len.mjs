// Prints character length and wrapped line count of the first visible element whose text starts with a prefix, live vs clone.
import { chromium } from 'playwright';
const [route, livePrefix, clonePrefix] = process.argv.slice(2);
const b = await chromium.launch();
for (const w of [1440, 1024, 768, 390]) for (const [name, base, pre] of [['live', 'https://www.acquired.fm', livePrefix], ['clone', 'http://localhost:3100', clonePrefix]]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(2000);
  console.log(w, name, await p.evaluate((pre) => { const e = [...document.querySelectorAll('p')].find((x) => x.textContent.trim().toLowerCase().startsWith(pre) && x.getBoundingClientRect().height); if (!e) return '-'; const lh = parseFloat(getComputedStyle(e).lineHeight); return `${e.textContent.trim().length} chars, ${Math.round(e.getBoundingClientRect().height / lh)} lines`; }, pre));
  await p.close();
}
await b.close();
