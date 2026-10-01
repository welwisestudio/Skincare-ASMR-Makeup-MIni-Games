import { DRESSUP_ASSETS } from './dressup-levels.js';
import { PREMIUM_ASSETS } from './premium-levels.js';
import { WORLD_ASSETS } from './world-assets.js';
import { PUZZLE_ASSETS } from './puzzle-assets.js';
import { ROMANCE_ASSETS } from './romance-assets.js';
import { META_ASSETS } from './meta-assets.js';
// Every visible interface surface is an illustrated Higgsfield sprite.
export const UI_ASSETS=['pause','back','settings','hint','sound','muted','score','coins','progress-track','progress-fill','timer','star','green-button','purple-button','pink-ribbon','gold-ribbon','polaroid','polaroid-front','panel','trophy','lock','studio-logo','tiles','spa-room','celebration','ribbon-pink','ribbon-gold','bubble','heart','petal','glint','action-play','action-restart','action-levels','action-next','action-finish','action-back','serum-drop','water-puddle','foam-puff','mist-cloud','powder-stroke','mask-curl','progress-green'];
UI_ASSETS.push(...META_ASSETS);

UI_ASSETS.push(...WORLD_ASSETS);
UI_ASSETS.push(...PUZZLE_ASSETS);
UI_ASSETS.push(...ROMANCE_ASSETS);
UI_ASSETS.push('hint-hand');
UI_ASSETS.push('reward-coin','reward-rays');

UI_ASSETS.push(...PREMIUM_ASSETS);

UI_ASSETS.push(...DRESSUP_ASSETS);
