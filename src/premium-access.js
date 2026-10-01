import {LEVELS,LEVEL_ORDER,levelNumber} from './levels.js';
import {unlocked} from './save.js';
import {randomIndex} from './meta-content.js';

export function campaignDestination(save,index){
 const remaining=LEVEL_ORDER.filter(i=>!save.premiumSkipped.includes(i)&&save.stars[i]===0);
 const next=remaining.find(i=>levelNumber(i)>levelNumber(index))??remaining[0];
 if(next!==undefined)return next;
 const replay=LEVEL_ORDER.filter(i=>i!==index&&!save.premiumSkipped.includes(i)&&unlocked(save,i));
 return replay.length?replay[randomIndex(replay.length)]:LEVEL_ORDER[0];
}

export function installPremiumAccess(App){Object.assign(App.prototype,{
 offerPremium(index,source='menu'){
  if(!LEVELS[index]?.premium)return;
  this.openMeta('premium-offer',{index,source});
 },
 claimPremium(){
  const {index}=this.metaData;
  if(!LEVELS[index]?.premium||this.save.premiumSkipped.includes(index)||this.rewardBusy)return;
  if(unlocked(this.save,index)){this.start(index);return;}
  this.rewarded('premium-'+LEVELS[index].id,()=>{
   if(!this.save.premiumUnlocked.includes(index))this.save.premiumUnlocked.push(index);
   this.persist();this.start(index);
  });
 },
 skipPremium(){
  const {index,source}=this.metaData;
  if(!LEVELS[index]?.premium||this.rewardBusy||unlocked(this.save,index))return;
  if(!this.save.premiumSkipped.includes(index))this.save.premiumSkipped.push(index);
  this.persist();this.backMeta();
  if(source==='campaign')this.continueCampaign(index);
 },
 continueCampaign(index,afterBreak=false){
  return this.start(campaignDestination(this.save,index),'campaign',afterBreak);
 },
});}

export function installPremiumUI(UI){Object.assign(UI.prototype,{
 premiumCard(index,x,y,w,h){
  const level=LEVELS[index],a=this.app,expired=a.save.premiumSkipped.includes(index),open=unlocked(a.save,index);
  const g=this.add.container(x,y);this.root.add(g);
  this.image('vip-frame',0,0,w,h,g);
  this.art(level.hero,0,-h*.04,w*.65,h*.52,g);
  if(expired)this.image('vip-frame',0,0,w,h,g).setTint(0x000000).setAlpha(.65);
  this.text(expired?'MISSED':'VIP',0,-h*.30,Math.max(12,h*.09),{color:'#fff1ae',stroke:'#78502e',thickness:2,fitWidth:w*.6},g);
  if(!expired&&!open){this.art('ad-badge',-w*.17,h*.18,w*.19,h*.14,g);this.text('WATCH',w*.10,h*.18,Math.max(11,h*.07),{color:'#fff7d1',stroke:'#775033',fitWidth:w*.44},g);}
  if(open)for(let i=0;i<3;i++)this.image('star',(i-1)*w*.17,h*.34,w*.17,w*.17,g).setAlpha(a.save.stars[index]>i?1:.3);
  this.text(String(levelNumber(index)),w*.30,h*.35,Math.min(21,h*.11),{color:'#725080',stroke:'#fff0b9',fitWidth:w*.15},g);
  this.hit(`level-card-${index}`,`${level.name}. VIP. ${expired?'Missed permanently':open?'Play':'Watch a video to unlock'}`,x,y,w,h,()=>open?a.start(index):a.offerPremium(index),g,{level:index});
  this.pop(g,70);
 },
 drawPremiumOffer(){
  const a=this.app,index=a.metaData.index,level=LEVELS[index],expired=a.save.premiumSkipped.includes(index),open=unlocked(a.save,index);
  const {W,H,landscape}=this.layout,cx=W/2,top=landscape?15:(H-740)/2;
  this.ribbon('Your VIP Experience',cx,top+51,380,true,28);
  this.icon('meta-close','back','Return without deciding',W-34,34,46,()=>a.backMeta());
  const x=landscape?cx-228:cx,y=top+(landscape?315:286),w=landscape?255:229,h=landscape?353:318;
  this.royalGlow(x,y,landscape?152:130);this.image('vip-frame',x,y,w,h);this.art(level.hero,x,y-h*.035,w*.68,h*.54);
  this.text('VIP EXCLUSIVE',x,y-h*.30,20,{color:'#fff1ae',stroke:'#78502e',fitWidth:w*.64});
  this.text('PREMIUM',x,y+h*.33,18,{color:'#77512e',stroke:'#fff1ae',fitWidth:w*.65});
  const bx=landscape?cx+179:cx,ty=top+(landscape?187:472);
  this.text(level.name,bx,ty,28,{color:'#fff1b9',stroke:'#715080',thickness:3,fitWidth:landscape?365:420});
  this.text(level.subtitle,bx,ty+43,19,{color:'#fff9ec',stroke:'#715080',maxWidth:345,fitWidth:345,fitHeight:48});
  this.text(expired?'This invitation was skipped permanently.':open?'Your VIP experience is permanently unlocked.':'Watch one video to keep this VIP experience forever.',bx,ty+96,19,{color:'#fff9ec',stroke:'#715080',maxWidth:345,fitWidth:345,fitHeight:56});
  const by=ty+167;
  if(!expired)this.button('premium-watch',open?'PLAY VIP':'WATCH & UNLOCK',bx,by,330,69,()=>a.claimPremium(),'green-button',26,open?'play':'ad');
  else this.button('premium-return','BACK TO LEVELS',bx,by,310,65,()=>a.openLevels(),'purple-button',23,'levels');
  if(!expired&&!open){
   this.text('SKIP FOREVER',bx,by+61,18,{color:'#e4d3e6',stroke:'#584166',fitWidth:320});
   this.hit('premium-skip','Skip this VIP level permanently',bx,by+61,310,35,()=>a.skipPremium());
   this.text('Skipping removes this level from your journey.',bx,by+90,13,{color:'#fff3db',stroke:'#715080',fitWidth:420});
  }
 },
});}
