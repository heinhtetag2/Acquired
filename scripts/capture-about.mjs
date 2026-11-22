import { chromium } from 'playwright';
const b = await chromium.launch(); const ctx = await b.newContext({ reducedMotion: 'reduce' });
const t0 = Date.now(); const log = (m) => console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', m);
for (const w of [1440, 1024, 768, 390]) {
  const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: 900 });
  await p.goto('https://www.acquired.fm/about', { waitUntil: 'domcontentloaded', timeout: 60000 }); log('dom ' + w);
  await p.waitForTimeout(3000);
  const H = await p.evaluate(() => document.documentElement.scrollHeight); log('height ' + H);
  for (let y = 0; y < H; y += 450) { await p.mouse.wheel(0, 450); await p.waitForTimeout(80); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1000);
  await p.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused!important}' });
  await p.screenshot({ path: `reference/about/${w}.png`, fullPage: true, timeout: 90000 }); log('shot ' + w);
  await p.close();
}
await b.close();
