import {LEVELS} from './levels.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=v=>Math.max(0,Math.min(1,v));
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

// Six tactile rulesets for the twelve authored VIP keepsakes.
export class PremiumRitual{
 constructor(s){this.s=s;this.root=s.add.container();s.root.add(this.root);this.decorations=[];this.enter();}
 art(key,x,y,w,h=w,parent=this.stage){const im=this.s.add.image(x,y,this.s.textures.exists(key)?key:'ui-'+key),src=im.texture.getSourceImage();im.setScale(Math.min(w/src.width,h/src.height));parent.add(im);return im;}
 text(value,x,y,size=21){const t=this.s.add.text(x,y,value,{fontFamily:'Nunito',fontStyle:'900',fontSize:size,resolution:3,color:'#735080',align:'center',stroke:'#fff8eb',strokeThickness:2,wordWrap:{width:510}}).setOrigin(.5);this.stage.add(t);return t;}
 spot(u,v){return{x:300+(u-.5)*this.hero.displayWidth,y:240+(v-.5)*this.hero.displayHeight};}
 enter(){
  this.release();if(this.stage){for(const o of this.stage.list)this.s.tweens.killTweensOf(o);this.stage.destroy();}
  this.stage=this.s.add.container();this.root.add(this.stage);this.mode=this.s.step.mechanic;this.clock=0;this.targets=[];this.items=[];this.traceIndex=0;this.held=false;this.last=null;
  const mat=this.s.add.graphics();mat.fillStyle(0xffedc7,.33).fillEllipse(300,410,420,55);this.stage.add(mat);
  this.hero=this.art(this.s.level.hero,300,240,365,340);this.adornments=this.decorations.map(d=>({...d,sprite:this.art(d.key,d.x,d.y,43,43)}));this.g=this.s.add.graphics();this.stage.add(this.g);
  const settings=this.s.level.settings.map(([u,v])=>this.spot(u,v));
  if(this.mode==='polish')this.targets=settings.map(p=>({...p,v:0}));
  if(this.mode==='place')this.items=settings.map((p,i)=>({x:135+i*330/Math.max(1,settings.length-1),y:488,tx:p.x,ty:p.y,done:false,sprite:this.art(i%2?'world-pearl':'world-gem',135+i*330/Math.max(1,settings.length-1),488,43,43)}));
  if(this.mode==='trace'){
   // An engraved flourish follows the width of the authored object.
   const rx=this.hero.displayWidth*.30,ry=this.hero.displayHeight*.25;
   this.path=Array.from({length:45},(_,i)=>({x:300-Math.cos(i/44*Math.PI*1.8)*rx,y:245+Math.sin(i/44*Math.PI*1.8)*ry}));
  }
  if(this.mode==='rotate'){this.rotation=-(.7+(this.s.levelIndex%4)*.32);this.hero.setRotation(this.rotation);this.radius=Math.max(this.hero.displayWidth,this.hero.displayHeight)/2+28;}
  if(this.mode==='blend'){
   this.recipe=[2+this.s.levelIndex%3,2+(this.s.levelIndex+1)%3,2+(this.s.levelIndex+2)%3];this.drops=[0,0,0];this.bottles=[150,300,450].map((x,i)=>({x,y:486,sprite:this.art('royal-serum',x,486,68,86).setTint([0xffb8d5,0xd0b7ff,0xffe18e][i]),label:this.text('',x,552,19)}));
  }
  if(this.mode==='sequence'){
   this.pattern=Array.from({length:4},(_,i)=>(this.s.levelIndex+[0,2,1,3][i])%4);this.sequenceIndex=0;this.showUntil=3.5;this.flash=-1;
   this.gems=[135,245,355,465].map((x,i)=>({x,y:484,sprite:this.art('world-gem',x,484,65,65).setTint([0xffaac6,0xb8e5ff,0xceabff,0xffdf80][i])}));
   this.art('purple-button',510,44,124,46);this.text('REPLAY',510,42,18);
  }
  this.caption=this.text('',300,596,20);this.draw();
 }
 down(p){
  this.held=true;this.last={...p};
  if(this.mode==='rotate'&&dist(p,{x:300,y:240})<this.radius+35)this.angle=Math.atan2(p.y-240,p.x-300);
  if(this.mode==='place')this.drag=this.items.find(t=>!t.done&&dist(p,t.sprite)<42);
 }
 move(p){
  if(!this.held)return;
  if(this.drag)this.drag.sprite.setPosition(p.x,p.y);
  if(this.mode==='rotate'&&this.angle!==null){
   const a=Math.atan2(p.y-240,p.x-300);this.rotation+=angleDelta(a,this.angle);this.angle=a;this.hero.setRotation(this.rotation);
   if(Math.abs(angleDelta(this.rotation,0))<.075){this.rotation=0;this.hero.setRotation(0);this.s.stepProgress=1;this.held=false;}
  }
  if(this.mode==='trace'){const next=this.path[this.traceIndex];if(next&&dist(p,next)<32){this.traceIndex++;this.s.stepProgress=this.traceIndex/this.path.length;}}
  if(this.mode==='polish'&&this.last){const travel=Math.min(35,dist(p,this.last));for(const t of this.targets)if(dist(p,t)<42)t.v=clamp(t.v+travel/210);this.s.stepProgress=this.targets.reduce((sum,t)=>sum+t.v,0)/this.targets.length;}
  this.last={...p};this.draw();
 }
 up(p){
  if(this.drag){const t=this.drag;if(dist(p,{x:t.tx,y:t.ty})<45){t.done=true;t.sprite.setPosition(t.tx,t.ty);this.s.sparkle(t.tx,t.ty,8);this.decorations.push({key:t.sprite.texture.key,x:t.tx,y:t.ty});}else t.sprite.setPosition(t.x,t.y);this.s.stepProgress=this.items.filter(t=>t.done).length/this.items.length;}
  if(this.mode==='blend'){const i=this.bottles.findIndex(b=>dist(p,b)<45);if(i>=0){this.drops[i]=(this.drops[i]+1)%(this.recipe[i]+2);this.s.careEffect(this.bottles[i].x,440,'serum-drop');this.s.stepProgress=this.drops.every((v,i)=>v===this.recipe[i])?1:this.drops.reduce((n,v,i)=>n+Math.min(v,this.recipe[i])/this.recipe[i],0)/3*.9;}}
  if(this.mode==='sequence'){
   if(dist(p,{x:510,y:44})<65){this.replay();}
   else if(this.clock>=this.showUntil){const i=this.gems.findIndex(t=>dist(p,t)<43);if(i>=0){this.flash=i;this.flashUntil=this.clock+.25;if(i===this.pattern[this.sequenceIndex]){this.sequenceIndex++;this.s.sparkle(this.gems[i].x,484,5);this.s.stepProgress=this.sequenceIndex/this.pattern.length;}else this.replay();}}
  }
  this.release();this.draw();
 }
 replay(){this.sequenceIndex=0;this.s.stepProgress=0;this.showUntil=this.clock+3.5;}
 release(){if(this.drag&&!this.drag.done)this.drag.sprite.setPosition(this.drag.x,this.drag.y);this.drag=null;this.held=false;this.last=null;this.angle=null;}
 update(dt){this.clock+=dt;if(this.mode==='sequence')this.draw();}
 draw(){
  const g=this.g;g.clear();
  if(this.mode==='polish')for(const t of this.targets){g.fillStyle(0x75506f,(1-t.v)*.6).fillEllipse(t.x,t.y,46,30);g.lineStyle(3,0xffe4a6,.9).strokeCircle(t.x,t.y,29);}
  if(this.mode==='place')for(const t of this.items)if(!t.done){g.fillStyle(0x8b5d82,.35).fillCircle(t.tx,t.ty,24);g.lineStyle(3,0xffe4a6,1).strokeCircle(t.tx,t.ty,25);}
  if(this.mode==='trace'){
   g.lineStyle(4,0xfff4c6,.55).beginPath();this.path.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.strokePath();
   g.lineStyle(6,0xe9b543,1).beginPath();this.path.slice(0,this.traceIndex).forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.strokePath();const p=this.path[this.traceIndex];if(p)g.lineStyle(4,0xc4f3aa,1).strokeCircle(p.x,p.y,19);
  }
  if(this.mode==='rotate'){
   for(const d of this.adornments){const x=d.x-300,y=d.y-240;d.sprite.setPosition(300+x*Math.cos(this.rotation)-y*Math.sin(this.rotation),240+x*Math.sin(this.rotation)+y*Math.cos(this.rotation)).setRotation(this.rotation);}
   g.lineStyle(3,0xcdb68b,.75).strokeCircle(300,240,this.radius);
   g.fillStyle(0xffd764,1).fillTriangle(288,240-this.radius-12,312,240-this.radius-12,300,240-this.radius+5);
   const x=300+Math.sin(this.rotation)*this.radius,y=240-Math.cos(this.rotation)*this.radius;g.lineStyle(5,0xffd764,1).strokeCircle(x,y,12);
  }
  if(this.mode==='blend')this.bottles.forEach((b,i)=>{b.label.setText(`${this.drops[i]} / ${this.recipe[i]} drops`);b.label.setColor(this.drops[i]===this.recipe[i]?'#568147':'#735080');});
  if(this.mode==='sequence'){
   const showing=this.clock<this.showUntil,t=3.5-(this.showUntil-this.clock),index=Math.floor((t-.4)/.7),lit=showing&&t>.4&&(t-.4)%.7<.44?this.pattern[index]:this.clock<this.flashUntil?this.flash:-1;
   this.gems.forEach((gem,i)=>gem.sprite.setAlpha(lit===i?1:.5));if(lit>=0&&lit<4)g.lineStyle(5,0xffe489,1).strokeCircle(this.gems[lit].x,484,39);
   this.caption?.setText(showing?'Watch the sparkling order':`${this.sequenceIndex} / 4  ·  Your turn`);
  }else this.caption?.setText(this.mode==='rotate'?'Turn until both gold markers meet':this.mode==='blend'?'One tap = one drop · Extra taps reset the bottle':`${Math.round(this.s.stepProgress*100)}%  ·  A little royal care`);
 }
 finish(){if(this.mode==='place')for(const t of this.items)if(!t.done){t.done=true;t.sprite.setPosition(t.tx,t.ty);this.decorations.push({key:t.sprite.texture.key,x:t.tx,y:t.ty});}for(const d of this.adornments)d.sprite.setPosition(d.x,d.y).setRotation(0);this.hero.setRotation(0);this.g.clear();this.s.sparkle(300,240,24);}
 hintPlan(){
  if(this.mode==='place'){const t=this.items.find(t=>!t.done);return t&&{kind:'drag',points:[{x:t.sprite.x,y:t.sprite.y},{x:t.tx,y:t.ty}],instruction:'Drag this jewel into the golden setting.'};}
  if(this.mode==='polish'){const t=this.targets.find(t=>t.v<1);return t&&{kind:'circle',points:Array.from({length:33},(_,i)=>({x:t.x+Math.cos(i/32*Math.PI*2)*18,y:t.y+Math.sin(i/32*Math.PI*2)*18})),instruction:'Rub small circles on this dusty spot.'};}
  if(this.mode==='trace')return{kind:'trace',points:this.path.slice(this.traceIndex),instruction:'Follow the glowing engraving.'};
  if(this.mode==='rotate')return{kind:'drag',points:Array.from({length:25},(_,i)=>{const a=this.rotation*(1-i/24);return{x:300+Math.sin(a)*this.radius,y:240-Math.cos(a)*this.radius};}),instruction:'Turn the treasure until the gold markers meet.'};
  if(this.mode==='blend'){const i=this.drops.findIndex((v,i)=>v!==this.recipe[i]);return i<0?null:{kind:'tap',points:[this.bottles[i]],instruction:'Tap this ingredient to match its recipe.'};}
  return this.clock<this.showUntil?null:{kind:'tap',points:[this.gems[this.pattern[this.sequenceIndex]]],instruction:'This gem is next in the sequence.'};
 }
 capture(){const c=document.createElement('canvas');c.width=600;c.height=640;const ctx=c.getContext('2d'),src=this.hero.texture.getSourceImage();ctx.drawImage(src,300-this.hero.displayWidth/2,310-this.hero.displayHeight/2,this.hero.displayWidth,this.hero.displayHeight);for(const d of this.decorations)ctx.drawImage(this.s.textures.get(d.key).getSourceImage(),d.x-21,d.y+70-21,42,42);return c;}
 destroy(){for(const o of this.stage.list)this.s.tweens.killTweensOf(o);this.root.destroy();}
}

export function installPremiumScene(Scene){
 const p=Scene.prototype,base=Object.fromEntries(['begin','showWelcome','nextStep','onDown','onMove','onUp','release','update','finishStep','capturePortrait','refreshAccessory','resize'].map(k=>[k,p[k]]));
 const stop=s=>{s.premiumRitual?.destroy();s.premiumRitual=null;};
 p.begin=function(index){stop(this);if(!LEVELS[index].premium)return base.begin.call(this,index);base.showWelcome.call(this);this.clear();this.runId=(this.runId||0)+1;this.levelIndex=index;this.level=LEVELS[index];this.stepIndex=0;this.elapsed=0;this.active=true;this.frozen=false;this.transitioning=false;this.character='premium';for(const o of [this.portrait,...this.eyes,this.accessory,this.layer,this.patchLayer,this.guide,this.tool,this.targetText])o.setVisible(false);this.step=this.level.steps[0];this.stepProgress=0;this.mode='premium';this.premiumRitual=new PremiumRitual(this);this.app.stepChanged(this.level,0,this.step);this.resize();};
 p.showWelcome=function(){stop(this);return base.showWelcome.call(this);};
 p.nextStep=function(first=false){if(!this.premiumRitual)return base.nextStep.call(this,first);this.release();this.step=this.level.steps[this.stepIndex];this.stepProgress=0;this.transitioning=false;this.premiumRitual.enter();this.app.stepChanged(this.level,this.stepIndex,this.step);this.resize();};
 p.onDown=function(pointer){if(!this.premiumRitual)return base.onDown.call(this,pointer);if(!this.active||this.frozen||this.transitioning||this.pointerId!==null)return;this.pointerId=pointer.id;this.local=this.world(pointer);this.premiumRitual.down(this.local);this.premiumRitual.move(this.local);};
 p.onMove=function(pointer){if(!this.premiumRitual)return base.onMove.call(this,pointer);if(pointer.id!==this.pointerId||this.frozen)return;this.local=this.world(pointer);this.premiumRitual.move(this.local);};
 p.onUp=function(pointer){if(!this.premiumRitual)return base.onUp.call(this,pointer);if(pointer.id!==this.pointerId||this.frozen)return;this.local=this.world(pointer);this.premiumRitual.up(this.local);this.down=false;this.pointerId=null;};
 p.release=function(){if(!this.premiumRitual)return base.release.call(this);this.premiumRitual.release();this.down=false;this.pointerId=null;};
 p.update=function(time,delta){if(!this.premiumRitual)return base.update.call(this,time,delta);if(!this.active||this.frozen||this.transitioning)return;const dt=Math.min(delta/1000,.05);this.elapsed+=dt;this.premiumRitual.update(dt);this.app.progress((this.stepIndex+this.stepProgress)/this.level.steps.length,this.elapsed);if(this.stepProgress>=.999)this.finishStep();};
 p.finishStep=function(){if(!this.premiumRitual)return base.finishStep.call(this);if(this.transitioning)return;this.transitioning=true;this.release();this.premiumRitual.finish();this.app.progress((this.stepIndex+1)/this.level.steps.length,this.elapsed);const run=this.runId;this.time.delayedCall(850,()=>{if(run!==this.runId||!this.active)return;this.stepIndex++;if(this.stepIndex===this.level.steps.length){this.active=false;this.transitioning=false;this.app.completed(this.levelIndex,this.elapsed);}else this.nextStep();});};
 p.capturePortrait=function(asCanvas=false){if(!this.premiumRitual)return base.capturePortrait.call(this,asCanvas);const c=this.premiumRitual.capture();return asCanvas?c:c.toDataURL('image/webp',.9);};
 p.refreshAccessory=function(){if(!this.premiumRitual)return base.refreshAccessory.call(this);};
 p.resize=function(){base.resize.call(this);if(!this.premiumRitual||!this.app.ui?.layout)return;const l=this.app.ui.layout,top=l.landscape?111:196,bottom=l.H-(l.landscape?167:205),fit=Math.min((l.W-24)/600,(bottom-top)/640)*l.pixelScale;this.fit=fit;this.root.setScale(fit).setPosition(l.x*this.app.pixelRatio+l.W/2*l.pixelScale-300*fit,l.y*this.app.pixelRatio+(top+bottom)/2*l.pixelScale-320*fit);};
}

