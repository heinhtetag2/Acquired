import { chromium } from 'playwright';
const [route, w = '1440'] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto('http://localhost:3100' + route); await p.waitForTimeout(1500);
console.log(await p.evaluate(() => {
  const H = document.documentElement.scrollHeight; window.scrollTo(0, H);
  const els = document.elementsFromPoint(200, window.innerHeight - 20).slice(0, 5).map(e => `${e.tagName}.${e.className.toString().slice(0, 40)} bg=${getComputedStyle(e).backgroundColor}`);
  return { H, body: document.body.scrollHeight, els, htmlBg: getComputedStyle(document.documentElement).backgroundColor, bodyBg: getComputedStyle(document.body).backgroundColor };
}));
await b.close();
