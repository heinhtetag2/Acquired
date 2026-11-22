// Usage: node scripts/shot-pair.mjs <width> <route> <out> [clipH]
import { chromium } from 'playwright';
const [w, route, out, clipH = '900'] = process.argv.slice(2);
const b = await chromium.launch();
for (const [who, base] of [['live', 'https://www.acquired.fm'], ['clone', 'http://localhost:3100']]) {
  const p = await b.newPage({ viewport: { width: +w, height: +clipH } });
  await p.goto(base + route, { waitUntil: 'load' }); await p.waitForTimeout(3500);
  await p.screenshot({ path: `${out}-${who}.png` }); await p.close();
}
await b.close();
