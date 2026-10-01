# Cleaning level art and feedback audit — 2026-09-30

Generated six masters with Higgsfield in the existing project. Full prompts, generation IDs and original URLs are in `generation.json`. `scripts/pack-cleaning-audit.py` removes the cyan key, preserves scene coordinates and exports local WebP assets. The original redesign packer invokes it last, so regeneration preserves these replacements.

Changes:
- Shared open rubbish sack and four distinct litter sprites. Boutique shopping retains its own bag.
- Isolated bathroom vanity, car seats/dashboard, yacht seating/deck and aircraft seats/windows. Existing isolated sofa retained.
- Authored independent upholstery/countertop, floor and glass regions intersected with source alpha. Dirt, foam and window smudges stay on their own surfaces.
- Removed uniform brown wash and window stripe overlay; replaced with soft irregular stains and water spots.
- Separate grainy loose-dust layer erased continuously by vacuum motion. Progress now measures the cleaned area, not only tiny crumbs. Fine particles stream toward the nozzle; scrub/rinse/foam have local particles too. Emission stops after release, is capped and respects reduced motion.
- Preserved continuous stage transitions, four-item litter pacing, save IDs and premium access.

Validation:
- All cleaning/shop mechanics, both fitting mechanics and all 20 makeup stages complete using engine interactions.
- Actual mouse litter/vacuum, touch foam, shopping/scanner/packing, small and desktop layouts pass.
- Pixel tests find zero dirty pixels outside the matching surface masks for all six cleaning scenes.
- Rug local swipe changes dust alpha from 110 to 1 at the touched sample, leaves a distant sample at 114, emits 18 particles and advances 19% of the surface. No idle progress; particles expire.
- Sofa clipping and exact stage-boundary pixel continuity pass, including pause/resume during transition.
- 78 stage screenshots across all 12 premium levels are under `test-results/cleaning-audit`.
- Estimated gesture-model durations (not human playtest telemetry): jet 30.8s, rug 35.2s, sofa 28.8s, bath 17.2s, car 30.9s, yacht 22.5s; makeup 34/33.2s. Ordinary comparison levels 25.8/19.4s. Full data: `test-results/balance/after.json`.

Production build succeeded. All 12 premium levels load their local assets and support pause/resume/return in the compiled build.
