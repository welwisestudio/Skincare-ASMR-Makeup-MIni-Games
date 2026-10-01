# Sofa mask and cleaning transitions

The room illustration was replaced by a separately generated, isolated sofa. `sofa-isolated.json` records its Higgsfield provenance. The transparent sprite and upholstery alpha mask share source coordinates. Dirty layers and foam are intersected with that mask; wooden feet and transparent background are excluded. Crumbs, litter, cleaning coverage cells and placement positions use the revised scene coordinates.

Cleaning no longer fills the entire foam canvas on normal completion or switches foam opacity between scrubbing and extraction. Unfinished residue fades over 650 ms; newly introduced surface details fade over 700 ms. Tools and captions fade between steps. Animation uses the scene update clock and respects pause, restart, cancellation and reduced motion. Rewarded skips still establish the correct surface state for the next stage.

Validated with `cleaning-fix-test.mjs`: zero dirty or foamy pixels outside the upholstery mask, transparent sprite corners, full sofa coverage, pixel-identical frames at all rug stage boundaries, gradual intermediate frames, and paused/resumed live transitions. `premium-redesign-test.mjs` and `premium-input-test.mjs` also pass with the shared renderer changes.
