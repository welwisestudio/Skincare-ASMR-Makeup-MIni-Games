# Short-session balance

The twelve premium slots keep their stages and mechanics. Regular campaign settings and save IDs are unchanged.

- Facial treatment uses the regular 3x progress rate. Its ten stages have shorter workloads (4?6 nominal seconds divided by the shared speed), broader application footprints, and six serum points.
- Premium outfit washing uses the same 1.15-per-second rate as ordinary makeover stories, replacing its 0.42 rate.
- Cleaning footprints scale with surface area (70?110 local units; vacuum 70), and need 18 units of local stroke travel instead of 38. Finishing coverage is 94%, matching ordinary face painting. A footprint overlapping the surface can clean its edge even when the cursor center is just outside; far-away strokes still do nothing. Litter is reduced from seven pieces to four, crumbs from 85 to 32.
- Surface masks, any-order placement, shopping rules and the recently smoothed transition durations remain intact.

## Comparable workload check

These are modeled input times, not human completion promises: the same driver moves at 600 scene units per second, explicitly accounts for targeting and transition time, and completes work through engine interactions without assigning progress. Face targeting uses the same coverage strategy before and after. The two regular reference levels produce identical results. New cleanup/facial levels must stay within the driver's 15?36 second regression budget.

| Level | Before, seconds | After, seconds |
| --- | ---: | ---: |
| Fresh Start | 25.8 | 25.8 |
| Soft Glow | 19.4 | 19.4 |
| Private Jet Reset | 91.6 | 34.9 |
| Persian Rug Revival | 114.6 | 33 |
| Designer Sofa Rescue | 60.8 | 29.1 |
| Red Carpet Makeup | 214.5 | 34 |
| Penthouse Spa Reset | 58.1 | 23.9 |
| Convertible Detail | 76.5 | 31.3 |
| Runway Skin & Glam | 219.5 | 33.2 |
| Yacht Lounge Refresh | 42.7 | 30.4 |

Commands: `premium-balance-benchmark.mjs`, `premium-outfit-pace-test.mjs`, `premium-redesign-test.mjs`, `premium-input-test.mjs`, `cleaning-fix-test.mjs`. The latter image test allows a zero intermediate difference only when the entire final change is at most one 8-bit value per channel; larger changes must have a genuinely intermediate frame. This avoids treating unavoidable subpixel quantization as a visual snap.

Reports: `test-results/balance/before.json` and `after.json`.
