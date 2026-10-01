# First playable design

## Source brief

The relevant PDF entry describes short skincare and makeup actions: apply a mask, remove patches, wipe, and massage with a roller, accompanied by ASMR sounds. The user's requested first release contains five roughly minute-long levels, uses Phaser and omits all SDKs. The PDF's advertising, platform ports and 100-level roadmap are future context rather than requirements for this release.

The 16-minute portrait gameplay reference was sampled at 18 points (`contact-sheet.jpg`). The first skincare sequence establishes the key visual grammar: centered closed-eye doll face, zebra cat-ear towel wrap, shaded cosmetic tools, a muted stage, purple outlined pill counters and buttons, a bright green progress meter, and small celebratory stars. Later footage includes a frog face wrap and makeup brushes. Those elements are reflected here with new Nano Banana 2 artwork.

## Interaction rules

- The cursor or finger must be within the active treatment area. Out-of-bounds input cannot progress the level.
- Face treatments use a shared geometric mask for visible treatment layers and completion samples. Eyes and lips stay clear of cleanser and facial masks.
- Painting and wiping require spatial coverage and repeated soft strokes, with no instant full-area completion.
- Ring targets fill only while pressed. Placement and peel steps require dragging in the demonstrated direction.
- Roller strokes start at the mint dot, progress outward, and repeat twice before moving to the next area.
- Each step has its own instruction, selected tool and visible feedback. A free hint highlights unfinished areas.
- A level cannot finish by waiting. There is no loss state or time penalty; stars reward completing the ritual.
- Progress saves between levels. Pause freezes both the treatment and active-play timer.

## Release boundaries

This is a local standalone web game, not a deployed platform integration. No SDK, ads, external telemetry, login, network persistence, store economy, or additional 95 levels are included. The coin counter is a local completion reward. The first version is intentionally focused on the complete core loop and the five care procedures.
