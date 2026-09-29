// Fails if the game's scripts don't parse. Checks them in the order play/index.html loads them.
import { readFileSync } from 'node:fs';
const root = new URL('../play/', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const files = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m => m[1]);
let bad = 0;
for (const f of files) {
  try { new Function(readFileSync(new URL(f, root), 'utf8')); }
  catch (e) { bad++; console.error(`Syntax error in play/${f}: ${e.message}`); }
}
if (bad) process.exit(1);
console.log(`ok: ${files.length} scripts parse`);
