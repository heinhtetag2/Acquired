import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://www.acquired.fm/episodes/seinfeld', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
console.log(JSON.stringify(await p.evaluate(() => {
  const cs = (s, props) => { const e = document.querySelector(s); if (!e) return null; const c = getComputedStyle(e); return Object.fromEntries(props.map(k => [k, c.getPropertyValue(k)])); };
  const P = ['border-radius','border-top','border-bottom','background-color','padding','top','color','font-size','line-height','transition','transform','height','box-shadow','margin-bottom'];
  return {
    audio: [...document.querySelectorAll('audio, [data-audio-src], [data-src]')].map(a => a.src || a.dataset.audioSrc || a.dataset.src).filter(Boolean).slice(0,3),
    duration: document.querySelector('.audio-module')?.getAttribute('data-duration'),
    tag: cs('.episode-tag-wrap .badge-label, .episode-tag-wrap a', P),
    iconBtn: cs('.icon-button.s-episode-page', P),
    back: cs('.episode-page-left .btn', P),
    details: cs('.episode-details-wrap', P),
    richH2: cs('.episode-right .episode-rich-text-h2, .episode-rich-text-h2', P),
    richH2b: cs('.episode-rich-text h2', P),
    li: cs('.episode-rich-text li', [...P, 'padding-left','margin-left']),
    ul: cs('.episode-rich-text ul', [...P,'padding-left','margin']),
    presenting: cs('.presenting-wrap', P),
    artLabel: cs('.ep-artifacts-link', P),
    popupBtn: cs('.popup-full-button', P),
    player: cs('.episode-player', [...P,'right','bottom','width']),
    playerSection: cs('.episode-player-section', ['padding','right','bottom']),
    popup: cs('.episode-sources .popup', P),
    drawer: cs('.chapter-drawer', P),
    item: cs('.episode-item', P),
    sliderArrow: cs('.slider-arrow', P),
    hr: cs('.episode-section .h-rule', P),
    cta: cs('.episode-cta', ['background-image']),
    sponsorsTitleColor: cs('.episode-page-left .no-mobile .font-display', ['color']),
    disclaimer: cs('.episode-page-right .text-foreground-muted', ['color']),
    h2mb: cs('.episode-page-right h2.mb-base', ['margin-bottom','color']),
    stickyTop: cs('.episode-details-wrap', ['top','position']),
  };
}), null, 1)); await b.close();
