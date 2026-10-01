# Four free outfit levels — 2026-09-30

The requested reference is the dress-up screenshot (Outfit Atelier, storage index 6), now shown as level 4 after the earlier menu swap. The new levels reuse its three drag-and-drop stages, not the private jet now numbered 29.

Appended at positions 55–58, storage indices 54–57:
- Garden Brunch: peach floral dress, ivory cardigan, ballet flats, straw bag and flower clip.
- City Chic: lilac pleated dress, beige blazer, ankle boots, mauve bag and star clip.
- Seaside Afternoon: yellow sundress, lavender linen jacket, sandals, canvas bag and shell clip.
- Evening in Velvet: plum cocktail dress, rose bolero, gray pumps, evening bag and pearl clip.

All four are immediately accessible without coins or rewarded ads. Existing level order, stable IDs, premium states and progress remain intact. The campaign now has 58 levels / 174 stars and 61 collection cards.

Art: four original Higgsfield GPT Image 2.5 2K sheets. Exact prompts, job IDs and source URLs are in generation.json. pack-dressup-expansion.py extracts 36 local WebP assets, keys the cyan background and registers character states by head center and feet. Full dressed portraits are also used for menu and achievement cards.

Runtime: per-level outfit configuration reuses Workshop drag/drop and stage transitions. Regional reveals keep the first placed jacket, shoes, bag or clip visible while its partner is still on the tray. Either item order is accepted. Incorrect drops return to their source. Global cosmetic charms are anchored to the new portraits.

Validation: campaign ordering/migration checks; all 20 real mouse/touch placements, wrong drops, both item orders, visible partial outfit states, completion rewards/cards, save/reload; phone and desktop layouts. Production check covers fresh-save access to all four levels, no payment/paywall, local assets, pause/resume and exit. Screenshots: test-results/dressup-expansion.
