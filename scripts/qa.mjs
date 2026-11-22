// Usage: node scripts/qa.mjs <page[,page]>  — screenshots the clone (localhost:3100) and diffs against /reference.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const pages = process.argv[2] || 'home';
execFileSync('node', ['scripts/capture-reference.mjs', 'http://localhost:3100', 'qa/clone', pages], { stdio: 'inherit' });
const rows = [];
for (const name of pages.split(',')) for (const w of [1440, 1024, 768, 390]) {
  const ref = PNG.sync.read(fs.readFileSync(`reference/${name}/${w}.png`));
  const cln = PNG.sync.read(fs.readFileSync(`qa/clone/${name}/${w}.png`));
  const W = ref.width, H = Math.max(ref.height, cln.height);
  const pad = (img) => { const o = new PNG({ width: W, height: H }); o.data.fill(255); PNG.bitblt(img, o, 0, 0, Math.min(img.width, W), img.height, 0, 0); return o; };
  const a = pad(ref), b = pad(cln), diff = new PNG({ width: W, height: H });
  const n = pixelmatch(a.data, b.data, diff.data, W, H, { threshold: 0.1 });
  fs.mkdirSync(`qa/diff/${name}`, { recursive: true });
  fs.writeFileSync(`qa/diff/${name}/${w}.png`, PNG.sync.write(diff));
  rows.push({ page: name, width: w, refH: ref.height, cloneH: cln.height, diffPct: +(100 * n / (W * H)).toFixed(2) });
}
console.table(rows);
fs.writeFileSync('qa/results.json', JSON.stringify(rows, null, 1));
