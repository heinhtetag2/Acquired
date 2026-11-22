import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://www.acquired.fm/episodes/' + (process.argv[2] || 'seinfeld'), { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
const out = await p.evaluate(() => {
  const src = (i) => i.currentSrc || i.src || i.dataset.src;
  return {
    art: [...document.querySelectorAll('.episode-item-media.episode-page img')].map(src),
    artifacts: [...document.querySelectorAll('.ep-artifacts-frame img')].map(src),
    sponsors: [...document.querySelectorAll('.episode-sponsor-item')].map(e => ({ img: e.querySelector('img') && src(e.querySelector('img')), svg: !!e.querySelector('svg'), text: e.textContent.trim().slice(0, 40), href: e.querySelector('a')?.href })),
    related: [...document.querySelectorAll('.episode-scroll-content .episode-item')].map(a => ({ href: a.getAttribute('href'), img: src(a.querySelector('img')), title: a.querySelector('.font-display')?.textContent.trim(), sub: a.querySelector('.font-body')?.textContent.trim(), bg: getComputedStyle(a.querySelector('.episode-item-media')).backgroundColor })),
    tags: [...document.querySelectorAll('.episode-tag-wrap a, .episode-tag-wrap .badge-label')].map(a => [a.textContent.trim(), a.getAttribute('href')]),
    chapters: [...document.querySelectorAll('.episode-transcript .chapter-drawer__list a, .chapter-drawer-section:not(.is-toc-ready) .chapter-item')].slice(0, 40).map(a => a.textContent.trim().replace(/\s+/g, ' ')),
    sections: [...document.querySelectorAll('.chapter-drawer-section.is-toc-ready .chapter-item')].map(a => a.textContent.trim().replace(/\s+/g, ' ')),
  };
});
console.log(JSON.stringify(out, null, 1)); await b.close();
