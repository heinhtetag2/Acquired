// Captures interaction states on live + clone. Usage: node scripts/states.mjs [width]
import { chromium } from 'playwright';
import fs from 'node:fs';
const w = +(process.argv[2] || 1440);
const STATES = [
  { name: 'menu', route: '/', live: async p => p.click('.nav-menu .btn.sm-nav >> nth=0'), clone: async p => p.click('.nav__menu-btn') },
  { name: 'listen', route: '/', live: async p => p.click('.nav-menu .btn.sm-nav.desktop-only'), clone: async p => p.click('.nav__actions .nav-wide'), desktop: true },
  { name: 'search', route: '/', live: async p => p.click('.search-input'), clone: async p => p.click('#nav-search'), desktop: true },
  { name: 'hover-cover', route: '/', live: async p => p.hover('.acq-hero-item >> nth=0'), clone: async p => p.hover('.hero__item >> nth=0'), desktop: true },
  { name: 'scroll-400', route: '/', live: async p => { await p.mouse.wheel(0, 400); }, clone: async p => { await p.mouse.wheel(0, 400); } },
  { name: 'scroll-1900', route: '/', live: async p => { await p.mouse.wheel(0, 1900); }, clone: async p => { await p.mouse.wheel(0, 1900); } },
  { name: 'card-hover', route: '/', live: async p => { await p.mouse.wheel(0, 2100); await p.waitForTimeout(600); await p.hover('.discover-card >> nth=0'); }, clone: async p => { await p.mouse.wheel(0, 2100); await p.waitForTimeout(600); await p.hover('.ep-card >> nth=0'); }, desktop: true },
  { name: 'ep-transcript', route: '/episodes/seinfeld', live: async p => p.click('a[href="#transcript"]'), clone: async p => p.click('a[href="#transcript"]') },
  { name: 'ep-scrolled', route: '/episodes/seinfeld', live: async p => p.mouse.wheel(0, 1500), clone: async p => p.mouse.wheel(0, 1500) },
  { name: 'ep-companion', route: '/episodes/seinfeld', live: async p => p.click('a[href="#companion"]'), clone: async p => p.click('a[href="#companion"]') },
  { name: 'list-hover', route: '/episodes', live: async p => p.hover('.playlist-block-item >> nth=1'), clone: async p => p.hover('.pl-row >> nth=1'), desktop: true },
  { name: 'list-sidebar', route: '/episodes', live: async p => p.click('.playlist-nav .icon-button'), clone: async p => p.click('.pl-bar .icon-btn'), mobile: true },
];
const b = await chromium.launch();
fs.mkdirSync(`qa/states/${w}`, { recursive: true });
for (const s of STATES) {
  if (s.desktop && w < 992) continue; if (s.mobile && w >= 992) continue;
  for (const [who, base] of [['live', 'https://www.acquired.fm'], ['clone', 'http://localhost:3100']]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    try {
      await p.goto(base + s.route, { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(3500);
      await s[who](p); await p.waitForTimeout(1200);
      await p.screenshot({ path: `qa/states/${w}/${s.name}-${who}.png` });
    } catch (e) { console.log('FAIL', s.name, who, e.message.split('\n')[0]); }
    await p.close();
  }
  console.log('done', s.name);
}
await b.close();
