import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('http://localhost:3100/'); await p.waitForTimeout(1500);
console.log(await p.evaluate(() => { const out = []; for (const s of document.styleSheets) { try { for (const r of s.cssRules) { const t = r.cssText; if (t.includes('listen-section.is-open') || t.includes('search-bg.is-open') || t.includes('backdrop-filter: blur(var(--blur-base))')) out.push(t.slice(0, 300)); } } catch {} } return out.slice(0, 8).join('\n---\n'); }));
await b.close();
