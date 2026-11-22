// Measures live text widths, then candidate free fonts rendering the same strings.
import { chromium } from 'playwright';
const SAMPLES = {
  display: [['all episodes', 14, 0.42], ['menu', 16, 0.48], ['listen', 16, 0.48], ['Emails from Ben & David', 18, 0.54], ['New release ·', 16, 0.48], ['Oct 18, 2026', 16, 0.48], ['Eddy Cue', 18, 0.54], ['SVP Services, Apple', 18, 0.54]],
  serif: [['Latest Episodes', 32, 0.32], ['Our listeners', 24, 0.24], ['every company has a story', 48, 0.48], ['Seinfeld', 24, 0.24], ['The Home Depot', 24, 0.24]],
  body: [['Over one million people tune in to every episode.', 18, 0.18], ['New episodes come out about 8 times a year. Here are the most recent.', 18, 0.18], ['It’s hard to stop once you start listening.', 18, 0.18]],
};
const CANDS = {
  display: ['Barlow Condensed', 'Barlow Semi Condensed', 'Roboto Condensed', 'Archivo Narrow', 'IBM Plex Sans Condensed', 'Saira Condensed', 'Encode Sans Condensed', 'Sofia Sans Condensed', 'Pathway Gothic One', 'Fira Sans Condensed'],
  serif: ['Instrument Serif', 'Newsreader', 'Libre Caslon Condensed', 'Playfair Display', 'Source Serif 4', 'Cormorant Garamond', 'EB Garamond', 'Gelasio', 'Literata', 'Crimson Pro'],
  body: ['Newsreader', 'Source Serif 4', 'Literata', 'Gelasio', 'PT Serif', 'Crimson Pro', 'Libre Caslon Text', 'Lora', 'Merriweather', 'Noto Serif'],
};
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('https://www.acquired.fm/', { waitUntil: 'load' }); await p.waitForTimeout(2500);
const FAM = { display: '"Founders Grotesk Condensed"', serif: '"Reckless Condensed M"', body: '"Reckless Standard S"' };
const measure = (fam, upper) => p.evaluate(({ fam, samples, upper }) => samples.map(([t, fs, ls]) => { const s = document.createElement('span'); s.style.cssText = `position:absolute;white-space:nowrap;font-family:${fam};font-size:${fs}px;letter-spacing:${ls}px;text-transform:${upper ? 'uppercase' : 'none'}`; s.textContent = t; document.body.appendChild(s); const w = s.getBoundingClientRect().width; const h = s.getBoundingClientRect().height; s.remove(); return [w, h]; }), { fam, samples: SAMPLES[upper.k], upper: upper.u });
const live = {};
for (const k of Object.keys(SAMPLES)) { await p.evaluate(() => document.fonts.ready); live[k] = await measure(FAM[k], { k, u: k !== 'body' }); }
const all = [...new Set(Object.values(CANDS).flat())];
const p2 = await b.newPage();
await p2.setContent(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${all.map(f => 'family=' + f.replace(/ /g, '+') + ':wght@400').join('&')}&display=block"><body>${all.map(f => `<span style="font-family:'${f}'">Aa</span>`).join('')}</body>`);
await p2.waitForTimeout(4000); await p2.evaluate(() => document.fonts.ready);
for (const k of Object.keys(SAMPLES)) {
  const rows = [];
  for (const f of CANDS[k]) {
    const m = await p2.evaluate(({ f, samples, upper }) => samples.map(([t, fs, ls]) => { const s = document.createElement('span'); s.style.cssText = `position:absolute;white-space:nowrap;font-family:'${f}';font-size:${fs}px;letter-spacing:${ls}px;text-transform:${upper ? 'uppercase' : 'none'}`; s.textContent = t; document.body.appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return w; }), { f, samples: SAMPLES[k], upper: k !== 'body' });
    const ratios = m.map((w, i) => w / live[k][i][0]);
    const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const spread = Math.max(...ratios) - Math.min(...ratios);
    rows.push({ font: f, avgRatio: +avg.toFixed(3), spread: +spread.toFixed(3) });
  }
  console.log('==', k, 'live widths', live[k].map(x => Math.round(x[0])).join(','));
  console.table(rows.sort((a, b) => Math.abs(1 - a.avgRatio) - Math.abs(1 - b.avgRatio)));
}
await b.close();
