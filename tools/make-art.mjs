// Redraws icons/ and og-image.png from the game's own drawings. Run: node tools/make-art.mjs (needs Playwright; see package.json).
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
const root = new URL('..', import.meta.url);
const js = f => readFileSync(new URL('play/js/' + f, root), 'utf8');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(js('data.js') + js('draw.js') + ';this.bedSVG=bedSVG;', ctx);
const PAT = `<defs><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#000" stroke-width="2.6"/></pattern><pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#fff"/><circle cx="3" cy="3" r="1.15" fill="#000"/></pattern><pattern id="stripes" width="6" height="5" patternUnits="userSpaceOnUse"><rect width="6" height="5" fill="#fff"/><line x1="0" y1="2.5" x2="6" y2="2.5" stroke="#000" stroke-width="1.5"/></pattern></defs>`;
const hex = s => s.replace(/var\(--ink\)/g, '#000').replace(/var\(--paper\)/g, '#fff');
const inner = (p, look, sw) => hex(ctx.bedSVG(p, look, sw)).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
// The icon: a daisy in bloom. pad is the white margin around the 100 × 100 drawing.
const icon = pad => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad + 2} ${100 + 2 * pad} ${100 + 2 * pad}">${PAT}<rect x="${-pad}" y="${-pad + 2}" width="${100 + 2 * pad}" height="${100 + 2 * pad}" fill="#fff"/>${inner(0, 'bloom', 3.4)}</svg>`;
writeFileSync(new URL('icons/icon.svg', root), icon(8) + '\n');
const browser = await chromium.launch();
const page = await browser.newPage({ ignoreHTTPSErrors: true });
async function png(svg, size, file) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: new URL(file, root).pathname });
}
await png(icon(8), 512, 'icons/icon-512.png');
await png(icon(8), 192, 'icons/icon-192.png');
await png(icon(26), 512, 'icons/maskable-512.png');
await png(icon(14), 180, 'icons/apple-touch-icon.png');
await png(icon(4), 48, 'icons/favicon-48.png');
// The share image: a row of blooms beside the name.
const row = [1, 0, 5].map((p, i) => `<svg viewBox="0 0 100 100" x="${i * 158}" width="210" height="210">${inner(p, 'bloom', 2.4)}</svg>`).join('');
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,900&family=Figtree:wght@800&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#fff}.og{position:relative;width:1200px;height:630px;background:radial-gradient(circle,#000 1px,transparent 1.3px) 0 0/22px 22px}
.og::before{content:'';position:absolute;inset:0;background:#fff;opacity:.86}
.row{position:absolute;left:36px;top:190px}.card{position:absolute;right:60px;top:120px;width:500px;background:#fff;border:4px solid #000;border-radius:36px;box-shadow:10px 12px 0 #000;padding:40px 40px 44px}
h1{font:italic 900 84px/0.95 Fraunces,Georgia,serif;letter-spacing:-.01em;margin:0}p{font:800 30px/1.3 Figtree,sans-serif;margin:20px 0 0}</style>
<div class="og"><svg class="row" width="560" height="240" viewBox="0 0 560 240">${PAT}${row}</svg>
<div class="card"><h1>Ink Gardens</h1><p>Grow flowers. Sell them fresh. Beat the plastic place across the street.</p></div></div>`);
await page.waitForLoadState('networkidle');
await page.evaluate(async () => { await document.fonts.load('italic 900 84px Fraunces'); await document.fonts.load('800 30px Figtree'); await document.fonts.ready; });
await page.screenshot({ path: new URL('og-image.png', root).pathname });
await browser.close();
console.log('Wrote icons/ and og-image.png');
