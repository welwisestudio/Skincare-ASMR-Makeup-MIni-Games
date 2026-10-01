# Animated gesture hints

Implemented in `src/hints.js`, installed after the workshop scene router. Hint plans read current unfinished targets, path positions, item orientations and zipper progress. All demonstration objects are non-interactive and belong to a separate display tree. The hand is generated with Nano Banana 2 through Higgsfield; provenance and source master are in `reference/hints/`.

Validation:

- `node scripts/hint-test.mjs`: all 66 stages produce finite, action-specific demonstrations without mutating progress, targets or items. Real touch dismisses the overlay and continues gameplay. Inventory use, partial progress, zipper continuation, pause, resize, restart and skip passed. Thirty screenshots cover gesture families in portrait and landscape.
- `node scripts/hint-gestures.mjs`: 18 demonstrated gestures replayed using real mouse input and advanced gameplay, including timed release, rotation, outward peel, tracing and circular mixing.
- `node scripts/meta-test.mjs`: all 12 existing reward systems passed, including rewarded/inventory hints and cancelled ad behavior.
- `node scripts/text-layout-interactions.mjs`: instruction text, temporary messages, restoration, landscape and pause/resume passed.
- Production build: `npm run build`.
- `QUICK=1 node scripts/text-layout-audit.mjs`: 352 layouts checked, zero text issues.

Results and screenshots: `test-results/hints/`. Audio, level rewards and the existing TEST AD provider are unchanged.
