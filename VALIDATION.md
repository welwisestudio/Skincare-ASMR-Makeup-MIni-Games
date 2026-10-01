# Previous validation: responsive UI and tactile feedback revision

The latest monetization revision is documented in [VALIDATION-MONETIZATION.md](./VALIDATION-MONETIZATION.md). The measurements below describe the earlier tactile-feedback revision.

Validated 2026-09-30 with installed Chromium, Phaser 3.90 and the production Vite build.

## Requested changes

- Face and play area stay horizontally centered in both orientations; instructions remain underneath.
- Canvas resizing runs before rendering. Constant-buffer-size DPR changes refresh pointer transforms too.
- Star count is centered in the painted white well; timer text is underneath the kitten stopwatch.
- Bottom controls and stage stars are larger. Action buttons include generated play/restart/album/next/finish/back symbols.
- The progress fill uses rounded end caps and a stretchable body, inspected at 1%, 10%, 48% and 100%.
- Treatment progress is 3? faster, brush radius is 20% larger, roller paths need one pass, peel distances are shorter, and transitions take 420 ms.
- Generated open eyes animate closed during care and reopen when idle, with occasional blinks. All three characters were inspected. Bunny ears fit within narrow screens.
- Falling serum, splash/spread/absorption, foam, directional mist, towel drying, cream/powder strokes, lip shine, roller ripples and a curling mask provide tool-specific feedback.
- Audio code is unchanged. SHA256 of `src/audio.js`: `E50BD1C32FDA8C6E6D87CD4F213158C60BF8178ED7DABDD84E6C5CB9EA35DC2B`.

## Genuine gameplay run

All 21 stages completed with browser pointer events, without setting progress or bypassing stages. The active clock pauses for alternate-viewport captures. Input automation and stage screenshots add overhead; player times vary.

| Ritual | Previous run | Revised run |
| --- | ---: | ---: |
| Fresh Start | 78.0 s | 31.0 s |
| Berry Happy | 69.5 s | 30.3 s |
| Bright Eyes | 51.0 s | 19.5 s |
| Jade & Joy | 70.9 s | 25.6 s |
| Soft Glow | 62.4 s | 23.9 s |

Pause freezes the clock; input outside the face does not progress. Reload retains 15 stars, 375 coins and all five unlocked levels. No browser exceptions or failed requests occurred.

## Visual and automated checks

- 63 intermediate gameplay captures: all 21 stages at 390?844, 876?876 and 844?390. All stage contact sheets visually inspected.
- 90 combinations of five UI modes, nine viewports and DPR 1/2 passed control bounds, physical canvas resolution, text texture resolution and pause/result block separation checks.
- Album, pause/settings, results, star collection, unlocked album and successive victory frames inspected. Result fixtures test layout separately from earned progression.
- Dedicated final-material fixtures verify eyes open ? closed ? open, serum landing, each new material response, centered landscape layout and HUD details.
- Resize stress: 18 viewport/DPR changes; 191 post-render probes and 160 captured browser compositor frames. Zero black frames; lowest compositor-frame mean brightness was 199.6/255. This is Chromium evidence, not an assertion about every browser/GPU.
- Touch input at DPR 2, rotation preservation, no page scrolling, pause and saved sound preference passed.
- Control bounds passed at 12 sizes from 320?240 through 2560?1440.
- FINISH ? collection ? unlocked album passed; victory animation video captured.
- Production build and browser interaction tests passed; no external requests and no development inspection hook.
- Static production ZIP integrity checked.

## Evidence and commands

- `npm test`: full genuine pointer run, persistence and layout checks; `test-results/report.json`.
- `VISUAL_AUDIT=1` with `scripts/smoke-test.mjs`: `test-results/visual-stages/` and `review-L*-*.jpg`.
- `node scripts/visual-audit.mjs`: `test-results/visual-ui-report.json` and `visual-ui/`.
- `node scripts/feel-review.mjs`: final effect/HUD fixtures and assertions in `test-results/feel/`.
- `node scripts/resize-stress.mjs`: `test-results/resize-report.json` and browser compositor frames in `resize/`.
- `node scripts/touch-test.mjs`: `test-results/touch-report.json` and touch/retina screenshots.
- `node scripts/motion-review.mjs`: `test-results/motion/`, including victory video.
- `npm run build`, then `node scripts/production-test.mjs` against preview port 4173: `test-results/production-report.json`.

Six new masters were generated with Nano Banana 2 through Higgsfield. Exact prompts, job IDs and URLs: `reference/feel-generation.json`; originals: `reference/feel/`. They produce 13 UI/material sprites and six feathered eye patches. Transparent material edges receive cyan-spill removal during packing.

Ready-to-host files: `dist/`. Archive: `Skincare-ASMR-web.zip`. No SDK was added.
