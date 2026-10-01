import {ECONOMY,SUPPLIES,reserveBonusRound,bubbleCoins} from './economy.js';
import {LEVELS,levelNumber} from './levels.js';
import {writeSave,unlocked} from './save.js';
import {ITEMS,CARDS,DAILY,PASS,WHEEL,MODES,LEVEL_PRICES,dailyReady,dayKey,grant,randomIndex,rollBox} from './meta-content.js';
import {RewardedProvider} from './ads.js';

export function installMeta(App){Object.assign(App.prototype,{
  initMeta(){this.firstSession=!this.save.hasLaunched;this.levelMenuVisits=0;this.dailyAutoShown=false;this.ads=new RewardedProvider();this.metaStack=[];this.metaData={};this.rewardBusy=false;this.cardScroll=0;this.observedCoins=this.save.coins;this.displayCoins=this.save.coins;this.coinQueue=0;},
  onLevelMenuShown(previousMode){
    if(previousMode==='levels'&&this.levelMenuVisits>0)return;
    this.levelMenuVisits++;
    if(!this.save.hasLaunched){this.save.hasLaunched=true;writeSave(this.save);}
    const showDaily=!this.dailyAutoShown&&this.levelMenuVisits>=(this.firstSession?2:1)&&dailyReady(this.save);
    if(showDaily){this.dailyAutoShown=true;this.openMeta('daily');}
    else this.offerLevelChest();
  },
  celebrateCard(id,returnMode='result'){this.cardCelebration={card:CARDS.find(c=>c.id===id),start:performance.now(),returnMode};this.modalName='card-earned';this.freeze();this.ui.show('card-earned');},
  finishCardCelebration(){if(!this.cardCelebration)return;const mode=this.cardCelebration.returnMode||'result';this.cardCelebration=null;this.modalName=mode==='playing'?null:mode;if(mode==='playing')this.unfreeze();this.ui.show(mode);},
  persist(){writeSave(this.save);this.updateWallet();},
  openMeta(mode,data={}){
    if(this.rewardBusy||this.reveal)return;
    if(this.ui.mode===mode&&JSON.stringify(this.metaData)===JSON.stringify(data))return;
    this.metaStack.push({mode:this.ui.mode,data:this.metaData});this.metaData=data;this.modalName=mode;this.freeze();this.ui.show(mode);
  },
  backMeta(afterBreak=false){
    if(!afterBreak&&['bonus','mode-offer'].includes(this.ui.mode))return this.transition('bonus-menu',()=>this.backMeta(true));
    if(this.ui.mode==='chest-reveal'&&!this.chestReveal?.ready)return;
    if(this.ui.mode==='chest-reveal')this.chestReveal=null;
    if(this.ads.pending){this.ads.cancel();return;}
    if(this.reveal)return;
    if(this.ui.mode==='level-chest'&&this.save.levelChest.prizes.length)this.discardLevelChest();
    // A bonus offer is an entry screen, never the destination when leaving a game.
    if(this.ui.mode==='bonus'||this.ui.mode==='mode-offer'){
      while(['bonus','mode-offer'].includes(this.metaStack.at(-1)?.mode))this.metaStack.pop();
      this.bonus=null;
    }
    // A claimed daily reward must not reopen when closing its reward screen.
    while(this.metaStack.at(-1)?.mode==='daily'&&!dailyReady(this.save))this.metaStack.pop();
    const back=this.metaStack.pop()||{mode:this.state==='playing'?'playing':this.state==='result'?'result':'levels',data:{}};
    this.metaData=back.data||{};this.modalName=back.mode==='playing'?null:back.mode;
    if(back.mode==='playing')this.unfreeze();else this.freeze();this.ui.show(back.mode);
  },
  showReward(title,rewards,art='grand-bundle',extra=''){
    this.openMeta('reward',{title,rewards,art,extra});
  },
  async rewarded(placement,action){
    if(this.rewardBusy||this.navigationBusy||this.platform.paused)return;this.rewardBusy=true;this.freeze();
    const origin={mode:this.ui.mode,data:this.metaData};
    this.modalName='ad';const promise=this.ads.show(placement);
    let result;try{result=await promise;}catch{result={status:'unavailable'};}
    await this.platform.whenActive();this.rewardBusy=false;this.metaData=origin.data;this.modalName=origin.mode;this.ui.show(origin.mode);
    if(result.status!=='rewarded'||this.save.adReceipts.includes(result.receipt)){
      if(origin.mode==='playing'){this.modalName=null;this.unfreeze();}
      if(result.status==='unavailable')this.showReward('Try again soon',[],'ad-badge','The video is unavailable. Nothing was spent.');
      return;
    }
    this.save.adReceipts.push(result.receipt);this.save.adReceipts=this.save.adReceipts.slice(-100);
    let pass=this.save.passAds<7?PASS[this.save.passAds]:null;
    if(pass){this.save.passAds++;pass=grant(this.save,pass);}
    this.lastPassReward=pass;this.applyingReward=true;try{action(pass);}finally{this.applyingReward=false;this.persist();}
    if(pass?.cards?.length&&this.ui.mode==='playing')this.celebrateCard(pass.cards[0],'playing');
  },
  claimDaily(){
    if(!dailyReady(this.save))return;
    const index=this.save.daily.claims%7;this.save.daily.claims++;this.save.daily.lastDay=dayKey();const r=grant(this.save,DAILY[index]);this.persist();
    this.showReward(`Day ${index+1} gift!`,[r],r.art,'A little reason to come back tomorrow.');
  },
  watchCoins(){this.rewarded('coins',pass=>{const r={coins:ECONOMY.coinVideo};grant(this.save,r);this.showReward('A little more sparkle',[r,...(pass?[pass]:[])],'coin-pile',pass?`Spa Pass ${this.save.passAds}/7 reward included`:`${ECONOMY.coinVideo} coins added to your purse.`);});},
  buySupply(id){
    const pack=SUPPLIES.find(p=>p.id===id);if(!pack||this.rewardBusy||this.save.coins<pack.price)return false;
    this.save.coins-=pack.price;const r=grant(this.save,pack.reward);this.persist();this.showReward('Ready for your next ritual',[r],pack.art,`${pack.price} coins spent.`);return true;
  },
  watchPass(){if(this.save.passAds>=7)return;this.rewarded('spa-pass',pass=>this.showReward(this.save.passAds===7?'The royal collection!':'Spa Pass reward!',[pass],pass.art,`${this.save.passAds} / 7 rewarded videos completed`));},
  buyLevel(index){
    if(LEVELS[index]?.premium||unlocked(this.save,index)||!LEVEL_PRICES[index]||this.save.coins<LEVEL_PRICES[index])return false;
    this.save.coins-=LEVEL_PRICES[index];this.save.purchased.push(index);this.persist();
    this.showReward('A new ritual awaits',[],'card-pack',`Level ${levelNumber(index)} is now permanently unlocked.`);return true;
  },
  watchLevel(index){
    if(LEVELS[index]?.premium){this.offerPremium(index);return;}
    if(!Number.isInteger(index)||!LEVELS[index]||unlocked(this.save,index))return;
    this.rewarded('level-'+LEVELS[index].id,pass=>{
      if(!this.save.purchased.includes(index))this.save.purchased.push(index);
      this.showReward('Level unlocked!',pass?[pass]:[],LEVELS[index].hero||'card-pack',`${LEVELS[index].name} is yours to play.\nPermanently unlocked!`);
    });
  },
  requestHelp(kind){
    if(!this.scene.active||this.scene.transitioning)return;
    if(kind==='hint'&&this.scene.puzzle&&!this.scene.puzzle.hintPlan()){
      this.toast(this.scene.puzzle.kind==='rescue'?'Your shelter is working. Wait for the swarm.':'Let the cards finish turning, then ask for a hint.');return;
    }
    this.openMeta('help',{kind,run:this.scene.runId,step:this.scene.stepIndex});
  },
  useHelp(watch=false,payCoins=false){
    const data={...this.metaData},kind=data.kind,key=kind==='hint'?'hints':'skips';
    if(!['hint','skip'].includes(kind)||data.run!==this.scene.runId||data.step!==this.scene.stepIndex||!this.scene.active||this.scene.transitioning||this.rewardBusy)return;
    const apply=()=>{
      if(data.run!==this.scene.runId||data.step!==this.scene.stepIndex)return;
      // Return to the exact game context before applying an earned action.
      this.metaStack=[];this.modalName=null;this.unfreeze();this.ui.show('playing');
      if(kind==='hint')this.scene.hint();else this.scene.skipStage();
    };
    if(watch)this.rewarded(kind,pass=>{apply();if(pass)this.toast(`Spa Pass ${this.save.passAds}/7: ${pass.label}`);});
    else if(payCoins){const price=ECONOMY.help[kind];if(this.save.coins<price)return;this.save.coins-=price;this.persist();apply();}
    else if(this.save[key]>0){this.save[key]--;this.persist();apply();}
  },
  equipItem(id){if(id&&!this.save.items.includes(id))return;this.save.equipped=id;this.persist();this.scene.refreshAccessory();this.ui.render(false);},
  watchItem(id){
    if(this.save.items.includes(id)){this.equipItem(id);return;}
    this.rewarded('item-'+id,pass=>{const r={items:[id]};grant(this.save,r);this.save.equipped=id;this.scene.refreshAccessory();this.showReward('Your new spa look',[r,...(pass?[pass]:[])],ITEMS.find(i=>i.id===id).art,'Equipped! Your item stays in your collection.');});
  },
  tripleReward(){
    const pending=this.save.pendingResult;if(!pending||pending.id!==this.resultId||pending.tripled||!pending.base)return;
    this.rewarded('result-x3',pass=>{
      if(this.save.pendingResult?.id!==pending.id||pending.tripled)return;
      pending.tripled=true;const r={coins:pending.base*(ECONOMY.resultMultiplier-1)};grant(this.save,r);this.resultCoins=pending.base*ECONOMY.resultMultiplier;
      this.showReward('Triple the glow!',[r,...(pass?[pass]:[])],'coin-pile',`${pending.base} + ${pending.base*(ECONOMY.resultMultiplier-1)} = ${pending.base*ECONOMY.resultMultiplier} level coins${pass?`\nSpa Pass ${this.save.passAds}/7 bonus included`:''}`);
    });
  },
  spinWheel(){if(this.reveal)return;this.rewarded('lucky-wheel',pass=>{
    const index=randomIndex(WHEEL.length),r=grant(this.save,WHEEL[index]);
    this.reveal={type:'wheel',index,rewards:[r,...(pass?[pass]:[])],art:r.art,start:performance.now(),duration:this.reducedMotion?600:3800};this.ui.render(false);
  });},
  openBox(){
    if(this.reveal||this.save.boxes<1)return;
    this.save.boxes--;const r=grant(this.save,rollBox());this.persist();
    this.reveal={type:'box',rewards:[r],art:r.art,start:performance.now(),duration:this.reducedMotion?500:1700};this.ui.render(false);
  },
  watchBox(){this.rewarded('gift-box',pass=>{const r={boxes:1};grant(this.save,r);this.showReward('A surprise for you',[r,...(pass?[pass]:[])],'chest-closed','Open your gift in the Gift Boxes room.');});},
  finishReveal(){const reveal=this.reveal;if(!reveal)return;this.reveal=null;this.showReward(reveal.type==='wheel'?'Lucky you!':'A lovely surprise',reveal.rewards,reveal.art,'Your rewards are already safe in your collection.');},
  offerMode(id){this.openMeta('mode-offer',{id});},
  unlockMode(id){
    if(this.save.bonusUnlocked.includes(id)){this.playBonus(id);return;}
    this.rewarded('mode-'+id,()=>{this.save.bonusUnlocked.push(id);this.persist();this.playBonus(id);});
  },
  watchBonusRound(id){if(this.rewardBusy||!this.save.bonusUnlocked.includes(id))return;this.rewarded('bonus-round-'+id,()=>this.playBonus(id,true));},
  async playBonus(id,adRound=false,afterBreak=false){
    if(!adRound&&!afterBreak)return this.transition('bonus-play',()=>this.playBonus(id,false,true));
    if(!this.save.bonusUnlocked.includes(id))return;
    if(this.rewardBusy||this.reveal)return;
    await this.ensureGameAssets();
    const earnsCoins=reserveBonusRound(this.save,adRound);this.persist();
    this.bonus={id,popped:[],stacked:0,finished:false,start:performance.now(),tip:'',earnsCoins,adRound};
    if(this.ui.mode==='mode-offer'||this.ui.mode==='bonus'){
      while(['bonus','mode-offer'].includes(this.metaStack.at(-1)?.mode))this.metaStack.pop();
      this.metaData={id};this.modalName='bonus';this.freeze();this.ui.show('bonus');
    }else this.openMeta('bonus',{id});
  },
  bonusAction(index,origin){
    const b=this.bonus;if(!b||b.finished)return;
    if(b.id==='bubbles'){
      if(!Number.isInteger(index)||index<0||index>=18||b.popped.includes(index))return;
      const sprite=this.ui.bubbleSprites?.[index],point=origin||{x:sprite?.x??this.ui.layout.W/2,y:sprite?.y??this.ui.layout.H/2};
      const coins=b.earnsCoins?bubbleCoins(randomIndex(100)/100,b.adRound):0;b.popped.push(index);b.coins=(b.coins||0)+coins;
      this.nextCoinOrigin={...point,W:this.ui.layout.W,H:this.ui.layout.H};grant(this.save,{coins});this.persist();this.ui.popBubble(index,coins,point);
      if(b.popped.length===18)this.finishBonus();
    }else{
      if(Math.abs(this.ui.stoneOffset||0)>40){b.tip='Almost! Try the center.';this.ui.bonusTip?.setText(b.tip);return;}
      b.stacked++;b.tip='Beautiful balance!';if(b.stacked>=5)this.finishBonus();else{this.ui.render(false);this.ui.landStone();}
    }
  },
  finishBonus(){
    if(this.bonus.finished)return;this.bonus.finished=true;const r={coins:this.bonus.earnsCoins?(this.bonus.id==='bubbles'?ECONOMY.bonus.bubbleFinish:this.bonus.adRound?ECONOMY.bonus.adStoneFinish:ECONOMY.bonus.stoneFinish):0};grant(this.save,r);this.persist();
    const bonus=this.bonus,show=()=>{if(this.bonus===bonus&&this.ui.mode==='bonus'&&!bonus.earnsCoins){this.ui.render(false);return;}if(this.bonus===bonus&&this.ui.mode==='bonus')this.showReward('A moment of zen',[r],MODES.find(m=>m.id===bonus.id).art,bonus.id==='bubbles'?`${bonus.coins} bubble coins + ${r.coins} completion coins!`:`${r.coins} coins for a lovely little break.`);};
    if(bonus.id==='bubbles')this.ui.time.delayedCall(1100,show);else show();
  },
});}
