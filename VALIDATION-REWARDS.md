# Reward UI and feedback revision

- Pink background on Lucky Spin, Daily Rewards and Spa Pass.
- Portrait achievement cards, clipped native scrolling, up/down buttons, touch/trackpad/mouse-wheel and keyboard navigation. Scroll position survives opening a card detail and returning.
- Card reveal with generated golden rays, particles, congratulations and a keep button. Campaign cards celebrate once; a Spa Pass card earned by an in-level rewarded action pauses and resumes the same stage.
- Rebuilt Spa Pass grand prize area and wardrobe text/button spacing. Wardrobe descriptions explain what changes and that cosmetics are permanent.
- Individual generated coin sprites, golden trails and per-arrival displayed balance increments. Saved economy remains immediate and independent of animation. Spending clears pending presentation safely.
- Main-menu labels for Daily Gifts and Lucky Spin.

Checks:

- `node scripts/reward-ui-test.mjs`: four viewport sizes; pink backdrops; scroll buttons, wheel, touch and keyboard; card-detail return position; daily coin flow; resize/navigation during flight; spending while coins fly; new campaign card once; Spa Pass card reveal during a hint and resuming the same stage.
- `node scripts/meta-test.mjs`: existing twelve reward systems, seven pass steps, reward cancellation, purchase persistence and real bonus-game interactions.
- `node scripts/economy-test.mjs`: save migration, bounded grants, daily rollover, duplicate conversion and exactly-once ad completion.
- `QUICK=1 node scripts/text-layout-audit.mjs`: 356 screen fixtures in portrait and landscape, zero text overlaps or runtime errors. Scroll hit regions are measured after clipping to their viewport; decorative light effects are excluded from text/icon collision checks.
- `node scripts/production-test.mjs`: static build, actual pointer input, rewards and preview ad, no debug API or external runtime requests.

Screenshots and interaction report: `test-results/reward-polish/`. Generated masters, exact prompts and Higgsfield job IDs: `reference/reward-fx/`. Audio is unchanged.
