// Keep full-surface rituals in the same short-session range as the regular campaign.
// Larger surfaces get a wider working footprint, rather than extra repetitions.
export const CLEANING_PACE={litter:4,crumbs:32,coverage:.94,strokeDistance:18,vacuumRadius:70};
export function cleaningRadius(cellCount,mode){
 if(mode==='vacuum')return Math.max(CLEANING_PACE.vacuumRadius,Math.min(94,Math.sqrt(cellCount*121)/4.4));
 return Math.max(70,Math.min(110,Math.sqrt(cellCount*121)/3.8));
}
