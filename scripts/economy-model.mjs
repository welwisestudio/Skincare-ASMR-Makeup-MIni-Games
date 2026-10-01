import fs from 'node:fs';
import assert from 'node:assert/strict';
import {ECONOMY,SUPPLIES,bubbleCoins,bonusRoundsLeft,reserveBonusRound} from '../src/economy.js';
import {DAILY,PASS,WHEEL,grant,LEVEL_PRICES} from '../src/meta-content.js';
import {CHEST_PRIZES,giftCoins} from '../src/engagement.js';
import {freshSave,normalizeSave,reward} from '../src/save.js';
const sum=(xs)=>xs.reduce((a,b)=>a+b,0),mean=xs=>sum(xs)/xs.length;
const boxCoins=.6*ECONOMY.giftBoxCoins+.15*ECONOMY.duplicate;
const liquid=r=>(r.coins||0)+(r.boxes||0)*boxCoins+((r.items?.length||0)+(r.cards?.length||0))*ECONOMY.duplicate;
const value=r=>liquid(r)+(r.hints||0)*ECONOMY.help.hint+(r.skips||0)*ECONOMY.help.skip+(r.boxes||0)*.25*2*ECONOMY.help.hint;
const bubbleMean=mean(Array.from({length:100},(_,i)=>bubbleCoins(i/100)));
const estimates={firstClear:75,resultAdExtra:150,coinAd:ECONOMY.coinVideo,timeAd:giftCoins(2),
 freeBubbleRound:bubbleMean*18+ECONOMY.bonus.bubbleFinish,adBubbleRound:5.5*18+ECONOMY.bonus.bubbleFinish,
 boxLiquid:boxCoins,boxUtility:boxCoins+.25*2*ECONOMY.help.hint,
 wheelLiquid:mean(WHEEL.map(liquid)),wheelUtility:mean(WHEEL.map(value)),
 chestLiquid:3*mean(CHEST_PRIZES.map(liquid)),chestUtility:3*mean(CHEST_PRIZES.map(value)),
 weeklyDailyCoins:sum(DAILY.map(r=>r.coins||0)),oneTimePassCoins:sum(PASS.map(r=>r.coins||0)),
 regularPrices:LEVEL_PRICES.filter(Boolean),supplies:SUPPLIES};
assert.ok(estimates.resultAdExtra>estimates.timeAd&&estimates.timeAd>estimates.coinAd);
assert.ok(estimates.boxUtility<SUPPLIES.find(p=>p.id==='box').price,'No positive-value coin -> box loop');
const s=freshSave(),today=Date.UTC(2026,8,30);assert.equal(bonusRoundsLeft(s,today),2);
assert.ok(reserveBonusRound(s,false,today));assert.ok(reserveBonusRound(s,false,today));assert.equal(reserveBonusRound(s,false,today),false);
assert.equal(bonusRoundsLeft(normalizeSave(s),today),0);assert.ok(reserveBonusRound(s,true,today));assert.equal(bonusRoundsLeft(s,today),0);assert.equal(bonusRoundsLeft(s,today+86400000),2);
for(let i=0;i<100;i++){assert.ok(bubbleCoins(i/100)>=1&&bubbleCoins(i/100)<=10);assert.ok(bubbleCoins(i/100,true)>=1&&bubbleCoins(i/100,true)<=10);}
s.coins=ECONOMY.coinCap-5;s.items=['bow'];s.cards=['lucky'];grant(s,{coins:10,items:['bow'],cards:['lucky']});assert.equal(s.coins,ECONOMY.coinCap);
globalThis.localStorage={setItem(){}};const paid=freshSave();assert.equal(reward(paid,0,3),75);assert.equal(reward(paid,0,3),0);
// Transparent deterministic expectations, not retention/revenue forecasts.
const cohorts=[];
for(const style of ['no-ads','selective','engaged']){
 let balance=0,completed=0,pass=0;const days=[];
 for(let day=0;day<7;day++){
  const levels=Math.min(10,(style==='no-ads'?46:58)-completed);completed+=levels;
  let income=levels*75+ECONOMY.bonus.freeRounds*estimates.freeBubbleRound+liquid(DAILY[day])+(day===0?sum(ECONOMY.timeGifts.slice(0,2))+boxCoins:0);
  const resultAds=style==='no-ads'?0:Math.min(levels,style==='selective'?2:4),timeAds=style==='engaged'?2:0,chestAds=style==='no-ads'?0:Math.floor(levels/5);
  const ads=resultAds+timeAds+chestAds;
  income+=resultAds*150+timeAds*giftCoins(2)+chestAds*estimates.chestLiquid;
  for(let n=0;n<ads&&pass<PASS.length;n++)income+=liquid(PASS[pass++]);
  // Assumed spend cadence for comparison, not a forced payment or measured behavior.
  const spend=Math.min(balance+income,levels>0?ECONOMY.help.hint*2+ECONOMY.help.skip+(day%2?350:0):150);
  balance+=income-spend;days.push({day:day+1,levels,ads,income:+income.toFixed(1),spend,balance:+balance.toFixed(1)});
 }
 cohorts.push({style,days});
}
fs.mkdirSync('test-results/economy',{recursive:true});fs.writeFileSync('test-results/economy/model.json',JSON.stringify({assumptions:'Expected values after duplicate collectibles; 10 first clears/day until campaign exhaustion; 2 bonus rounds/day. Hypothetical spend cadence. No eCPM, retention or revenue claims.',estimates,cohorts},null,2));
console.log('PASS: reward value ladder, no box arbitrage, daily quota/persistence, coin cap, first-clear idempotency');console.log(JSON.stringify(estimates,null,2));
