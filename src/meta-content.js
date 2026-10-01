import {ECONOMY} from './economy.js';
import { DRESSUP_LEVELS } from './dressup-levels.js';
import { PREMIUM_LEVELS } from './premium-levels.js';
import { WORKSHOP_LEVELS } from './workshop-levels.js';
import { PUZZLE_LEVELS } from './puzzle-levels.js';
import { ROMANCE_LEVELS } from './romance-levels.js';
import { LEVELS, LEVEL_ORDER, levelNumber } from './levels.js';
// Keep existing ritual prices stable when charging for the four outfit levels.
const regularOrder=LEVEL_ORDER.filter(i=>!LEVELS[i].premium&&!LEVELS[i].free&&!DRESSUP_LEVELS.includes(LEVELS[i]));
export const LEVEL_PRICES=LEVELS.map((l,i)=>{if(l.premium||l.free)return 0;const n=DRESSUP_LEVELS.includes(l)?regularOrder.filter(index=>levelNumber(index)<levelNumber(i)).length:regularOrder.indexOf(i);return n<=0?0:Math.min(ECONOMY.unlock.max,ECONOMY.unlock.base+n*ECONOMY.unlock.step);});
export const ITEMS=[
  {id:'bow',name:'Rose Bow',art:'rose-bow',detail:'Adds a pink bow to your character or creation.'},
  {id:'butterfly',name:'Golden Butterfly',art:'butterfly',detail:'Decorates your finished look with a golden charm.'},
  {id:'serum',name:'Royal Serum',art:'royal-serum',detail:'Turns the skincare dropper and serum drops gold.'},
];
export const CARDS=[
  {id:'fresh',name:'Fresh Start',art:'badge-clean',goal:'Complete Fresh Start'},
  {id:'berry',name:'Berry Lovely',art:'badge-berry',goal:'Complete Berry Happy'},
  {id:'eyes',name:'Bright Eyes',art:'badge-bunny',goal:'Complete Bright Eyes'},
  {id:'jade',name:'Jade Master',art:'badge-jade',goal:'Complete Jade & Joy'},
  {id:'glow',name:'Soft Glow',art:'badge-lipstick',goal:'Complete Soft Glow'},
  {id:'royal',name:'Spa Royalty',art:'badge-crown',goal:'Finish the 7-reward Spa Pass'},
  {id:'lucky',name:'Lucky Charm',art:'butterfly',goal:'Find in a box or on the wheel'},
  {id:'devoted',name:'Seven Sweet Days',art:'calendar',goal:'Claim the seventh daily gift'},
];
CARDS.push(...WORKSHOP_LEVELS.map(l=>({id:l.id,name:l.name,art:l.hero,goal:`Complete ${l.name}`})));
CARDS.push(...PUZZLE_LEVELS.map(l=>({id:l.id,name:l.name,art:l.hero,goal:`Complete ${l.name}`})));
CARDS.push(...ROMANCE_LEVELS.map(l=>({id:l.id,name:l.name,art:l.hero,goal:`Complete ${l.name}`})));
CARDS.push(...PREMIUM_LEVELS.map(l=>({id:l.id,name:l.name,art:l.hero,goal:`Complete ${l.name}`})));
CARDS.push(...DRESSUP_LEVELS.map(l=>({id:l.id,name:l.name,art:l.hero,goal:`Complete ${l.name}`})));
export const DAILY=[
  {label:'50 coins',art:'coin-pile',coins:50},
  {label:'Rose Bow',art:'rose-bow',items:['bow']},
  {label:'75 coins',art:'coin-pile',coins:75},
  {label:'2 hints',art:'hint',hints:2},
  {label:'Gift box',art:'chest-closed',boxes:1},
  {label:'100 coins',art:'coin-pile',coins:100},
  {label:'The self-care collection',art:'grand-bundle',coins:250,boxes:2,items:['butterfly'],cards:['devoted']},
];
export const PASS=[
  {label:'50 coins',art:'coin-pile',coins:50},
  {label:'2 hints',art:'hint',hints:2},
  {label:'Gift box',art:'chest-closed',boxes:1},
  {label:'Rose Bow',art:'rose-bow',items:['bow']},
  {label:'100 coins',art:'coin-pile',coins:100},
  {label:'2 skips',art:'action-next',skips:2},
  {label:'Royal spa bundle',art:'grand-bundle',coins:300,boxes:2,items:['serum','butterfly'],cards:['royal']},
];
export const WHEEL=[
  {label:'200',art:'coin-pile',coins:200},{label:'80',art:'coin-pile',coins:80},
  {label:'1 hint',art:'hint',hints:1},{label:'1 box',art:'chest-closed',boxes:1},
  {label:'120',art:'coin-pile',coins:120},{label:'1 skip',art:'action-next',skips:1},
  {label:'40',art:'coin-pile',coins:40},{label:'Card',art:'card-pack',cards:['lucky']},
  {label:'60',art:'coin-pile',coins:60},{label:'2 hints',art:'hint',hints:2},
  {label:'160',art:'coin-pile',coins:160},{label:'300',art:'coin-pile',coins:300},
];
export const MODES=[
  {id:'bubbles',name:'Bubble Garden',art:'bonus-bubbles',description:'Pop a little garden of pearly bubbles.',instruction:'Tap every bubble. Enjoy each little pop.'},
  {id:'stones',name:'Zen Stones',art:'bonus-stones',description:'Find your balance, one smooth stone at a time.',instruction:'Tap STACK when the stone is over the center.'},
];
export const dayKey=(now=Date.now())=>new Date(now).toISOString().slice(0,10);
export function dailyReady(save,now=Date.now()){return !save.daily.lastDay||dayKey(now)>save.daily.lastDay;}
export function rewardLines(r){return [r.coins?`${r.coins} coins`:null,r.boxes?`${r.boxes} gift box${r.boxes>1?'es':''}`:null,r.hints?`${r.hints} hint${r.hints>1?'s':''}`:null,r.skips?`${r.skips} stage skip${r.skips>1?'s':''}`:null,...(r.items||[]).map(id=>ITEMS.find(i=>i.id===id)?.name),...(r.cards||[]).map(id=>`${CARDS.find(c=>c.id===id)?.name} card`)].filter(Boolean);}
export function grant(save,r){
  const actual={...r,items:[],cards:[]};
  for(const key of ['coins','boxes','hints','skips'])save[key]=Math.min(ECONOMY.coinCap,save[key]+(r[key]||0));
  for(const id of r.items||[])if(!save.items.includes(id)){save.items.push(id);actual.items.push(id);}else{const coins=Math.min(ECONOMY.duplicate,ECONOMY.coinCap-save.coins);save.coins+=coins;actual.coins=(actual.coins||0)+coins;}
  for(const id of r.cards||[])if(!save.cards.includes(id)){save.cards.push(id);actual.cards.push(id);}else{const coins=Math.min(ECONOMY.duplicate,ECONOMY.coinCap-save.coins);save.coins+=coins;actual.coins=(actual.coins||0)+coins;}
  return actual;
}
export function randomIndex(length){const a=new Uint32Array(1);crypto.getRandomValues(a);return Math.floor(a[0]/4294967296*length);}
export function rollBox(){const n=randomIndex(100);return n<60?{coins:ECONOMY.giftBoxCoins,art:'coin-pile'}:n<85?{hints:2,art:'hint'}:{cards:['lucky'],art:'card-pack'};}
