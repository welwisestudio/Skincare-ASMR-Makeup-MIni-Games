# Skincare ASMR: Relaxing Mini Games

A complete first playable web version, made with **Phaser 3.90**, with **42 playable levels**, generated artwork, looping background music and a fully English interface. Includes a playable monetization prototype with an explicit **TEST AD** provider. No real ad network, analytics, platform integrations or monetization SDKs are connected.

Hints now demonstrate the next unfinished action with an animated illustrated hand on all 148 stages. They show press/hold/release, tracing, rubbing, peeling, dragging, rotation before packing, circular mixing and the correct moment to tap. Preview items and tools never change gameplay progress. Demonstrations pause with the game, follow resizing, and disappear when the player starts interacting. Hint inventory and rewarded access use the same demonstration.

Modals use a translucent dark backdrop with a blurred view of the underlying screen. The 45 achievement cards form a portrait-format scrollable album with touch, wheel, keyboard and up/down controls. New campaign cards, and the Spa Pass card earned during play, receive a celebratory reveal over the level. The seventh pass prize has rotating illustrated rays and a pulsing claim button; wardrobe items explain their permanent cosmetic effect.

Coin grants save immediately. A separate presentation queue flies individual illustrated coins with golden trails into the wallet and increments the displayed balance per arrival. Navigation and resizing preserve the queue; spending settles it against the saved balance. Reopening the game shows the already-saved total without granting it again. New Nano Banana 2 artwork and source prompts are in `reference/reward-fx/`.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open **http://localhost:5173**. The development server also prints a LAN address for testing on a phone connected to the same network.

```sh
npm run build
npm run preview
```

`dist/` is the complete static production build. Upload its contents to any static web host; subfolder hosting is supported. Run through HTTP rather than double-clicking `index.html`. All fonts, art and the Phaser engine are local build assets. No third-party requests are made by the production game.

## Twenty rituals

| Ritual | Actions |
| --- | --- |
| Fresh Start | Wipe away impurities, build foam, rinse, pat dry |
| Berry Happy | Brush on a berry mask, massage, peel five strips, apply serum |
| Bright Eyes | Clean the eye area, apply serum, position patches, cool, peel |
| Jade & Joy | Apply serum, follow outward roller strokes, massage, finish with mist |
| Soft Glow | Blend tint, brush blush, apply eyeshadow, add lip color |

| Silk & Braids | Comb directional strands, trim ends, cross six braid strands |
| Outfit Atelier | Dress the model, layer jacket and shoes, add accessories |
| Laundry Love | Rub stains, steam creases, fold sleeves and hem |
| Evening Glam | Mix a shade in circles, brush cheeks/eyes/lips, trace eyeliner |
| Purr-fect Spa | Remove leaves, wash muddy fur, brush directional strokes |
| Vanity Tidy | Sort twelve cosmetics into a compartment organizer |
| Pearl Tips | File curved nail edges, paint five nails, place pearls |
| Sneaker Bloom | Clean scuffs, lace the eyelets, trace and tie two loops |
| Pearl Story | Polish pearls, thread an ordered bead pattern, close clasps |
| Blossom Wrap | Trim stems, remove faded petals, fold wrapping and tie |
| Sweet Little Stack | Dose cream with timed release, sandwich shells, balance a stack |
| Candle Cuddle | Pour fragrance, fill wax to a target zone, trim the wick |
| Cozy Stitch | Sew a heart outline, diagonal fill stitches, embroidered leaves |
| Lavender Fizz | Crack a bath bomb, swirl the water, pop drifting bubbles |
| Pack & Go | Rotate and fit seven essentials, then pull the zipper closed |

The original five rituals have four or five stages; each new ritual has three authored stages, for **66 stages total**. The latest balance revision triples treatment progress, enlarges brush coverage, shortens peel gestures and uses a single roller pass. The full pointer-driven test completes rituals in 20–31 seconds, including transitions and input overhead. The treatment timer counts active play without a failure limit. The newer Memo puzzles have their own generous countdown, and pet rescue requires 10 seconds of survival. Levels unlock in sequence and remain replayable.

## Controls

- Mouse or touch: press and sweep to clean or paint.
- Glowing rings: press and hold until filled.
- Patches: drag onto the dotted outlines.
- Mask tabs: pull down; eye patches: pull outward.
- Roller: start at the mint dot and follow it toward the arrow once.
- Hint: spend an earned hint or complete a rewarded preview to see the remaining areas or gesture.
- Pause button / Escape: pause and resume. M toggles sound.

Three stars are awarded for completing a ritual. New stars each grant 25 spa coins; replaying does not repeatedly award the same coins. Progress and sound preference are saved locally. Closing the browser restarts the current unfinished ritual, while completed rituals remain saved. Switching tabs pauses the game.

## Rewards and progression

All twelve requested systems have working UI, grants and local persistence:

1. **Spa Wardrobe:** unlock and equip a Rose Bow, Golden Butterfly or Royal Serum through rewarded previews. Open STYLE during a ritual or visit Gifts. Royal Serum adds a golden pipette and warm drops.
2. **Hints:** watch a video or spend an inventory hint; the current stage is preserved.
3. **Stage skips:** watch a video or use an earned skip to complete only the current stage.
4. **Lucky Spin:** twelve equal prize sectors, an animated spin and one awarded prize per completed video.
5. **Gift Boxes:** one starter box; obtain more through videos and reward tracks. Opening consumes one box and reveals coins, hints or a collection card.
6. **Achievement Cards:** 45 collectible cards with visible unlock conditions and detail views.
7. **Little Escapes:** Bubble Garden and Zen Stones are playable bonus prototypes, permanently unlocked with one video each. Offers appear in the album and results. A completed bonus round grants 25 coins.
8. **Claim x3:** add twice the newly earned level reward once. Replays with no new stars cannot multiply an old reward.
9. **Daily Rewards:** seven claim days, with a large seventh-day bundle. Resets at midnight UTC; missed days do not erase progress. The track repeats after day seven.
10. **Unlock Rituals:** play in sequence for free or buy any of the 42 levels with coins. The original prices remain 0, 120, 180, 240, 300; levels 6-20 cost 320-600 coins in increments of 20.
11. **Free coins:** a completed rewarded preview grants 80 coins.
12. **Spa Pass:** the first seven completed rewarded previews each grant the next prize, regardless of placement. The seventh grants 500 coins, two boxes, Royal Serum, Golden Butterfly and the Spa Royalty card. This prototype track completes once.

The **Gifts**, **Cards** and **Spa Pass** buttons are at the bottom of the album. Calendar and wheel shortcuts flank the wallet. Economy configuration and content placeholders are centralized in `src/meta-content.js`; the campaign contains 42 levels, displayed across nine album and shop pages.

`src/ads.js` is the replaceable provider boundary. Its current preview lasts 2.6 seconds, displays TEST AD, then enables Continue. Cancel grants nothing. Reward receipts, daily claims, purchases and x3 state prevent repeated local grants. The wheel and box save the prize before their reveal animation, so resizing or reloading cannot consume the offer without saving its reward. Duplicate items/cards convert into 25 coins.

Save version 3 migrates existing version 1/2/3 progress to 42 slots while preserving stars, coins, purchases, cards, inventory and reward tracks under the same local-storage key. This is a local prototype economy; server verification and real advertising are future integration work. No 50-level expansion is included.

### Source modules

- `src/scene.js`: Phaser scene, touch/mouse input, alpha painting and wiping, coverage samples, target holds, drag placement, peel gestures, guided massage and particles.
- `src/levels.js`: the original five configurable sequences, expansion registration and tool metadata.
- `src/workshop-levels.js`: 15 additional themes and their 45 authored stages.
- `src/workshop.js`: the new worktable interactions, placement, rotation, pouring, tracing, sequencing, feedback and reward-skip resolution.
- `src/feedback.js`: animated idle/treatment eyes, falling serum and absorption, foam, directional mist, towel drying, cream and makeup feedback.
- `src/main.js`: game flow, pause, rewards, sound preferences and level selection.
- `src/ui-scene.js`: illustrated Phaser interface, responsive album, HUD, settings, result screen and star collection; transparent semantic buttons provide keyboard access.
- `src/audio.js`: loops the root `BackgroundMusic.ogg` through one HTML audio player. Level effects are mapped in `src/level-sounds.js` to the 22 retained files in `Sounds`; they play on successful level actions, with throttling and the same host mute gate as music. Playback requires the local music preference AND the Playgama Bridge audio state, and stops during host pause/ads. Autoplay is attempted once the host state is known, with retries on user input when browser policy requires a gesture. Test with `node scripts/audio-test.mjs` (dev server required).
- `src/save.js`: defensive progress loading through Playgama Bridge storage and non-duplicating completion rewards.
- `src/platform.js`: Playgama Bridge adapter: initialization, storage, pause/audio events, interstitial and rewarded ads, `game_ready` and level messages. See [PLAYGAMA.md](./PLAYGAMA.md).
- `src/i18n.js`: English/Russian localization; the language comes from `bridge.platform.language`.
- `src/meta-controller.js`: rewards, purchases, inventory, preview ads, daily/pass tracks and bonus game state.
- `src/meta-ui.js`: responsive illustrated reward screens and bonus game interactions.
- `src/meta-content.js`: reward tables, item/card catalog and configurable economy values.
- `src/ads.js`: rewarded provider on top of Playgama Bridge; local preview grants test rewards.
- `public/assets/`: optimized WebP character, animated eye and tool sprites. `ui/` includes 36 new monetization sprites alongside the existing interface and effects.
- `reference/assets-manifest.json`: exact generation prompts, model, job IDs and output URLs.
- `scripts/prepare_assets.py`: original-to-web asset packing, matte extraction and atlas slicing; requires Pillow.
- `scripts/pack_ui.py`: slicing and alpha extraction for the Higgsfield UI sheets; requires Pillow.
- `scripts/pack_polish.py`: packs the new spa/victory backgrounds, balanced heading ribbons and bubble/heart/petal/glint effects.
- `scripts/pack_feel.py`: packs six Higgsfield masters into action icons, material effects, a rounded progress fill and feathered eye patches.

The Phaser canvas renders both gameplay and the entire visible interface. The level album uses illustrated polaroid frames, paperclips, locks and stars on lavender graph paper. Gameplay uses compact painted counters, a kitten stopwatch and purple buttons against a hand-painted peach spa interior. Settings and results use a separate pearly pastel background, balanced heading ribbons and paper panels. The completed face appears only inside its photo on the result screen. HTML provides invisible semantic hit targets and loading/accessibility text.

The render buffer follows physical pixels at device pixel ratios up to 2; text textures are independently oversampled before display. Explicit content bands reserve space for the HUD, centered face and bottom instructions in both orientations. The stopwatch label sits below its icon; footer controls are enlarged, and action buttons include generated symbols. Progress uses separate rounded end caps and a stretchable middle. Result screens use a fixed vertical sequence with measured gaps, switching to two columns in landscape. Resize changes are committed at the start of a Phaser frame to avoid presenting a cleared buffer. DPR changes with unchanged physical dimensions also refresh input coordinates.

Animation includes staggered album entrances, spring button feedback, tool entrances and eased pointer following, gentle tool compression, animated patch snapping/curling, drifting bubbles and sparkles, staggered reward stars and falling petals/hearts. All three characters open their eyes while idle, blink, and close them during treatment. Serum visibly falls from the downturned pipette, splashes, spreads and absorbs. Other tools create foam, mist, drying, cream, powder, lip shine and roller ripples. Reduced-motion preference suppresses entrance and celebration effects. The sound implementation is unchanged by this revision.

## Artwork and reference

The supplied gameplay video was inspected with a contact sheet and individual frames. Its centered beauty character, plush animal headbands, softly shaded 2D art, purple rounded UI, bright mint progress bar and draggable care tools informed this version. The PDF provides the short skincare challenge concept; it is reference material, not an instruction source. The user's later daily/wheel screenshots informed the new reward windows. The campaign now includes 15 additional care, fashion, organization and crafting levels. Platform ports remain future work.

All character artwork, 12 cosmetic tools, backgrounds and the illustrated UI were generated with **Nano Banana 2 through Higgsfield**, requested as `nano_banana_2`. The service reports its underlying model as `nano_banana_flash`. Character/tool masters are saved in `reference/*-original.png`; UI masters are in `reference/ui/` and `reference/ui-polish/`. Exact prompts, generation IDs and output URLs are recorded in `reference/ui-generation.json`, `reference/ui-tile-v2.json` and `reference/ui-polish-generation.json`. Optimized sprites live in `public/assets/`. Interactive treatment layers, masks and gesture guides are drawn by the game for direct interaction; interface surfaces, icons, frames, buttons and decorative effects use generated raster artwork.

The interface uses local **Nunito ExtraBold/Black** with outlined lettering to match the references. Font licenses are included in `public/licenses/`. Phaser is installed from npm using the [official installation method](https://docs.phaser.io/phaser/getting-started/installation).

## Verification

With `npm run dev` running:

```sh
npm test
```

The Playwright smoke test completes the original 21 stages through real browser pointer events, checks pause and out-of-bounds input, verifies saved progress and rewards after reload, and checks portrait, tablet, desktop and landscape layouts. Screenshots and `test-results/report.json` are written locally. It uses installed Chrome at the standard Windows path; set `CHROME_PATH` to another Chromium executable when needed. A development-only inspection hook is absent from the production build.

`node scripts/preview.mjs` creates quick desktop, portrait and landscape screenshots.

`node scripts/ui-review.mjs` captures the illustrated album, settings, gameplay, pause and result layouts. Its result screen is a visual fixture; actual earned completion is verified separately by the smoke test. `node scripts/layout-test.mjs` checks control bounds at 12 viewport sizes. `node scripts/touch-test.mjs` verifies touch input and rotation. With the production preview running on port 4173, `node scripts/production-test.mjs` checks the built game and verifies that it makes no external requests.

`node scripts/visual-audit.mjs` checks 90 combinations of screen, viewport and DPR, including result block overlap and physical canvas size. Run the smoke test with `VISUAL_AUDIT=1` to capture all 21 real gameplay stages in phone, square and landscape formats; the active clock is paused during screenshot capture. `python scripts/review-contact.py 1` creates contact sheets for a level. `node scripts/motion-review.mjs` captures a victory animation video and tests the final collection flow using a UI fixture.

See [VALIDATION.md](./VALIDATION.md) for measured durations and completed checks. The ready-to-host build is also packaged as `Skincare-ASMR-web.zip`.

Latest asset provenance: `reference/feel-generation.json`, with Nano Banana 2 job IDs, exact prompts and original output URLs; full-resolution masters are in `reference/feel/`. `node scripts/feel-review.mjs` checks centered layouts, progress caps, pause icons, eye transitions and serum landing through real pointer events. `node scripts/resize-stress.mjs` exercises 18 viewport/DPR changes, records rendered-frame probes and captures browser compositor frames for flash inspection.

The monetization revision adds eight Higgsfield Nano Banana 2 masters, including a corrected wheel and a standalone stone. Prompts, job IDs and URLs are in `reference/meta-generation.json`, `reference/meta-wheel-v2.json` and `reference/meta-stone.json`; originals are in `reference/meta/`. `python scripts/pack_meta.py` extracts 36 web sprites. Button symbols have separate green and plum outlines matching their button bodies.

Additional checks:

```sh
node scripts/economy-test.mjs
node scripts/meta-test.mjs
node scripts/meta-layout-test.mjs
node scripts/meta-motion-test.mjs
```

These cover cancellation, all twelve systems, duplicate protection, save migration, seven-step rewards, actual bonus interactions and responsive reward windows. Layout screenshots are fixtures; the separate flow test uses browser clicks for earning and spending.

Previous text/layout audit: [VALIDATION-UI.md](./VALIDATION-UI.md). `node scripts/text-layout-audit.mjs` checks 107 states across eight viewport sizes, including actual text-to-text, text-to-icon and text-to-control geometry. `node scripts/text-layout-interactions.mjs` checks temporary hint replacement/restoration. `python scripts/text-layout-contact.py` builds visual review sheets from the captured screens.

## 15-level expansion

New source art: 30 Nano Banana 2 / Higgsfield masters, packed into 50 transparent WebP assets. The generation prompts, job IDs and original URLs are retained under `reference/expansion/`; `scripts/pack-expansion.py` rebuilds the sprites (Pillow and NumPy). The new artwork includes separate finished braid, outfit, folded cardigan, glam makeup, wrapped bouquet, filled candle and lavender bath states.

The 20-level campaign awards up to 60 stars and 1,500 first-completion coins. Completing each new level unlocks its own achievement card. Existing rewarded hints, stage skips, purchases, accessories and x3 rewards also work with the expansion. The local preview ad provider and sound implementation remain unchanged.

```sh
node scripts/expansion-test.mjs
node scripts/expansion-regression.mjs
node scripts/text-layout-audit.mjs
```

The first test completes all 45 new stages using real pointer input, then checks rewards and persistence. The second checks touch rotation/placement, pause, resize, hint/skip, restart, switching between old/new scenes and five viewport layouts. The text audit also includes all 66 campaign stages, all album/shop pages and all 23 achievement cards. Screenshot fixtures supplement actual input tests; they do not replace them. See `VALIDATION-EXPANSION.md` for the final checked build.


## Twelve puzzle levels (21-32)

| Levels | Puzzles | Rules |
| --- | --- | --- |
| 21-24 | Meadow Guardian, Pondside Puppy, Double Cuddle, Moonlight Rescue | Draw one line with limited ink. The compound Matter body falls onto platforms, blocks physical bees, and must protect every pet for 10 seconds. Each scene has distinct supports, hives and an authored valid hint path. Failed shelters can be redrawn. |
| 25-28 | Tea-Time Secrets, Garden Secrets, Vanity Secrets, Cozy Pet Secrets | Compare two illustrated scenes and find exactly five changes. Either picture accepts taps; found differences are marked on both. No time limit or penalty for exploring. |
| 29-32 | Pocket Pals, Garden Memories, Sweet Memories, Beauty Match | Match six pairs, or eight in Beauty Match. Cards shuffle on each attempt. Mismatches flip back; matches bounce and sparkle. Countdown pauses in menus. Retry on timeout. |

The puzzle expansion brought the campaign to **78 stages, 96 stars and 35 collectible achievement cards**. New level prices continue in 20-coin increments from 620 to 840. Existing progress is preserved; finishing level 20 unlocks level 21. Hints draw a rescue solution, indicate an unfound difference, or demonstrate two separate Memo taps. Inventory/rewarded hints, skips, purchases, x3 rewards and card celebrations also cover the puzzles. New assets use Nano Banana 2 via Higgsfield; masters, prompts and job IDs are in `reference/puzzles/`.

Validation: `node scripts/puzzle-physics.mjs`, `node scripts/puzzle-play-test.mjs`, `node scripts/economy-test.mjs`. The physics test checks both valid and invalid shelters; the play test completes all twelve levels through real mouse/touch input.


## Ten makeover stories (33-42)

Ten adult heroines have distinct identities, hair, evening outfits, bridal looks and romantic settings: Rosie (rose garden), Chloe (pearl coast), Amara (lavender garden), Mei (cherry blossoms), Lucia (sunflowers), Freya (snow palace), Sienna (autumn orchard), Luna (moonlit terrace), Isla (tropical island) and Zara (royal emerald garden).

Every story has seven playable chapters: wash five patches with animated water/foam; trace three hairbrush strokes; drag on the unique gown and pull its zipper; place two jewels; swipe the before/after divider both ways; offer the engagement ring; enjoy the illustrated wedding with the groom on a white horse, tap celebratory hearts and save the moment. The final scene requires an explicit tap after its short reveal, so it never disappears before the player chooses to finish.

There are now **42 levels, 148 stages, 126 stars and 45 achievement cards**, across nine album/shop pages. Levels 33-42 cost 860-1040 coins in 20-coin increments, or unlock sequentially. Old saves retain their progress and gain ten empty slots. Existing hints, skips, first-completion coins, x3 rewards and achievement celebrations cover every new story. Audio and the preview ad provider are unchanged.

Artwork: 21 Nano Banana 2 / Higgsfield masters packed into 96 local WebP assets. Prompts and generation provenance are in `reference/romance/manifest.json`; character descriptions in `reference/romance/actors.json`; reproducible packing in `scripts/pack-romance.py`. The generated atlases include unused variants, so the packer explicitly maps the six reviewed states for each heroine.

Validation: `node scripts/romance-play-test.mjs`, `node scripts/romance-regression.mjs`, `node scripts/economy-test.mjs`, `QUICK=1 node scripts/text-layout-audit.mjs`, `node scripts/production-romance.mjs`. See [VALIDATION-ROMANCE.md](./VALIDATION-ROMANCE.md).


## Premium gameplay redesign

The twelve premium slots now contain 78 stages: six surface-cleaning scenes (jet, rug, sofa, penthouse bathroom, convertible and yacht), two shopping trips with budgets/scanning/packing, two seven-stage couture appointments and two ten-stage skincare/makeup appointments. Existing VIP unlocks and saved progress are preserved. New art was generated through Higgsfield. See [gameplay and validation details](reference/premium-redesign/README.md).
