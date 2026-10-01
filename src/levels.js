import { DRESSUP_LEVELS } from './dressup-levels.js';
import { PREMIUM_LEVELS } from './premium-levels.js';
import { WORKSHOP_LEVELS } from './workshop-levels.js';
import { PUZZLE_LEVELS } from './puzzle-levels.js';
import { ROMANCE_LEVELS } from './romance-levels.js';
export const TOOLS = [
  ['cleanser','Cleanser'], ['cotton','Cotton pad'], ['mask-brush','Mask brush'], ['roller','Jade roller'],
  ['dropper','Serum'], ['patches','Eye patches'], ['towel','Soft towel'], ['spray','Fresh mist'],
  ['makeup-brush','Fluffy brush'], ['lipstick','Lip tint'], ['compact','Eyeshadow'], ['sponge','Soft sponge'],
];

// Treatment workload is three times faster; gesture distances and transitions
// are tuned separately so short rituals still feel responsive and deliberate.
export const PACE={speed:3,brushScale:1.2,transitionMs:420,rollerPasses:1,rollerSpeed:1.7,maskPull:155,patchPull:68};

export const LEVELS = [
  {id:'clean',name:'Fresh Start',subtitle:'A cloud-soft cleanse',character:'cat',color:'#c0dfd2',steps:[
    {name:'Melt the day away',hint:'Sweep the cotton pad over every little mark.',tool:'cotton',mode:'wipe',layer:'dirt',seconds:13,brush:43,sound:'wipe'},
    {name:'Make a little foam',hint:'Rub gentle circles to lather up the cleanser.',tool:'cleanser',mode:'paint',layer:'foam',seconds:13,brush:38,sound:'foam'},
    {name:'A refreshing rinse',hint:'Move the mist across the bubbles to rinse.',tool:'spray',mode:'wipe',layer:'foam',seconds:12,brush:42,sound:'spray'},
    {name:'Soft & squeaky clean',hint:'Pat each glowing spot dry with your towel.',tool:'towel',mode:'dab',layer:'water',seconds:12,count:8,sound:'dab'},
  ]},
  {id:'mask',name:'Berry Happy',subtitle:'A sweet little skin treat',character:'frog',color:'#ecc1d6',steps:[
    {name:'A berry lovely mask',hint:'Brush the pink mask onto all the bare skin.',tool:'mask-brush',mode:'paint',layer:'berry',seconds:15,brush:35,sound:'cream'},
    {name:'Let the goodness sink in',hint:'Hold on each little flower to massage.',tool:'sponge',mode:'hold',layer:'flowers',seconds:12,count:6,sound:'massage'},
    {name:'The satisfying part',hint:'Pull each mask tab down to peel it away.',tool:'cotton',mode:'peel',layer:'berry',seconds:12,count:5,sound:'peel'},
    {name:'Seal in the glow',hint:'Add a little serum to each sparkling spot.',tool:'dropper',mode:'dab',layer:'serum',seconds:10,count:6,sound:'drop'},
  ]},
  {id:'eyes',name:'Bright Eyes',subtitle:'A tiny reset for tired eyes',character:'bunny',color:'#cfc2e7',steps:[
    {name:'A fresh little start',hint:'Gently wipe away the sleepy smudges.',tool:'cotton',mode:'wipe',layer:'eye-dirt',seconds:12,brush:32,sound:'wipe'},
    {name:'A drop of kindness',hint:'Press each glowing spot to add eye serum.',tool:'dropper',mode:'dab',layer:'serum',seconds:10,count:6,sound:'drop'},
    {name:'Patch perfect',hint:'Drag each eye patch onto its dotted outline.',tool:'patches',mode:'place',layer:'patches',seconds:8,count:2,sound:'cream'},
    {name:'Cool, calm & collected',hint:'Hold on each patch. Breathe in, breathe out.',tool:'roller',mode:'hold',layer:'patches',seconds:10,count:2,sound:'massage'},
    {name:'Hello, bright eyes',hint:'Pull both patches outward to lift them off.',tool:'cotton',mode:'peel',layer:'patches',seconds:8,count:2,sound:'peel'},
  ]},
  {id:'massage',name:'Jade & Joy',subtitle:'Roll your worries away',character:'frog',color:'#b7dac9',steps:[
    {name:'A dewy beginning',hint:'Hold the dropper over each glowing spot.',tool:'dropper',mode:'dab',layer:'serum',seconds:11,count:7,sound:'drop'},
    {name:'A gentle lift',hint:'Follow each arrow from the dot to the tip.',tool:'roller',mode:'trace',layer:'roll',seconds:16,count:6,sound:'massage'},
    {name:'Smooth little circles',hint:'Massage each flower with a slow, steady hold.',tool:'roller',mode:'hold',layer:'flowers',seconds:12,count:6,sound:'massage'},
    {name:'One last fresh breath',hint:'Sweep the cooling mist across your skin.',tool:'spray',mode:'paint',layer:'glow',seconds:11,brush:40,sound:'spray'},
  ]},
  {id:'glam',name:'Soft Glow',subtitle:'Your feel-good finishing touch',character:'cat',color:'#efc4cf',steps:[
    {name:'Your perfect canvas',hint:'Blend the skin tint with soft sweeping strokes.',tool:'sponge',mode:'paint',layer:'foundation',seconds:10,brush:38,sound:'cream'},
    {name:'A little rosy glow',hint:'Brush softly across both dotted cheek areas.',tool:'makeup-brush',mode:'paint',layer:'blush',seconds:9,brush:26,sound:'brush'},
    {name:'A touch of shimmer',hint:'Sweep the brush over both eyelids.',tool:'compact',mode:'paint',layer:'eyeshadow',seconds:9,brush:20,sound:'brush'},
    {name:'The sweetest finishing touch',hint:'Glide the lip tint over the dotted lip shape.',tool:'lipstick',mode:'paint',layer:'lips',seconds:8,brush:16,sound:'cream'},
  ]},
];

export const PRAISE = ['Lovely touch!', 'So satisfying…', 'Looking fresh!', 'A little more glow', 'Beautifully done!'];

LEVELS.push(...WORKSHOP_LEVELS);
LEVELS.push(...PUZZLE_LEVELS);
LEVELS.push(...ROMANCE_LEVELS);
LEVELS.push(...PREMIUM_LEVELS);
LEVELS.push(...DRESSUP_LEVELS);

// Keep storage indices stable; only the album and campaign route are curated.
// Each row is a five-level album page, with varied gestures and subjects.
export const LEGACY_LEVEL_ORDER = [
  0,20,32,10,9, // facial spa, rescue, makeover story, sorting, kitten spa
  5,28,8,15,11, // hair, memory, makeup, macarons, nail art
  33,7,24,25,34,
  12,21,1,29,35,
  13,6,26,36,16,
  2,22,30,37,14,
  17,3,27,38,18,
  23,31,39,19,40,
  4,41,
];
export const V4_LEVEL_ORDER = LEGACY_LEVEL_ORDER.flatMap((index,i)=>i<36&&(i+1)%3===0?[index,42+Math.floor(i/3)]:[index]);
// Swap displayed slots 4 and 29 without changing saved level identities.
export const V5_LEVEL_ORDER = [...V4_LEVEL_ORDER];
[V5_LEVEL_ORDER[3],V5_LEVEL_ORDER[28]]=[V5_LEVEL_ORDER[28],V5_LEVEL_ORDER[3]];
V5_LEVEL_ORDER.push(...DRESSUP_LEVELS.map((_,i)=>54+i));
export const LEVEL_ORDER = [...V5_LEVEL_ORDER];
[LEVEL_ORDER[3],LEVEL_ORDER[57]]=[LEVEL_ORDER[57],LEVEL_ORDER[3]];
export const levelNumber = index => LEVEL_ORDER.indexOf(index) + 1;
export const nextLevelIndex = index => LEVEL_ORDER[levelNumber(index)];
