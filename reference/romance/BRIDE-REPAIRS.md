# Full-silhouette bride sprites

Four bride exports had skirt edges cut by their original atlas cells: Rose,
Violet, Moon and Emerald. The other six bride silhouettes were checked and
retained. The fixes use the built-in `image_gen` editing tool with each existing
transparent WebP as the edit target. Original atlases remain available.

## Saved masters and runtime assets

| Character | Transparent master | Packed game asset |
| --- | --- | --- |
| Rose | [bride-rose-repaired.png](bride-rose-repaired.png) | [romance-rose-bride.webp](../../public/assets/ui/romance-rose-bride.webp) |
| Violet | [bride-violet-repaired.png](bride-violet-repaired.png) | [romance-violet-bride.webp](../../public/assets/ui/romance-violet-bride.webp) |
| Moon | [bride-moon-repaired.png](bride-moon-repaired.png) | [romance-moon-bride.webp](../../public/assets/ui/romance-moon-bride.webp) |
| Emerald | [bride-emerald-repaired.png](bride-emerald-repaired.png) | [romance-emerald-bride.webp](../../public/assets/ui/romance-emerald-bride.webp) |

`python scripts/pack-romance.py` prioritizes these masters, preserves native
alpha, fits the complete silhouette within 510 × 566 pixels and places it on
the existing 600 × 640 sprite canvas. Subsequent exports therefore do not
reintroduce the clipped atlas versions. Only these four runtime assets changed.

Review: [all ten brides after repair](bride-audit-repaired.jpg).

## Exact edit prompts

### Rose

Edit the attached game sprite to repair the cropped silhouette. This is an adult copper-red-haired bride for an existing hand-painted pastel mobile game. Keep her exact face, hair, pose, rose bouquet, lace wedding dress, veil, colors and illustration style. The left edge of the skirt and veil was cut off in an atlas export: reconstruct the missing outer skirt and veil naturally, with complete flowing skirt sides and a complete curved bottom hem, continuous fine plum outline. Do NOT leave a vertical sliced edge. Preserve the original character rather than redesigning her. Entire head, veil, both arms and full dress must fit within image with at least 8% empty padding on ALL sides. One centered full-body sprite only. Genuinely transparent background with alpha; no floor, shadow, text, frame, checkerboard or extra objects. This will replace the existing transparent sprite in the game.

### Violet

Edit the attached game sprite to repair its cropped silhouette. Keep the same beautiful adult dark-skinned bride: exact facial features, dark hair updo with pearl jewelry, pose, purple and ivory rose bouquet, ivory wedding dress with gold embroidery and lace sleeves, hand-painted pastel mobile game style with delicate plum outlines. Both lower sides of her wide bridal skirt were sliced off vertically in an atlas export. Reconstruct only the missing outer skirt so the entire flowing gown is visible with naturally curved sides, complete gold motifs and a smooth full scalloped bottom hem. No vertical cutoff edges anywhere. Preserve identity, outfit, colors and pose; do not redesign. One centered full-body sprite, entire head to skirt hem, at least 8% empty padding on ALL sides. Genuinely transparent background with alpha. No floor, shadows, text, frame, checkerboard, extra people or objects. Production replacement sprite for the same game.

### Emerald

Repair the cropped silhouette of this existing adult bridal princess game sprite. Keep the SAME medium-dark-skinned woman, exact face, warm brown eyes, brown hair in low updo, gold earrings, smiling expression, full frontal standing pose, white rose bouquet, pale veil, ivory long sleeve gown with emerald-green and gold embroidered trim. Keep hand-painted pastel game style and delicate plum outlines. Both lower outer sides of the wide ivory skirt have been sliced off by a rectangular crop. Reconstruct the missing outer skirt naturally with complete curved skirt edges and full flowing hem, no vertical sliced edges. Do not change identity, outfit design, hairstyle, pose or colors. Entire body, veil and full gown visible, centered with at least 8% clear margin on every side. One sprite only on a genuinely transparent alpha background. No floor, shadow, frame, checkerboard, text or extra objects.

### Moon

Precisely repair this existing adult bridal princess sprite. Preserve this exact pale-skinned woman, friendly smiling face, blue-gray eyes, black hair bun with silver headband, front-facing pose with both arms slightly out, pale lilac wedding gown with silver-purple ornamental embroidery, star-sparkled pale blue sheer veil and delicate dark plum game-art outlines. The extreme right edge of the lower skirt and veil was clipped by an atlas export. Restore the full natural skirt outline and complete curved hem, full veil edges, with no cropped or straight vertical sliced edge. Do not redesign the character, dress, hairstyle, colors or pose; only repair incomplete silhouette and clean transparency edges. One full-body sprite centered with the entire head and dress visible, at least 8% empty padding on all sides. Truly transparent alpha background; no ground, shadow, text, checkerboard, frame or extra objects.
