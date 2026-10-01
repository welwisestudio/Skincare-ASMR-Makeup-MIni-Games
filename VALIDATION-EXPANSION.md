# Twenty-level campaign validation

Validated September 30, 2026, in installed Chrome using Playwright.

## Delivered

- 15 additional playable levels, 20 total, 66 stages (21 original + 45 new).
- Hair styling and braiding, layered dressing, stain removal/ironing/folding, full makeup, kitten care, compartment sorting, nail care, shoe cleaning/lacing, jewelry threading, bouquet wrapping, macaron assembly/balancing, candle pouring, embroidery, bath-bomb mixing and rotated travel packing with zipper closure.
- 30 Higgsfield / Nano Banana 2 source images, extracted into 50 local WebP sprites. Source prompts, job IDs, URLs and full-resolution masters are in `reference/expansion/`.
- Four album/shop pages, 23 achievement cards, 60 available stars, 1,500 first-completion coins. New prices range from 320 to 600 coins; sequential play remains free.
- Save version 3 preserves prior stars, coins, purchases, inventory, cards and reward tracks, and appends the new level slots.

## Executed checks

| Check | Result |
| --- | --- |
| `npm run build` | Production build succeeds |
| `node scripts/smoke-test.mjs` | All 21 original stages completed with real pointer input; persistence, pause and 12 viewport sizes pass |
| `node scripts/expansion-test.mjs` | All 45 new stages completed with real pointer input; all 15 results and saved rewards pass |
| `node scripts/expansion-regression.mjs` | Touch rotation/placement, pause, hint, skip, restart, resize preservation and old/new scene switching pass; 225 layout fixtures |
| `node scripts/text-layout-audit.mjs` | 176 states × 8 viewports = 1,408 checks; zero text overlap, container overflow or page errors |
| `node scripts/economy-test.mjs` | v1/v2/v3 migration, 20-slot unlocks, reward bounds, duplicate conversion and ad receipt behavior pass |
| `node scripts/meta-test.mjs` | All 12 monetization/retention systems pass using browser clicks and preview ads |
| `node scripts/production-test.mjs` | Built original gameplay, daily rewards and rewarded preview pass; no debug hook or external requests |
| `node scripts/production-expansion.mjs` | Four album pages and level 20 playable in production; real rotation/placement works; no debug hook or external requests |
| `$env:WORKSHOP='1'; node scripts/resize-stress.mjs` | 18 viewport/DPR changes; 168 sampled rendered frames, zero black frames; 141 compositor captures |

The new completion test uses target coordinates from the development inspection hook, but performs real browser mouse gestures. It does not set completion percentages or grant result rewards directly. It seeds level purchases to access the new campaign independently. Screenshot fixtures explicitly freeze stages for layout inspection; they supplement the input tests.

New automated completion times range from approximately 8 to 40 seconds per level. These measure a script that already knows where every target is, not a human session. Input responsiveness retains the earlier fast-treatment balance, with no mandatory one-minute wait.

## Visual review and fixes

- Reviewed all 45 new stages in portrait and landscape, plus real intermediate states and earned results.
- Corrected extracted tool/clothing sprite bounds, including the full dress, handbag chain, scissors and needle.
- Aligned makeup regions and laces with their underlying artwork; kept pearls inside the jewelry tray and bath bubbles inside the diagonal tub.
- Replaced temporary flat braid/wax/bath overlays with generated finished artwork and animated transitions.
- Added destination silhouettes, rotate-to-fit feedback, snap-back on incorrect placement, timed-release feedback and an interactive final zipper.
- Reserved space for locked-card prices, two-digit level numbers, pagination and shop descriptions.
- Rewarded skips resolve the final material/placement state instead of leaving the skipped task visually unfinished.
- Final result capture preserves sprite tint and display order. A pixel check confirms the tint is retained; levels 12, 14 and 18 were replayed after the final manicure, necklace and embroidery polish.

Reports and screenshots: `test-results/expansion-play/`, `test-results/expansion-regression/`, `test-results/text-layout/`, `test-results/meta-flow-report.json`, `test-results/production-expansion.json` and `test-results/resize-workshop-report.json`.

## Build boundaries

No real advertising SDK, analytics or platform SDK is connected. Rewarded placements still use the existing explicit TEST AD provider. Audio code is unchanged (SHA-256 `E50BD1C32FDA8C6E6D87CD4F213158C60BF8178ED7DABDD84E6C5CB9EA35DC2B`). Progress is stored locally; incomplete levels restart after a browser reload. The campaign contains 20 levels, not 50.

`dist/` and `Skincare-ASMR-web.zip` are the standalone static web build. Serve them over HTTP. `scripts/verify-package.py` compares every archive entry byte-for-byte with `dist/`.
