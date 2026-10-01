import { installPremiumScene } from './premium-ritual.js';
import { installWorkshop } from './workshop.js';
import { installPuzzles } from './puzzles.js';
import { installRomance } from './romance.js';
import { installHints } from './hints.js';
import * as Phaser from 'phaser';
import { LEVELS, PACE } from './levels.js';
import { MENU_ASSETS, queueAssets } from './asset-loading.js';
import { CareFeedback } from './feedback.js';

const SIZE=600;
const clamp=Phaser.Math.Clamp;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const ellipse=(x,y,cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2<1;
const FACE={
  cat:{size:740,ox:-70,oy:-70,cx:300,cy:347,rx:139,ry:183,eyeY:330,eyeDX:79,mouthY:452,mouthW:51,top:153},
  frog:{size:700,ox:-50,oy:-43,cx:300,cy:349,rx:151,ry:194,eyeY:340,eyeDX:80,mouthY:468,mouthW:57,top:150},
  bunny:{size:680,ox:-40,oy:-18,cx:300,cy:359,rx:132,ry:176,eyeY:352,eyeDX:76,mouthY:464,mouthW:51,top:186},
};

export class SpaScene extends Phaser.Scene {
  constructor(controller){super('Spa');this.app=controller;this.active=false;this.frozen=false;this.stepIndex=0;this.local={x:300,y:560};this.down=false;this.pointerId=null;this.particles=[];this.transitioning=false;this.effectId=0;}
  preload(){
    this.load.on('progress',p=>{const bar=document.querySelector('#load-progress');if(bar)bar.textContent=`Loading… ${Math.round(p*100)}%`;});
    const onError=file=>this.app.loadError(file.key);
    this.load.on('loaderror',onError);
    this.load.once('complete',()=>this.load.off('loaderror',onError));
    queueAssets(this,MENU_ASSETS);
  }
  create(){
    this.background=this.add.image(0,0,'ui-tiles');
    this.root=this.add.container(0,0);
    this.decor=this.add.graphics();this.root.add(this.decor);
    this.portrait=this.add.image(300,300,'cat');this.root.add(this.portrait);
    this.eyes=['left','right'].map(()=>{const eye=this.add.image(0,0,'__WHITE').setVisible(false);this.root.add(eye);return eye;});
    this.accessory=this.add.image(390,140,'ui-rose-bow').setVisible(false);this.root.add(this.accessory);
    this.texture=this.textures.createCanvas('treatment',SIZE,SIZE);this.ctx=this.texture.context;
    this.layer=this.add.image(0,0,'treatment').setOrigin(0);this.root.add(this.layer);
    this.patchLayer=this.add.container(0,0);this.root.add(this.patchLayer);this.patchSprites=[];
    this.guide=this.add.graphics();this.root.add(this.guide);
    this.targetText=this.add.text(300,576,'',{fontFamily:'Nunito',fontSize:'15px',fontStyle:'800',resolution:3,color:'#8b6489'}).setOrigin(.5);this.root.add(this.targetText);
    this.fx=this.add.container(0,0);this.root.add(this.fx);
    this.cursorRing=this.add.graphics();this.root.add(this.cursorRing);
    this.tool=this.add.image(300,545,'cotton').setDisplaySize(93,105).setAlpha(0);this.root.add(this.tool);
    this.feedback=new CareFeedback(this);
    this.pointer=new Phaser.Math.Vector2();
    this.input.on('pointerdown',p=>this.onDown(p));
    this.input.on('pointermove',p=>this.onMove(p));
    this.input.on('pointerup',p=>this.onUp(p));this.input.on('pointerupoutside',p=>this.onUp(p));
    this.input.on('gameout',()=>this.release());
    this.game.canvas.addEventListener('pointercancel',()=>this.release());
    this.scale.on('resize',()=>this.resize());this.resize();
    this.showWelcome();this.app.ready(this);
  }
  resize(){
    const bg=this.background.texture.getSourceImage();this.background.setPosition(this.scale.width/2,this.scale.height/2).setScale(Math.max(this.scale.width/bg.width,this.scale.height/bg.height));
    const l=this.app.ui?.layout;
    if(l){
      // Explicit header, face and instruction bands prevent square-window overlap.
      const top=l.landscape?107:196,bottom=l.landscape?l.H-112:l.H-205;
      const characterWidth={cat:404,frog:410,bunny:472}[this.character]||472;
      const s=Math.min(l.W/(characterWidth+32),(bottom-top)/560);
      this.fit=s*l.pixelScale;const cx=l.W/2,cy=(top+bottom)/2;
      this.root.setScale(this.fit).setPosition(l.x*this.app.pixelRatio+cx*l.pixelScale-300*this.fit,l.y*this.app.pixelRatio+cy*l.pixelScale-300*this.fit);
      this.targetText.setResolution(Math.max(2,Math.ceil(this.fit)));return;
    }
    const w=this.scale.width,h=this.scale.height;
    this.fit=Math.min(w/600,h/600);this.root.setScale(this.fit).setPosition((w-600*this.fit)/2,(h-600*this.fit)/2);
  }
  setCharacter(name){
    this.face={...FACE[name]};this.character=name;const f=this.face;
    this.portrait.setTexture(name).setOrigin(0).setPosition(f.ox,f.oy).setDisplaySize(f.size,f.size);
    this.eyes.forEach((eye,i)=>eye.setVisible(true).setTexture(`${name}-eye-${i?'right':'left'}`).setPosition(300+(i?1:-1)*f.eyeDX,f.eyeY-10).setDisplaySize(124,84).setCrop().setAlpha(1));
    this.feedback.reset();this.resize();
    this.refreshAccessory();
  }
  clear(){this.tweens.killAll();this.fx.removeAll(true);this.root.setAlpha(1);this.ctx.clearRect(0,0,SIZE,SIZE);this.texture.refresh();this.guide.clear();this.cursorRing.clear();this.patchLayer.removeAll(true);this.patchSprites=[];this.targets=[];this.grid=[];this.targetText.setText('');this.patches=[];this.tracePaths=[];this.strokePrev=null;}
  showWelcome(){
    this.active=false;this.frozen=false;this.transitioning=false;this.release();this.clear();if(this.app.gameAssetsReady)this.setCharacter('cat');this.tool.setAlpha(0);
    this.welcomeTime=0;this.drawDecor();
  }
  drawDecor(){
    this.decor.clear();
  }
  begin(index){
    this.runId=(this.runId||0)+1;this.levelIndex=index;this.level=LEVELS[index];this.stepIndex=0;this.active=true;this.frozen=false;this.elapsed=0;this.usedHint=false;this.setCharacter(this.level.character);this.clear();this.drawDecor();this.nextStep(true);
    if(!this.app.reducedMotion){this.root.setAlpha(0);this.tweens.add({targets:this.root,alpha:1,duration:500,ease:'Sine.Out'});}
  }
  pause(){this.frozen=true;this.release();}
  resume(){this.frozen=false;}
  nextStep(first=false){
    this.transitioning=false;this.release();this.step=this.level.steps[this.stepIndex];this.stepTime=0;this.effort=0;this.stepProgress=0;this.completedTargets=0;this.lastPraise=0;this.strokePrev=null;this.guide.clear();this.targetText.setText('');this.patches=[];this.tracePaths=[];
    this.patchLayer.removeAll(true);this.patchSprites=[];
    if(!this.step){this.active=false;this.tool.setAlpha(0);return;}
    this.mode=this.step.mode;
    this.source=document.createElement('canvas');this.source.width=SIZE;this.source.height=SIZE;this.sourceCtx=this.source.getContext('2d');
    this.mask=document.createElement('canvas');this.mask.width=SIZE;this.mask.height=SIZE;this.maskCtx=this.mask.getContext('2d');
    this.previous=document.createElement('canvas');this.previous.width=SIZE;this.previous.height=SIZE;
    this.previous.getContext('2d').drawImage(this.texture.canvas,0,0);
    if(['paint','wipe'].includes(this.mode))this.setupSurface();
    else this.setupTargets();
    this.feedback.start();
    const actualTool=this.step.tool==='compact'?'makeup-brush':this.step.tool;
    this.tool.setTexture(actualTool).setDisplaySize(168,189).setPosition(430,505).setAlpha(.95).setAngle(-13);
    this.tool.setTint(this.app.save.equipped==='serum'&&actualTool==='dropper'?0xffd570:0xffffff);
    this.toolBase={x:this.tool.scaleX,y:this.tool.scaleY};this.toolIntro=0;this.lastEffect=0;
    if(['place','peel'].includes(this.mode))this.tool.setAlpha(0);
    else if(!this.app.reducedMotion){this.toolIntro=this.time.now+600;this.tool.setPosition(560,535).setAngle(18).setAlpha(0);this.tweens.add({targets:this.tool,x:452,y:505,angle:-13,alpha:.95,duration:600,ease:'Back.Out'});}
    this.app.stepChanged(this.level,this.stepIndex,this.step);this.drawGuides();
    if(!first)this.app.toast(['Fresh & lovely!','So satisfying…','Look at that glow!'][this.stepIndex%3]);
  }
  skin(x,y,holes=true){
    const f=this.face;if(!ellipse(x,y,300,f.cy,f.rx-9,f.ry-10))return false;
    // Keep brows, eyes and lips readable under foam and masks.
    if(holes&&(ellipse(x,y,300-f.eyeDX,f.eyeY-11,52,42)||ellipse(x,y,300+f.eyeDX,f.eyeY-11,52,42)||ellipse(x,y,300,f.mouthY,f.mouthW+7,27)))return false;
    return true;
  }
  valid(x,y,layer=this.step.layer){
    const f=this.face;
    if(layer==='eye-dirt')return ellipse(x,y,300-f.eyeDX,f.eyeY+25,57,25)||ellipse(x,y,300+f.eyeDX,f.eyeY+25,57,25);
    if(layer==='blush')return ellipse(x,y,300-f.eyeDX-6,f.eyeY+67,43,27)||ellipse(x,y,300+f.eyeDX+6,f.eyeY+67,43,27);
    if(layer==='eyeshadow')return ellipse(x,y,300-f.eyeDX,f.eyeY-12,43,15)||ellipse(x,y,300+f.eyeDX,f.eyeY-12,43,15);
    if(layer==='lips')return ellipse(x,y,300,f.mouthY,f.mouthW-4,15);
    return this.skin(x,y);
  }
  makeSkinClip(ctx,layer=this.step.layer){
    const image=ctx.createImageData(SIZE,SIZE);
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)if(this.valid(x,y,layer))image.data[(y*SIZE+x)*4+3]=255;
    const c=document.createElement('canvas');c.width=SIZE;c.height=SIZE;c.getContext('2d').putImageData(image,0,0);return c;
  }
  setupSurface(){
    this.targets=[];this.grid=[];
    const name=this.step.layer,c=this.sourceCtx,f=this.face;
    this.clip=this.makeSkinClip(c);
    for(let y=110;y<550;y+=9)for(let x=130;x<475;x+=9)if(this.valid(x,y))this.grid.push({x,y,v:0});
    // All decorative pixels and all completion samples share exactly the same mask.
    if(name==='dirt'){
      let seed=81;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
      c.fillStyle='#987b4e33';c.fillRect(0,0,600,600);
      for(let i=0;i<170;i++){const x=155+rand()*285,y=170+rand()*355;if(!this.valid(x,y))continue;const r=3+rand()*20;const grad=c.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,['#7a634ba8','#936b6599','#95704699'][i%3]);grad.addColorStop(1,'#887b4900');c.fillStyle=grad;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
      for(let i=0;i<50;i++){const x=160+rand()*270,y=180+rand()*340;if(!this.valid(x,y))continue;c.fillStyle='#926a5180';c.beginPath();c.arc(x,y,1+rand()*2,0,7);c.fill();}
    }else if(name==='eye-dirt'){
      for(const side of [-1,1]){const x=300+f.eyeDX*side,y=f.eyeY+24;const g=c.createRadialGradient(x,y,3,x,y,58);g.addColorStop(0,'#766c9390');g.addColorStop(1,'#86719600');c.fillStyle=g;c.fillRect(x-65,y-35,130,70);}
    }else if(name==='foam'){
      c.fillStyle='#f8fffde8';c.fillRect(0,0,600,600);
      for(let i=0;i<260;i++){const x=145+Math.random()*320,y=150+Math.random()*400,r=3+Math.random()*14;c.beginPath();c.arc(x,y,r,0,7);c.fillStyle=i%2?'#e1eff5b0':'#ffffffd9';c.fill();c.strokeStyle='#c1dce566';c.lineWidth=1;c.stroke();c.beginPath();c.arc(x-r*.25,y-r*.3,r*.23,0,7);c.fillStyle='#fff';c.fill();}
    }else if(name==='berry'){
      const grad=c.createLinearGradient(170,190,430,530);grad.addColorStop(0,'#ed8ebb');grad.addColorStop(.5,'#cb6599');grad.addColorStop(1,'#df8ab3');c.fillStyle=grad;c.fillRect(0,0,600,600);
      for(let i=0;i<100;i++){c.fillStyle=i%2?'#ffe2ea90':'#ac497969';c.beginPath();c.ellipse(150+Math.random()*300,155+Math.random()*380,1.5,3,Math.random()*3,0,7);c.fill();}
      c.strokeStyle='#ffbddbaa';c.lineWidth=3;for(let y=210;y<500;y+=40){c.beginPath();c.moveTo(170,y);c.bezierCurveTo(240,y-15,355,y+25,432,y);c.stroke();}
    }else if(name==='foundation'){c.fillStyle='#ffdab835';c.fillRect(0,0,600,600);}
    else if(name==='glow'){
      c.fillStyle='#e5ffef28';c.fillRect(0,0,600,600);
      for(let i=0;i<70;i++){c.fillStyle='#fff9';c.beginPath();c.arc(155+Math.random()*290,175+Math.random()*330,Math.random()*2+1,0,7);c.fill();}
    }else if(['blush','eyeshadow'].includes(name)){
      const eyes=name==='eyeshadow',y=eyes?f.eyeY-12:f.eyeY+67,rx=eyes?46:46;
      for(const side of [-1,1]){const x=300+(f.eyeDX+(eyes?0:6))*side;c.save();c.translate(x,y);c.scale(1,eyes?.38:.60);const g=c.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,eyes?'#b868ad90':'#e7759870');g.addColorStop(.5,eyes?'#df90c666':'#ef92b046');g.addColorStop(1,'#ff8bba00');c.fillStyle=g;c.fillRect(-rx,-rx,rx*2,rx*2);c.restore();}
    }else if(name==='lips'){
      const g=c.createLinearGradient(0,f.mouthY-15,0,f.mouthY+15);g.addColorStop(0,'#c53364a0');g.addColorStop(.6,'#e45d80ad');g.addColorStop(1,'#f990ab88');c.fillStyle=g;c.fillRect(220,f.mouthY-18,160,36);c.fillStyle='#ffe4e9cc';c.beginPath();c.ellipse(301,f.mouthY+7,14,2,0,0,7);c.fill();
    }
    c.globalCompositeOperation='destination-in';c.drawImage(this.clip,0,0);c.globalCompositeOperation='source-over';
    if(this.mode==='wipe'){
      // A rinse begins with the exact foam produced by the previous step.
      if(name==='foam'){c.clearRect(0,0,600,600);c.drawImage(this.previous,0,0);}
      this.previous.getContext('2d').clearRect(0,0,600,600);
      this.maskCtx.fillStyle='white';this.maskCtx.fillRect(0,0,600,600);
    }
    this.renderSurface();
  }
  renderSurface(){
    const c=this.ctx;c.clearRect(0,0,600,600);c.drawImage(this.source,0,0);c.globalCompositeOperation='destination-in';c.drawImage(this.mask,0,0);c.globalCompositeOperation='source-over';
    if(this.mode==='paint'){c.globalCompositeOperation='destination-over';c.drawImage(this.previous,0,0);c.globalCompositeOperation='source-over';}
    this.texture.refresh();
  }
  setupTargets(){
    const f=this.face,n=this.step.count;
    const positions=[[300,f.top+65],[300-f.eyeDX-8,f.eyeY+62],[300+f.eyeDX+8,f.eyeY+62],[260,f.mouthY+38],[340,f.mouthY+38],[300,f.eyeY+47],[247,f.top+82],[353,f.top+82]];
    this.targets=positions.slice(0,n).map(([x,y],i)=>({x,y,v:0,done:false,id:i}));
    if(this.step.layer==='patches'){
      this.targets=[-1,1].map((side,i)=>({x:300+side*f.eyeDX,y:f.eyeY+34,v:0,done:false,id:i,side}));
      this.patches=this.targets.map((t,i)=>({x:this.mode==='place'?(i===0?156:444):t.x,y:this.mode==='place'?534:t.y,target:t,placed:this.mode!=='place',v:0,removed:false}));
      this.patchSprites=this.patches.map((p,i)=>{const sprite=this.add.image(p.x,p.y,i===0?'patch-left':'patch-right').setDisplaySize(104,42);this.patchLayer.add(sprite);return sprite;});
      if(this.mode==='place')this.ctx.clearRect(0,0,600,600);
    }
    if(this.mode==='peel'&&this.step.layer==='berry'){
      this.targets=Array.from({length:5},(_,i)=>({x:186+i*57,y:f.top+33,v:0,done:false,id:i}));
      this.peelSnapshot=document.createElement('canvas');this.peelSnapshot.width=600;this.peelSnapshot.height=600;this.peelSnapshot.getContext('2d').drawImage(this.texture.canvas,0,0);
    }
    if(this.mode==='trace'){
      const y=f.eyeY;
      this.tracePaths=[[[285,y+65],[191,y+29]],[[315,y+65],[409,y+29]],[[277,y+127],[194,y+84]],[[323,y+127],[406,y+84]],[[289,f.top+94],[218,f.top+54]],[[311,f.top+94],[382,f.top+54]]].map(([a,b])=>({a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]},v:0,passes:0,done:false}));
    }
    this.texture.refresh();
  }
  world(p){return {x:(p.x-this.root.x)/this.fit,y:(p.y-this.root.y)/this.fit};}
  onDown(p){
    if(!this.active||this.frozen||this.transitioning||this.pointerId!==null)return;
    this.app.audio.unlock();this.pointerId=p.id;this.down=true;this.local=this.world(p);this.lastLocal={...this.local};this.strokePrev=null;this.lastInput=this.time.now;
    if(this.step.tool==='dropper'){this.tweens.killTweensOf(this.tool);this.toolIntro=0;this.tool.setPosition(this.local.x,this.local.y-108).setAngle(180).setAlpha(.95);}
    if(this.mode==='place')this.drag=this.patches.find(patch=>!patch.placed&&distance(this.local,patch)<60);
    if(this.mode==='peel'){
      if(this.step.layer==='patches')this.drag=this.patches.find(patch=>!patch.removed&&distance(this.local,patch)<64);
      else this.drag=this.targets.find(t=>!t.done&&Math.abs(t.x-this.local.x)<35&&Math.abs(t.y-this.local.y)<50);
      if(this.drag)this.dragStart={...this.local};
    }
  }
  onMove(p){if(this.pointerId!==null&&p.id!==this.pointerId)return;this.local=this.world(p);if(this.down)this.lastInput=this.time.now;}
  onUp(p){if(this.pointerId!==null&&p.id!==this.pointerId)return;if(this.mode==='place'&&this.drag)this.finishPlace();this.release();}
  release(){this.down=false;this.pointerId=null;this.strokePrev=null;if(this.drag&&this.mode==='place'&&!this.drag.placed){this.drag.x=this.drag.target.id===0?156:444;this.drag.y=534;}this.drag=null;this.cursorRing?.clear();}
  finishPlace(){
    const p=this.drag;if(distance(p,p.target)<62){p.placed=true;p.target.v=1;p.target.done=true;this.tweens.add({targets:p,x:p.target.x,y:p.target.y,duration:this.app.reducedMotion?0:300,ease:'Back.Out'});this.sparkle(p.target.x,p.target.y);}
  }
  paint(dt){
    const {x,y}=this.local,r=this.step.brush*PACE.brushScale;
    const moved=this.lastLocal?distance(this.local,this.lastLocal):0;
    if(!this.valid(x,y)&&!this.grid.some(g=>Math.hypot(g.x-x,g.y-y)<r))return;
    // A stationary press moisturizes one spot; real coverage needs movement.
    const near=this.grid.filter(g=>Math.hypot(g.x-x,g.y-y)<r);
    if(!near.length)return;
    const amount=dt*this.grid.length/(Math.max(near.length,1)*this.step.seconds)*.99*PACE.speed;
    let fresh=0;
    for(const cell of near){const old=cell.v;cell.v=clamp(cell.v+amount,0,1);fresh+=cell.v-old;}
    if(fresh<=0)return;
    this.feedback.touch(x,y);
    this.effort+=dt;
    const c=this.maskCtx;c.globalCompositeOperation=this.mode==='wipe'?'destination-out':'source-over';
    // Repeated strokes create a tactile soft edge and gradual removal.
    const alpha=clamp(amount*1.8,.025,.6);
    const g=c.createRadialGradient(x,y,r*.2,x,y,r);g.addColorStop(0,`rgba(255,255,255,${alpha})`);g.addColorStop(.72,`rgba(255,255,255,${alpha*.85})`);g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.globalCompositeOperation='source-over';
    this.renderSurface();this.stepProgress=this.grid.reduce((s,g)=>s+g.v,0)/this.grid.length;
    
    if(moved>2&&Math.random()<.13)this.sparkle(x,y,1,this.step.layer==='foam'?0xffffff:0xece4ff);
  }
  interactTargets(dt){
    const mode=this.mode;
    if(mode==='dab'||mode==='hold'){
      const target=this.targets.find(t=>!t.done&&distance(t,this.local)<(this.step.layer==='patches'?62:35));
      if(target){
        this.feedback.touch(target.x,target.y);
        target.v=clamp(target.v+dt*PACE.speed/(this.step.seconds/this.targets.length),0,1);this.effort+=dt;
        if(target.v>=1){target.done=true;this.sparkle(target.x,target.y,9);}
      }
      this.stepProgress=this.targets.reduce((s,t)=>s+t.v,0)/this.targets.length;
    }else if(mode==='place'){
      if(this.drag){this.feedback.touched=this.time.now;this.drag.x=this.local.x;this.drag.y=this.local.y;if(distance(this.drag,this.drag.target)<36){this.finishPlace();this.drag=null;}}
      this.stepProgress=this.patches.filter(p=>p.placed).length/this.patches.length;
    }else if(mode==='peel'){
      if(this.drag){
        this.feedback.touched=this.time.now;
        if(this.step.layer==='patches'){
          const delta=(this.local.x-this.dragStart.x)*this.drag.target.side;
          this.drag.v=clamp(delta/PACE.patchPull,0,1);this.drag.x=this.drag.target.x+this.drag.target.side*this.drag.v*75;this.drag.y=this.drag.target.y+this.drag.v*32;
          if(this.drag.v>=1){this.drag.removed=true;this.drag.target.done=true;this.sparkle(this.drag.x,this.drag.y);this.drag=null;}
        }else{
          this.drag.v=Math.max(this.drag.v,clamp((this.local.y-this.dragStart.y)/PACE.maskPull,0,1));
          if(this.drag.v>=1){this.drag.done=true;this.sparkle(this.drag.x,490);this.drag=null;}
          this.renderPeel();
        }
        
      }
      this.stepProgress=this.step.layer==='patches'?this.patches.reduce((s,p)=>s+p.v,0)/2:this.targets.reduce((s,t)=>s+t.v,0)/5;
    }else if(mode==='trace'){
      const path=this.tracePaths.find(p=>!p.done);
      if(path){
        const dx=path.b.x-path.a.x,dy=path.b.y-path.a.y;
        const t=clamp(((this.local.x-path.a.x)*dx+(this.local.y-path.a.y)*dy)/(dx*dx+dy*dy),0,1);
        const nearest={x:path.a.x+dx*t,y:path.a.y+dy*t};
        if(distance(nearest,this.local)<34&&t>=path.v-.16&&t<=path.v+.36){
          this.feedback.touch(nearest.x,nearest.y);
          path.v=Math.max(path.v,Math.min(t+.07,path.v+dt*PACE.rollerSpeed));
          if(path.v>=.96){path.passes++;path.v=0;this.sparkle(path.b.x,path.b.y,5);if(path.passes>=PACE.rollerPasses)path.done=true;}
        }
      }
      this.stepProgress=this.tracePaths.reduce((s,p)=>s+(p.done?PACE.rollerPasses:p.passes+p.v),0)/(this.tracePaths.length*PACE.rollerPasses);
    }
  }
  renderPeel(){
    const c=this.ctx;c.clearRect(0,0,600,600);c.drawImage(this.peelSnapshot,0,0);
    for(const t of this.targets){const height=t.v*440;c.clearRect(t.x-28.5,110,57,height);if(t.v>0&&t.v<1){c.drawImage(this.textures.get('ui-mask-curl').getSourceImage(),t.x-29,110+height-22,58,38);}}
    this.texture.refresh();
  }
  patchPath(g,x,y,side,alpha=1){
    const index=side===-1?0:1,p=this.patches[index],v=this.mode==='peel'?(p?.v||0):0;
    this.patchSprites[index]?.setPosition(x,y).setDisplaySize(104*(1-v*.16),42*(1-v*.5)).setAngle(side*v*27).setAlpha(alpha).setVisible(true);
  }
  dottedEllipse(g,x,y,rx,ry,color=0xffffff){for(let a=0;a<Math.PI*2;a+=.22){g.fillStyle(color,.8);g.fillCircle(x+Math.cos(a)*rx,y+Math.sin(a)*ry,1.7);}}
  drawGuides(){
    if(!this.step||!this.active)return;
    const g=this.guide;g.clear();const pulse=1+Math.sin(this.time.now/310)*.075,f=this.face;
    if(['paint','wipe'].includes(this.mode)){
      if(['blush','eyeshadow','eye-dirt'].includes(this.step.layer)){
        const eyes=this.step.layer==='eyeshadow',dirt=this.step.layer==='eye-dirt';
        for(const side of [-1,1])this.dottedEllipse(g,300+side*(f.eyeDX+(!eyes&&!dirt?6:0)),f.eyeY+(eyes?-12:dirt?25:67),eyes?46:47,eyes?18:27);
      }else if(this.step.layer==='lips')this.dottedEllipse(g,300,f.mouthY,f.mouthW+3,20);
      // Late-stage guidance points at the actual unprocessed skin samples.
      if(this.stepProgress>.7||this.hintUntil>this.time.now){
        this.grid.filter((cell,i)=>cell.v<.7&&i%5===0).forEach(cell=>{g.fillStyle(0xffffff,.3+Math.sin(this.time.now/200)*.18);g.fillCircle(cell.x,cell.y,3);});
      }
    }else if(this.mode==='dab'||this.mode==='hold'){
      if(this.step.layer==='patches')for(const p of this.patches)this.patchPath(g,p.x,p.y,p.target.side);
      for(const t of this.targets){
        if(t.done){g.lineStyle(2,0xffffff,.7);g.lineBetween(t.x-5,t.y,t.x-1,t.y+4);g.lineBetween(t.x-1,t.y+4,t.x+7,t.y-5);continue;}
        const r=this.step.layer==='patches'?27:21;g.fillStyle(0xffffff,.18);g.fillCircle(t.x,t.y,r*pulse);g.lineStyle(2,0xffffff,.65);g.strokeCircle(t.x,t.y,r*pulse);
        g.lineStyle(4,0xb9edcd,1);g.beginPath();g.arc(t.x,t.y,r,-Math.PI/2,-Math.PI/2+t.v*Math.PI*2,false);g.strokePath();
        if(this.step.layer==='flowers'){g.fillStyle(0xf7e0f3,.85);for(let a=0;a<6;a++){const angle=a*Math.PI/3;g.fillCircle(t.x+Math.cos(angle)*6,t.y+Math.sin(angle)*6,4.5);}g.fillStyle(0xffda87,1);g.fillCircle(t.x,t.y,3);}
        else{g.fillStyle(0xffffff,.9);g.fillCircle(t.x,t.y,4);}
      }
    }else if(this.mode==='place'){
      for(const p of this.patches){if(!p.placed)this.dottedEllipse(g,p.target.x,p.target.y,55,23);this.patchPath(g,p.x,p.y,p.target.side);if(!p.placed){g.fillStyle(0xffffff,.85);g.fillCircle(p.x,p.y,4);}}
    }else if(this.mode==='peel'){
      if(this.step.layer==='patches'){
        for(const p of this.patches){if(p.removed){this.patchSprites[p.target.id]?.setVisible(false);continue;}this.patchPath(g,p.x,p.y,p.target.side,1-p.v*.6);this.arrow(g,p.x,p.y+33,p.x+p.target.side*50,p.y+33,.7);}
      }else{
        for(const t of this.targets){if(t.done)continue;g.fillStyle(0xffd4e7,.95);g.fillRoundedRect(t.x-16,t.y-15,32,23,9);g.lineStyle(2,0xffffff,.9);g.strokeRoundedRect(t.x-16,t.y-15,32,23,9);this.arrow(g,t.x,t.y+14,t.x,t.y+48,.8);}
      }
    }else if(this.mode==='trace'){
      const path=this.tracePaths.find(p=>!p.done);if(path){
        g.lineStyle(15,0xffffff,.12);g.lineBetween(path.a.x,path.a.y,path.b.x,path.b.y);this.arrow(g,path.a.x,path.a.y,path.b.x,path.b.y,.8);
        const x=Phaser.Math.Linear(path.a.x,path.b.x,path.v),y=Phaser.Math.Linear(path.a.y,path.b.y,path.v);
        g.fillStyle(0xc0ecd3,1);g.fillCircle(x,y,10*pulse);g.lineStyle(3,0xffffff,.9);g.strokeCircle(x,y,10*pulse);
      }
    }
    if(['dab','hold','place','peel'].includes(this.mode)){const done=this.targets.filter(t=>t.done).length;this.targetText.setText(`${done} / ${this.targets.length}  ${this.mode==='peel'?'peeled':this.mode==='place'?'placed':'little moments'}`);}
    if(this.mode==='trace')this.targetText.setText(`${this.tracePaths.filter(t=>t.done).length} / 6  soothing strokes · follow the mint dot`);
  }
  arrow(g,x1,y1,x2,y2,alpha){
    g.lineStyle(3,0xffffff,alpha);g.lineBetween(x1,y1,x2,y2);const a=Math.atan2(y2-y1,x2-x1);g.lineBetween(x2,y2,x2-Math.cos(a-.55)*10,y2-Math.sin(a-.55)*10);g.lineBetween(x2,y2,x2-Math.cos(a+.55)*10,y2-Math.sin(a+.55)*10);
  }
  update(time,delta){
    const dt=Math.min(delta/1000,.045);
    if(!this.root)return;
    if(this.frozen)return;
    this.feedback.update(dt);
    if(!this.active){this.welcomeTime+=dt;return;}
    this.elapsed+=dt;
    if(this.transitioning)return;
    this.stepTime+=dt;
    if(this.down){
      if(['paint','wipe'].includes(this.mode))this.paint(dt);else this.interactTargets(dt);
      const noTool=['place','peel'].includes(this.mode);
      if(!noTool){
        const brush=['roller','mask-brush','makeup-brush','lipstick','dropper','compact'].includes(this.step.tool);
        if(this.toolIntro){this.tweens.killTweensOf(this.tool);this.toolIntro=0;}
        const drop=this.step.tool==='dropper',spray=this.step.tool==='spray';
        const ease=1-Math.exp(-delta/34),margin=65;
        const x=clamp(this.local.x+(drop?0:spray?66:brush?15:12),-this.root.x/this.fit+margin,(this.scale.width-this.root.x)/this.fit-margin),y=this.local.y+(drop?-108:spray?54:brush?55:20);
        this.tool.setPosition(Phaser.Math.Linear(this.tool.x,x,ease),Phaser.Math.Linear(this.tool.y,y,ease)).setAngle(drop?180:spray?-10:brush?-17+Math.sin(time/160)*3:Math.sin(time/170)*5).setAlpha(.95);
        const squash=this.app.reducedMotion?0:Math.sin(time/120)*.022;this.tool.setScale(this.toolBase.x*(1+squash),this.toolBase.y*(1-squash));
      }
      this.cursorRing.clear();this.cursorRing.lineStyle(1.5,0xffffff,.6);this.cursorRing.strokeCircle(this.local.x,this.local.y,12);
      this.lastLocal={...this.local};
    }else{
      this.cursorRing.clear();
      const dropLanding=this.step.tool==='dropper'&&time-this.feedback.last<340;
      if(!dropLanding&&!['place','peel'].includes(this.mode)&&time>this.toolIntro){this.tool.x=Phaser.Math.Linear(this.tool.x,452,.13);this.tool.y=Phaser.Math.Linear(this.tool.y,505+Math.sin(time/550)*5,.13);this.tool.angle=Phaser.Math.Linear(this.tool.angle,-13,.1);this.tool.setScale(this.toolBase.x,this.toolBase.y);}
    }
    this.drawGuides();
    this.app.progress((this.stepIndex+this.stepProgress)/this.level.steps.length,this.elapsed);
    const threshold=['paint','wipe'].includes(this.mode)?.94:.999;
    if(this.stepProgress>=threshold)this.finishStep();
  }
  finishStep(){
    if(this.transitioning)return;this.transitioning=true;this.release();this.guide.clear();this.targetText.setText('');this.tool.setAlpha(0);
    if(this.mode==='peel')this.patchSprites.forEach(s=>s.setVisible(false));
    if(this.mode==='paint'){this.ctx.clearRect(0,0,600,600);this.ctx.drawImage(this.previous,0,0);this.ctx.drawImage(this.source,0,0);this.texture.refresh();}
    if(this.mode==='wipe'||this.mode==='peel'){this.ctx.clearRect(0,0,600,600);this.texture.refresh();}
    this.sparkle(300,330,22);this.app.progress((this.stepIndex+1)/this.level.steps.length,this.elapsed);
    const run=this.runId;
    this.time.delayedCall(PACE.transitionMs,()=>{if(run!==this.runId||!this.active)return;this.stepIndex++;if(this.stepIndex>=this.level.steps.length){this.active=false;this.transitioning=false;this.app.completed(this.levelIndex,this.elapsed);}else this.nextStep();});
  }
  skipStage(){if(!this.active||this.transitioning)return;this.stepProgress=1;this.finishStep();}
  refreshAccessory(){
    if(!this.accessory)return;const item=this.app.save.equipped;
    this.accessory.setVisible(item==='bow'||item==='butterfly');
    if(item==='bow'||item==='butterfly')this.accessory.setTexture(item==='bow'?'ui-rose-bow':'ui-butterfly').setPosition(393,this.face?.top-23||133).setDisplaySize(78,65).setAngle(14);
    if(this.tool)this.tool.setTint(item==='serum'&&this.step?.tool==='dropper'?0xffd570:0xffffff);
  }
  sparkle(x,y,count=8,color=0xffe696){
    if(this.fx.length>70)return;
    for(let i=0;i<count;i++){
      const size=8+Math.random()*11,star=this.add.image(x,y,i%3===0?'ui-heart':'ui-glint').setDisplaySize(size,size).setAlpha(.9);this.fx.add(star);
      const a=Math.random()*Math.PI*2,d=24+Math.random()*80;
      this.tweens.add({targets:star,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d-25,scaleX:star.scaleX*.15,scaleY:star.scaleY*.15,alpha:0,angle:90,duration:650+Math.random()*350,onComplete:()=>star.destroy()});
    }
  }
  careEffect(x,y,key){
    if(this.fx.length>50)return;const size=key==='bubble'?15+Math.random()*15:10+Math.random()*9;
    const p=this.add.image(x+(Math.random()-.5)*25,y,`ui-${key}`).setDisplaySize(size,size).setAlpha(.8);this.fx.add(p);
    this.tweens.add({targets:p,x:p.x+(Math.random()-.5)*45,y:y-35-Math.random()*25,angle:Math.random()*35,alpha:0,scaleX:p.scaleX*.5,scaleY:p.scaleY*.5,duration:850,ease:'Sine.Out',onComplete:()=>p.destroy()});
  }
  hint(){
    if(!this.active)return;this.usedHint=true;this.hintUntil=this.time.now+6500;
    if(this.mode==='paint'||this.mode==='wipe'){
      const cell=this.grid.find(g=>g.v<.8);if(cell)this.sparkle(cell.x,cell.y,12,0xffffff);
    }else{
      const target=this.targets.find(t=>!t.done)||this.tracePaths.find(t=>!t.done)?.a;if(target)this.sparkle(target.x,target.y,15,0xffffff);
    }
    this.app.toast(this.mode==='hold'||this.mode==='dab'?'Press & hold until the ring fills':this.mode==='trace'?'Start at the mint dot. Follow it slowly.':this.mode==='peel'?'Grab a tab, then pull along the arrow':this.mode==='place'?'Drag a patch to its dotted outline':'Sweep over the sparkling areas');
  }
  capturePortrait(asCanvas=false){
    const full=document.createElement('canvas');full.width=600;full.height=600;const ctx=full.getContext('2d'),f=this.face;
    ctx.drawImage(this.textures.get(this.character).getSourceImage(),f.ox,f.oy,f.size,f.size);ctx.drawImage(this.texture.canvas,0,0);
    if(this.accessory.visible){const a=this.accessory;ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.rotation);ctx.drawImage(a.texture.getSourceImage(),-39,-32.5,78,65);ctx.restore();}
    const thumb=document.createElement('canvas');thumb.width=512;thumb.height=512;thumb.getContext('2d').drawImage(full,80,30,440,530,44,0,424,512);
    return asCanvas?thumb:thumb.toDataURL('image/webp',.9);
  }
  debugState(){const d=this.app.pixelRatio;return {active:this.active,paused:this.frozen,level:this.levelIndex,step:this.stepIndex,mode:this.mode,layer:this.step?.layer,progress:this.stepProgress,elapsed:this.elapsed,fit:this.fit/d,offset:{x:this.root.x/d,y:this.root.y/d},targets:this.targets?.map(t=>({...t})),patches:this.patches?.map(p=>({x:p.x,y:p.y,placed:p.placed,removed:p.removed,target:{...p.target}})),trace:this.tracePaths,grid:this.grid?.filter((g,i)=>i%3===0).map(g=>({...g}))};}
}

installWorkshop(SpaScene);
installPuzzles(SpaScene);
installRomance(SpaScene);
installPremiumScene(SpaScene);
installHints(SpaScene);
