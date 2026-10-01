import { LEVELS } from './levels.js';

const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const xy=([x,y])=>({x,y});
const sample=points=>points.flatMap((a,i)=>{
 const b=points[i+1];if(!b)return [xy(a)];const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/10);
 return Array.from({length:n},(_,j)=>({x:a[0]+(b[0]-a[0])*j/n,y:a[1]+(b[1]-a[1])*j/n}));
});

/** Seven interactive chapters, with an independently owned display tree. */
export class Romance {
 constructor(scene){
  this.s=scene;this.level=scene.level;this.root=scene.add.container();scene.root.add(this.root);
  this.disposed=false;this.width=600;this.height=650;this.enter();
 }
 image(key,x,y,w,h=w,parent=this.stage,stretch=false){
  const im=this.s.add.image(x,y,this.s.textures.exists(key)?key:`ui-${key}`);parent.add(im);
  if(stretch)im.setDisplaySize(w,h);else{const src=im.texture.getSourceImage();im.setScale(Math.min(w/src.width,h/src.height));}return im;
 }
 text(value,x,y,size=22,parent=this.stage){
  const t=this.s.add.text(x,y,value,{fontFamily:'Nunito',fontStyle:'900',fontSize:size,resolution:3,color:'#734e82',stroke:'#fff9f0',strokeThickness:3,align:'center',padding:{left:5,right:5,top:4,bottom:4}}).setOrigin(.5);parent.add(t);return t;
 }
 killTree(node){if(!node)return;for(const c of [...(node.list||[])])this.killTree(c);this.s.tweens.killTweensOf(node);}
 burst(x,y,key='glint',count=12){
  if(this.s.app.reducedMotion||this.disposed)return;
  for(let i=0;i<count;i++){const p=this.image(key,x,y,14+Math.random()*13,28,this.fx),angle=i/count*Math.PI*2;
   this.s.tweens.add({targets:p,x:x+Math.cos(angle)*(40+Math.random()*40),y:y+Math.sin(angle)*50-20,alpha:0,angle:80,duration:600+Math.random()*250,onComplete:()=>p.destroy()});}
 }
 praise(value,x=300,y=220){const t=this.text(value,x,y,29,this.fx);this.s.tweens.add({targets:t,y:y-30,alpha:0,duration:1100,onComplete:()=>t.destroy()});}
 actor(state){this.hero?.destroy();this.hero=this.image(state==='styled'?this.jewelledTexture():`romance-${this.level.theme}-${state}`,300,294,562,600);this.actorState=state;return this.hero;}
 swap(state){
  const old=this.hero;this.hero=null;const next=this.actor(state);this.stage.moveBelow(next,this.guides);
  if(old?.active){if(this.s.app.reducedMotion)old.destroy();else{next.setAlpha(0);this.s.tweens.add({targets:next,alpha:1,duration:280});this.s.tweens.add({targets:old,alpha:0,duration:280,onComplete:()=>old.destroy()});}}
  this.burst(300,240,'glint',20);
 }
 action(label,y=600){
  const wedding=this.mode==='wedding',w=450,h=100;
  const g=this.s.add.container(300,y);this.stage.add(g);this.image('green-button',0,0,w,h,g,true);
  const text=this.text(label,0,-2,29,g),iconSize=wedding?43:30,gap=14;
  const width=text.width+iconSize+gap;
  this.image(wedding?'heart':'symbol-green-next',-width/2+iconSize/2,-2,iconSize,iconSize,g);
  text.x=width/2-text.width/2;
  this.actionButton=g;this.actionHit={x:300,y,w,h};return g;
 }
 enter(){
  this.release();this.killTree(this.stage);this.stage?.destroy();this.stage=this.s.add.container();this.root.add(this.stage);
  this.mode=this.s.step.mechanic;this.clock=0;this.fxClock=0;this.lastFx=-1;this.targets=[];this.paths=[];this.items=[];this.hearts=[];this.drag=null;this.pathDrag=false;this.actionButton=null;this.actionHit=null;this.hero=null;this.cursor=null;this.zip=null;this.accepted=false;this.ready=false;
  this.guides=this.s.add.graphics();this.stage.add(this.guides);this.fx=this.s.add.container();this.stage.add(this.fx);
  if(['proposal','wedding'].includes(this.mode))this.setupStory();else{
   this.image('panel',300,291,390,568,this.stage,true).setAlpha(.38).setTint(this.level.color);
   this.actor({wash:'before',hair:'clean',dress:'hair',press:'dress',stitch:'dress',jewels:'dress',compare:'styled'}[this.mode]);
   this.nameplate=this.text(this.level.girl,300,15,23);
   if(this.mode==='wash')this.setupWash();
   if(this.mode==='hair')this.setupHair();
   if(['press','stitch'].includes(this.mode))this.setupTailoring();
   if(this.mode==='dress')this.item(`romance-${this.level.theme}-gown`,80,335,300,300,119,181);
   if(this.mode==='jewels')this.setupJewels();
   if(this.mode==='compare')this.setupCompare();
   this.counter=this.text('',300,this.mode==='compare'?532:619,21);
  }
  this.stage.bringToTop(this.guides);this.stage.bringToTop(this.fx);
 }
 jewelLayout(){
  // Landmarks are in the 600 x 640 heroine artwork, shared by placement and comparison.
  const [x,neck,crown]={rose:[300,172,53],pearl:[310,177,53],violet:[301,180,52],cherry:[303,172,49],sunflower:[302,173,51],winter:[313,176,49],amber:[308,176,53],moon:[299,193,76],coral:[314,179,54],emerald:[309,173,50]}[this.level.theme];
  return [{key:'romance-necklace',x,y:neck,w:46,h:62},{key:'romance-tiara',x,y:crown,w:92,h:50}];
 }
 jewelledTexture(){
  const key=`romance-${this.level.theme}-equipped`;
  if(!this.s.textures.exists(key)){
   const src=this.s.textures.get(`ui-romance-${this.level.theme}-dress`).getSourceImage();
   const texture=this.s.textures.createCanvas(key,src.width,src.height),ctx=texture.getContext();ctx.drawImage(src,0,0);
   for(const j of this.jewelLayout()){
    const art=this.s.textures.get(`ui-${j.key}`).getSourceImage(),scale=Math.min(j.w/art.width,j.h/art.height),w=art.width*scale,h=art.height*scale;
    ctx.drawImage(art,j.x-w/2,j.y-h/2,w,h);
   }
   texture.refresh();
  }
  return key;
 }
 setupJewels(){
  this.jewelLayout().forEach((j,index)=>{
   const x=this.hero.x+(j.x-this.hero.displayOriginX)*this.hero.scaleX,y=this.hero.y+(j.y-this.hero.displayOriginY)*this.hero.scaleY;
   const i=this.item(j.key,index?515:80,index?160:290,x,y,index?88:86,index?67:86);
   const art=i.sprite.texture.getSourceImage();i.equippedScale=Math.min(j.w/art.width,j.h/art.height)*this.hero.scaleX;
   i.ghost.setScale(i.equippedScale);
  });
 }
 setupWash(){
  const offset=(this.level.variant%3-1)*8;
  this.targets=[[273,224],[331,289],[269,369],[325,443],[305,135]].map(([x,y],i)=>({x:x+offset,y,v:0,done:false,visual:this.image('powder-stroke',x+offset,y,45,35).setTint(0x72523e).setAlpha(.85).setAngle(i*51)}));
  // Anchor the perforated shower face, not the handle or sprite center.
  this.cursor=this.image('romance-shower',470,420,160,170).setOrigin(.73,.25).setAngle(-25);
 }
 showerPoint(u,v){
  const c=this.cursor;
  return c.getLocalTransformMatrix().transformPoint((u-c.originX)*c.width,(v-c.originY)*c.height);
 }
 setupHair(){
  const shift=(this.level.variant%3-1)*10;
  const short=this.level.theme==='winter'||this.level.theme==='moon';
  this.paths=[[[266,90],[243+shift,143],[249+shift,short?186:230]],[[300,60],[326,105],[343+shift,short?165:228]],[[324,77],[347+shift,127],[350+shift,short?175:240]]].map(p=>({points:sample(p),index:0,done:false}));
  this.cursor=this.image('romance-brush',480,400,154,190);
 }
 setupTailoring(){
  const routes=this.mode==='press'?[[[269,306],[259,379],[234,484]],[[292,304],[288,390],[277,504]],[[314,304],[326,394],[328,505]],[[337,310],[354,384],[370,484]]]:[[[267,318],[246,391],[228,474]],[[339,318],[357,391],[378,474]],[[233,488],[272,507],[324,516],[370,494]]];
  this.paths=routes.map(p=>({points:sample(p),index:0,done:false}));this.cursor=this.image(this.s.step.tool,483,431,128,150);
 }
 item(key,x,y,tx,ty,w,h){
  this.image('reward-tile',x,y,w+28,h+28).setAlpha(.82);
  const sprite=this.image(key,x,y,w,h),ghost=this.image(key,tx,ty,w*.60,h*.60).setAlpha(.18);
  const i={key,x,y,tx,ty,w,h,sprite,ghost,done:false};this.items.push(i);return i;
 }
 setupCompare(){
  this.nameplate.setVisible(false);this.hero.setPosition(300,256).setDisplaySize(465,496);
  this.before=this.image(`romance-${this.level.theme}-before`,300,256,465,496,this.stage,true);
  this.text('AFTER',155,15,21);this.text('BEFORE',445,15,21);
  this.slider=.5;this.minSlide=.5;this.maxSlide=.5;
  this.knob=this.image('hint',300,506,59,59);this.knob.setTexture('ui-purple-button').setDisplaySize(69,44);
  this.knobLabel=this.text('< >',300,506,25);
  this.action(this.level.premium?'KEEP THIS LOOK':'HER NEXT CHAPTER').setVisible(false);this.drawCompare();
 }
 drawCompare(){
  // The finished look occupies the left side; the original occupies the right.
  // Moving the handle right reveals more of the finished look.
  const before=this.before.frame,after=this.hero.frame;
  const beforeCut=Math.round(before.realWidth*this.slider),afterCut=Math.round(after.realWidth*this.slider);
  this.before.setCrop(beforeCut,0,before.realWidth-beforeCut,before.realHeight);
  this.hero.setCrop(0,0,afterCut,after.realHeight);
  const x=67.5+465*this.slider;this.knob.setPosition(x,506);this.knobLabel.setPosition(x,506);
 }
 setupStory(){
  const frameY=274,frameW=480,frameH=530,photoY=frameY-frameH*.045;
  this.image('polaroid',300,frameY,frameW,frameH,this.stage,true);
  this.image('celebration',300,photoY,frameW*.77,frameH*.61,this.stage,true);
  this.story=this.image(`romance-${this.level.theme}-${this.mode}`,300,photoY,frameW*.75,frameH*.59);
  this.image('polaroid-front',300,frameY,frameW,frameH,this.stage,true);
  if(this.mode==='wedding')for(let i=0;i<3;i++)this.image('star',300+(i-1)*frameW*.18,frameY+frameH*.35,frameW*.17,frameW*.17);
  if(this.mode==='proposal'){
   this.text('Will you marry me?',300,0,29);
   this.image('heart',300,304,64,64).setAlpha(.40);
   this.item('romance-ring',300,602,300,304,72,77);
  }else{
   this.text('Happily ever after',300,0,29);
   this.action('KEEP THIS MOMENT').setAlpha(.45);
   this.hearts=[[115,183],[474,190],[440,410]].map(([x,y])=>({x,y,done:false,sprite:this.image('heart',x,y,52,52)}));
   this.burst(300,125,'petal',28);
  }
 }
 inside(p,r){return Math.abs(p.x-r.x)<=r.w/2&&Math.abs(p.y-r.y)<=r.h/2;}
 down(p){
  this.press={...p};this.previous={...p};this.s.down=true;
  if(this.mode==='compare'&&p.y>45&&p.y<522){this.sliding=true;this.slide(p);return;}
  const i=this.items.find(i=>!i.done&&this.inside(p,{x:i.sprite.x,y:i.sprite.y,w:Math.max(76,i.w+14),h:Math.max(76,i.h+14)}));
  if(i){this.s.tweens.killTweensOf(i.sprite);this.drag=i;this.stage.bringToTop(i.sprite);return;}
  if(['hair','press','stitch'].includes(this.mode)||this.zip){const path=this.zip||this.paths.find(v=>!v.done);if(path&&dist(p,path.points[path.index])<40)this.pathDrag=true;}
 }
 slide(p){
  this.slider=clamp((p.x-67.5)/465);if(this.slider>=.985)this.slider=1;this.minSlide=Math.min(this.minSlide,this.slider);this.maxSlide=Math.max(this.maxSlide,this.slider);this.drawCompare();
  this.ready=this.slider===1;this.s.stepProgress=this.ready?.85:.6*this.slider;
  this.actionButton.setVisible(this.ready);this.counter?.setText(this.ready?'A beautiful new chapter':'Slide right to reveal her new look');
 }
 move(p){
  if(this.drag){this.drag.sprite.setPosition(clamp(p.x,20,580),clamp(p.y,35,625));return;}
  if(this.sliding){this.slide(p);return;}
  const path=this.zip||this.paths.find(v=>!v.done);
  // Hair strokes re-engage while the same press is held: the player can
  // enter a strand, leave it and continue with the next without clicking again.
  if((this.pathDrag||(['hair','press','stitch'].includes(this.mode)&&this.s.down))&&path&&!path.done){
   // Sample the swipe segment, requiring ordered points instead of jumping to its end.
   const prev=this.previous||p,n=Math.max(1,Math.ceil(dist(prev,p)/7));
   for(let j=1;j<=n;j++){const q={x:prev.x+(p.x-prev.x)*j/n,y:prev.y+(p.y-prev.y)*j/n};let steps=0;
    while(path.index<path.points.length&&dist(q,path.points[path.index])<(this.mode==='hair'?32:26)&&steps++<5)path.index++;
   }
   if(path.index>=path.points.length){path.done=true;path.index=path.points.length-1;this.pathDrag=false;this.burst(p.x,p.y);}
   this.s.stepProgress=this.zip?.45+.55*(path.index/(path.points.length-1)):(this.paths.filter(v=>v.done).length+(path.done?0:path.index/path.points.length))/this.paths.length;
   if(this.mode==='hair'&&this.s.time.now-this.lastFx>95){this.burst(p.x,p.y,'glint',2);this.lastFx=this.s.time.now;}
  }
  this.previous={...p};
 }
 up(p){
  if(this.drag){const i=this.drag;this.drag=null;
   if(dist(p,{x:i.tx,y:i.ty})<65){
    i.done=true;i.ghost.setVisible(false);i.sprite.setPosition(i.tx,i.ty);this.burst(i.tx,i.ty,'glint',15);
    if(this.mode==='dress'){i.sprite.setVisible(false);this.swap('dress');this.zip={points:sample([[303,305],[301,264],[300,220],[300,184]]),index:0,done:false};this.s.stepProgress=.45;this.praise('A perfect fit!',300,342);}
    if(this.mode==='jewels'){i.sprite.setScale(i.equippedScale);this.s.stepProgress=this.items.filter(v=>v.done).length/this.items.length;if(this.s.stepProgress<1)this.praise('Lovely!',i.tx,i.ty+65);}
    if(this.mode==='proposal'){i.sprite.setVisible(false);this.accepted=true;this.s.stepProgress=1;this.praise('YES!',300,215);this.burst(300,290,'heart',28);}
   }else this.returnItem(i);
  }else if(this.press&&dist(p,this.press)<30){
   if(this.mode==='compare'&&this.ready&&this.inside(p,this.actionHit))this.s.stepProgress=1;
   if(this.mode==='wedding'){
    const heart=this.hearts.find(v=>!v.done&&dist(p,v)<40);if(heart){heart.done=true;heart.sprite.setVisible(false);this.burst(heart.x,heart.y,'heart',14);}
    if(this.clock>=3&&this.inside(p,this.actionHit))this.s.stepProgress=1;
   }
  }
  this.sliding=false;this.pathDrag=false;this.press=null;this.previous=null;
 }
 returnItem(i){this.s.tweens.add({targets:i.sprite,x:i.x,y:i.y,duration:230,ease:'Back.Out'});}
 release(){if(this.drag&&!this.drag.done)this.returnItem(this.drag);this.drag=null;this.sliding=false;this.pathDrag=false;this.press=null;this.previous=null;}
 update(dt){
  this.clock+=dt;this.fxClock+=dt;const p=this.s.local;
  if(this.s.down&&this.mode==='wash'){
   this.cursor.setPosition(p.x,p.y);
   const t=this.targets.find(v=>!v.done&&dist(p,v)<40);
   if(t){t.v=clamp(t.v+dt*1.15);t.visual.setAlpha(.85*(1-t.v));if(t.v>=1){t.done=true;this.burst(t.x,t.y);}
    this.s.stepProgress=this.targets.reduce((n,v)=>n+v.v,0)/this.targets.length;
   }
   if(this.fxClock>.09){
    this.fxClock=0;
    if(t){const foam=this.image('foam-puff',p.x+(Math.random()-.5)*24,p.y,26+Math.random()*18,34,this.fx);this.s.tweens.add({targets:foam,y:p.y-35,scaleX:foam.scaleX*1.4,scaleY:foam.scaleY*1.4,alpha:0,duration:550,onComplete:()=>foam.destroy()});}
    // Sample actual nozzle holes through the sprite's scale and rotation.
    // Water keeps flowing while pressed, including between dirty patches.
    [[.65,.23],[.74,.27],[.83,.31]].forEach(([u,v],i)=>{
     const outlet=this.showerPoint(u,v),drop=this.image('serum-drop',outlet.x,outlet.y,7,14,this.fx).setTint(0xb9e4ef).setAngle(-12);
     this.s.tweens.add({targets:drop,x:outlet.x+10+i*5,y:outlet.y+48+i*5,alpha:0,duration:280+i*25,onComplete:()=>drop.destroy()});
    });
   }
  }
  if(['hair','press','stitch'].includes(this.mode)&&this.s.down)this.cursor.setPosition(p.x+17,p.y+16).setAngle(-15);
  if(this.mode==='wedding'){
   if(this.clock>=3){this.ready=true;this.actionButton.setAlpha(1);}
   if(this.fxClock>.45){this.fxClock=0;this.burst(65+Math.random()*470,55,'petal',3);}
   if(!this.s.app.reducedMotion)this.hearts.filter(v=>!v.done).forEach((v,i)=>v.sprite.setScale(v.sprite.scaleX*(1+(Math.sin(this.clock*3+i)*.002))));
  }
  this.draw();
 }
 draw(){
  const g=this.guides;g.clear();const pulse=1+Math.sin(this.clock*5)*.06;
  const ring=(x,y,r=27)=>{g.lineStyle(6,0x785482,.7).strokeCircle(x,y,r*pulse);g.lineStyle(3,0xfff8df,1).strokeCircle(x,y,r*pulse);};
  if(this.mode==='wash')for(const t of this.targets)if(!t.done){ring(t.x,t.y,27);g.lineStyle(5,0xbde8a4,1).beginPath().arc(t.x,t.y,23,-Math.PI/2,-Math.PI/2+t.v*Math.PI*2).strokePath();}
  if(this.mode==='wash')this.counter.setText(`${this.targets.filter(t=>t.done).length} / 5 fresh little spots`);
  const path=this.zip||this.paths.find(v=>!v.done);
  if(path&&!path.done){for(let i=path.index;i<path.points.length;i+=2)g.fillStyle(0xa27ca8,.9).fillCircle(path.points[i].x,path.points[i].y,3);const q=path.points[path.index];ring(q.x,q.y,20);}
  if(['press','stitch'].includes(this.mode)){this.counter.setText(`${this.paths.filter(v=>v.done).length} / ${this.paths.length} ${this.mode==='press'?'creases smoothed':'seams finished'}`);for(const line of this.paths){const from=this.mode==='press'?line.index:0,to=this.mode==='press'?line.points.length:line.index;for(let i=from;i<to-1;i+=2){const a=line.points[i],b=line.points[i+1];g.lineStyle(this.mode==='press'?2:3,this.mode==='press'?0x95738f:0xfff5da,.7).lineBetween(a.x,a.y,b.x,b.y);}}}
  if(this.mode==='hair')this.counter.setText(`${this.paths.filter(v=>v.done).length} / 3 silky strands`);
  if(this.mode==='dress')this.counter.setText(this.zip?'Pull the zipper up':'Drag her dress to the glowing outline');
  if(this.mode==='jewels')this.counter.setText(`${this.items.filter(v=>v.done).length} / 2 finishing touches`);
  for(const i of this.items)if(!i.done)ring(i.tx,i.ty,this.mode==='dress'?47:32);
  if(this.mode==='compare'){const x=67.5+465*this.slider;g.lineStyle(6,0x795081,1).lineBetween(x,55,x,516);g.lineStyle(3,0xfff7e8,1).lineBetween(x,55,x,516);}
 }
 finish(){
  this.release();this.guides.clear();this.cursor?.setVisible(false);this.counter?.setText('');
  for(const t of this.targets)t.visual.setVisible(false);
  for(const i of this.items){if(this.mode==='jewels'){i.sprite.setPosition(i.tx,i.ty).setScale(i.equippedScale).setVisible(true);}else i.sprite.setVisible(false);i.ghost.setVisible(false);}
  const state={wash:'clean',hair:'hair',dress:'dress',press:'dress',stitch:'dress',jewels:'styled'}[this.mode];if(state)this.swap(state);
  if(this.mode==='proposal'&&!this.accepted){this.praise('YES!',300,215);this.burst(300,290,'heart',28);}
  if(this.mode==='wedding')this.burst(300,210,'heart',30);
 }
 hintPlan(){
  if(this.mode==='wash'){const t=this.targets.find(v=>!v.done);return t&&{kind:'rub',points:Array.from({length:25},(_,i)=>({x:t.x+Math.cos(i/12*Math.PI*2)*15,y:t.y+Math.sin(i/12*Math.PI*2)*15})),instruction:'Hold and wash this glowing patch in gentle circles.'};}
  const path=this.zip||this.paths.find(v=>!v.done);if(path&&!path.done)return{kind:'trace',points:path.points.slice(path.index).map(p=>({...p})),instruction:this.zip?'Hold the zipper. Pull it all the way up.':['press','stitch'].includes(this.mode)?'Follow the line from the glowing starting point.':'Keep holding and brush down the glow. Move to the next strand without lifting.'};
  const i=this.items.find(v=>!v.done);if(i)return{kind:'drag',points:[{x:i.sprite.x,y:i.sprite.y},{x:i.tx,y:i.ty}],ghost:{key:i.sprite.texture.key,width:i.sprite.displayWidth,height:i.sprite.displayHeight},instruction:this.mode==='proposal'?'Hold the ring. Drag it into the glowing heart.':'Hold the accessory. Drag it onto its glowing outline.'};
  if(this.mode==='compare')return this.ready?{kind:'tap',points:[{x:this.actionHit.x,y:this.actionHit.y}],instruction:this.level.premium?'Tap to save the finished look.':'Tap to turn the page and meet her sweetheart.'}:{kind:'drag',points:[{x:this.knob.x,y:506},{x:532.5,y:506}],instruction:'Slide the handle right to reveal her new look.'};
  if(this.mode==='wedding')return{kind:'tap',points:[{x:this.actionHit.x,y:this.actionHit.y}],instruction:this.ready?'Tap to keep this wedding memory.':'A lovely wedding moment. The button opens in a moment.'};
  return null;
 }
 refreshAccessory(){/* Narrative jewels are authored per heroine. */}
 capture(){const c=document.createElement('canvas');c.width=c.height=600;const ctx=c.getContext('2d'),src=this.s.textures.get(this.level.premium?this.jewelledTexture():`ui-romance-${this.level.theme}-wedding`).getSourceImage(),scale=Math.min(600/src.width,600/src.height);ctx.drawImage(src,(600-src.width*scale)/2,(600-src.height*scale)/2,src.width*scale,src.height*scale);return c;}
 debug(){return{mechanic:this.mode,actor:this.actorState,clock:this.clock,ready:this.ready,slider:this.slider,minSlide:this.minSlide,maxSlide:this.maxSlide,targets:this.targets.map(({x,y,v,done})=>({x,y,v,done})),paths:this.paths.map(({points,index,done})=>({points,index,done})),zip:this.zip,items:this.items.map(({x,y,tx,ty,done})=>({x,y,tx,ty,done})),hearts:this.hearts.map(({x,y,done})=>({x,y,done}))};}
 destroy(){this.disposed=true;this.killTree(this.root);this.root.destroy();}
}

export function installRomance(Scene){
 const p=Scene.prototype,base=Object.fromEntries(['begin','showWelcome','nextStep','onDown','onMove','onUp','release','update','finishStep','capturePortrait','debugState','refreshAccessory','resize'].map(k=>[k,p[k]]));
 const stop=s=>{s.romance?.destroy();s.romance=null;};
 p.begin=function(index){stop(this);if(LEVELS[index].kind!=='romance')return base.begin.call(this,index);
  base.showWelcome.call(this);this.clear();this.runId=(this.runId||0)+1;this.levelIndex=index;this.level=LEVELS[index];this.stepIndex=0;this.elapsed=0;this.active=true;this.frozen=false;this.transitioning=false;this.character='romance';
  for(const o of [this.portrait,...this.eyes,this.accessory,this.layer,this.patchLayer,this.guide,this.tool,this.targetText])o.setVisible(false);
  this.step=this.level.steps[0];this.mode='romance';this.stepProgress=0;this.romance=new Romance(this);this.app.stepChanged(this.level,0,this.step);this.resize();
 };
 p.showWelcome=function(){stop(this);return base.showWelcome.call(this);};
 p.nextStep=function(first=false){if(!this.romance)return base.nextStep.call(this,first);this.release();this.step=this.level.steps[this.stepIndex];this.stepProgress=0;this.transitioning=false;this.romance.enter();this.app.stepChanged(this.level,this.stepIndex,this.step);this.resize();};
 p.onDown=function(pointer){if(!this.romance)return base.onDown.call(this,pointer);if(!this.active||this.frozen||this.transitioning||this.pointerId!==null)return;this.pointerId=pointer.id;this.local=this.world(pointer);this.romance.down(this.local);};
 p.onMove=function(pointer){if(!this.romance)return base.onMove.call(this,pointer);if(pointer.id!==this.pointerId||this.frozen)return;this.local=this.world(pointer);this.romance.move(this.local);};
 p.onUp=function(pointer){if(!this.romance)return base.onUp.call(this,pointer);if(pointer.id!==this.pointerId||this.frozen)return;this.local=this.world(pointer);this.romance.up(this.local);this.down=false;this.pointerId=null;};
 p.release=function(){if(!this.romance)return base.release.call(this);this.romance.release();this.down=false;this.pointerId=null;};
 p.update=function(time,delta){if(!this.romance)return base.update.call(this,time,delta);if(!this.active||this.frozen||this.transitioning)return;const dt=Math.min(delta/1000,.05);this.elapsed+=dt;this.romance.update(dt);this.app.progress((this.stepIndex+this.stepProgress)/this.level.steps.length,this.elapsed);if(this.stepProgress>=.999)this.finishStep();};
 p.finishStep=function(){if(!this.romance)return base.finishStep.call(this);if(this.transitioning)return;this.transitioning=true;this.release();this.romance.finish();this.app.progress((this.stepIndex+1)/this.level.steps.length,this.elapsed);const run=this.runId;
  this.time.delayedCall(this.step.mechanic==='proposal'?1550:650,()=>{if(run!==this.runId||!this.active)return;this.stepIndex++;if(this.stepIndex===this.level.steps.length){this.active=false;this.transitioning=false;this.app.completed(this.levelIndex,this.elapsed);}else this.nextStep();});
 };
 p.capturePortrait=function(asCanvas=false){if(!this.romance)return base.capturePortrait.call(this,asCanvas);const c=this.romance.capture();return asCanvas?c:c.toDataURL('image/webp',.9);};
 p.debugState=function(){return{...base.debugState.call(this),romance:this.romance?.debug()};};
 p.refreshAccessory=function(){if(!this.romance)return base.refreshAccessory.call(this);return this.romance.refreshAccessory();};
 p.resize=function(){base.resize.call(this);if(!this.romance||!this.app.ui?.layout)return;const l=this.app.ui.layout,hint=this.gestureHint?.active,top=l.landscape?111:196,bottom=l.H-(l.landscape?112:205),fit=Math.min((l.W-22)/600,(bottom-top)/650)*l.pixelScale;
  this.fit=fit;this.root.setScale(fit).setPosition(l.x*this.app.pixelRatio+l.W/2*l.pixelScale-300*fit,l.y*this.app.pixelRatio+(top+bottom)/2*l.pixelScale-325*fit);if(hint)this.gestureHint.start();
 };
}
