# Monetization prototype validation

Validated 2026-09-30 using installed Chrome, Phaser 3.90 and the Vite production build.

## Delivered scope

All twelve requested reward systems are implemented, with English illustrated UI, local grants and saved progress. Five campaign levels remain unchanged in scope. Two small playable bonus modes are included. There is no real advertising SDK: all video placements use a clearly labeled, cancellable TEST AD preview.

Eight new masters were generated through Higgsfield Nano Banana 2 and packed into 36 sprites. They include green/plum button symbols, a 12-sector wheel, chests, rewards, cards, wardrobe accessories, bonus illustrations and a complete isolated stone. The service identifies the backend as `nano_banana_flash`. Provenance: `reference/meta-generation.json`, `reference/meta-wheel-v2.json`, `reference/meta-stone.json`.

## Functional evidence

- `node scripts/meta-test.mjs`: all twelve systems passed via browser clicks. Covers daily claim/reload, rewarded wardrobe equipment, ad cancellation without any save mutation, earned and inventory hints, four rewarded stage skips, real level completion, once-only x3, all seven pass rewards, wheel and box resizing during reveal, currency offers, buying a ritual, saved unlocks, achievement details, and both bonus games.
- `node scripts/economy-test.mjs`: save migration, balance normalization, daily rollover/clock rollback, duplicate compensation, seven pass rewards and exactly-once preview completion passed.
- `node scripts/meta-layout-test.mjs`: 119 new-screen/viewport combinations passed at DPR 2. Seventeen windows tested at seven sizes, including 320x240, phone, tablet, square and desktop. Click targets remain inside the screen and do not overlap each other.
- `node scripts/visual-audit.mjs`: 90 original UI/viewport/DPR combinations passed, including physical canvas resolution, oversampled text and measured result/pause block separation.
- `node scripts/meta-motion-test.mjs`: both orientations of the completed bonus screen, five real timed stone placements and a direct Spa Pass claim passed. Captured `test-results/meta-motion/bonus-preview.webm`.
- `node scripts/touch-test.mjs`: touch progression, rotation preservation, no page scrolling, pause and saved sound preference passed.
- `node scripts/resize-stress.mjs`: 18 viewport/DPR changes, 99 rendered-frame probes and 93 browser compositor frames; zero black rendered probes and no browser errors. This is Chromium evidence, not a claim about every browser/GPU.
- `node scripts/production-test.mjs`: built bundle, local assets, pointer interaction, pause, menu, daily claim and rewarded preview passed. No external requests, asset failures or development inspection hook.

The full ordinary pointer run also completed every one of the 21 campaign stages without skipping or setting progress. Measured active times: Fresh Start 31.9s, Berry Happy 29.7s, Bright Eyes 21.4s, Jade & Joy 29.7s, Soft Glow 24.9s. Saved stars/coins, pause, out-of-face input and twelve viewport sizes passed. These automated timings include input/transition overhead and are not fixed level deadlines.

## Visual inspection

Inspected portrait and landscape reward hubs, daily/pass tracks, wheel, boxes, shop, ritual purchase, wardrobe, cards/details, help, bonus offers, ad preview and reward bundle screens. Also inspected real earned results, final pass bundle and the bonus completion screen. Fixed bundle art/text collisions in landscape, result block spacing, replay/caption overlap and the cut-off stone sprite. Screenshot fixtures are separate from the click-driven functional tests.

New evidence is in `test-results/meta-flow/`, `meta-layout/`, `meta-motion/` and corresponding JSON reports. Previous-stage contact sheets remain in `test-results/visual-stages/`; they belong to the earlier tactile-feedback revision.

## Packaging and limits

`npm run build` passes. `Skincare-ASMR-web.zip` contains the static `dist/` files; `python scripts/verify-package.py` compares every archived file byte-for-byte against the build.

Progress is local storage, not a server-authoritative economy. Daily gifts reset at midnight UTC. Wheel sectors have equal 1/12 probability; box probabilities are shown in-game. Duplicate collectibles grant 25 coins. Production ad SDK integration and campaign expansion are intentionally not included.

Audio is unchanged: SHA256 of `src/audio.js` remains `E50BD1C32FDA8C6E6D87CD4F213158C60BF8178ED7DABDD84E6C5CB9EA35DC2B`.
