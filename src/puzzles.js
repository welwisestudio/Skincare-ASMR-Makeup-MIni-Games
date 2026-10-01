import * as Phaser from 'phaser';
import { LEVELS } from './levels.js';
import { RESCUES, DIFFERENCES, MEMO_SETS } from './puzzle-levels.js';

const M=Phaser.Physics.Matter.Matter;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const point=([x,y])=>({x,y});
const shuffled=items=>{const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};

/** Three complete puzzle rulesets, with their own input, timers and display tree. */
export class Puzzle {
 constructor(scene){
  this.s=scene;this.level=scene.level;this.kind=this.level.puzzle;this.root=scene.add.container();scene.root.add(this.root);
  this.width=600;this.height=560;this.status='ready';this.clock=0;this.found=[];this.moves=0;this.disposed=false;
  this.content=scene.add.container();this.root.add(this.content);this.fx=scene.add.container();this.root.add(this.fx);
  if(this.kind==='rescue')this.setupRescue();else if(this.kind==='difference')this.setupDifferences();else this.setupMemo();
 }
 image(key,x,y,w,h=w,parent=this.content,stretch=false){
  const im=this.s.add.image(x,y,this.s.textures.exists(key)?key:`ui-${key}`);parent.add(im);
  if(stretch)im.setDisplaySize(w,h);else{const source=im.texture.getSourceImage();im.setScale(Math.min(w/source.width,h/source.height));}return im;
 }
 text(value,x,y,size=22,parent=this.content){const t=this.s.add.text(x,y,value,{fontFamily:'Nunito',fontStyle:'900',fontSize:size,resolution:3,color:'#684378',stroke:'#fff9f1',strokeThickness:3,padding:{left:4,right:4,top:3,bottom:3},align:'center'}).setOrigin(.5);parent.add(t);return t;}
 burst(x,y,color='glint',count=12){if(this.s.app.reducedMotion)return;for(let i=0;i<count;i++){const im=this.image(color,x,y,12+Math.random()*15,25,this.fx),a=i/count*Math.PI*2;this.s.tweens.add({targets:im,x:x+Math.cos(a)*(40+Math.random()*25),y:y+Math.sin(a)*50-22,alpha:0,angle:90,duration:500+Math.random()*250,onComplete:()=>im.destroy()});}}
 praise(value,x,y){const t=this.text(value,x,y,24,this.fx);this.s.tweens.add({targets:t,y:y-25,alpha:0,duration:850,onComplete:()=>t.destroy()});}
 retry(afterBreak=false){if(this.disposed)return;if(!afterBreak)return this.s.app.transition('retry-stage',()=>this.retry(true));const s=this.s,app=s.app;app.modalName=null;app.unfreeze();s.nextStep(true);app.ui.show('playing');app.progress(0,s.elapsed);}
 fail(message){
  if(this.status==='failed'||this.status==='won')return;this.status='failed';this.s.down=false;this.s.pointerId=null;this.s.gestureHint?.stop();
  this.failureMessage=message;
  const app=this.s.app;app.modalName='puzzle-failed';app.freeze();app.ui.show('puzzle-failed');
 }
 finish(){this.status='won';this.s.gestureHint?.stop();this.failure?.destroy();this.failure=null;this.s.stepProgress=1;this.burst(this.width/2,this.height/2,'heart',20);}
 hit(p,r){return Math.abs(p.x-r.x)<=r.w/2&&Math.abs(p.y-r.y)<=r.h/2;}
 down(p){
  this.press={...p};
  if(this.status==='failed')return;
  if(this.kind==='rescue'){
   if(this.hit(p,{x:536,y:28,w:84,h:48})){this.retry();return;}
   if(this.status==='ready'&&this.validInk(p)){this.status='drawing';this.points=[{...p}];this.s.down=true;this.drawInk();}
  }
 }
 move(p){if(this.kind==='rescue'&&this.status==='drawing')this.appendInk(p);}
 up(p){
  if(this.status==='failed')return;
  if(this.kind==='rescue'){if(this.status==='drawing')this.launch();return;}
  if(!this.press||distance(p,this.press)>22||this.status==='won')return;
  if(this.kind==='difference')this.findDifference(p);else this.flipAt(p);
 }
 release(){this.press=null;if(this.kind==='rescue'&&this.status==='drawing'){
   // Opening a modal or losing a touch cancels the unfinished stroke, never
   // starts a swarm while the player cannot see or control the board.
   this.status='ready';this.points=[];this.usedInk=0;this.drawInk();
  }}
 setupRescue(){
  this.config=RESCUES[this.level.rescue];this.points=[];this.usedInk=0;this.bees=[];this.spawned=0;this.survived=0;this.impactClock=0;this.beePushes=0;this.physicsTime=0;
  this.engine=M.Engine.create({gravity:{x:0,y:1,scale:.001},positionIterations:8,velocityIterations:8});
  this.solids=this.config.platforms.map(p=>{
   if(p.art==='stone'&&p.h>p.w){
    // Stack slabs at their original aspect ratio instead of stretching one
    // horizontal slab into a tall pillar. Keep the authored collision body.
    const source=this.s.textures.get(this.s.textures.exists('puzzle-stone')?'puzzle-stone':'ui-puzzle-stone').getSourceImage();
    const rows=Math.ceil(p.h/(p.w*source.height/source.width)),height=p.h/rows;
    for(let i=0;i<rows;i++)this.image('puzzle-stone',p.x,p.y-p.h/2+(i+.5)*height,p.w,height);
   }else this.image(`puzzle-${p.art}`,p.x,p.y,p.w,p.h,this.content,true);
   return M.Bodies.rectangle(p.x,p.y,p.w,p.h,{isStatic:true,friction:.9});
  });
  this.pets=this.config.pets.map(p=>({sprite:this.image(`puzzle-${p.art}`,p.x,p.y,83,84),body:M.Bodies.circle(p.x,p.y+2,25,{isStatic:true,isSensor:true}),...p}));
  this.hives=this.config.hives.map(p=>this.image('puzzle-hive',p.x,p.y,73,86));
  M.Composite.add(this.engine.world,[...this.solids,...this.pets.map(p=>p.body)]);
  this.ink=this.s.add.graphics();this.content.add(this.ink);
  this.image('progress-track',241,27,327,32,this.content,true);
  this.inkFill=this.s.add.graphics();this.content.add(this.inkFill);
  this.image('puzzle-pencil',48,27,46,46);
  this.counter=this.text('',246,26,19);
  this.image('purple-button',536,28,84,43,this.content,true);this.image('symbol-purple-restart',536,28,23,23);
  this.statusText=this.text('ONE LINE · LIMITED INK',300,-6,16);
  this.drawInk();
 }
 validInk(p){
  if(p.x<13||p.x>587||p.y<66||p.y>510)return false;
  if(this.pets.some(a=>Math.hypot(p.x-a.x,p.y-a.y)<43))return false;
  if(this.config.hives.some(a=>Math.hypot(p.x-a.x,p.y-a.y)<43))return false;
  return !M.Query.point(this.solids,p).length;
 }
 appendInk(p){
  const last=this.points.at(-1);if(!last)return;let d=distance(last,p);if(d<5)return;
  const remain=this.config.ink-this.usedInk;if(remain<=0)return;
  const t=Math.min(1,remain/d),next={x:last.x+(p.x-last.x)*t,y:last.y+(p.y-last.y)*t};d=distance(last,next);
  // Check the whole segment: a fast swipe may not cut through a pet or rock.
  for(let i=1;i<=Math.ceil(d/5);i++){const k=i/Math.ceil(d/5);if(!this.validInk({x:last.x+(next.x-last.x)*k,y:last.y+(next.y-last.y)*k}))return;}
  this.s.app.audio.cue('pencil');const count=Math.ceil(d/11);for(let i=1;i<=count;i++)this.points.push({x:last.x+(next.x-last.x)*i/count,y:last.y+(next.y-last.y)*i/count});
  this.usedInk+=d;this.drawInk();
 }
 drawInk(){
  this.ink.clear();const pts=this.wall?this.relativePoints.map(p=>{const a=this.wall.angle;return{x:this.wall.position.x+p.x*Math.cos(a)-p.y*Math.sin(a),y:this.wall.position.y+p.x*Math.sin(a)+p.y*Math.cos(a)};}):this.points;
  for(const [width,color] of [[17,0x60416d],[11,0xe5aed3],[3,0xffeced]]){
   this.ink.lineStyle(width,color,1).beginPath();pts.forEach((p,i)=>i?this.ink.lineTo(p.x,p.y):this.ink.moveTo(p.x,p.y));this.ink.strokePath();
   if(pts.length){this.ink.fillStyle(color,1).fillCircle(pts[0].x,pts[0].y,width/2).fillCircle(pts.at(-1).x,pts.at(-1).y,width/2);}
  }
  const ratio=Math.max(0,1-this.usedInk/this.config.ink);this.inkFill.clear().fillStyle(0xbbe985,1).fillRoundedRect(98,17,Math.max(1,285*ratio),17,Math.min(8,285*ratio/2));
  this.counter.setText(this.status==='surviving'?`${Math.max(0,10-this.survived).toFixed(1)}s TO SAFETY`:`INK ${Math.round(ratio*100)}%`);
 }
 launch(){
  if(this.points.length<3||this.usedInk<28){this.status='ready';this.points=[];this.usedInk=0;this.drawInk();return;}
  const parts=[];
  for(let i=1;i<this.points.length;i++){const a=this.points[i-1],b=this.points[i],length=distance(a,b);parts.push(M.Bodies.rectangle((a.x+b.x)/2,(a.y+b.y)/2,length+5,16,{angle:Math.atan2(b.y-a.y,b.x-a.x),density:.06,friction:.95}));}
  this.wall=M.Body.create({parts,friction:.95,frictionStatic:1,restitution:.02,density:.06,frictionAir:.025});
  // Compound segments need the inertia of the whole drawn structure, not the
  // sum of tiny segment-local inertias (which makes a roof spin like a pin).
  const bounds=this.wall.bounds;
  M.Body.setInertia(this.wall,this.wall.mass*((bounds.max.x-bounds.min.x)**2+(bounds.max.y-bounds.min.y)**2)/8);
  this.relativePoints=this.points.map(p=>({x:p.x-this.wall.position.x,y:p.y-this.wall.position.y}));
  M.Composite.add(this.engine.world,this.wall);this.status='surviving';this.statusText.setText('KEEP YOUR LITTLE FRIENDS SAFE!');
  this.burst(this.points.at(-1).x,this.points.at(-1).y,'glint',7);
 }
 spawnBee(){
  const i=this.spawned++,h=this.config.hives[i%this.config.hives.length],x=h.x+(i%3-1)*8,y=h.y+34;
  const body=M.Bodies.circle(x,y,8,{restitution:.8,friction:0,frictionAir:.025,density:.00015});
  M.Composite.add(this.engine.world,body);const sprite=this.image('puzzle-bee',x,y,29,28);this.bees.push({body,sprite,seed:i*.83,nextPush:0});
  this.burst(x,y,'glint',3);
 }
 pushShelter(dt){
  if(!this.wall||dt<=0)return;
  // Bees are deliberately light enough to fly. Transfer a small additional
  // contact impulse to the heavy ink at the actual contact point, so an
  // unsupported roof can rock or slide without pressure acting at a distance.
  const contacts=new Map();
  for(const pair of this.engine.pairs.list){
   if(!pair.isActive)continue;
   const a=pair.bodyA.parent,b=pair.bodyB.parent;
   if(a!==this.wall&&b!==this.wall)continue;
   const bee=this.bees.find(bee=>bee.body===(a===this.wall?b:a));
   if(!bee||this.survived<bee.nextPush||contacts.has(bee))continue;
   const hit=pair.collision.supports[0];if(!hit)continue;
   const sign=a===this.wall?1:-1,n=pair.collision.normal;
   contacts.set(bee,{x:hit.x,y:hit.y,nx:n.x*sign,ny:n.y*sign});
  }
  let count=0;
  for(const [bee,hit] of contacts){
   if(count++===3)break;
   bee.nextPush=this.survived+.32+(bee.seed% .13);
   const force=this.wall.mass*.0009*(1/60)/dt;
   M.Body.applyForce(this.wall,hit,{x:hit.nx*force,y:hit.ny*force});
   this.beePushes++;
   if(this.impactClock>.16){this.impactClock=0;this.burst(hit.x,hit.y,'glint',3);}
  }
 }
 updateRescue(dt){
  if(this.status!=='surviving')return;
  // Fixed ticks keep contact pressure and shelter stability identical across displays.
  this.physicsTime+=Math.min(dt,1/15);
  while(this.physicsTime>=1/60){this.physicsTime-=1/60;this.simulateRescue(1/60);}
 }
 simulateRescue(dt){
  if(this.status!=='surviving'||this.survived>=10)return;
  this.survived+=dt;this.impactClock+=dt;
  if(this.spawned<15&&this.survived>this.spawned*.20)this.spawnBee();
  for(const b of this.bees){
   const p=b.body.position,target=this.pets.reduce((best,a)=>distance(a,p)<distance(best,p)?a:best,this.pets[0]);
   const dx=target.x-p.x,dy=target.y-p.y,d=Math.max(1,Math.hypot(dx,dy)),wiggle=Math.sin(this.survived*4+b.seed);
   // Steering, gravity compensation and physical collisions keep bees outside
   // a closed wall. No point-in-polygon or scripted success shortcuts.
   const force=.00014*b.body.mass;
   M.Body.applyForce(b.body,p,{x:dx/d*force+dy/d*wiggle*force*.48,y:dy/d*force-dx/d*wiggle*force*.48-b.body.mass*.001});
   const speed=Math.hypot(b.body.velocity.x,b.body.velocity.y);if(speed>2.8)M.Body.setVelocity(b.body,{x:b.body.velocity.x/speed*2.8,y:b.body.velocity.y/speed*2.8});
  }
  this.pushShelter(dt);
  M.Engine.update(this.engine,dt*1000);
  for(const b of this.bees){const p=b.body.position;b.sprite.setPosition(p.x,p.y).setFlipX(b.body.velocity.x<0).setAngle(Math.sin(this.survived*24+b.seed)*8);if(this.pets.some(a=>M.Collision.collides(b.body,a.body))){this.burst(p.x,p.y,'petal',9);this.fail('A bee slipped through. Try another line.');return;}}
  this.pets.forEach(p=>p.sprite.setAngle(Math.sin(this.survived*12)*1.5));
  this.drawInk();this.s.stepProgress=Math.min(.99,this.survived/10);
  if(this.survived>=10){this.pets.forEach(p=>{p.sprite.setAngle(0);this.burst(p.x,p.y,'heart');this.s.tweens.add({targets:p.sprite,y:p.y-16,duration:200,yoyo:true,repeat:1,ease:'Sine.Out'});});this.statusText.setText('SAFE & SNUG!');this.s.stepProgress=1;}
 }
 setupDifferences(){
  this.diff=DIFFERENCES[this.level.theme];this.status='searching';this.found=[];this.wrongClock=0;
  this.panels=[0,1].map(side=>{
   const g=this.s.add.container();this.content.add(g);const frame=this.image('panel',0,0,565,428,g,true),bg=this.image(`puzzle-diff-${this.level.theme}`,0,0,540,405,g,true);
   const shadows=this.s.add.graphics();g.add(shadows);
   const items=this.diff.objects.map(o=>{const changed=side===1;
    const im=this.image(changed&&o.change==='replace'?o.replacement:o.key,0,0,o.w,o.h,g,!!o.flat).setOrigin(.5,1);
    if(changed&&o.change==='missing')im.setVisible(false);
    if(changed&&o.change==='color')im.setTint(0x9dc9fa);
    if(changed&&o.change==='flip')im.setFlipX(true);
    if(changed&&o.change==='small')im.setScale(im.scaleX*.60,im.scaleY*.60);
    return im;
   });
   const marks=this.s.add.graphics();g.add(marks);const label=this.text(side?'B':'A',0,0,21);
   return{g,frame,bg,shadows,items,marks,label};
  });
  this.counter=this.text('0 / 5 DIFFERENCES',300,23,24);this.layoutDifferences();
 }
 layoutDifferences(){
  const wide=!!this.s.app.ui?.layout.landscape;this.width=wide?1160:600;this.height=wide?510:940;
  this.counter.setPosition(this.width/2,23);
  this.panels.forEach((p,side)=>{
   const x=wide?290+side*580:300,y=wide?287:264+side*451;p.g.setPosition(x,y);p.label.setPosition(wide?x:x-250,y-229);
   p.shadows.clear();p.items.forEach((im,i)=>{const o=this.diff.objects[i],x=(o.x-.5)*540,y=(o.foot-.5)*405;im.setPosition(x,y);
    if(im.visible&&o.shadow!==false){p.shadows.fillStyle(0x65465e,.12).fillEllipse(x,y-1,im.displayWidth*.75,Math.min(5,im.displayWidth*.14));}
   });
   p.marks.clear();this.found.forEach(i=>{const q=this.diff.points[i],x=(q[0]-.5)*540,y=(q[1]-.5)*405;p.marks.lineStyle(7,0x6c4678,1).strokeCircle(x,y,37);p.marks.lineStyle(4,0xcfff9b,1).strokeCircle(x,y,37);});
  });
 }
 findDifference(p){
  for(const panel of this.panels){
   const nx=(p.x-panel.g.x)/540+.5,ny=(p.y-panel.g.y)/405+.5;if(nx<0||nx>1||ny<0||ny>1)continue;
   const i=this.diff.points.findIndex(([x,y])=>Math.hypot((nx-x)*540,(ny-y)*405)<40);
   if(i>=0){if(this.found.includes(i)){this.praise('Already spotted!',p.x,p.y);return;}this.s.app.audio.cue('compare');this.found.push(i);this.s.stepProgress=this.found.length/5;
    this.counter.setText(`${this.found.length} / 5 DIFFERENCES`);this.layoutDifferences();for(const q of this.panels){const v=this.diff.points[i];this.burst(q.g.x+(v[0]-.5)*540,q.g.y+(v[1]-.5)*405,'glint',9);}return;
   }
   if(this.wrongClock<=0){this.wrongClock=.45;const cross=this.text('×',p.x,p.y,36,this.fx).setColor('#c46a94');this.s.tweens.add({targets:cross,alpha:0,scale:1.3,duration:500,onComplete:()=>cross.destroy()});}
  }
 }
 setupMemo(){
  this.status='matching';this.remaining=this.level.limit;this.matchCount=0;this.selected=[];this.busy=false;
  const set=MEMO_SETS[this.level.theme];this.deck=shuffled(set.flatMap((key,pair)=>[{key,pair},{key,pair}]));
  const source=this.s.textures.get(`ui-puzzle-back-${this.level.theme}`).getSourceImage();
  const w=this.level.columns===3?117:111,h=w*source.height/source.width;
  this.cards=this.deck.map((item,i)=>{
   const x=0,y=0,g=this.s.add.container();this.content.add(g);
   const back=this.image(`puzzle-back-${this.level.theme}`,0,0,w,h,g,true),front=this.image('reward-tile',0,0,w,h,g,true).setVisible(false),face=this.image(item.key,0,0,w*.75,h*.65,g).setVisible(false);
   return {...item,x,y,w,h,g,back,front,face,open:false,matched:false};
  });
  this.counter=this.text(`0 / ${set.length} PAIRS`,150,26,23);this.timer=this.text(`${this.remaining}s`,475,26,23);this.movesText=this.text('0 turns',315,26,20);
  this.layoutMemo();
 }
 layoutMemo(){
  const wide=!!this.s.app.ui?.layout.landscape,columns=wide?this.cards.length/2:this.level.columns,rows=this.cards.length/columns;
  const {w,h}=this.cards[0],gapX=15,gapY=13,gridWidth=columns*w+(columns-1)*gapX,gridHeight=rows*h+(rows-1)*gapY;
  // Grow the board to fit portrait cards, then scale the whole board uniformly.
  // Wide screens use two rows so the cards remain comfortably sized.
  this.width=Math.max(600,gridWidth+60);this.height=Math.max(wide?0:560,gridHeight+86);
  const top=73+(this.height-86-gridHeight)/2;
  this.cards.forEach((c,i)=>{c.x=(this.width-gridWidth)/2+w/2+i%columns*(w+gapX);c.y=top+h/2+Math.floor(i/columns)*(h+gapY);c.g.setPosition(c.x,c.y);});
  this.counter.setPosition(this.width*.25,26);this.movesText.setPosition(this.width*.525,26);this.timer.setPosition(this.width*.79,26);
 }
 turn(card,open,done){
  card.open=open;const flip=()=>{card.back.setVisible(!open);card.front.setVisible(open);card.face.setVisible(open);};
  if(this.s.app.reducedMotion){flip();done?.();return;}
  this.s.tweens.add({targets:card.g,scaleX:.03,duration:125,ease:'Sine.In',onComplete:()=>{if(this.disposed)return;flip();this.s.tweens.add({targets:card.g,scaleX:1,duration:155,ease:'Back.Out',onComplete:()=>{if(!this.disposed)done?.();}});}});
 }
 flipAt(p){
  if(this.busy)return;const card=this.cards.find(c=>this.hit(p,c));if(!card||card.matched||card.open)return;
  this.s.app.audio.cue('fold');this.busy=true;this.selected.push(card);this.turn(card,true,()=>{
   if(this.status!=='matching')return;
   if(this.selected.length===1){this.busy=false;return;}
   const [a,b]=this.selected;this.moves++;this.movesText.setText(`${this.moves} turns`);
   if(a.pair===b.pair){a.matched=b.matched=true;this.matchCount++;this.s.stepProgress=this.matchCount/(this.cards.length/2);this.counter.setText(`${this.matchCount} / ${this.cards.length/2} PAIRS`);
    for(const c of [a,b]){this.burst(c.x,c.y);this.s.tweens.add({targets:c.g,y:c.y-10,scaleX:1.07,scaleY:1.07,duration:180,yoyo:true,ease:'Sine.Out',onComplete:()=>{if(!this.disposed)c.g.setAlpha(.65);}});}
    this.selected=[];this.busy=false;
   }else{for(const c of [a,b])this.s.tweens.add({targets:c.g,angle:4,duration:90,yoyo:true,repeat:2});this.mismatchWait=.85;}
  });
 }
 update(dt){
  this.clock+=dt;this.wrongClock=Math.max(0,(this.wrongClock||0)-dt);
  if(this.kind==='rescue')this.updateRescue(dt);
  if(this.kind==='memo'&&this.status==='matching'){
   if(this.matchCount<this.cards.length/2){this.remaining=Math.max(0,this.remaining-dt);this.timer.setText(`${Math.ceil(this.remaining)}s`);if(this.remaining===0){this.fail('A fresh shuffle. You can do this!');return;}}
   if(this.mismatchWait>0){this.mismatchWait-=dt;if(this.mismatchWait<=0){const [a,b]=this.selected;this.turn(a,false);this.turn(b,false,()=>{this.selected=[];this.busy=false;});}}
  }
 }
 hintPlan(){
  if(this.status==='failed')return null;
  if(this.kind==='rescue')return this.status==='ready'?{kind:'trace',points:this.config.solution.map(point),instruction:'Draw this shelter in one stroke. Lift your finger to start.'}:null;
  if(this.kind==='difference'){const i=this.diff.points.findIndex((_,i)=>!this.found.includes(i));if(i<0)return null;const p=this.diff.points[i],panel=this.panels[1];return{kind:'tap',points:[{x:panel.g.x+(p[0]-.5)*540,y:panel.g.y+(p[1]-.5)*405}],instruction:'Compare this little detail. Tap the difference here.'};}
  if(this.busy)return null;
  const first=this.selected[0]||this.cards.find(c=>!c.matched),second=this.cards.find(c=>!c.matched&&c!==first&&c.pair===first?.pair);
  return first&&second?{kind:this.selected.length?'tap':'tap-pair',points:(this.selected.length?[second]:[first,second]).map(c=>({x:c.x,y:c.y})),instruction:'Tap these matching cards, one after the other.'}:null;
 }
 capture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=600;const ctx=canvas.getContext('2d');
  const source=this.s.textures.get(`ui-${this.level.hero}`).getSourceImage(),scale=Math.min(510/source.width,510/source.height);ctx.drawImage(source,(600-source.width*scale)/2,(600-source.height*scale)/2,source.width*scale,source.height*scale);return canvas;
 }
 debug(){return{kind:this.kind,status:this.status,width:this.width,height:this.height,found:[...this.found],panels:this.panels?.map(p=>({x:p.g.x,y:p.g.y})),points:this.points,ink:this.usedInk,survived:this.survived,beePushes:this.beePushes,remaining:this.remaining,moves:this.moves,cards:this.cards?.map(({x,y,w,h,pair,open,matched})=>({x,y,w,h,pair,open,matched})),bees:this.bees?.map(b=>({...b.body.position})),wall:this.wall&&{...this.wall.position,angle:this.wall.angle}};}
 destroy(){this.disposed=true;if(this.engine){M.Composite.clear(this.engine.world,false);M.Engine.clear(this.engine);}this.root.destroy();}
}

export function installPuzzles(Scene){
 const p=Scene.prototype,base=Object.fromEntries(['begin','showWelcome','nextStep','onDown','onMove','onUp','release','update','finishStep','capturePortrait','debugState','refreshAccessory','resize'].map(k=>[k,p[k]]));
 const stop=s=>{s.puzzle?.destroy();s.puzzle=null;};
 p.begin=function(index){stop(this);if(LEVELS[index].kind!=='puzzle')return base.begin.call(this,index);
  base.showWelcome.call(this);this.clear();this.runId=(this.runId||0)+1;this.levelIndex=index;this.level=LEVELS[index];this.stepIndex=0;this.elapsed=0;this.active=true;this.frozen=false;this.transitioning=false;this.character='puzzle';
  for(const o of [this.portrait,...this.eyes,this.accessory,this.layer,this.patchLayer,this.guide,this.tool,this.targetText])o.setVisible(false);
  this.puzzle=new Puzzle(this);this.step=this.level.steps[0];this.mode='puzzle';this.stepProgress=0;this.app.stepChanged(this.level,0,this.step);this.resize();
 };
 p.showWelcome=function(){stop(this);return base.showWelcome.call(this);};
 p.nextStep=function(first=false){if(!this.puzzle)return base.nextStep.call(this,first);stop(this);this.release();this.puzzle=new Puzzle(this);this.step=this.level.steps[0];this.stepProgress=0;this.transitioning=false;this.app.stepChanged(this.level,0,this.step);this.resize();};
 p.onDown=function(pointer){if(!this.puzzle)return base.onDown.call(this,pointer);if(!this.active||this.frozen||this.transitioning||this.pointerId!==null)return;this.pointerId=pointer.id;this.local=this.world(pointer);this.puzzle.down(this.local);};
 p.onMove=function(pointer){if(!this.puzzle)return base.onMove.call(this,pointer);if(pointer.id!==this.pointerId)return;this.local=this.world(pointer);this.puzzle.move(this.local);};
 p.onUp=function(pointer){if(!this.puzzle)return base.onUp.call(this,pointer);if(pointer.id!==this.pointerId||this.frozen)return;this.local=this.world(pointer);this.puzzle.up(this.local);this.down=false;this.pointerId=null;};
 p.release=function(){if(!this.puzzle)return base.release.call(this);this.puzzle.release();this.down=false;this.pointerId=null;};
 p.update=function(time,delta){if(!this.puzzle)return base.update.call(this,time,delta);if(!this.active||this.frozen)return;const dt=Math.min(delta/1000,.05);if(this.transitioning)return;this.elapsed+=dt;this.puzzle.update(dt);this.app.progress(this.stepProgress,this.elapsed);if(this.stepProgress>=.999)this.finishStep();};
 p.finishStep=function(){if(!this.puzzle)return base.finishStep.call(this);if(this.transitioning)return;this.transitioning=true;this.release();this.puzzle.finish();this.app.progress(1,this.elapsed);const run=this.runId;this.time.delayedCall(1000,()=>{if(run!==this.runId||!this.active)return;this.active=false;this.transitioning=false;this.app.completed(this.levelIndex,this.elapsed);});};
 p.capturePortrait=function(asCanvas=false){if(!this.puzzle)return base.capturePortrait.call(this,asCanvas);const c=this.puzzle.capture();return asCanvas?c:c.toDataURL('image/webp',.9);};
 p.debugState=function(){return{...base.debugState.call(this),puzzle:this.puzzle?.debug()};};
 p.refreshAccessory=function(){if(!this.puzzle)return base.refreshAccessory.call(this);};
 p.resize=function(){base.resize.call(this);if(!this.puzzle||!this.app.ui?.layout)return;const l=this.app.ui.layout,hint=this.gestureHint?.active;
  if(this.puzzle.kind==='difference')this.puzzle.layoutDifferences();
  if(this.puzzle.kind==='memo')this.puzzle.layoutMemo();
  const top=l.landscape?(this.puzzle.kind==='difference'?140:111):196,bottom=l.H-(l.landscape?112:205),fit=Math.min((l.W-22)/this.puzzle.width,(bottom-top)/this.puzzle.height)*l.pixelScale;
  this.fit=fit;this.root.setScale(fit).setPosition(l.x*this.app.pixelRatio+l.W/2*l.pixelScale-this.puzzle.width/2*fit,l.y*this.app.pixelRatio+(top+bottom)/2*l.pixelScale-this.puzzle.height/2*fit);
  if(hint)this.gestureHint.start();
 };
}
