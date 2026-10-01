import {ECONOMY} from './economy.js';
import {grant,randomIndex,rewardLines,ITEMS} from './meta-content.js';
import {writeSave} from './save.js';

export const CHEST_PRIZES=[{coins:100},{coins:200},{hints:2},{skips:1},{boxes:1},{items:['butterfly']},{cards:['lucky']}];
export const giftDelay=claims=>claims===0?30:claims===1?60:90;
export const giftCoins=claims=>ECONOMY.timeGifts[Math.min(claims,2)];

export function installEngagement(App){Object.assign(App.prototype,{
  advanceChest(){
    const c=this.save.levelChest;if(c.prizes.length)return;
    c.steps=Math.min(5,c.steps+1);
    if(c.steps===5){const pool=CHEST_PRIZES.map((_,i)=>i);for(let i=0;i<3;i++)c.prizes.push(pool.splice(randomIndex(pool.length),1)[0]);}
  },
  offerLevelChest(){if(this.save.levelChest.prizes.length)this.openMeta('level-chest');},
  discardLevelChest(){this.save.levelChest={steps:0,prizes:[]};this.persist();},
  claimLevelChest(){
    if(!this.save.levelChest.prizes.length||this.rewardBusy)return;
    this.rewarded('level-chest',pass=>{
      const rewards=this.save.levelChest.prizes.map(i=>grant(this.save,CHEST_PRIZES[i]));
      this.save.levelChest={steps:0,prizes:[]};this.persist();this.backMeta();
      this.chestReveal={rewards:[...rewards,...(pass?[pass]:[])],started:performance.now(),opened:false,ready:false};
      this.openMeta('chest-reveal');
    });
  },
  tickPlayGift(delta){
    if(this.platform?.paused||this.platform?.adBusy||this.assetsLoading||!this.ui||this.ads.pending||this.state==='loading')return;
    if(!['playing','levels','result'].includes(this.ui.mode))return;
    const t=this.save.playGift,limit=giftDelay(t.claims),wasReady=t.seconds>=limit;
    t.seconds=Math.min(limit,t.seconds+Math.min(delta/1000,.1));
    this.giftSaveClock=(this.giftSaveClock||0)+delta/1000;
    if(this.giftSaveClock>=5||(!wasReady&&t.seconds>=limit)){writeSave(this.save);this.giftSaveClock=0;}
    if(this.ui.giftTime?.active)this.ui.giftTime.setText(this.playGiftLabel());
  },
  playGiftLabel(){const t=this.save.playGift,left=Math.max(0,Math.ceil(giftDelay(t.claims)-t.seconds));return left?`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`:'CLAIM';},
  claimPlayGift(){
    const t=this.save.playGift;if(t.seconds<giftDelay(t.claims)||this.rewardBusy)return;
    const claim=t.claims,apply=pass=>{
      if(this.save.playGift.claims!==claim)return;
      const r=grant(this.save,{coins:giftCoins(claim)});t.claims++;t.seconds=0;this.persist();this.backMeta();
      this.showReward('Thanks for playing!',[r,...(pass?[pass]:[])],'coin-pile','Your next gift is on its way.');
    };
    if(claim>=2)this.rewarded('play-time-gift',apply);else apply();
  },
});}

export function installEngagementUI(UI){Object.assign(UI.prototype,{
  drawGiftHUD(x=50,y=123){
    this.icon('play-gift','chest-closed','Gift for time in game',x,y,54,()=>this.app.openMeta('play-gift'));
    this.giftTime=this.text(this.app.playGiftLabel(),x,y+42,16,{color:'#79567f',thickness:0,fitWidth:86});
  },
  drawEngagement(kind){
    const chest=kind==='level-chest',a=this.app,{cx,top,landscape}=this.metaHeader(chest?'Your level treasure':'A gift for your time');
    const cy=top+(landscape?320:388),artX=landscape?cx-190:cx,bodyX=landscape?cx+165:cx;
    this.image('panel',cx,cy,landscape?680:428,landscape?347:510);
    this.royalGlow(artX,landscape?cy:cy-115,95);
    this.art(chest?'chest-closed':'coin-pile',artX,landscape?cy:cy-115,190,160);
    const t=a.save.playGift,ready=t.seconds>=giftDelay(t.claims),ad=chest||t.claims>=2;
    const textY=landscape?cy-104:cy+4;
    this.text(chest?'5 levels complete!':`${giftCoins(t.claims)} coins`,bodyX,textY,26,{color:'#a27c31',thickness:0,fitWidth:320});
    this.text(chest?'3 random rewards inside':ready?'Your gift is ready!':`Ready in ${a.playGiftLabel()} of play`,bodyX,textY+40,18,{color:'#715080',thickness:0,fitWidth:320});
    this.text(chest?'Coins, hints, skips and special gifts.':ad?'Watch a video to collect this gift.':'This gift is free to collect.',bodyX,textY+77,17,{color:'#715080',thickness:0,maxWidth:300,fitWidth:310,fitHeight:48});
    const by=landscape?cy+54:cy+136;
    const btn=this.button(chest?'level-chest-open':'play-gift-claim',ad?'WATCH & CLAIM':'CLAIM',bodyX,by,300,70,()=>chest?a.claimLevelChest():a.claimPlayGift(),'green-button',27,ad?'ad':'finish');
    if(!chest&&!ready)this.disable('play-gift-claim',btn);else this.pulseRewardButton(btn);
    const closeY=by+64,label=chest?'SKIP THIS CHEST':'Tap here to close';
    this.text(label,bodyX,closeY,18,{color:'#84768a',thickness:0});
    this.hit('gift-dismiss',label,bodyX,closeY,280,36,()=>a.backMeta());
    if(chest)this.text('Skipping loses this chest permanently.',cx,cy+(landscape?205:292),16,{color:'#fff9ff',fitWidth:420});
  },
  drawChestReveal(){
    const a=this.app,r=a.chestReveal;if(!r)return;
    const {W,H,landscape}=this.layout,cx=W/2,top=landscape?15:(H-740)/2;
    this.ribbon('Your treasure!',cx,landscape?top+51:Math.max(48,top+16),370,true,28);this.walletBadge(cx,landscape?top+110:Math.max(107,top+75));
    const chestX=landscape?cx-240:cx,chestY=top+(landscape?330:220);
    const glow=this.royalGlow(chestX,chestY,landscape?135:95);glow.setAlpha(0);
    const chest=this.art('chest-closed',chestX,chestY,landscape?230:190,180);
    const tiles=r.rewards.map((reward,i)=>{
      const col=i%2,row=Math.floor(i/2),oddLast=r.rewards.length%2&&i===r.rewards.length-1;
      const x=landscape?cx+80+col*191:cx+(oddLast?0:(col-.5)*194),y=top+(landscape?250:389)+row*163;
      if(reward.coins&&!this.coinOrigin)this.coinOrigin={x,y:y-6};
      const group=this.add.container(chestX,chestY);this.root.add(group);this.image('reward-tile',0,0,178,150,group);
      const key=reward.art||(reward.items?.length?ITEMS.find(item=>item.id===reward.items[0]).art:reward.cards?.length?'card-pack':reward.coins?'coin-pile':reward.hints?'hint':reward.skips?'action-next':'chest-closed');
      const lines=rewardLines(reward),bundle=lines.length>2;
      this.art(key,0,bundle?-13:-6,bundle?52:74,bundle?40:56,group);
      this.text(lines.join('\n'),0,bundle?35:45,18,{color:'#715080',thickness:0,fitWidth:156,fitHeight:bundle?50:32,maxWidth:154},group);
      group.setAlpha(0).setScale(.12);return{group,x,y,delay:900+i*300,burst:false};
    });
    const by=top+(landscape?552:692),bx=landscape?cx+165:cx;
    const button=this.button('chest-reveal-continue','LOVELY!',bx,by,285,65,()=>a.backMeta(),'green-button',28,'finish');
    this.disable('chest-reveal-continue',button);
    this.chestVisual={chest,glow,chestX,chestY,scale:chest.scaleX,tiles,button,total:900+(tiles.length-1)*300+850};
    this.updateChestPresentation();
  },
  updateChestPresentation(){
    const a=this.app,sequence=a.chestSequence;
    if(this.mode==='result'&&this.chestMeter&&sequence?.id===a.resultId&&!sequence.offered){
      const elapsed=performance.now()-sequence.started;
      this.chestMeter.meter.value=4+Math.max(0,Math.min(1,(elapsed-650)/1100));this.chestMeter.draw();
      if(elapsed>=2300){sequence.offered=true;a.offerLevelChest();}return;
    }
    if(this.mode!=='chest-reveal'||!this.chestVisual||!a.chestReveal)return;
    const r=a.chestReveal,v=this.chestVisual,elapsed=performance.now()-r.started,quiet=a.reducedMotion;
    if(elapsed<650){v.chest.setAngle(quiet?0:Math.sin(elapsed/35)*5).setScale(v.scale*(1+Math.sin(elapsed/90)*.035));}
    else{
      if(v.chest.texture.key!=='ui-chest-open'){
        v.chest.setTexture('ui-chest-open');const source=v.chest.texture.getSourceImage();v.scale=Math.min((this.layout.landscape?230:190)/source.width,180/source.height);
        this.chestSparkles(v.chestX,v.chestY,22);
      }
      const pulse=quiet?0:Math.max(0,1-(elapsed-650)/450)*.15;
      v.chest.setAngle(0).setScale(v.scale*(1+pulse));v.glow.setAlpha(Math.min(1,(elapsed-650)/250));
    }
    for(const tile of v.tiles){
      const t=Math.max(0,Math.min(1,(elapsed-tile.delay)/(quiet?220:700))),ease=1-(1-t)**3;
      tile.group.setAlpha(Math.min(1,t*4)).setScale(.12+.88*ease).setPosition(v.chestX+(tile.x-v.chestX)*ease,v.chestY+(tile.y-v.chestY)*ease-(quiet?0:Math.sin(t*Math.PI)*85)).setAngle(quiet?0:Math.sin(t*Math.PI)*12);
      if(t===1&&!tile.burst){tile.burst=true;this.chestSparkles(tile.x,tile.y,8);}
    }
    r.opened=elapsed>=v.total;r.ready=r.opened;
    if(r.ready){const button=document.getElementById('chest-reveal-continue');if(button)button.disabled=false;v.button.setAlpha(1);}
  },
  chestSparkles(x,y,count){
    if(this.app.reducedMotion)return;
    for(let i=0;i<count;i++){
      const spark=this.art(i%3?'glint':'star',x,y,12+Math.random()*12,24),angle=i/count*Math.PI*2;
      this.tweens.add({targets:spark,x:x+Math.cos(angle)*(45+Math.random()*70),y:y+Math.sin(angle)*80-30,alpha:0,angle:100,duration:700+Math.random()*300,onComplete:()=>spark.destroy()});
    }
  },
  drawChestProgress(x,y,w=265){
    const count=this.app.save.levelChest.steps,ready=count===5;
    this.art('chest-closed',x-w/2+22,y,40,38);
    const g=this.add.graphics();this.root.add(g);
    const text=this.text('',x+22,y,14,{fitWidth:w-65}),meter={value:count};
    const draw=()=>{g.clear();g.fillStyle(0x785080,1).fillRoundedRect(x-w/2+48,y-11,w-48,22,11);
      if(meter.value>0)g.fillStyle(0xc7ed82,1).fillRoundedRect(x-w/2+50,y-9,(w-52)*meter.value/5,18,9);
      text.setText(ready&&meter.value===5?'100% - CHEST READY':`Treasure ${Math.round(meter.value*20)}%`);};
    if(ready){
      const a=this.app;if(a.chestSequence?.id!==a.resultId)a.chestSequence={id:a.resultId,started:performance.now(),offered:false};
      this.chestMeter={meter,draw};if(!a.chestSequence.offered)meter.value=4;
    }
    if(!ready&&this.animate&&!this.app.reducedMotion&&count){meter.value=count-1;this.tweens.add({targets:meter,value:count,duration:900,delay:200,ease:'Sine.Out',onUpdate:draw});}draw();
    if(ready)this.hit('result-chest','Open earned chest',x,y,w,46,()=>this.app.offerLevelChest());
  },
});}
