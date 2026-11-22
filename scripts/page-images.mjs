// Usage: node scripts/page-images.mjs <route> <css selector>  → prints image URLs (currentSrc) for matches
import { chromium } from 'playwright';
const [route, sel] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://www.acquired.fm' + route, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
console.log((await p.evaluate((sel) => [...document.querySelectorAll(sel)].map(i => i.currentSrc || i.src || i.poster), sel)).join('\n'));
await b.close();
