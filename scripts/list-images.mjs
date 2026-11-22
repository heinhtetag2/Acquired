import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://www.acquired.fm/', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
const out = await p.evaluate(() => {
  const pick = (img) => img.currentSrc || img.src;
  const hero = [...document.querySelectorAll('.acq-hero-item')].map(it => {
    const img = it.querySelector('.acq-hero-cover-img img'); const v = it.querySelector('video source, video');
    const rec = it.querySelector('.acq-hero-record-img');
    return { alt: img?.alt, src: img && pick(img), video: v && (v.src || v.getAttribute('src')), poster: it.querySelector('video')?.poster, record: rec?.dataset?.src || rec?.getAttribute('src') };
  });
  const q = (s) => [...document.querySelectorAll(s)].map(i => ({ alt: i.alt, src: pick(i) }));
  return { hero, about: q('.hero-about-img'), press: q('.press-logo img'), latest: q('.discover-art img'), footer: q('.img-bg-footer img'), sierra: document.querySelector('.hero-presenting-logo')?.innerHTML.slice(0, 300) };
});
console.log(JSON.stringify(out, null, 1)); await b.close();
