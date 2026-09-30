// A bot plays the soft opening start to finish at phone size, in real time, closing Nana's tips as they finish.
// Fails if it gets stuck, doesn't land on Monday, or anything errors. Run: npm run tutorial
// Add "shots" to save a screenshot of every tip in screenshots/: npm run tutorial -- shots
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith('/')) p += 'index.html';
  try { const body = await readFile(join(root, p)); res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const shots = process.argv.includes('shots');
if (shots) await mkdir(join(root, 'screenshots'), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: shots ? 2 : 1, ignoreHTTPSErrors: true });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::/.test(m.text())) errors.push(m.text()); });
if (!shots) await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto(`http://localhost:${port()}/play/`);
function port() { return server.address().port }
await page.waitForTimeout(600);
const first = await page.$$eval('.screen .btn', bs => bs.map(b => b.textContent));
if (first[0] !== 'Soft opening') errors.push('a fresh player should see Soft opening first, saw ' + first.join(' / '));
await page.click('[data-act="tut"]');
const seen = new Set(), t0 = Date.now();
let end = '';
while (Date.now() - t0 < 150000) {
  await page.waitForTimeout(300);
  const st = await page.evaluate(() => ({ mode: S.mode, tut: S.tut && S.tut.i, text: (document.querySelector('#coach p') || {}).textContent }));
  if (st.mode === 'intro') { end = 'monday'; break; }
  if (st.text && !seen.has(st.text)) {
    seen.add(st.text); console.log(`  ${seen.size}. ${st.text}`);
    if (shots) { await page.waitForTimeout(700); await page.screenshot({ path: join(root, 'screenshots', `tut-${seen.size}.png`) }); }
  }
  await page.evaluate(() => {
    const click = sel => { const el = document.querySelector(sel); if (el) { el.click(); return true } return false };
    if (click('#coach .cx')) return;
    const t = liveTickets().find(canServe); if (t) return click(`.ticket[data-tid="${t.id}"]`);
    for (let i = 0; i < S.beds; i++) { const l = lookOf(S.garden[i]); if (['bloom', 'fade', 'weed', 'dead'].includes(l)) return click(`.bed[data-b="${i}"]`); }
    for (let i = 0; i < S.beds; i++) { const b = S.garden[i]; if (b && !b.weed && !b.dead && b.g < 1 && b.w < .5) return click(`.bed[data-b="${i}"]`); }
    // plant whatever the waiting customers still need, or one daisy to begin with
    const need = {}; liveTickets().concat(S.queue).forEach(t => t.want.forEach(p => need[p] = (need[p] || 0) + 1));
    S.garden.forEach(b => { if (b && !b.dead && !b.weed) need[b.p] = (need[b.p] || 0) - 1 });
    S.bucket.forEach((n, p) => need[p] = (need[p] || 0) - n);
    let p = +(Object.entries(need).find(([, n]) => n > 0) || [])[0];
    if (isNaN(p) && !S.garden.some(b => b && !b.weed && !b.dead) && !bucketCount()) p = 0;
    if (isNaN(p)) return;
    const i = S.garden.findIndex((b, k) => k < S.beds && !b); if (i < 0) return;
    if (S.sel !== p) click(`.seed[data-p="${p}"]`); click(`.bed[data-b="${i}"]`);
  });
}
const done = await page.evaluate(() => [BEST.tutDone, S.day, S.garden.filter(Boolean).length]);
await browser.close(); server.close();
if (end !== 'monday') errors.push('the soft opening got stuck (' + seen.size + ' tips seen)');
else if (!done[0] || done[1] !== 0) errors.push('finished, but did not land on a fresh Monday: ' + done);
else console.log(`ok: soft opening finished in ${Math.round((Date.now() - t0) / 1000)} s, ${seen.size} tips, on to Monday`);
if (errors.length) { console.error('Errors:\n' + [...new Set(errors)].join('\n')); process.exit(1); }
