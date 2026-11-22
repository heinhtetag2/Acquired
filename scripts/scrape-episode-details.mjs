// Pulls factual episode metadata from each live episode page (no overview/transcript text).
import { chromium } from 'playwright';
import fs from 'node:fs';
const eps = JSON.parse(fs.readFileSync('content/episodes.json'));
const out = fs.existsSync('reference/episodes/details.json') ? JSON.parse(fs.readFileSync('reference/episodes/details.json')) : {};
const todo = eps.map(e => e.slug).filter(s => !out[s]);
const b = await chromium.launch(); const ctx = await b.newContext({ javaScriptEnabled: false });
const one = async (slug) => {
  const p = await ctx.newPage();
  try {
    const res = await p.goto('https://www.acquired.fm/episodes/' + slug, { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (!res || res.status() >= 400) { out[slug] = { missing: true }; return; }
    out[slug] = await p.evaluate(() => {
      const html = document.documentElement.innerHTML;
      const theme = Object.fromEntries([...html.matchAll(/--theme-(light|dark|accent-400|accent-500|accent-600):\s*(#[0-9a-fA-F]{3,8})/g)].map(m => [m[1], m[2]]));
      const txt = (e) => e?.textContent.replace(/\s+/g, ' ').trim();
      const left = document.querySelector('.episode-page-left');
      const right = document.querySelector('.episode-page-right');
      const links = (h) => { if (!right) return null; const h2 = [...right.querySelectorAll('.episode-rich-text h2')].find(x => txt(x).toLowerCase().startsWith(h)); if (!h2) return null; let ul = h2.nextElementSibling; while (ul && ul.tagName !== 'UL') ul = ul.nextElementSibling; return ul ? [...ul.querySelectorAll('li')].map(li => li.innerHTML.replace(/ class="[^"]*"/g, '').replace(/\s+/g, ' ').trim()).slice(0, 20) : null; };
      const href = (sel) => left?.querySelector(sel)?.getAttribute('href') || null;
      return {
        theme,
        subtitle: txt(right?.querySelector('h2.mb-base')) || null,
        tags: [...(left?.querySelectorAll('.episode-tag-wrap a') || [])].map(a => ({ label: txt(a), href: a.getAttribute('href') })),
        season: (() => { const a = left?.querySelector('a.badge-label[href^="/season"]'); return a ? { label: txt(a), href: a.getAttribute('href') } : null; })(),
        youtube: href('a[href*="youtu"]'), netflix: href('a[href*="netflix"]'),
        spotify: href('a[href*="spotify"]'), apple: href('a[href*="apple.com"]'),
        audio: (html.match(/https:\/\/[^"' ]+\.mp3[^"' ]*/) || [null])[0],
        duration: +(document.querySelector('[data-duration]')?.getAttribute('data-duration') || 0) || null,
        hasTranscript: !!document.querySelector('a[href="#transcript"]'), hasSources: !!document.querySelector('a[href="#sources"]'), hasCompanion: !!document.querySelector('a[href="#companion"]'),
        chapters: [...document.querySelectorAll('.episode-transcript .chapter-item')].map(c => [txt(c.querySelector('.chapter-title')), txt(c.querySelector('.chapter-timestamp'))]).slice(0, 60),
        sources: [...document.querySelectorAll('.chapter-drawer-section.is-toc-ready .chapter-item, .episode-sources .chapter-item')].map(c => txt(c)).slice(0, 20),
        presentedBy: (() => { const a = right?.querySelector('.ep-link-presenting'); return a ? a.getAttribute('href') : null; })(),
        links: links('links'), carveOuts: links('carve'),
      };
    });
  } catch (e) { out[slug] = { error: e.message.slice(0, 80) }; }
  await p.close();
};
for (let i = 0; i < todo.length; i += 4) {
  await Promise.all(todo.slice(i, i + 4).map(one));
  if (i % 40 === 0) { fs.writeFileSync('reference/episodes/details.json', JSON.stringify(out, null, 1)); console.log('done', i + 4, '/', todo.length); }
}
fs.writeFileSync('reference/episodes/details.json', JSON.stringify(out, null, 1));
await b.close();
const vals = Object.values(out);
console.log('total', vals.length, 'missing', vals.filter(v => v.missing).length, 'errors', vals.filter(v => v.error).length, 'withTheme', vals.filter(v => v.theme && v.theme.dark).length, 'withAudio', vals.filter(v => v.audio).length, 'withChapters', vals.filter(v => v.chapters?.length).length);
