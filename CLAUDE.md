# Ink Gardens: notes for Claude Code

Ink Gardens is a minimal mobile flower shop game drawn like a paper-and-ink cartoon. You grow flowers and plants in the garden behind Nana's old shop and sell them fresh, one week against Everbloom, the plastic flower superstore across the street. It's a sister game to Ink Burger (`../ink-burger`), Ink Nine and Ink Crossing, and shares their way of working. It's hosted on Vercel from this repo (expected at https://ink-gardens.vercel.app; update the `og:` and canonical links in both HTML files if the address changes).

## Who you're working with
Otis is the designer. He doesn't read code. He judges changes by playing them on his phone.
- Explain every change in plain language: what the player will see and feel, not how the code works.
- After pushing a branch, give Otis the Vercel preview link so he can play it before it goes live.
- Keep replies short. Ask one question at a time when a design decision is his to make.

## How the project is built
- **No build step, no frameworks, no npm packages in the game.** Plain HTML, CSS and JavaScript files served as-is by Vercel. The only outside code is Supabase's client, loaded from a CDN the first time a note is sent, plus Google Fonts.
- `index.html`: the front page (three beds that keep growing, blooming and getting picked, and a Play button). It borrows `play/js/data.js` and `play/js/draw.js` to draw them.
- `play/index.html`: the game page. It loads `styles.css` and then the scripts in `play/js/` **in the order listed there**.
- The scripts are classic scripts that share one global scope (`"use strict"` at the top of each). Order matters: a file can only use things defined in files above it *while it is loading*. Calls that happen later (on tap, per frame) can use anything.
- `manifest.webmanifest`, `sw.js`, `icons/`, `og-image.png`: home-screen install and share previews. The service worker is network-first. When you add, rename or remove a game file, update the `CORE` list in `sw.js` and bump `CACHE`.
- `supabase/`: SQL files Otis runs by hand in the Supabase SQL Editor, numbered in order.
- `tools/` and `package.json`: not part of the game (Playwright test tooling and art).
  - `tools/gallery.html`: every plant at every stage on one page. Open http://localhost:8000/tools/gallery.html after changing a drawing.
  - `node tools/make-art.mjs` redraws `icons/` and `og-image.png` from the game's own daisy.

| File | What's in it |
|---|---|
| config.js | `VERSION`, Supabase URL and publishable key |
| data.js | `PLANTS` (grow time, bloom time, thirst, seed cost, price), `PLANT_NOTE`, the week (`DAYS`: which plant joins the seed tray, customers, gaps, patience, order sizes, story), `START`, beds and their costs, `UPGRADES`, customer names |
| core.js | Small helpers, saved progress (`BEST`, `loadRun`, `saveRun`), game state `S`, `snapshot`/`restore`, `unlocked()` |
| online.js | Supabase connection, the feedback screen, quiet crash notes |
| audio.js | Procedural sound effects |
| draw.js | Ink SVG for every plant at every stage (`bedSVG`), flower icons, seed packets, customer faces |
| garden.js | The beds: planting, watering, picking, weeds, dead plants, growth per frame (`tickGarden`), the seed tray, the bucket, little effects |
| shop.js | Customers and their orders (`makeCustomer`), the rail, selling, walkouts, street meter, till, floating text, toasts |
| tutorial.js | The soft opening: `TUT` steps, Nana's bubble (`bubble`, the reading ring and x), `coach(event)`, `startTutorial`, `finishTutorial` |
| screens.js | The day flow (`newWeek`, `startShift`, `endShift`), Monday's hints, every screen (title, morning intro, closing time, seed shop, win, lose, pause), the main loop, `start()` |

## How it plays
- One week, Monday to Sunday. Each morning a new plant joins the seed tray (daisy and tulip first, orchid last). Each day has more customers, less patience and bigger orders. Saturday is market day; Sunday is the flower show.
- **One tap does the obvious thing.** Empty bed: plant the seed picked in the tray (costs the seed price). Growing plant: water it (only when it's below 75%). Bloom: pick it into the bucket. Weed or dead plant: clear it, free.
- Plants grow only while they have water. Dry for 8 seconds while growing, they die. A bloom lasts its `bloom` time, fades in its last 30% (shown drooping), then goes to seed. Dry blooms fade faster.
- Customers wait on the rail with a patience bar. Tap one when the bucket holds their order to sell it: they pay the stems' prices plus a tip for speed (1 to 3 stars). A ticket that can be served bobs and gets a double outline.
- The street meter starts at 60%. A sale adds 1 + stars; a walkout costs 14. At 0% the day is lost and can be retried from that morning.
- Between days: the seed shop. Dig more beds (6 to 12) and buy upgrades (sprinkler, cold frame, flower food, striped awning). Plants and the bucket carry over to the next day, and every plant starts the day with a full drink.
- Never stuck: with no money, nothing growing and an empty bucket, a daisy seed is free ("Nana's old tin").
- Weeds creep into empty beds from Tuesday on.
- Monday shows a one-line hint above the seed tray until the player has watered, picked, sold and planted once.

## The soft opening (tutorial)
- A guided evening before Monday with Nana as coach. New players see Soft opening first on the title (with Skip to Monday); everyone else gets a quiet Play the soft opening button. Finishing or skipping sets `BEST.tutDone` and goes to Monday's intro.
- It uses the normal garden with bare beds, and `S.tut` switches off the pressure: no customers except scripted ones (`tutCustomer`), no patience loss, no walkouts, plants never die and blooms never fade. It never saves a run.
- The game reports moments with `coach(event)`: `plant`, `water`, `bloom`, `pick`, `sell`, `pull`, plus `tick` a few times a second.
- Each step in `TUT` has `when` (the event that shows it), `until` (the event that moves on, or `next`/`finish` for explanations closed with the x), `target` (what gets the dashed ring), `pos` (`top` or `bottom`), `show` (set-up as it appears) and `ready` (true once the step is done anyway, so doing things out of order never leaves it stuck).
- The bubble is Ink Crossing's: a reading ring fills for 2.6 to 7 seconds, then turns into an x. It lets taps through; only its buttons are tappable. Don't add Next or Got it buttons.
- If you rename an element a step targets, or change when one of those events fires, update `TUT` and run `npm run tutorial`.

## Every change
1. Work on a new branch, never directly on `main`.
2. Bump `VERSION` in `play/js/config.js` (patch for fixes, minor for features) and add a line to `CHANGELOG.md` in plain language.
3. Test:
   - `npm run check`: all scripts parse.
   - `npm run week`: a bot plays whole weeks at phone size with the clock run fast and fails on any error. `npm run week -- 5 human 1.1` plays at a person's pace (one tap every 1.1 s); use it after any balance change. At 0.7 s the bot should win comfortably, and at 1.1 s Saturday and Sunday should get tense.
   - `npm run tutorial`: a bot plays the soft opening start to finish and fails if it gets stuck. `npm run tutorial -- shots` saves a screenshot of every tip in `screenshots/`.
   - Then run `python3 -m http.server` in the repo folder and open http://localhost:8000/play/ at a phone size (390 × 844). Online features only work over https, so locally feedback may say it isn't connected. That's expected.
4. Push the branch and share the Vercel preview link with Otis. Merge to `main` only when he's happy.

## Protect players' saved progress
Progress is kept in the browser's localStorage. An update must never wipe or break it.
- `inkgardens`: `best` (`day`, `earned`, `till`, `won`), `muted` and `tutDone` (finished or skipped the soft opening).
- `inkgardens-run`: the week in progress, saved each morning (`v`, `day`, `loyalty`, `till`, `earned`, `beds`, `up`, `garden`, `bucket`, `sel`). "Carry on" restarts that morning.
- Never rename or remove a saved field. Add new fields with defaults in `restore()`. If a field's meaning changes, bump `v` and convert old runs in `loadRun()`.
- Never reorder `PLANTS`: saved gardens and buckets refer to plants by position. Add new plants at the end. Never rename an `UPGRADES` key (`k`).

## Supabase
- It's the same Supabase project as Ink Nine and Ink Burger, with its own table `garden_feedback` (`supabase/01-garden-feedback.sql`): tester notes with the version and a snapshot of the game (day, street meter, till, garden, bucket, customers, screen size), readable only in the Supabase dashboard.
- "Send feedback" is on the title, pause, closing time, win and lose screens. It opens over the current screen, and Back restores that screen exactly.
- Unexpected errors are sent quietly as kind "Crash" (at most three per visit, never from localhost).
- `config.js` holds only the public publishable key. **Never add a Supabase secret or service key anywhere.**
- Players are anonymous Supabase users. Row-level security lets each player insert only their own notes.
- Any schema change needs a new numbered file in `supabase/` and a clear note to Otis to run it before merging.

## Look and feel (keep it consistent)
- Paper and ink only: white and black, with grey only for secondary text. Shading is hatching, dots and stripes, never color. Dark mode swaps paper and ink.
- Fonts: Fraunces for display and Figtree for the UI (400 to 800), the same pair as Ink Nine and the other ink games. Titles and headings are Fraunces italic 900; numbers (till, prices, counts, stats) are upright Fraunces 900 with even-width digits.
- Plants draw in a 100 × 100 box with the soil at y 88 (`GROUND` in draw.js). New plants need a `case` in `plantBody` for bud and bloom, and an `ICON_BOX` crop.
- Motion follows Disney's principles: squash and stretch, anticipation, follow-through, slow in and out. Blooms sway, thirsty plants droop.
- Mobile first, portrait, one thumb. Respect safe areas and `prefers-reduced-motion`.
- Writing: sentence case, short and plain, no jargon, numbers as digits.

## Smoke test before sharing a preview
- The front page shows three beds growing, blooming and getting picked, and a Play button that opens the game.
- The title shows the version and "Send feedback". A fresh player sees Soft opening first; after it, Open the shop; after starting a week, a refresh shows Carry on.
- Soft opening: Nana's tips appear one at a time with a filling ring, the ring turns into an x, and the thing she's talking about gets a dashed ring. Play it through to Monday. Pause, restart it and quit from the middle: the tip goes away.
- Monday: the intro shows daisy and tulip and the how-to. Open the shop: six beds with two daisies and a tulip already growing, the hint line, and two seed packets.
- Plant, water (the bar fills and drops fall), pick (the flower flies to the bucket), and sell to a customer (flowers fly to the ticket, "Sold" stamp, the till goes up).
- Let a customer run out: "Went to Everbloom". Let a plant dry out: "Dried out". Leave a bloom: it droops, then goes to seed.
- Closing time, then the seed shop: dig a bed and buy an upgrade; Tuesday adds the sunflower.
- Pause, send feedback, Back returns to the pause screen.
- Check it in dark mode too. No errors in the browser console.
