# UI text and spacing audit

Validated 2026-09-30 in Chrome after the monetization revision.

## Fixes

- Daily Rewards and Spa Pass completion checks have reserved space beside their labels. Gift illustrations no longer touch the title strip.
- Buttons, ribbons, reward tiles and achievement names fit their own text areas in both width and height.
- Album prices, lock icons and level numbers scale with the polaroid. This fixes their collisions on short, square and tablet layouts.
- The album logo, wallet, timer caption, STYLE label and level label have explicit separation.
- The Coin Boutique subtitle clears its wallet in landscape.
- Result portraits and level numbers stay inside their intended photo/frame areas.
- The Zen Stones stack and target marker clear the instruction text, including the fourth stone.
- Open-chest artwork keeps the same reserved area as the closed chest during its reveal.
- Temporary gameplay messages use the bottom instruction band. The ordinary hint is hidden for the message, then restored; messages cannot overlay the face, HUD or each other.

## Checks

`node scripts/text-layout-audit.mjs` passed **856 combinations**: 107 states at 320x240, 320x480, 390x844, 844x390, 876x876, 768x1024, 1440x900 and 2560x1080, at DPR 2.

The audit traverses actual Phaser text objects, including the gameplay stage counter. It checks text against other text, foreground icons/illustrations, button edges, the viewport and declared text areas. Rotated wheel labels use oriented rectangle intersection rather than inaccurate axis-aligned overlap. Painted backgrounds, frames and button surfaces intentionally contain their labels and are excluded from foreground-icon collision checks.

States include all 21 campaign stages, ordinary menus, pause/settings, reward windows, all achievement details, collected/uncollected tracks, full inventories, six-digit balances, x3, every wheel prize combined with the last pass reward, unavailable/ready ad previews, opening chests, spinning wheels, bonus completion and transient hints. These are UI fixtures, not a claim of newly replaying all levels.

Final report: `test-results/text-layout/report.json` — no intersections or browser exceptions found. Portrait/landscape captures and review contact sheets are in the same folder. Inspected the main screens, alternate states, campaign instruction layouts and compact/square album layouts visually.

Additional checks passed:

- `node scripts/visual-audit.mjs`: 90 UI/viewport/DPR 1/2 combinations, physical canvas size, text texture resolution and pause/result regions.
- `node scripts/text-layout-interactions.mjs`: temporary hints, timeout restoration, replacing a message, stage changes, landscape and pause/resume.
- `node scripts/meta-test.mjs`: all twelve reward systems through real browser clicks after the initial UI corrections.
- `npm run build` and `node scripts/production-test.mjs`: production input, menus, daily reward and rewarded preview; no external requests or browser exceptions.
- `python scripts/verify-package.py`: archive compared byte-for-byte against `dist/`.

The campaign, economy, generated artwork and audio are otherwise unchanged. These results cover the tested Chromium viewports; other browser engines were not tested in this pass.
