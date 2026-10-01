// Explicit level-to-file mapping; only these assets are included in the build.
import sound0 from '../Sounds/Cotton.ogg?url';
import sound1 from '../Sounds/ShampooWash.ogg?url';
import sound2 from '../Sounds/spray.ogg?url';
import sound3 from '../Sounds/Towel.ogg?url';
import sound4 from '../Sounds/MakeupBrush.ogg?url';
import sound5 from '../Sounds/FaceMassage.ogg?url';
import sound6 from '../Sounds/peeling.ogg?url';
import sound7 from '../Sounds/Bubble.ogg?url';
import sound8 from '../Sounds/BrushingHair.ogg?url';
import sound9 from '../Sounds/cut.ogg?url';
import sound10 from '../Sounds/put.ogg?url';
import sound11 from '../Sounds/wipescrub.ogg?url';
import sound12 from '../Sounds/MakeupTap.ogg?url';
import sound13 from '../Sounds/Nail-File.ogg?url';
import sound14 from '../Sounds/WaterPoor.ogg?url';
import sound15 from '../Sounds/FireCrack.ogg?url';
import sound16 from '../Sounds/GlassWipe.ogg?url';
import sound17 from '../Sounds/card-friction.ogg?url';
import sound18 from '../Sounds/lipstick.ogg?url';
import sound19 from '../Sounds/Right.ogg?url';
import sound20 from '../Sounds/pencil.ogg?url';
import sound21 from '../Sounds/xitkem.ogg?url';
export const LEVEL_SOUNDS={
  "wipe":sound0,
  "pearl-polish":sound0,
  "foam":sound1,
  "kitten-wash":sound1,
  "wash":sound1,
  "spray":sound2,
  "iron":sound2,
  "press":sound2,
  "dab":sound3,
  "cream":sound4,
  "brush":sound4,
  "makeup":sound4,
  "polish":sound4,
  "liner":sound4,
  "massage":sound5,
  "peel":sound6,
  "drop":sound7,
  "bath-pop":sound7,
  "comb":sound8,
  "braid":sound8,
  "hair":sound8,
  "groom":sound8,
  "trim":sound9,
  "stems":sound9,
  "wick":sound9,
  "dress":sound10,
  "layers":sound10,
  "accessorize":sound10,
  "sort-tall":sound10,
  "sort-flat":sound10,
  "sort-last":sound10,
  "nail-gems":sound10,
  "beads":sound10,
  "clasp":sound10,
  "sandwich":sound10,
  "stack":sound10,
  "pack-tall":sound10,
  "pack-flat":sound10,
  "pack-close":sound10,
  "jewels":sound10,
  "proposal":sound10,
  "wedding":sound10,
  "arrange":sound10,
  "shop":sound10,
  "checkout":sound10,
  "pack":sound10,
  "laundry-wash":sound11,
  "shoe-wash":sound11,
  "scrub":sound11,
  "vacuum":sound11,
  "mix":sound12,
  "crush":sound12,
  "file":sound13,
  "fragrance":sound14,
  "wax":sound14,
  "swirl":sound14,
  "rinse":sound14,
  "ignite":sound15,
  "glass":sound16,
  "fold":sound17,
  "leaves":sound17,
  "lace":sound17,
  "tie":sound17,
  "petals":sound17,
  "wrap":sound17,
  "outline":sound17,
  "cross-stitch":sound17,
  "embellish":sound17,
  "pickup":sound17,
  "stitch":sound17,
  "lipstick":sound18,
  "compare":sound19,
  "pencil":sound20,
  "filling":sound21,
};
export function soundForStep(step){return LEVEL_SOUNDS[step?.tool==='lipstick'?'lipstick':step?.mechanic||step?.sound];}
