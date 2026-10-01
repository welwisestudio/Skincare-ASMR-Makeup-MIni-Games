# Premium gameplay replacement

This replaces the original twelve trinket rituals. Storage indices 42–53 and the existing `vip-*` IDs are retained, including earned stars, rewarded unlocks, explicit permanent skips and collected cards. Normal levels, prices and campaign ordering remain unchanged.

## Activities

| Scene | Stages | Interaction |
| --- | --- | --- |
| Private Jet Reset | 7 | Remove litter, vacuum crumbs, foam upholstery, scrub stains, extract foam, clean windows, arrange amenities |
| Persian Rug Revival | 5 | Vacuum, foam, scrub, extract, brush the pile downward |
| The Boutique Haul | 3 | Shop from a list within a budget, scan purchases, pack the matching compartments |
| Couture Appointment | 7 | Wash, brush hair, fit and zip the gown, press folds, finish seams, place jewellery, reveal and save the look |
| Designer Sofa Rescue | 6 | Remove litter, vacuum, foam, scrub, extract, arrange cushions and blanket |
| Red Carpet Makeup | 10 | Cleanse, foam, rinse, apply and peel a mask, serum, foundation, blush, eyes, lips |
| Penthouse Spa Reset | 6 | Clear litter, foam, scrub, extract, clean the mirror, arrange toiletries |
| Beauty Shopping Spree | 3 | Choose cosmetics within a budget, scan them, pack the haul |
| Convertible Detail | 7 | Litter, vacuum, foam, scrub, extract, windshield, amenities |
| Evening Atelier | 7 | Seven-stage fitting and finishing appointment |
| Runway Skin & Glam | 10 | Ten-stage skincare and makeup appointment |
| Yacht Lounge Refresh | 7 | Litter, vacuum, foam, scrub, extract, windows, cushions and blanket |

Cleaning uses local surface masks authored against each scene. Movement paints or erases actual foam, dirt and glass layers. Holding still does not fill the progress meter; vacuuming removes individual crumbs. Shopping enforces one item per requested category and a fixed budget, supports returns, requires scanning, and accepts packing in any order. Makeup uses the original face masks and treatment engine at its full duration, without the regular campaign's 3× speed multiplier.

## Art and access

Ten masters were generated through Higgsfield (`gpt_image_2_5`): eight scene backgrounds, four cleaning tools and four props across two sheets. Originals are `scene-0.png` through `scene-9.png`; generation records are in `generation.json`. `python scripts/pack-premium-redesign.py` creates sixteen local WebP assets. Existing character and clothing assets are reused for the longer appointments. The menu's VIP frame remains distinct from regular cards.

Rewarded access retains the existing receipt, cancellation and permanent-skip behavior. Advertising still uses the repository's `PreviewRewardedProvider`; this change does not connect a production advertising SDK.

## Checks

- `premium-redesign-test.mjs`: all cleaning/shopping stages through mechanic inputs, duplicate/over-budget rejection, returning items, scan-before-bag, wrong-slot rejection, any-order packing, tailoring paths, both ten-stage facial treatments.
- `premium-input-test.mjs`: actual mouse pickup/vacuum, touch foam trail and untouched pixels, complete shopping through normal transitions, earned reward, small/desktop layouts.
- `premium-test.mjs`: rewarded cancel/complete, legacy bypass rejection, Next offer, explicit permanent decline, persistence.
- `campaign-order-test.mjs`: 54 unique campaign entries, original prices and old-save migration.
- `production-premium.mjs`: opens all twelve replacements in the production build, pause/return, missing assets, external requests and debug-global absence.
- `engagement-test.mjs`: existing settings, gifts, chests, pearl placement and comparison behavior.

Direct mechanic tests accelerate input and separately inspect progress; they do not establish a human completion-time claim. Real browser input and production checks supplement them.
