import {platform} from './platform.js';
import {ECONOMY} from './economy.js';
import { LEVELS, LEVEL_ORDER, LEGACY_LEVEL_ORDER, V4_LEVEL_ORDER, V5_LEVEL_ORDER, levelNumber } from './levels.js';
import { CAMPAIGN_CARD_IDS } from './workshop-levels.js';
export const freshSave=()=>({version:3,hasLaunched:false,levelOrderVersion:6,premiumUnlocked:[],premiumSkipped:[],bonusEconomy:{day:'',rounds:0},levelChest:{steps:0,prizes:[]},playGift:{claims:0,seconds:0},stars:Array(LEVELS.length).fill(0),coins:0,sound:true,purchased:[],items:[],equipped:null,cards:[],boxes:1,hints:0,skips:0,bonusUnlocked:[],daily:{claims:0,lastDay:''},passAds:0,adReceipts:[],pendingResult:null});
const integer=(n,max=999999)=>Math.max(0,Math.min(max,Math.floor(Number(n)||0)));
const list=(value,allowed)=>Array.isArray(value)?[...new Set(value.filter(v=>allowed.includes(v)))]:[];
export function normalizeSave(s){
  const f=freshSave();if(!s||![1,2,3].includes(s.version))return f;
  const stars=Array.from({length:LEVELS.length},(_,i)=>integer(s.stars?.[i],3));
  const cards=list(s.cards,[...CAMPAIGN_CARD_IDS,'royal','lucky','devoted']);
  CAMPAIGN_CARD_IDS.forEach((id,i)=>{if(stars[i]&&!cards.includes(id))cards.push(id);});
  const items=list(s.items,['bow','butterfly','serum']);
  const purchased=list(s.purchased,LEVEL_ORDER);
  // Existing players retain every level opened under the original route.
  if(!s.levelOrderVersion)LEVELS.forEach((_,i)=>{if((i===0||stars[i-1]>0)&&!purchased.includes(i))purchased.push(i);});
  // Preserve access after moving the facial ritual onto the first album page.
  if(s.levelOrderVersion===1)for(const [index,previous] of [[24,10],[5,24],[0,7],[25,0]]){if(stars[previous]>0&&!purchased.includes(index))purchased.push(index);}
  // Keep previously open levels accessible when swapping the first and fifth slots.
  if(s.levelOrderVersion===1||s.levelOrderVersion===2)for(const [index,previous] of [[9,null],[20,9],[5,0]]){if((previous===null||stars[previous]>0)&&!purchased.includes(index))purchased.push(index);}
  if((s.levelOrderVersion||0)<4)LEGACY_LEVEL_ORDER.forEach((index,pos)=>{if((pos===0||stars[LEGACY_LEVEL_ORDER[pos-1]]>0)&&!purchased.includes(index))purchased.push(index);});
  // Preserve ordinary levels unlocked by the previous route; VIP access stays ad-gated.
  if(s.levelOrderVersion===4){let previous;for(const index of V4_LEVEL_ORDER){if(LEVELS[index].premium)continue;if((previous===undefined||stars[previous]>0)&&!purchased.includes(index))purchased.push(index);previous=index;}}
  // Retain access granted by the route before swapping displayed slots 4/58.
  if((s.levelOrderVersion||0)<=5)for(const [position,index] of V5_LEVEL_ORDER.entries()){if(LEVELS[index].premium)continue;const earlier=V5_LEVEL_ORDER.slice(0,position).reverse();if((position===0||stars[index]>0||stars[earlier.find(i=>!s.premiumSkipped?.includes(i))]>0||stars[earlier.find(i=>!LEVELS[i].premium)]>0)&&!purchased.includes(index))purchased.push(index);}
  const vip=LEVELS.map((l,i)=>l.premium?i:-1).filter(i=>i>=0),premiumUnlocked=list(s.premiumUnlocked,vip),premiumSkipped=list(s.premiumSkipped,vip).filter(i=>!premiumUnlocked.includes(i));
  const chestPrizes=list(s.levelChest?.prizes,[0,1,2,3,4,5,6]).slice(0,3);
  const levelChest={steps:chestPrizes.length?5:integer(s.levelChest?.steps,4),prizes:chestPrizes};
  const playGift={claims:integer(s.playGift?.claims),seconds:Math.max(0,Math.min(90,Number(s.playGift?.seconds)||0))};
  const bonusEconomy={day:/^\d{4}-\d{2}-\d{2}$/.test(s.bonusEconomy?.day)?s.bonusEconomy.day:'',rounds:integer(s.bonusEconomy?.rounds,ECONOMY.bonus.freeRounds)};
  return {...f,hasLaunched:s.hasLaunched!==false,bonusEconomy,premiumUnlocked,premiumSkipped,levelChest,playGift,stars,coins:integer(s.coins),sound:s.sound!==false,purchased,items,equipped:items.includes(s.equipped)?s.equipped:null,cards,
    boxes:s.boxes===undefined?1:integer(s.boxes),hints:integer(s.hints),skips:integer(s.skips),bonusUnlocked:list(s.bonusUnlocked,['bubbles','stones']),
    daily:{claims:integer(s.daily?.claims),lastDay:/^\d{4}-\d{2}-\d{2}$/.test(s.daily?.lastDay)?s.daily.lastDay:''},passAds:integer(s.passAds,7),
    adReceipts:Array.isArray(s.adReceipts)?s.adReceipts.filter(x=>typeof x==='string').slice(-100):[],
    pendingResult:s.pendingResult&&typeof s.pendingResult.id==='string'?{id:s.pendingResult.id,base:integer(s.pendingResult.base,75),tripled:!!s.pendingResult.tripled}:null};
}
export function parseCloudSave(raw){
  if(raw.trim()==='')return freshSave();
  const parsed=JSON.parse(raw);
  // Empty serialized placeholders contain no progress to migrate.
  if(parsed===null||(typeof parsed==='object'&&!Array.isArray(parsed)&&Object.keys(parsed).length===0))return freshSave();
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||!Array.isArray(parsed.stars))throw new Error('Unrecognized cloud save');
  // Early saves did not include a version. Reuse the existing v1 migration.
  const version=parsed.version??1;
  if(![1,2,3].includes(version))throw new Error('Unsupported cloud save version');
  return normalizeSave({...parsed,version});
}
export async function loadSave(host=platform){
  const raw=await host.load();
  const save=parseCloudSave(raw);host.acceptLoad();return save;
}
export function writeSave(save){return platform.save(JSON.stringify(save));}
export function reward(save,level,stars){const improved=Math.max(0,stars-save.stars[level]);save.stars[level]=Math.max(stars,save.stars[level]);const coins=Math.min(ECONOMY.coinCap-save.coins,improved*ECONOMY.coinsPerStar);save.coins+=coins;writeSave(save);return coins;}
export function unlocked(save,index){if(LEVELS[index]?.premium)return save.premiumUnlocked?.includes(index)&&!save.premiumSkipped?.includes(index);if(LEVELS[index]?.free)return true;const position=levelNumber(index)-1;return position>=0&&(position===0||save.stars[index]>0||save.stars[LEVEL_ORDER.slice(0,position).reverse().find(i=>!save.premiumSkipped?.includes(i))]>0||save.stars[LEVEL_ORDER.slice(0,position).reverse().find(i=>!LEVELS[i].premium)]>0||save.purchased?.includes(index));}
