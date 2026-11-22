import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://www.acquired.fm/wsj', { waitUntil: 'load', timeout: 90000 }); await p.waitForTimeout(2500);
const d = await p.evaluate(() => [...document.querySelectorAll('.wsj-block-item')].map(r => ({ title: r.querySelector('h2')?.textContent.trim(), href: r.querySelector('a')?.href, img: r.querySelector('img')?.currentSrc })));
fs.writeFileSync('reference/wsj/data.json', JSON.stringify(d, null, 1)); console.log(d.map(x => x.title).join('\n')); await b.close();
