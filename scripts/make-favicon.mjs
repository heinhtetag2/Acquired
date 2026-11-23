// Renders the Scrollbook tab icon (white "S" in the nav logo font on a black circle) from the running site,
// so it uses the exact logo font. Usage: node scripts/make-favicon.mjs <out.png>
import { chromium } from 'playwright';
const [out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 600, height: 600 } });
await p.goto('http://localhost:3100/scrollbook', { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(1500);
await p.evaluate(async () => {
  document.body.innerHTML = '';
  document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent';
  const d = document.createElement('div');
  Object.assign(d.style, { position: 'fixed', left: '0', top: '0', width: '512px', height: '512px', borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 });
  const svg = `<svg width="300" height="300" viewBox="0 0 300 300"><text x="150" y="150" text-anchor="middle" dominant-baseline="central" fill="#fff" style="font-family: var(--font-logo); font-weight: 700; font-stretch: 125%; font-size: 330px">S</text></svg>`;
  d.innerHTML = svg; document.body.appendChild(d); await document.fonts.ready;
});
await p.waitForTimeout(300);
await p.screenshot({ path: out, clip: { x: 0, y: 0, width: 512, height: 512 }, omitBackground: true });
await b.close();
