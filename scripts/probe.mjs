import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://www.acquired.fm/', { waitUntil: 'networkidle', timeout: 60000 });
const info = await p.evaluate(() => ({
  title: document.title,
  links: [...new Set([...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')))].slice(0, 200),
  scripts: [...document.scripts].map(s => s.src).filter(Boolean),
  styles: [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.href),
  fonts: [...document.fonts].map(f => `${f.family}|${f.weight}|${f.style}|${f.status}`),
  height: document.documentElement.scrollHeight,
  sections: [...document.body.children].map(e => `${e.tagName}.${e.className}`).slice(0, 40),
}));
console.log(JSON.stringify(info, null, 1));
await b.close();
