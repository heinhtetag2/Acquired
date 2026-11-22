import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 900 } });
await p.goto('https://www.acquired.fm/', { waitUntil: 'load' }); await p.waitForTimeout(5000);
await p.click('.acq-hero-item:has(img[alt="Seinfeld"]) .acq-hero-cover-skin', { force: true }); await p.waitForTimeout(2800);
console.log(await p.evaluate(() => { const q = (s) => { const e = document.querySelector(s); if (!e) return s + ' null'; const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return `${s} [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] fs=${c.fontSize} lh=${c.lineHeight} pad=${c.padding} clamp=${c.webkitLineClamp}`; };
  return ['.acq-hero-vinyl-wrap', '.acq-hero-layout', '.acq-hero-copy', '.acq-hero-copy .btn', '.acq-hero-title', '.acq-hero-subtitle', '.hero-copy-cta', '.hero-copy-cta .btn', '.hero-copy-cta .btn:nth-child(2)'].map(q).join('\n'); }));
await b.close();
