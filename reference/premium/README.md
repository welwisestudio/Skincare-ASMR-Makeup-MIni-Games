> Superseded by [the gameplay redesign](../premium-redesign/README.md). This directory retains the original trinket-art provenance only.

# Premium expansion

12 chapters (storage indices 42?53) with 36 stages. Campaign order inserts a VIP chapter after every third original chapter through original chapter 36. Existing indices, prices and progress are preserved; levelOrderVersion 4 migrates unlocked regular chapters.

Mechanics: polishing, engraving, gem placement, rotational alignment, recipe mixing and replayable light sequences. Recipe overfill resets that ingredient; sequence mistakes replay without consuming resources. Gems can be placed in any order.

Art: generated with Higgsfield gpt_image_2_5. Original sheets, prompts, project and job IDs are in this directory. `scripts/pack-premium.py` crops authored cells, removes cyan and stray fragments and writes 13 WebP assets. No generated text is used for UI labels.

Access: `premiumUnlocked` is permanent only after a completed rewarded receipt. `premiumSkipped` records the explicit SKIP FOREVER choice. Closing the offer or cancelling/unavailable advertising preserves the offer. Campaign Next skips permanently declined chapters; menu Play also excludes them. Legacy purchases or normal predecessor completion cannot unlock VIP chapters.

Ads use the existing PreviewRewardedProvider in src/ads.js. A production platform SDK is not connected in this repository.

Checks: campaign-order-test.mjs, premium-test.mjs (all 36 stages and access persistence), premium-input-test.mjs (mouse/touch, completion, mobile/desktop layouts), engagement-test.mjs.
