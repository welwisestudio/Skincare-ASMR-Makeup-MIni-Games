# Levels 21-32

The campaign contains 32 levels, 78 stages, 96 stars and 35 achievement cards. The new content consists of four physical draw-to-protect puzzles, four five-difference scenes and four shuffled Memo decks (six to eight pairs).

## Checks

- `node scripts/puzzle-physics.mjs`: all four authored shelters survive ten seconds; unrelated strokes fail when a bee reaches a pet. The test runs the actual Matter simulation.
- `node scripts/puzzle-play-test.mjs`: completes all twelve new levels using browser mouse/touch input. Checks incorrect/repeated difference taps, Memo mismatches, resize, pause, rewards, scene switching and the final partial album page.
- `node scripts/puzzle-regression.mjs`: 72 layouts (all twelve levels at six viewport sizes), animated hints, paused timers, selected-card preservation, timeout, retries and stage skips.
- `node scripts/economy-test.mjs`: old saves extend to 32 slots while retaining purchases and progress; sequential unlocks, new prices and achievement cards remain consistent.
- `QUICK=1 node scripts/text-layout-audit.mjs`: 422 screen states across portrait and landscape; no reported text collisions or runtime errors.
- `npm test`: original five rituals remain playable through real pointer input, with persistence and twelve viewport checks.
- `node scripts/production-puzzles.mjs`: packaged rescue and difference wins, Memo flip/pause, no development hook or external runtime requests.

Screenshots and machine-readable reports are under `test-results/puzzles/`. The visual review includes small portrait differences, landscape rescue, animated Memo hints and the timeout panel.

## Artwork and integration

45 local WebP assets, approximately 3.3 MB, were packed from Nano Banana 2 / Higgsfield artwork. Generation prompts, job IDs and masters remain in `reference/puzzles/`; `scripts/pack-puzzles.py` reproduces the packed artwork. Runtime assets are local; no generation service is called while playing.

Existing reward ads still use the preview provider. Sound was not changed. Hints, skips, level purchases, card celebrations, coin flights and x3 rewards use the existing shared systems. No new real advertising SDK was added.
