import {ECONOMY,SUPPLIES,bonusRoundsLeft} from './economy.js';
import {ITEMS,CARDS,DAILY,PASS,WHEEL,MODES,LEVEL_PRICES,dailyReady,rewardLines} from './meta-content.js';
import {LEVELS,LEVEL_ORDER,levelNumber} from './levels.js';
import {unlocked} from './save.js';
import {lang} from './i18n.js';

export const META_MODES=['premium-offer','chest-reveal','level-chest','play-gift','rewards','daily','wheel','boxes','coins','shop','purchase','cards','card-detail','pass','items','help','modes','mode-offer','bonus','reward'];
const ink={color:'#715080',thickness:0};
const light={color:'#fff9ff',stroke:'#553563',thickness:2};
// Russian prize words do not fit the wheel; the icon names the prize, the label keeps the amount.
const wheelAmount=label=>label.match(/^\d+/)?.[0]??'1';

export function installMetaUI(UI){Object.assign(UI.prototype,{
  art(key,x,y,w,h,parent=this.root){const texture=this.textures.exists(key)?key:`ui-${key}`,f=this.textures.get(texture).getSourceImage(),s=Math.min(w/f.width,h/f.height),image=this.add.image(x,y,texture).setScale(s);parent.add(image);return image;},
  disable(id,visual){const b=document.getElementById(id);if(b)b.disabled=true;visual?.setAlpha(.48);},
  metaHeader(title){
    const {W,H,landscape}=this.layout;this.metaTop=landscape?15:(H-740)/2;
    this.pop(this.ribbon(title,W/2,this.metaTop+51,Math.min(370,W-100),false,27));
    this.icon('meta-close','back','Back',W-34,34,46,()=>this.app.backMeta());
    this.walletBadge(W/2,this.metaTop+110);
    return {cx:W/2,top:this.metaTop,H,W,landscape};
  },
  metaTile(id,title,art,x,y,w,h,callback,subtitle=''){
    const group=this.add.container(x,y);this.root.add(group);this.image('reward-tile',0,0,w,h,group);
    this.text(title,0,-h*.35,18,{...ink,fitWidth:w-24,fitHeight:h*.19},group);this.art(art,0,0,w*.64,h*.43,group);
    if(subtitle)this.text(subtitle,0,h*.34,15,{...ink,maxWidth:w-24,fitWidth:w-24,fitHeight:h*.18},group);
    if(callback)this.hit(id,title,x,y,w,h,callback,group);this.pop(group,60);return group;
  },
  drawMeta(){
    const mode=this.mode;
    if(mode==='premium-offer')this.drawPremiumOffer();
    else if(mode==='chest-reveal')this.drawChestReveal();
    else if(mode==='level-chest'||mode==='play-gift')this.drawEngagement(mode);
    else if(mode==='rewards')this.drawRewardsHub();
    else if(mode==='daily'||mode==='pass')this.drawRewardTrack(mode==='pass');
    else if(mode==='wheel')this.drawWheel();
    else if(mode==='boxes')this.drawBoxes();
    else if(mode==='coins')this.drawCoins();
    else if(mode==='shop')this.drawShop();
    else if(mode==='purchase')this.drawPurchase();
    else if(mode==='cards')this.drawCards();
    else if(mode==='card-detail')this.drawCardDetail();
    else if(mode==='items')this.drawItems();
    else if(mode==='help')this.drawHelp();
    else if(mode==='modes')this.drawModes();
    else if(mode==='mode-offer')this.drawModeOffer();
    else if(mode==='bonus')this.drawBonus();
    else if(mode==='reward')this.drawReward();
  },
  drawRewardsHub(){
    const {cx,top,landscape,H}=this.metaHeader('Little luxuries');
    const entries=[['daily','Daily gifts','calendar','A gift every day'],['wheel','Lucky spin','lucky-wheel','Twelve lovely prizes'],['boxes','Gift boxes','chest-closed',`${this.app.save.boxes} ready to open`],['coins','Coin boutique','coin-pile','Free coins & rituals'],['modes','Bonus games','bonus-bubbles','A little playful break'],['items','Spa wardrobe','rose-bow','Make it your own']];
    const cols=landscape?3:2,w=landscape?206:190,h=landscape?174:157,gap=landscape?226:214;
    entries.forEach(([id,title,art,sub],i)=>this.metaTile(`hub-${id}`,title,art,cx+(i%cols-(cols-1)/2)*gap,top+225+Math.floor(i/cols)*(h+15),w,h,()=>this.app.openMeta(id),sub));
    this.button('hub-pass','SPA PASS',cx,landscape?H-47:top+713,230,56,()=>this.app.openMeta('pass'),'purple-button',23,'levels');
  },
  drawRewardTrack(isPass){
    if(isPass)return this.drawSpaPass();
    const a=this.app,s=a.save,{cx,top,landscape}=this.metaHeader('Daily Rewards');
    const completed=s.daily.claims%7,ready=dailyReady(s),dayCurrent=!ready&&completed===0?7:completed;
    DAILY.slice(0,6).forEach((r,i)=>{
      const x=landscape?cx-258+(i%3)*126:cx+(i%3-1)*140,y=top+(landscape?214:209)+Math.floor(i/3)*(landscape?153:144);
      const w=landscape?116:126,h=landscape?136:130,g=this.metaTile('',`Day ${i+1}`,r.art,x,y,w,h,null,r.label);
      if(i<dayCurrent){g.setAlpha(.70);g.list[1].x=-8;this.fitText(g.list[1],w-44,22);this.art('symbol-green-finish',w*.34,-h*.35,19,19,g);}
      else if(i===completed&&ready){g.list[0].setTint(0xeaffd6);g.list[1].x=8;this.fitText(g.list[1],w-44,22);this.art('star',-w*.34,-h*.35,20,20,g);}
    });
    this.drawGrandBundle('Day 7 · Mega Bundle',[`${DAILY[6].coins} coins + ${DAILY[6].boxes} gift boxes`,'Golden Butterfly','Seven Sweet Days card'],dayCurrent===7);
    const bx=landscape?cx+225:cx;
    this.dailyTimer=this.text(ready?'A little gift, just for you.':'Next gift after the daily reset',bx,top+(landscape?469:650),17,{...light,fitWidth:landscape?290:410});
    this.wasDailyReady=ready;
    const btn=this.button('daily-claim',ready?'CLAIM':'COME BACK SOON',bx,top+(landscape?524:705),landscape?277:295,64,()=>a.claimDaily(),'green-button',25,'finish');
    if(!ready)this.disable('daily-claim',btn);else this.pulseRewardButton(btn);
  },
  drawGrandBundle(title,lines,complete){
    const a=this.app,{W,landscape}=this.layout,cx=W/2,top=this.metaTop;
    const x=landscape?cx+231:cx,y=top+(landscape?307:531),w=landscape?332:416,h=192;
    this.image('bundle-tile',x,y,w,h);
    const chestX=x-(landscape?105:121),chestY=y;
    this.royalGlow(chestX,chestY,landscape?67:79);
    this.text(title,x,y-63,30,{color:'#fff0b0',stroke:'#774273',thickness:3,fitWidth:w-68,fitHeight:38}).setShadow(0,2,'#b16897',0,true,true);
    const chest=this.art('grand-bundle',chestX,chestY,landscape?90:110,104);
    if(!a.reducedMotion)this.tweens.add({targets:chest,y:chestY-4,angle:2,duration:1600,yoyo:true,repeat:-1,ease:'Sine.InOut'});
    const textX=x-(landscape?42:46),textWidth=landscape?173:216;
    lines.forEach((line,i)=>{
      this.text(line,textX,y-25+(4-lines.length)*11.5+i*23,i===0?18:17,{...ink,align:'left',fitWidth:textWidth,fitHeight:23}).setOrigin(0,.5);
    });
    if(complete)this.art('symbol-green-finish',x+w*.39,y-63,21,21);
    this.coinOrigin={x:chestX,y:chestY};
  },
  drawSpaPass(){
    const a=this.app,{cx,top,landscape}=this.metaHeader('Spa Pass'),n=a.save.passAds;
    PASS.slice(0,6).forEach((r,i)=>{
      const x=landscape?cx-258+(i%3)*126:cx+(i%3-1)*140,y=top+(landscape?214:209)+Math.floor(i/3)*(landscape?153:144);
      const w=landscape?116:126,h=landscape?136:130,g=this.metaTile('',`Reward ${i+1}`,r.art,x,y,w,h,null,r.label);
      if(i<n){g.setAlpha(.65);this.art('symbol-green-finish',x+w*.38,y-h*.36,19,19);g.list[1].x=-6;this.fitText(g.list[1],w-41,22);}
      else if(i===n){g.list[0].setTint(0xeaffce);this.art('star',x-w*.39,y-h*.35,21,21);g.list[1].x=8;this.fitText(g.list[1],w-40,22);}
    });
    this.drawGrandBundle('Royal Spa Bundle',[`${PASS[6].coins} coins + ${PASS[6].boxes} gift boxes`,'Royal Serum','Golden Butterfly','Spa Royalty card'],n>=7);
    const bx=landscape?cx+225:cx;
    this.text(n>=7?'Your royal collection is complete!':`${n}/7 collected · Grand prize at 7`,bx,top+(landscape?469:650),17,{...light,fitWidth:landscape?290:410});
    const btn=this.button('pass-watch',n<7?'WATCH & CLAIM':'PASS COMPLETE',bx,top+(landscape?524:705),landscape?277:295,64,()=>a.watchPass(),'green-button',25,n<7?'ad':'finish');
    if(n>=7)this.disable('pass-watch',btn);else this.pulseRewardButton(btn);
  },
  drawWheel(){
    const {cx,top,landscape,H}=this.metaHeader('Lucky Spin'),a=this.app,radius=landscape?192:203;
    const x=landscape?cx-165:cx,y=top+(landscape?326:382);
    this.wheel=this.add.container(x,y);this.root.add(this.wheel);this.image('lucky-wheel',0,0,radius*2,radius*2,this.wheel).setAngle(15);
    WHEEL.forEach((r,i)=>{const group=this.add.container(0,0).setAngle(i*30);this.wheel.add(group);this.art(r.art,0,-radius*.67,34,34,group);this.text(lang==='ru'?wheelAmount(r.label):r.label,0,-radius*.47,12,{color:'#604178',thickness:0,maxWidth:52},group);});
    this.wheelPointer=this.art('symbol-purple-play',x,y-radius+5,36,36).setAngle(90);
    const bx=landscape?cx+228:cx,by=top+(landscape?385:646);
    if(landscape){this.art('coin-pile',bx,top+222,120,100);this.text('Spin the wheel,\nunlock your glow!',bx,top+313,25,{...light,maxWidth:290});}
    const button=this.button('wheel-spin',a.reveal?'SPINNING...':'SPIN',bx,by,255,72,()=>a.spinWheel(),'green-button',31,'ad');
    if(a.reveal){this.disable('wheel-spin',button);this.disable('meta-close');}
    if(!landscape)this.text('A little luck. A lovely surprise.',cx,top+145,19,light);
  },
  drawBoxes(){
    const {cx,top,landscape}=this.metaHeader('Gift Boxes'),a=this.app,cy=landscape?315:top+352;
    this.chest=this.art('chest-closed',cx,cy,245,230);this.pop(this.chest);
    this.text(`${a.save.boxes} unopened gift${a.save.boxes===1?'':'s'}`,cx,cy-137,23,light);
    const open=this.button('box-open',a.reveal?'OPENING...':'OPEN GIFT',cx,cy+145,250,64,()=>a.openBox(),'green-button',27,'finish');
    if(a.reveal||!a.save.boxes)this.disable('box-open',open);
    if(a.reveal)this.disable('meta-close');
    this.button('box-watch','GET A GIFT',cx,cy+223,244,58,()=>a.watchBox(),'purple-button',23,'ad');if(a.reveal)this.disable('box-watch');
    this.text(`60%: ${ECONOMY.giftBoxCoins} coins · 25%: 2 hints · 15%: Lucky card\nDuplicate collectibles become ${ECONOMY.duplicate} coins.`,cx,cy+(landscape?279:294),14,{...light,maxWidth:430});
  },
  drawCoins(){
    const {cx,top,landscape}=this.metaHeader('Coin Boutique'),a=this.app,bx=landscape?cx-215:cx,shopX=landscape?cx+190:cx;
    this.text('A little more sparkle',bx,top+169,24,light);this.art('coin-pile',bx,top+247,130,100);
    this.button('coins-watch',`GET ${ECONOMY.coinVideo} COINS`,bx,top+337,282,65,()=>a.watchCoins(),'green-button',25,'ad');
    this.text('1 completed video',bx,top+382,15,light);
    SUPPLIES.forEach((pack,i)=>{const y=top+(landscape?232:448)+i*(landscape?113:88);this.art(pack.art,shopX-155,y,49,49);
      const button=this.button(`supply-${pack.id}`,`${pack.name.toUpperCase()} / ${pack.price}`,shopX+26,y,280,60,()=>a.buySupply(pack.id),'purple-button',22,'coins','right');
      if(a.save.coins<pack.price)this.disable(`supply-${pack.id}`,button);
    });
    this.text('Prices in coins. Supplies are used once.',shopX,top+(landscape?515:667),15,{...light,fitWidth:385});
    this.button('coins-shop','UNLOCK RITUALS',cx,top+(landscape?560:721),282,52,()=>a.openMeta('shop'),'purple-button',23,'levels');
  },
  drawShop(){
    const {cx,top,landscape}=this.metaHeader('Unlock Rituals'),a=this.app;
    LEVEL_ORDER.slice((a.shopPage||0)*5,(a.shopPage||0)*5+5).forEach((i,k)=>{const level=LEVELS[i];
      const x=landscape?cx+(k-2)*150:cx+(k%2?104:-104),y=top+(landscape?310:227)+Math.floor(landscape?0:k/2)*164;
      this.metaTile(`shop-level-${i}`,`Ritual ${levelNumber(i)}`,level.hero||['badge-clean','badge-berry','badge-bunny','badge-jade','badge-lipstick'][i],x,y,landscape?139:184,150,()=>level.premium?a.offerPremium(i):a.openMeta('purchase',{index:i}),unlocked(a.save,i)?'Unlocked':level.premium?'VIP - Watch video':`${LEVEL_PRICES[i]} coins`);
    });
    this.button('shop-coins',`GET ${ECONOMY.coinVideo} COINS`,landscape?cx:cx+104,top+(landscape?461:555),landscape?270:184,62,()=>a.watchCoins(),'green-button',24,'ad');
    this.albumPager('shop',top+(landscape?553:697));
    this.text('Play in order for free, or unlock any ritual with coins.',cx,top+(landscape?413:740),14,{...light,fitWidth:420,fitHeight:23});
  },
  drawPurchase(){
    if(LEVELS[this.app.metaData.index]?.premium)return this.drawPremiumOffer();
    const a=this.app,index=a.metaData.index||0,{cx,top,landscape}=this.metaHeader(LEVELS[index].name),open=unlocked(a.save,index),price=LEVEL_PRICES[index];
    const bx=landscape?cx+180:cx,firstY=top+(landscape?249:410);
    this.art(LEVELS[index].hero||['badge-clean','badge-berry','badge-bunny','badge-jade','badge-lipstick'][index],landscape?cx-210:cx,top+(landscape?310:238),landscape?230:160,landscape?270:180);
    this.text(open?'This ritual is yours.':'Choose your way to unlock',bx,top+(landscape?190:351),22,{...light,fitWidth:350,fitHeight:35});
    if(open)this.button('purchase-level','PLAY',bx,firstY,290,66,()=>a.start(index),'green-button',27,'play');
    else{
      this.button('purchase-watch','WATCH & UNLOCK',bx,firstY,290,66,()=>a.watchLevel(index),'green-button',25,'ad');
      this.text('1 video · this level is yours forever',bx,firstY+47,15,{...light,fitWidth:340,fitHeight:24});
      const coinY=firstY+102,btn=this.button('purchase-level',`UNLOCK · ${price}`,bx,coinY,280,61,()=>a.buyLevel(index),'purple-button',25,'coins');
      if(a.save.coins<price){this.disable('purchase-level',btn);this.text(`You need ${price-a.save.coins} more coins`,bx,coinY+43,15,{...light,fitWidth:340,fitHeight:24});}
      else this.text('Or use your coins',bx,coinY+43,15,light);
    }
    const wheelY=firstY+(open?103:205);
    this.button('purchase-wheel','LUCKY SPIN',bx,wheelY,280,60,()=>a.openMeta('wheel'),'purple-button',25,'ad');
    this.text('1 video · 1 spin · a surprise reward',bx,wheelY+44,15,{...light,fitWidth:340,fitHeight:24});
  },
  drawCards(){
    const {cx,top,landscape}=this.metaHeader('Achievement Cards'),a=this.app,cols=landscape?3:2;
    const page=a.cardPage||0;this.text(`${a.save.cards.length} / ${CARDS.length} treasured moments`,cx,top+153,20,ink);
    CARDS.slice(page*6,page*6+6).forEach((c,k)=>{
      const x=cx+(k%cols-(cols-1)/2)*(landscape?213:205),y=top+(landscape?270:251)+Math.floor(k/cols)*(landscape?170:157),owned=a.save.cards.includes(c.id);
      const g=this.add.container(x,y);this.root.add(g);this.image('achievement-frame',0,0,landscape?183:178,149,g);
      this.art(c.art,0,-12,98,83,g).setAlpha(owned?1:.24);this.text(c.name,0,49,16,{...light,fitWidth:137,fitHeight:26},g);
      if(!owned)this.art('lock',0,-6,30,35,g);else this.art('star',63,-49,24,24,g);
      this.hit(`achievement-${c.id}`,c.name,x,y,178,149,()=>a.openMeta('card-detail',{id:c.id}),g);this.pop(g,k*45);
    });
    this.button('cards-page','MORE CARDS',cx,top+(landscape?550:705),260,57,()=>{a.cardPage=(page+1)%Math.ceil(CARDS.length/6);this.render(true);},'purple-button',23,page?'restart':'next');
  },
  drawCardDetail(){
    const a=this.app,c=CARDS.find(c=>c.id===a.metaData.id)||CARDS[0],{cx,top,landscape}=this.metaHeader(c.name),cy=landscape?315:top+345,owned=a.save.cards.includes(c.id);
    this.image('achievement-frame',cx,cy,220,270);this.art(c.art,cx,cy-12,154,175).setAlpha(owned?1:.45);
    this.text(owned?'COLLECTED':'TO DISCOVER',cx,cy+95,20,light);this.text(c.goal,cx,cy+179,20,{...light,maxWidth:390});
    this.button('card-back','BACK',cx,cy+247,220,57,()=>a.backMeta(),'purple-button',24,'restart');
  },
  drawItems(){
    const {cx,top,landscape}=this.metaHeader('Spa Wardrobe'),a=this.app;
    this.text('Permanent cosmetic upgrades · Yours to keep',cx,top+155,16,{...light,fitWidth:420});
    ITEMS.forEach((item,i)=>{
      const x=landscape?cx+(i-1)*244:cx,y=top+(landscape?338:259)+i*(landscape?0:175),owned=a.save.items.includes(item.id);
      if(landscape){this.image('reward-tile',x,y,224,321);this.text(item.name,x,y-118,21,{...ink,fitWidth:189,fitHeight:32});this.art(item.art,x,y-45,105,104);}
      else{this.image('bundle-tile',x,y,420,172);this.art(item.art,x-128,y,94,100);this.text(item.name,x+52,y-49,21,{...ink,fitWidth:230,fitHeight:30});}
      const bx=landscape?x:x+50,by=y+(landscape?116:34),equipped=a.save.equipped===item.id;
      this.text(item.detail,bx,y+(landscape?39:-8),15,{...ink,maxWidth:landscape?184:229,fitWidth:landscape?184:229,fitHeight:landscape?61:42});
      const btn=this.button(`item-${item.id}`,equipped?'EQUIPPED':owned?'WEAR IT':'UNLOCK',bx,by,landscape?189:184,landscape?48:43,()=>owned?a.equipItem(item.id):a.watchItem(item.id),owned?'purple-button':'green-button',20,owned?'finish':'ad');
      if(equipped)this.disable(`item-${item.id}`,btn);
    });
    this.button('item-clear','CLASSIC LOOK',cx,top+(landscape?552:724),247,50,()=>a.equipItem(null),'purple-button',22,'restart');
  },
  drawHelp(){
    const a=this.app,hint=a.metaData.kind==='hint',{cx,top,landscape}=this.metaHeader(hint?'A gentle nudge':'Skip this stage'),cy=landscape?292:top+343,key=hint?'hints':'skips';
    this.art(hint?'hint-hand':'symbol-purple-next',cx,cy-45,110,110);
    this.text(hint?'Watch a hand show you the next move.':'Finish this stage and keep your glow.',cx,cy+55,21,{...light,maxWidth:360});
    this.text(`You have ${a.save[key]} ${hint?'hints':'stage skips'}`,cx,cy+112,18,light);
    const stocked=a.save[key]>0,price=ECONOMY.help[hint?'hint':'skip'];
    const use=this.button('help-use',stocked?(hint?'USE A HINT':'USE A SKIP'):`USE ${price} COINS`,cx,cy+176,287,62,()=>a.useHelp(false,!stocked),'purple-button',24,stocked?'finish':'finish');
    if(!stocked&&a.save.coins<price)this.disable('help-use',use);
    this.button('help-watch',hint?'WATCH FOR HINT':'WATCH TO SKIP',cx,cy+254,287,62,()=>a.useHelp(true),'green-button',25,'ad');
  },
  drawModes(){
    const {cx,top,landscape}=this.metaHeader('Little Escapes'),a=this.app;
    MODES.forEach((m,i)=>{const x=landscape?cx+(i-.5)*300:cx,y=top+(landscape?310:300)+i*(landscape?0:239);
      this.metaTile(`mode-${m.id}`,m.name,m.art,x,y,landscape?278:344,216,()=>a.offerMode(m.id),a.save.bonusUnlocked.includes(m.id)?'Ready to play':'Unlock with 1 video');});
    this.text('Two bonus mini games. A little change of pace.',cx,top+(landscape?526:706),17,{...light,maxWidth:400});
  },
  drawModeOffer(){
    const a=this.app,m=MODES.find(m=>m.id===a.metaData.id)||MODES[0],{cx,top,landscape}=this.metaHeader(m.name),cy=landscape?295:top+333,owned=a.save.bonusUnlocked.includes(m.id);
    this.pop(this.art(m.art,cx,cy-13,245,206));this.text(m.description,cx,cy+120,21,{...light,maxWidth:380});
    this.text(owned?`${bonusRoundsLeft(a.save)} free coin rounds left today`:'Watch 1 video to unlock this bonus game',cx,cy+181,17,{...light,maxWidth:400});
    this.button('mode-unlock',owned?(bonusRoundsLeft(a.save)?'PLAY & EARN':'PLAY FOR FUN'):'UNLOCK',cx,cy+252,286,68,()=>a.unlockMode(m.id),'green-button',28,owned?'play':'ad');
    if(owned&&!bonusRoundsLeft(a.save)){this.text('Free practice has no coin rewards.',cx,cy+214,15,light);this.button('mode-earn','WATCH & EARN',cx,cy+327,286,58,()=>a.watchBonusRound(m.id),'purple-button',24,'ad');this.text(m.id==='bubbles'?`Video: 1-10 coins per pop + ${ECONOMY.bonus.bubbleFinish} at the end`:`Video: ${ECONOMY.bonus.adStoneFinish} coins on completion`,cx,cy+370,14,{...light,fitWidth:410});}
  },
  drawBonus(){
    const a=this.app,b=a.bonus,m=MODES.find(m=>m.id===b.id),{cx,top,landscape}=this.metaHeader(m.name);
    this.bubbleSprites=[];this.bonusTip=this.text(m.instruction,cx,top+(landscape?533:664),18,{...ink,maxWidth:420});
    this.bonusCounter=this.text('',cx,top+147,21,ink);
    this.text(b.finished?(b.id==='bubbles'?`Video round: 1-10 per pop + ${ECONOMY.bonus.bubbleFinish} at the end`:`Video round: ${ECONOMY.bonus.adStoneFinish} coins on completion`):b.earnsCoins?(b.id==='bubbles'?`1-10 coins per pop + ${ECONOMY.bonus.bubbleFinish} on completion`:`${b.adRound?ECONOMY.bonus.adStoneFinish:ECONOMY.bonus.stoneFinish} coins on completion`):'FREE PRACTICE - NO COINS',cx,top+179,14,ink);
    if(b.finished){this.bonusTip.setText(`${bonusRoundsLeft(a.save)} free coin rounds left today - Shared by both games`);this.bonusTip.setY(top+(landscape?579:722));this.art(m.art,cx,top+(landscape?290:331),200,190);this.text('A lovely little break!',cx,top+(landscape?404:480),23,ink);
      this.button('bonus-replay',bonusRoundsLeft(a.save)?'PLAY & EARN':'PLAY FOR FUN',cx,top+(landscape?460:566),270,59,()=>a.playBonus(b.id),'purple-button',24,'play');
      this.button('bonus-watch','WATCH & EARN',cx,top+(landscape?525:643),270,59,()=>a.watchBonusRound(b.id),'green-button',24,'ad');return;}

    if(b.id==='bubbles'){
      const cols=landscape?6:3,rows=18/cols;
      for(let i=0;i<18;i++){
        const x=cx+(i%cols-(cols-1)/2)*(landscape?95:105),y=top+(landscape?239:225)+Math.floor(i/cols)*(landscape?90:71);
        if(b.popped.includes(i))continue;const p=this.art('bubble',x,y,67,67).setTint([0xffd5ef,0xd8eaff,0xfdeccf][i%3]);this.bubbleSprites[i]=p;
        this.hit(`bubble-${i}`,'Pop bubble',x,y,72,69,event=>{const l=this.layout;const origin=event.detail?{x:(event.clientX-l.x)/l.scale,y:(event.clientY-l.y)/l.scale}:{x:p.x,y:p.y};a.bonusAction(i,origin);},p);
        if(!a.reducedMotion)this.tweens.add({targets:p,y:y-5,duration:900+i*17,yoyo:true,repeat:-1,ease:'Sine.InOut'});
      }
      this.bonusCounter.setText(`${b.popped.length} / 18 little pops`);
    }else{
      const base=top+(landscape?454:568);this.stoneCenter=cx;this.stoneBase=base;
      this.art('bonus-stones',cx,base+20,145,60).setAlpha(.35);
      this.stackedStones=[];
      for(let i=0;i<b.stacked;i++)this.stackedStones.push(this.art('zen-stone',cx,base-i*35,125-i*8,45));
      this.movingStone=this.art('zen-stone',cx,base-b.stacked*35-64,125-b.stacked*8,44).setTint(b.stacked%2?0xffd8ee:0xffffff);
      this.image('star',cx,base+43,18,18).setAlpha(.6);
      this.button('stone-stack','STACK',cx,top+(landscape?540:712),245,59,()=>a.bonusAction(),'green-button',27,'finish');
      this.bonusTip.setY(top+(landscape?213:640)).setText(b.tip||m.instruction);this.bonusCounter.setText(`${b.stacked} / 5 balanced stones`);
    }
  },
  landStone(){
    const p=this.stackedStones?.at(-1);if(!p||this.app.reducedMotion)return;
    const y=p.y,sx=p.scaleX,sy=p.scaleY;p.y-=60;
    this.tweens.add({targets:p,y,duration:220,ease:'Quad.In',onComplete:()=>{
      if(!p.active)return;this.tweens.add({targets:p,scaleX:sx*1.12,scaleY:sy*.85,duration:100,yoyo:true,ease:'Sine.Out'});
      for(let i=0;i<6;i++){const s=this.art('glint',p.x,p.y,14,14);this.tweens.add({targets:s,x:p.x+Math.cos(i*Math.PI/3)*67,y:p.y+Math.sin(i*Math.PI/3)*28,alpha:0,duration:420,onComplete:()=>s.destroy()});}
    }});
  },
  popBubble(index,coins=0,origin){
    const p=this.bubbleSprites[index];if(!p)return;this.disable(`bubble-${index}`);
    const hit=document.getElementById(`bubble-${index}`);if(hit)for(const name of ['onpointerdown','onpointerup','onpointercancel','onpointerleave','onpointerenter','onfocus','onblur'])hit[name]=null;
    this.tweens.killTweensOf(p);
    this.tweens.add({targets:p,scaleX:p.scaleX*1.35,scaleY:p.scaleY*1.35,alpha:0,duration:180,ease:'Quad.Out',onComplete:()=>p.setVisible(false)});
    this.bonusCounter?.setText(`${this.app.bonus.popped.length} / 18 little pops`);
    if(coins){const label=this.text(`+${coins}`,origin?.x??p.x,origin?.y??p.y,23,{color:'#ffe69b',stroke:'#976524',thickness:2});this.tweens.add({targets:label,y:label.y-45,alpha:0,duration:800,onComplete:()=>label.destroy()});}
    for(let i=0;i<5;i++){const s=this.art('glint',p.x,p.y,14,14);this.tweens.add({targets:s,x:p.x+Math.cos(i*1.26)*45,y:p.y+Math.sin(i*1.26)*45,alpha:0,duration:430,onComplete:()=>s.destroy()});}
  },
  drawReward(){
    const {W,H,landscape}=this.layout,cx=W/2,cy=H/2,d=this.app.metaData;
    this.pop(this.image('panel',cx,cy+6,426,landscape?558:610));this.pop(this.ribbon(d.title,cx,cy-(landscape?235:265),380,true,25));
    this.walletBadge(W-87,27,126);this.coinOrigin={x:cx,y:cy-113};
    const combined={};for(const r of d.rewards||[])if(r){for(const key of ['coins','boxes','hints','skips'])combined[key]=(combined[key]||0)+(r[key]||0);for(const key of ['items','cards'])combined[key]=[...new Set([...(combined[key]||[]),...(r[key]||[])])];}
    const lines=rewardLines(combined);
    if(combined.cards?.length){const card=CARDS.find(c=>c.id===combined.cards[0]);this.royalGlow(cx,cy-126,94);this.image('achievement-frame',cx,cy-125,99,139);this.art(card.art,cx,cy-126,72,92);}
    else this.pop(this.art(d.art||'grand-bundle',cx,cy-125,185,139),70);
    this.text(lines.join('\n')||'Unlocked!',cx,cy+21,lines.length>5?18:22,{...ink,maxWidth:350,fitWidth:350,fitHeight:140});
    this.text(d.extra||'',cx,cy+153,15,{...ink,maxWidth:345});
    this.pop(this.button('reward-continue','LOVELY!',cx,cy+231,253,66,()=>this.app.backMeta(),'green-button',29,'finish'),120);if(this.animate)this.confetti();
  },
  update(time,delta){
    const a=this.app;a.tickPlayGift(delta||16);this.updateChestPresentation();
    this.updateCoinFX(time||this.time.now,delta||16);
    if(this.mode==='card-earned'&&a.cardCelebration&&performance.now()-a.cardCelebration.start>(a.reducedMotion?2200:4500)){a.finishCardCelebration();return;}
    if(this.mode==='daily'&&this.dailyTimer?.active){
      const ready=dailyReady(a.save);if(ready!==this.wasDailyReady){this.render(false);return;}
      if(!ready){const seconds=Math.ceil((86400000-Date.now()%86400000)/1000),h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;this.dailyTimer.setText(`Next gift in ${[h,m,s].map(n=>String(n).padStart(2,'0')).join(':')}`);}
    }
    if(a.reveal){
      const r=a.reveal,t=Math.min(1,(performance.now()-r.start)/r.duration);
      if(this.mode==='wheel'&&this.wheel){this.wheel.angle=(1800+(360-r.index*30)%360)*(1-(1-t)**4);this.wheelPointer.angle=90+Math.sin(this.wheel.angle*Math.PI/15)*5*(1-t);}
      if(this.mode==='boxes'&&this.chest){this.chest.angle=t<.6?Math.sin(t*80)*7*(1-t):0;if(t>.57&&this.chest.texture.key!=='ui-chest-open'){this.chest.setTexture('ui-chest-open');const f=this.chest.texture.getSourceImage(),s=Math.min(245/f.width,230/f.height);this.chest.setDisplaySize(f.width*s,f.height*s);}}
      if(t>=1)a.finishReveal();
    }
    if(this.mode==='bonus'&&a.bonus?.id==='stones'&&!a.bonus.finished&&this.movingStone){this.stoneOffset=Math.sin((performance.now()-a.bonus.start)/680)*146;this.movingStone.x=this.stoneCenter+this.stoneOffset;}
  },
});}
