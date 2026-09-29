// A bot plays whole weeks at phone size, with the game clock run fast, and fails on any error.
// It plants what customers ask for, waters, picks, sells, pulls weeds and spends in the seed shop.
// Run: npm run week            (3 weeks, prints each day)
//      npm run week -- 10 human (10 weeks at a person's pace: one tap every 0.7 seconds)
//      npm run week -- 5 human 1.2  (a slower person: one tap every 1.2 seconds)
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith('/')) p += 'index.html';
  try { const body = await readFile(join(root, p)); res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;
const weeks = +process.argv[2] || 3, human = process.argv[3] === 'human', pace = +process.argv[4] || .7;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_CERT|net::/.test(m.text())) errors.push(m.text()); });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto(`http://localhost:${port}/play/`);
await page.waitForTimeout(300);
let wins = 0;
for (let w = 0; w < weeks; w++) {
  const result = await page.evaluate(async ([human, pace]) => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let taps = 0;
    const click = sel => { if (taps <= 0) return false; const el = document.querySelector(sel); if (el && !el.disabled) { el.click(); taps--; return true } return false };
    const ui = sel => { taps = 99; const r = click(sel); taps = 0; return r };
    const log = [];
    localStorage.removeItem('inkgardens-run'); titleScreen(); ui('[data-act="new"]');
    for (let guard = 0; guard < 40; guard++) {
      if (!ui('[data-act="start"]')) return { log, end: 'no start button on ' + S.mode };
      while (S.mode === 'play') {
        const steps = human ? Math.round(pace * 10) : 4; for (let k = 0; k < steps; k++) { S.clock += .1; tickGarden(.1); tickShop(.1); }
        taps = human ? 1 : 99;
        // sell first, then pick, water, clear, plant
        liveTickets().filter(canServe).forEach(t => click(`.ticket[data-tid="${t.id}"]`));
        S.garden.forEach((b, i) => {
          if (i >= S.beds) return;
          const look = lookOf(b), sel = `.bed[data-b="${i}"]`;
          if (look === 'bloom' || look === 'fade' || look === 'weed' || look === 'dead') click(sel);
          else if (b && b.g < 1 && b.w < .3) click(sel);
        });
        const need = {}; liveTickets().concat(S.queue).forEach(t => t.want.forEach(p => need[p] = (need[p] || 0) + 1));
        S.garden.forEach(b => { if (b && !b.dead && !b.weed) need[b.p] = (need[b.p] || 0) - 1 });
        S.bucket.forEach((n, p) => need[p] = (need[p] || 0) - n);
        const wanted = Object.entries(need).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([p]) => +p);
        const plantIt = wanted.length ? wanted[0] : unlocked()[Math.floor(Math.random() * unlocked().length)];
        for (let i = 0; i < S.beds; i++) if (!S.garden[i] && S.till >= PLANTS[plantIt].seed) {
          if (S.sel !== plantIt) click(`.seed[data-p="${plantIt}"]`); click(`.bed[data-b="${i}"]`); break;
        }
        await sleep(0);
      }
      await sleep(1400);
      const day = { day: DAYNAMES[S.day], served: S.served, walked: S.walked, take: S.dayTake, street: S.loyalty, till: S.till, beds: S.beds, up: Object.keys(S.up).join(',') };
      log.push(day);
      if (S.mode !== 'end') return { log, end: 'stuck in ' + S.mode };
      if (ui('[data-act="retry"]')) { day.lost = true; return { log, end: 'lost' } }
      if (!ui('[data-act="shop"]')) return { log, end: S.day === 6 ? 'won' : 'no shop button' };
      // spend: beds first while cheap, then upgrades
      for (let n = 0; n < 8; n++) if (!ui('[data-act="dig"]') && !ui('[data-act="up"]:not([disabled])')) break;
      ui('[data-act="next"]');
    }
    return { log, end: 'too many days' };
  }, [human, pace]);
  for (const d of result.log) console.log(`  ${d.day.padEnd(9)} served ${String(d.served).padStart(2)}  walked ${d.walked}  took $${String(d.take).padStart(3)}  street ${d.street}%  till $${d.till}  beds ${d.beds}  ${d.up}${d.lost ? '  LOST' : ''}`);
  console.log(`week ${w + 1}: ${result.end}`);
  if (result.end === 'won') wins++;
  else if (result.end !== 'lost') errors.push('week ' + (w + 1) + ': ' + result.end);
}
await browser.close(); server.close();
console.log(`${wins} of ${weeks} weeks won`);
if (errors.length) { console.error('Errors:\n' + [...new Set(errors)].join('\n')); process.exit(1); }
