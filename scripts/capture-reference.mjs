// Usage: node scripts/capture-reference.mjs [baseUrl] [outDir] [pageFilter]
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.argv[2] || 'https://www.acquired.fm';
const outDir = process.argv[3] || 'reference';
const only = process.argv[4];
export const PAGES = {
  home: '/', episodes: '/episodes', 'episode-seinfeld': '/episodes/seinfeld',
  'features-must-listen': '/features/must-listen', 'features-niche-gems': '/features/niche-gems',
  'features-interviews': '/features/interviews', 'industry-software': '/industry/software',
  artifacts: '/artifacts', library: '/library', email: '/email', about: '/about',
  'media-kit': '/media-kit', press: '/press', sponsor: '/sponsor', acq2: '/acq2', slack: '/slack', wsj: '/wsj',
};
const WIDTHS = [1440, 1024, 768, 390];

const b = await chromium.launch();
const ctx = await b.newContext({ deviceScaleFactor: 1, reducedMotion: 'reduce' });
async function shoot(name, route) {
  const page = await ctx.newPage();
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    try {
      await page.goto(base + route, { waitUntil: 'load', timeout: 60000 }); await page.waitForTimeout(2500);
    } catch { /* keep going on slow trackers */ }
    // scroll through to trigger lazy images + scroll reveals
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
      window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 800));
    }).catch(() => page.waitForTimeout(1500));
    // freeze marquees / running animations so diffs are deterministic
    await page.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused!important;caret-color:transparent!important}' });
    await page.evaluate(() => window.gsap && window.gsap.globalTimeline.pause()).catch(() => {});
    await fs.mkdir(path.join(outDir, name), { recursive: true });
    await page.screenshot({ path: path.join(outDir, name, `${w}.png`), fullPage: true, timeout: 60000 }).catch((e) => console.log('shot failed', name, w, e.message));
    console.log('saved', name, w);
  }
  await page.close();
}
const entries = Object.entries(PAGES).filter(([n]) => !only || only.split(',').includes(n));
for (let i = 0; i < entries.length; i += 4) await Promise.all(entries.slice(i, i + 4).map(([n, r]) => shoot(n, r)));
await b.close();
