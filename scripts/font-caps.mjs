import { chromium } from 'playwright';
const LIVE = { display: '"Founders Grotesk Condensed"', serif: '"Reckless Condensed M"', body: '"Reckless Standard S"' };
const CANDS = { display: ['Barlow Condensed', 'Sofia Sans Condensed', 'Saira Condensed', 'Pathway Gothic One', 'Roboto Condensed', 'Barlow Semi Condensed', 'Oswald', 'Antonio', 'League Gothic', 'Bebas Neue', 'Fjalla One', 'Archivo Narrow', 'Sofia Sans Extra Condensed', 'Big Shoulders Text', 'Teko', 'Khand', 'Mohave', 'Smooch Sans', 'Tulpen One'],
  serif: ['Instrument Serif', 'Crimson Pro', 'Libre Caslon Condensed', 'Playfair Display', 'Newsreader', 'Cormorant', 'Bodoni Moda', 'Prata', 'Gloock', 'Young Serif', 'DM Serif Display', 'Fraunces'], body: ['Newsreader', 'Crimson Pro', 'Gelasio', 'PT Serif'] };
const metric = (fam) => {
  const c = document.createElement('canvas').getContext('2d'); c.font = `400 100px ${fam}`;
  const H = c.measureText('H'), x = c.measureText('x'), word = c.measureText('MENU LISTEN EPISODES'), stem = c.measureText('I');
  return { cap: Math.round(H.actualBoundingBoxAscent), xh: Math.round(x.actualBoundingBoxAscent), w: Math.round(word.width), stem: Math.round(stem.width) };
};
const b = await chromium.launch();
const p = await b.newPage(); await p.goto('https://www.acquired.fm/', { waitUntil: 'load' }); await p.waitForTimeout(2500);
await p.evaluate(async () => { for (const f of ['400 100px "Founders Grotesk Condensed"', '400 100px "Reckless Condensed M"', '400 100px "Reckless Standard S"']) await document.fonts.load(f); });
for (const [k, f] of Object.entries(LIVE)) console.log('LIVE', k, JSON.stringify(await p.evaluate(`(${metric.toString()})(${JSON.stringify(f)})`)));
const all = [...new Set(Object.values(CANDS).flat())];
const p2 = await b.newPage();
await p2.setContent(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${all.map(f => 'family=' + f.replace(/ /g, '+')).join('&')}&display=block">`);
await p2.waitForTimeout(4000);
for (const f of all) { await p2.evaluate((f) => document.fonts.load(`400 100px '${f}'`), f); }
for (const [k, list] of Object.entries(CANDS)) for (const f of list) console.log(k.padEnd(8), f.padEnd(28), JSON.stringify(await p2.evaluate(`(${metric.toString()})("'${f}'")`)));
await b.close();
