// Launch balance. Currency has no cash value; validate these assumptions with live cohorts.
export const ECONOMY={
 version:1,coinCap:999999,coinsPerStar:25,resultMultiplier:3,coinVideo:100,
 timeGifts:[30,50,125],duplicate:25,giftBoxCoins:100,
 help:{hint:60,skip:150},
 unlock:{base:125,step:25,max:750},
 bonus:{freeRounds:2,bubbleFinish:10,stoneFinish:40,adStoneFinish:100,
  // Free coin rounds have weighted drops, all values from 1 through 10 remain possible.
  bubbleWeights:[40,25,15,8,5,3,1,1,1,1]},
};
export const SUPPLIES=[
 {id:'hints',name:'3 hints',art:'hint',price:150,reward:{hints:3}},
 {id:'skips',name:'2 stage skips',art:'action-next',price:250,reward:{skips:2}},
 {id:'box',name:'Gift box',art:'chest-closed',price:150,reward:{boxes:1}},
];
export const economyDay=(now=Date.now())=>new Date(now).toISOString().slice(0,10);
export function bonusRoundsLeft(save,now=Date.now()){
 const used=save.bonusEconomy?.day===economyDay(now)?save.bonusEconomy.rounds:0;
 return Math.max(0,ECONOMY.bonus.freeRounds-used);
}
export function reserveBonusRound(save,adRound=false,now=Date.now()){
 // Reserve before play and persist: exiting/reloading cannot replay a free coin round.
 const day=economyDay(now);if(save.bonusEconomy?.day!==day)save.bonusEconomy={day,rounds:0};
 if(adRound)return true;
 if(!bonusRoundsLeft(save,now))return false;
 save.bonusEconomy.rounds++;return true;
}
export function bubbleCoins(roll,adRound=false){
 if(adRound)return 1+Math.floor(roll*10);
 let total=0;for(let i=0;i<ECONOMY.bonus.bubbleWeights.length;i++){total+=ECONOMY.bonus.bubbleWeights[i];if(roll*100<total)return i+1;}return 10;
}
