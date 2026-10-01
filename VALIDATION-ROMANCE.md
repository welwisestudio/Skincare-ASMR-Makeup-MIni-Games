# Ten makeover stories: levels 33-42

42 campaign levels, 148 playable chapters, 126 stars, 45 achievement cards and nine album/shop pages. Ten distinct adult heroines each have six character states, their own proposal illustration and a wedding illustration with their groom on a white horse. Existing audio and advertising integration are unchanged.

## Checked behavior

- `node scripts/romance-play-test.mjs`: all ten stories completed with real browser pointer input, covering all 70 chapters. Incorrect dress drops return to the tray; gown placement enables the zipper; comparison requires both ends of the slider; ring placement triggers the proposal response; the wedding has an explicit finish action. Every story awards three stars and its collectible card.
- `node scripts/romance-regression.mjs`: 350 chapter layouts at five viewport sizes, all seven animated hints and skips, pause/resize, touch cancellation, touch dress placement, ad cancellation, restart, old scene routers and the last partial album page.
- `QUICK=1 node scripts/text-layout-audit.mjs`: 594 UI states across portrait and landscape, including every narrative chapter, with zero text-collision reports and zero runtime errors.
- `node scripts/economy-test.mjs`: saves from the 32-level campaign extend to 42 without losing progress; completing level 32 unlocks 33; the final level stays locked until earned or purchased; new achievement IDs survive normalization.
- `node scripts/production-romance.mjs`: completes all seven chapters of level 33 in the built game using only public UI and pointer coordinates, then reloads to verify progress and rewards. Development hooks must be absent; runtime requests must remain local.

Screenshots, including every heroine's before, clean, dressed, comparison, proposal, wedding and result screens, are in `test-results/romance/`. Small portrait and landscape screens were also visually reviewed. Source originals and a contact sheet for all ten story endings are under `reference/romance/`.

## Art provenance

21 images generated through Nano Banana 2 on Higgsfield; 96 packed WebP assets in `public/assets/ui/romance-*.webp`. Exact prompts, references, job IDs and result URLs: `reference/romance/manifest.json`. Repack with `python scripts/pack-romance.py` (Pillow and NumPy). Character state selection is explicit because some generated sheets include additional variants. Cyan matte removal preserves white bridal lace and removes edge contamination.

The 20 final story illustrations are animated with camera movement and interactive particles; they are not video clips or skeletal character animations.
