import { LEVELS } from './levels.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const point=(x,y)=>({x,y});
// Source-image coordinates keep polish, filing and pearls registered to the hand.
const nailRegions=[[0,322,64,82],[106,61,62,87],[247,1,66,89],[377,56,67,85],[489,190,59,73]];
const nailEdges=[[[16,359],[10,339],[20,331],[35,337],[47,357]],[[118,105],[117,82],[130,72],[145,79],[153,101]],[[257,47],[262,22],[280,12],[295,25],[298,48]],[[390,102],[394,80],[410,67],[424,80],[426,104]],[[507,230],[514,212],[529,202],[536,213],[532,234]]];
const macaronPlaces=[[206,238],[385,238],[299,280]];
const cosmetics=['lipstick','mascara','brush','blush','perfume','palette'];
const routes={
 comb:[[[231,172],[214,254],[225,375]],[[302,160],[300,280],[303,437]],[[366,177],[390,290],[374,384]]],
 trim:[[[214,409],[259,438],[302,460],[348,434],[386,404]]],
 iron:[[[226,184],[248,267],[238,354]],[[326,175],[343,265],[330,370]],[[168,268],[197,340]],[[400,267],[371,335]]],
 groom:[[[254,165],[233,226]],[[345,163],[366,224]],[[261,277],[246,364]],[[326,273],[348,366]]],
 // Liner landmarks use pixels of the actual portrait, transformed in setupPaths.
 liner:[[[242,375],[211,373],[194,360]],[[401,375],[431,369],[449,356]],[[213,396],[230,408]],[[432,395],[416,409]]],
 lace:[[[180,264],[260,309],[204,241],[283,284],[227,220],[310,257],[253,191],[335,230],[281,159],[361,200]]],
 tie:[[[322,217],[281,179],[270,207],[322,217],[368,182],[377,211],[322,217]]],
 stems:[[[244,425],[270,427],[300,428],[325,430],[348,432]]],
 outline:[[[300,228],[273,196],[229,195],[206,224],[207,266],[242,311],[300,354],[360,311],[392,266],[394,225],[368,195],[326,196],[300,228]]],
 'cross-stitch':Array.from({length:7},(_,i)=>[[242+i*18,257],[257+i*13,293]]),
 embellish:[[[282,377],[247,366],[237,343],[260,351],[282,377],[316,366],[344,351],[331,381],[282,377]]],
 wick:[[[275,139],[303,139],[330,139]]],
};
const pathModes=new Set(Object.keys(routes).concat('file'));
const scrubModes=new Set(['laundry-wash','kitten-wash','shoe-wash','pearl-polish','makeup','polish']);
const dragModes=new Set(['dress','layers','accessorize','leaves','sort-tall','sort-flat','sort-last','nail-gems','beads','clasp','petals','sandwich','pack-tall','pack-flat','pack-close']);

/** Interactive worktable shared by fifteen authored rituals. It only owns its own display tree. */
export class Workshop {
 constructor(scene){this.s=scene;this.root=scene.add.container(0,0);scene.root.add(this.root);this.permanent=scene.add.container();this.root.add(this.permanent);this.hero=this.image(scene.level.outfit?.base||scene.level.hero,300,274,420,464,this.permanent);this.marks=scene.add.graphics();this.permanent.add(this.marks);this.ink=[];this.placed=[];this.sequence=0;this.doneStages=[];}
 image(key,x,y,w,h=w,parent=this.stage||this.root){const texture=key.startsWith('world-')||!this.s.textures.exists(key)?`ui-${key}`:key;const im=this.s.add.image(x,y,texture);const src=im.texture.getSourceImage(),scale=Math.min(w/src.width,h/src.height);im.setScale(scale);parent.add(im);return im;}
 text(value,x,y,size=19){const t=this.s.add.text(x,y,value,{fontFamily:'Nunito',fontStyle:'900',fontSize:size,color:'#765584',resolution:3,stroke:'#fff7f4',strokeThickness:2}).setOrigin(.5);this.stage.add(t);return t;}
 beginStage(){
  if(this.stage){this.s.tweens.killTweensOf(this.stage.list);this.stage.destroy();}
  this.stopCue=null;
  this.stage=this.s.add.container();this.root.add(this.stage);this.guides=this.s.add.graphics();this.stage.add(this.guides);
  this.mode=this.s.step.mechanic;this.targets=[];this.paths=[];this.items=[];this.drag=null;this.sequence=0;this.moves=null;this.center=null;this.zip=null;this.braidReveal=null;this.waxReveal=null;this.meter=0;this.holdTime=0;this.anglePrev=null;this.turns=0;this.pops=0;this.lastFx=0;this.lastPoint=null;this.stroke=[];this.traceIndex=0;this.pathIndex=0;this.rotated=false;this.lastDown=null;
  this.s.stepProgress=0;this.s.transitioning=false;this.s.release();this.s.targetText.setText('');
  const mode=this.mode;this.s.root.bringToTop(this.s.fx);this.refreshAccessory();
  if(mode==='beads'){for(const pearl of this.loosePearls||[])pearl.destroy();this.loosePearls=[];}
  if(pathModes.has(mode))this.setupPaths();
  else if(scrubModes.has(mode))this.setupScrub();
  else if(dragModes.has(mode))this.setupDrag();
  else if(['braid','fold','wrap'].includes(mode))this.setupFolds();
  else if(['mix','swirl'].includes(mode))this.setupSwirl();
  else if(['filling','fragrance','wax'].includes(mode))this.setupPour();
  else if(mode==='ignite')this.setupIgnite();
  else if(mode==='stack')this.setupStack();
  else if(mode==='crush'||mode==='bath-pop')this.setupPops();
  this.cursor=this.image(this.s.step.tool,470,445,150,170).setAlpha(dragModes.has(mode)||['braid','fold','wrap','crush','bath-pop','stack','mix','swirl'].includes(mode)?0:.92);
  if(['filling','wax'].includes(mode))this.cursor.setOrigin(.055,.205).setPosition(420,422);
  else if(mode==='ignite')this.cursor.setOrigin(.5,.15);
  else if(['makeup','polish'].includes(mode))this.cursor.setOrigin(.5,.17);
  else if(mode==='fragrance')this.cursor.setOrigin(.5,.18);
  this.counter=this.text('',300,565,18);this.draw();
 }
 heroState(name){const next=this.image(name.startsWith('world-')?name:`world-${name}`,300,274,name==='laundry-folded'?305:420,name==='laundry-folded'?350:464,this.permanent).setAlpha(0);const old=this.hero;this.hero=next;this.permanent.sendToBack(next);this.s.tweens.add({targets:next,alpha:1,duration:this.s.app.reducedMotion?0:450});this.s.tweens.add({targets:old,alpha:0,duration:this.s.app.reducedMotion?0:400,onComplete:()=>old.destroy()});}
 setupOutfitDrag(){
  const prefix=this.s.level.outfit.prefix,add=(part,x,y,u,v,w,h)=>{const tx=this.hero.x+(u-.5)*this.hero.displayWidth,ty=this.hero.y+(v-.5)*this.hero.displayHeight;this.item(`${prefix}-${part}`,x,y,tx,ty,w,h,{hide:true,part});};
  if(this.mode==='dress')add('dress',99,320,.50,.59,116,170);
  if(this.mode==='layers'){add('jacket',92,240,.50,.37,122,130);add('shoes',505,446,.50,.94,108,90);}
  if(this.mode==='accessorize'){add('bag',98,355,.27,.62,98,110);add('clip',503,130,.60,.12,92,76);}
 }
 revealOutfitPart(item){
  const key=this.s.level.outfit.states[this.mode],src=this.s.textures.get(`ui-${key}`).getSourceImage();
  // Reveal the corresponding region of the registered dressed portrait immediately.
  // This keeps a dropped shoe or accessory visible before its partner is placed.
  const regions={jacket:[0,.20,1,.50],shoes:[0,.83,1,.17],bag:[0,.38,.45,.47],clip:[.45,0,.55,.25]},r=regions[item.part];if(!r)return;
  const layer=this.image(key,300,274,420,464,this.permanent);layer.setCrop(r[0]*src.width,r[1]*src.height,r[2]*src.width,r[3]*src.height);this.placed.push(layer);
 }

 setupPaths(){
  const raw=this.mode==='file'?nailEdges.map(path=>path.map(([x,y])=>this.portraitPoint(x,y))):this.mode==='liner'?routes.liner.map(path=>path.map(([x,y])=>this.portraitPoint(x,y))):routes[this.mode];
  this.paths=raw.map(list=>{const p=[];for(let i=0;i<list.length-1;i++){const a=list[i],b=list[i+1],n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/14);for(let j=0;j<n;j++)p.push(point(a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n));}p.push(point(...list.at(-1)));return {points:p,index:0,done:false};});
  if(this.mode==='iron')for(const path of this.paths){const g=this.s.add.graphics();this.stage.add(g);g.lineStyle(5,0x8e5676,.45);g.beginPath();path.points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.strokePath();path.visual=g;}
 }
 setupScrub(){
  if(this.mode==='makeup'){this.setupMakeup();return;}
  if(this.mode==='polish'){this.setupNailPolish();return;}
  let coords=this.mode==='pearl-polish'?Array.from({length:8},(_,i)=>[300+Math.cos(i*Math.PI/4)*110,247+Math.sin(i*Math.PI/4)*58]):this.mode==='kitten-wash'?[[250,187],[350,207],[279,288],[325,337],[233,352]]:this.mode==='shoe-wash'?[[200,337],[255,300],[337,279],[387,328],[292,373]]:[[235,207],[331,247],[249,335],[375,310],[190,292]];
  this.targets=coords.map(([x,y],i)=>{const target={x,y,v:0,done:false};
   if(this.mode==='pearl-polish'){this.loosePearls??=[];this.loosePearls.push(this.image('world-pearl',x,y,41,41,this.permanent));target.visual=this.image('powder-stroke',x,y,35,26).setTint(0x8f7a63).setAlpha(.72);}
   else target.visual=this.image('powder-stroke',x,y,55,40).setTint(0x735436).setAlpha(.78).setAngle(i*41);
   return target;});
 }
 portraitPoint(x,y){return [this.hero.x+(x-this.hero.displayOriginX)*this.hero.scaleX,this.hero.y+(y-this.hero.displayOriginY)*this.hero.scaleY];}
 setupNailPolish(){
  const source=this.s.textures.get('ui-world-nails-polished').getSourceImage();
  this.targets=nailRegions.map(([left,top,width,height],i)=>{
   const key=`workshop-polish-${i}`;
   if(!this.s.textures.exists(key)){
    const texture=this.s.textures.createCanvas(key,width,height);
    texture.getContext().drawImage(source,left,top,width,height,0,0,width,height);texture.refresh();
   }
   const [x,y]=this.portraitPoint(left+width/2,top+height/2);
   const visual=this.s.add.image(x,y,key).setScale(this.hero.scaleX,this.hero.scaleY).setAlpha(0);this.stage.add(visual);
   return {x,y,v:0,done:false,visual};
  });
  this.stage.bringToTop(this.guides);
 }
 setupMakeup(){
  // Reveal the authored finish in registered facial regions. Soft masks keep
  // the original skin, lip outline and eyelashes instead of stamping over them.
  const source=this.s.textures.get('ui-world-glam-finished').getSourceImage();
  const regions=[['cheek-left',226,419,52,42],['cheek-right',421,419,52,42],['eye-left',239,350,68,48],['eye-right',404,350,68,48],['lips',322,487,65,38]];
  this.targets=regions.map(([id,px,py,rx,ry])=>{
   const key=`workshop-makeup-${id}`;
   if(!this.s.textures.exists(key)){
    const texture=this.s.textures.createCanvas(key,rx*2,ry*2),ctx=texture.getContext();
    ctx.drawImage(source,px-rx,py-ry,rx*2,ry*2,0,0,rx*2,ry*2);
    ctx.globalCompositeOperation='destination-in';ctx.save();ctx.translate(rx,ry);ctx.scale(rx,ry);
    const feather=ctx.createRadialGradient(0,0,.64,0,0,1);feather.addColorStop(0,'rgba(255,255,255,1)');feather.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=feather;ctx.fillRect(-1,-1,2,2);ctx.restore();ctx.globalCompositeOperation='source-over';texture.refresh();
   }
   const [x,y]=this.portraitPoint(px,py),visual=this.s.add.image(x,y,key).setScale(this.hero.scaleX,this.hero.scaleY).setAlpha(0);this.stage.add(visual);
   return {x,y,v:0,done:false,visual};
  });
  this.makeupFocus=null;
  this.stage.bringToTop(this.guides);
 }
 item(key,x,y,tx,ty,w=70,h=w,options={}){const sprite=this.image(key,x,y,w,h);const item={key,x,y,tx,ty,w,h,sprite,done:false,angle:options.rotate?90:0,...options};sprite.setAngle(item.angle);this.items.push(item);return item;}
 setupDrag(){
  const m=this.mode;
  if(this.s.level.outfit){this.setupOutfitDrag();return;}
  if(m==='dress')this.item('world-party-dress',94,335,300,312,92,143,{hide:true});
  if(m==='layers'){this.item('world-jacket',91,239,300,212,99,83,{hide:true});this.item('world-flats',501,432,300,486,85,68,{hide:true});}
  if(m==='accessorize'){this.item('world-handbag',99,370,363,321,68,87,{hide:true});this.item('world-hairpin',501,160,325,71,65,53,{hide:true});}
  if(m==='leaves'||m==='petals'){[[252,170],[355,196],[245,292],[324,331],[300,225]].forEach(([x,y],i)=>this.item('petal',x,y,491,444,36,46,{remove:true,tint:0xa7b982,angle:i*50}));this.image('world-organizer',492,450,100,86);}
  if(m.startsWith('sort-')){
   const row={'sort-tall':0,'sort-flat':1,'sort-last':2}[m],keys=row===0?['lipstick','mascara','lipstick','mascara']:row===1?['blush','palette','blush','palette']:['brush','perfume','brush','perfume'];
   keys.forEach((key,i)=>this.item(`world-${key}`,138+i*108,505,189+i*74,182+row*92,48,72));
   for(let y=0;y<3;y++)for(let x=0;x<4;x++){this.guides.lineStyle(3,0xb598c1,.7);this.guides.strokeRoundedRect(155+x*74,135+y*92,68,84,9);}
  }
  if(m==='nail-gems')nailRegions.forEach(([left,top,width,height],i)=>{const [x,y]=this.portraitPoint(left+width/2,top+height*.65);this.item('world-pearl',145+i*77,510,x,y,44,44,{placedSize:19});});
  if(m==='beads')this.addStroke(Array.from({length:65},(_,i)=>{const a=-Math.PI/2+i*Math.PI/32;return point(300+Math.cos(a)*111,247+Math.sin(a)*58);}),0xd6ad70,3);
  if(m==='beads')Array.from({length:8},(_,i)=>{const a=-Math.PI/2+i*Math.PI/4;this.item(i%3===0?'world-gem':'world-pearl',110+i%4*125,475+Math.floor(i/4)*57,300+Math.cos(a)*111,247+Math.sin(a)*58,36,36);});
  if(m==='clasp'){this.item('world-pearl',237,169,291,183,32);this.item('world-gem',360,169,313,183,33);}
  if(m==='sandwich')macaronPlaces.forEach(([x,y],i)=>this.item('world-macaron-top',145+i*153,504,x,y,102,76));
  if(m.startsWith('pack-')){
   const data=m==='pack-tall'?[['mascara',195,207,38,99],['brush',252,207,38,99],['perfume',345,207,72,80]]:m==='pack-flat'?[['palette',210,315,89,70],['blush',339,315,72,72]]:[['sachet',205,415,73,68],['lipstick',322,420,35,79]];
   data.forEach(([key,tx,ty,w,h],i)=>this.item(`world-${key}`,145+i*148,513,tx,ty,w,h,{rotate:true}));
  }
  this.items.forEach(item=>{if(item.tint)item.sprite.setTint(item.tint);if(!item.remove){item.ghost=this.image(item.key,item.tx,item.ty,item.w,item.h).setAlpha(.20);this.stage.sendToBack(item.ghost);} });
 }
 setupFolds(){
  const m=this.mode;
  this.moves=m==='braid'?Array.from({length:6},(_,i)=>({a:point(i%2?377:223,310+i*15),b:point(300,350+i*17)})):m==='fold'?[{a:point(173,295),b:point(297,295)},{a:point(419,295),b:point(301,295)},{a:point(300,423),b:point(300,218)}]:[{a:point(140,370),b:point(302,371)},{a:point(454,371),b:point(305,371)},{a:point(231,424),b:point(355,424)}];
  if(m==='wrap'){this.paper=this.image('mask-curl',300,396,360,180).setTint(0xf4bddb).setAlpha(.6);}
  this.hand=this.image(m==='braid'?'world-comb':'world-ribbon',this.moves[0].a.x,this.moves[0].a.y,m==='braid'?106:80,m==='braid'?106:80);
 }
 setupSwirl(){if(this.mode==='swirl'){this.swirlReveal=this.image('world-bath-lavender',300,274,420,464).setAlpha(.35);}this.center=point(300,this.mode==='mix'?485:278);this.radius=this.mode==='mix'?66:72;this.swirlArt=this.image(this.mode==='mix'?'world-palette':'water-puddle',this.center.x,this.center.y,this.mode==='mix'?190:247,this.mode==='mix'?110:139).setTint(0xefb8e7);if(this.mode==='swirl')this.swirlArt.setVisible(false);}
 setupPour(){
  if(this.mode==='filling'){this.targets=macaronPlaces.map(([x,y])=>({x,y,v:0,done:false}));this.targets.forEach(t=>this.image('world-shell',t.x,t.y,109,86,this.permanent));}
  else this.targets=[{x:300,y:this.mode==='fragrance'?199:285,v:0,done:false}];
  if(this.mode==='wax')this.waxReveal=this.image('world-candle-filled',300,274,420,464).setAlpha(0);
  this.pourArt=this.s.add.graphics();this.stage.add(this.pourArt);
 }
 setupIgnite(){
  const flame=(ctx,x,y,w,h)=>{
   ctx.save();ctx.translate(x,y);ctx.scale(w/80,h/120);
   const gradient=ctx.createLinearGradient(0,0,0,120);gradient.addColorStop(0,'#ffe797');gradient.addColorStop(.55,'#ffbd54');gradient.addColorStop(1,'#e76d47');
   ctx.beginPath();ctx.moveTo(40,3);ctx.bezierCurveTo(49,38,78,58,72,85);ctx.bezierCurveTo(66,129,9,127,8,85);ctx.bezierCurveTo(6,60,30,41,40,3);ctx.fillStyle=gradient;ctx.fill();
   ctx.beginPath();ctx.moveTo(40,47);ctx.bezierCurveTo(61,79,60,112,40,115);ctx.bezierCurveTo(19,112,20,85,40,47);ctx.fillStyle='#fff6c7';ctx.fill();ctx.restore();
  };
  if(!this.s.textures.exists('workshop-match')){
   const t=this.s.textures.createCanvas('workshop-match',80,230),c=t.getContext();
   c.lineCap='round';c.strokeStyle='#835141';c.lineWidth=15;c.beginPath();c.moveTo(40,53);c.lineTo(40,218);c.stroke();c.strokeStyle='#f6cf92';c.lineWidth=9;c.stroke();flame(c,16,0,48,68);t.refresh();
   const f=this.s.textures.createCanvas('workshop-flame',80,120);flame(f.getContext(),0,0,80,120);f.refresh();
   const g=this.s.textures.createCanvas('workshop-fire-glow',256,256),gc=g.getContext(),gradient=gc.createRadialGradient(128,128,8,128,128,125);
   gradient.addColorStop(0,'rgba(255,235,153,.85)');gradient.addColorStop(.4,'rgba(255,188,92,.35)');gradient.addColorStop(1,'rgba(255,173,80,0)');gc.fillStyle=gradient;gc.fillRect(0,0,256,256);g.refresh();
  }
  const src=this.hero.texture.getSourceImage(),[x,y]=this.portraitPoint(src.width*.495,src.height*.112);
  this.targets=[{x,y,v:0,done:false}];
 }
 lightCandle(){
  if(this.flame?.active)return;
  const {x,y}=this.targets[0],glow=this.image('workshop-fire-glow',x,y-28,175,175,this.permanent),fire=this.image('workshop-flame',x,y-33,48,70,this.permanent);
  this.flame=fire;this.placed.push(glow,fire);this.burst(x,y,14,'glint');
  if(!this.s.app.reducedMotion){this.s.tweens.add({targets:fire,scaleX:fire.scaleX*.9,scaleY:fire.scaleY*1.06,angle:3,duration:230,yoyo:true,repeat:-1});this.s.tweens.add({targets:glow,alpha:.65,duration:550,yoyo:true,repeat:-1});}
 }
 setupStack(){for(const o of [...this.permanent.list])if(o!==this.hero&&o!==this.marks&&o!==this.charm)o.destroy();this.placed=[];this.stackCount=0;this.stackX=300;this.stackY=356;this.stackSprite=this.image('world-macaron-top',300,196,115,80);this.stackPhase=0;}
 setupPops(){if(this.mode==='crush'){this.bomb=this.image('world-bath-bomb',300,265,119,119);this.targets=[{x:300,y:265}];}else{this.targets=Array.from({length:14},(_,i)=>{const a=i*2.4,r=24+Math.sqrt(i/14)*123,u=Math.cos(a)*r,v=Math.sin(a)*r*.43;const t={x:300+u*.75+v*.66,y:277-u*.66+v*.75,done:false};t.visual=this.image('bubble',t.x,t.y,46,46).setTint(i%2?0xffdeff:0xe3fff5);return t;});}}
 down(p){
  this.lastDown={...p};this.lastPoint={...p};this.s.down=true;
  if(dragModes.has(this.mode)){const available=this.items.filter(i=>!i.done&&(!i.ordered||this.items.find(t=>!t.done)===i));this.drag=available.find(i=>Math.abs(p.x-i.sprite.x)<Math.max(34,i.w*.65)&&Math.abs(p.y-i.sprite.y)<Math.max(34,i.h*.65));if(this.drag){this.stage.bringToTop(this.drag.sprite);this.drag.origin={x:this.drag.sprite.x,y:this.drag.sprite.y};this.s.tweens.killTweensOf(this.drag.sprite);}}
  if(['braid','fold','wrap'].includes(this.mode)){const m=this.moves[this.sequence];if(m&&dist(p,m.a)<58)this.drag={move:m};}
  if(this.mode==='crush'&&dist(p,this.targets[0])<90){this.pops++;this.burst(p.x,p.y,7,'powder-stroke');this.bomb.setScale(this.bomb.scaleX*.93);this.s.tweens.add({targets:this.bomb,angle:this.pops%2?12:-12,duration:100,yoyo:true});this.s.stepProgress=this.pops/8;}
  if(this.mode==='bath-pop'){const t=this.targets.find(t=>!t.done&&dist(p,t)<34);if(t){t.done=true;this.s.tweens.add({targets:t.visual,alpha:0,scaleX:t.visual.scaleX*1.4,scaleY:t.visual.scaleY*1.4,duration:170});this.burst(t.x,t.y);this.s.stepProgress=this.targets.filter(t=>t.done).length/this.targets.length;}}
  if(this.mode==='stack'){if(Math.abs(this.stackSprite.x-300)<43){this.stackCount++;this.stackSprite.setPosition(300,this.stackY-this.stackCount*41);this.permanent.add(this.stackSprite);this.placed.push(this.stackSprite);this.burst(300,this.stackSprite.y);this.stackSprite=this.image('world-macaron-top',300,140,115,80);this.s.stepProgress=this.stackCount/4;}else{this.burst(this.stackSprite.x,this.stackSprite.y,3,'petal');this.s.app.toast('A little closer to the center');}}
 }
 move(p){
  if(this.mode==='braid'&&this.s.down){
   const next=this.moves[this.sequence];
   if(!this.drag&&next&&dist(p,next.a)<58)this.drag={move:next};
   this.hand.setPosition(p.x,p.y);
   // Crossing the target completes a strand immediately. Keep the pointer held
   // and pick up the next highlighted strand without another down/up gesture.
   if(this.drag?.move&&dist(p,this.drag.move.b)<55){this.up(p);this.hand.setPosition(p.x,p.y);}
   return;
  }
  if(this.drag&&!this.drag.move){this.drag.sprite.setPosition(p.x,p.y);}else if(this.drag?.move)this.hand.setPosition(p.x,p.y);
 }
 up(p){
  this.setStopCue(false);
  if(this.drag&&!this.drag.move){const item=this.drag,moved=dist(p,this.lastDown);if(item.rotate&&moved<12){item.angle=(item.angle+90)%180;item.sprite.setAngle(item.angle);this.returnItem(item);}else if(dist(p,point(item.tx,item.ty))<48&&(!item.rotate||item.angle===0)){item.done=true;item.ghost?.setVisible(false);if(item.placedSize){const src=item.sprite.texture.getSourceImage(),scale=item.placedSize/Math.max(src.width,src.height);this.s.tweens.add({targets:item.sprite,scaleX:scale,scaleY:scale,duration:240});}this.s.tweens.add({targets:item.sprite,x:item.tx,y:item.ty,angle:0,duration:240,ease:'Back.Out'});if(item.hide||item.remove)this.s.tweens.add({targets:item.sprite,alpha:0,duration:200});else{this.permanent.add(item.sprite);this.placed.push(item.sprite);}this.burst(item.tx,item.ty);this.s.stepProgress=this.items.filter(i=>i.done).length/this.items.length;if(this.mode==='pack-close'){this.s.stepProgress*=.75;if(this.items.every(i=>i.done)){this.zip={points:[point(146,133),point(205,133),point(265,133),point(325,133),point(385,133),point(453,133),point(456,200),point(456,275),point(456,350),point(456,435)],index:0};this.s.app.toast('Pull the glowing zipper around the edge');}}if(this.s.level.outfit&&this.items.some(t=>!t.done))this.revealOutfitPart(item);else if(!this.s.level.outfit&&this.mode==='layers'&&this.items[0].done)this.hero.setTint(0xfbf1ff);}else{this.returnItem(item);if(item.rotate&&item.angle)this.s.app.toast('Tap to rotate, then match the outline');}}
  else if(this.drag?.move){const m=this.drag.move;if(dist(p,m.b)<55){this.sequence++;this.burst(m.b.x,m.b.y);if(this.mode==='braid'){if(!this.braidReveal){this.braidReveal=this.image('world-hair-braided',300,274,420,464);this.stage.sendToBack(this.braidReveal);}const f=this.braidReveal.texture.getSourceImage();this.braidReveal.setCrop(0,0,f.width,f.height*(.22+.78*this.sequence/this.moves.length));}if(this.mode==='fold'){const sx=this.hero.scaleX;this.s.tweens.add({targets:this.hero,scaleX:sx*.92,duration:160,yoyo:true});}this.s.stepProgress=this.sequence/this.moves.length;}const next=this.moves[this.sequence];if(next)this.hand.setPosition(next.a.x,next.a.y);}
  if(this.mode==='filling'&&this.holdTime){const t=this.targets.find(t=>!t.done);if(t&&this.meter>=.66&&this.meter<=.94){t.done=true;t.v=1;this.burst(t.x,t.y);if(this.mode==='filling'){const cream=this.image('foam-puff',t.x,t.y-10,90,47,this.permanent).setTint(0xffe2f3);this.placed.push(cream);}else this.waxLevel=.78;this.s.stepProgress=this.targets.filter(t=>t.done).length/this.targets.length;}else this.s.app.toast('Release when the ring turns mint');this.meter=0;this.holdTime=0;}
  this.drag=null;this.anglePrev=null;this.lastPoint=null;
 }
 returnItem(i){this.s.tweens.add({targets:i.sprite,x:i.x,y:i.y,duration:260,ease:'Back.Out'});}
 burst(x,y,n=7,key='glint'){if(this.s.app.reducedMotion||this.s.fx.length>65)return;for(let i=0;i<n;i++){const im=this.image(key,x,y,13+Math.random()*15,20,this.s.fx),a=i*6.283/n,d=25+Math.random()*45;this.s.tweens.add({targets:im,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d-18,alpha:0,angle:60,duration:430+Math.random()*240,onComplete:()=>im.destroy()});}}
 addStroke(points,color=0xd986bc,width=7){this.ink.push({points:points.map(p=>({...p})),color,width});this.marks.lineStyle(width,color,1);this.marks.beginPath();points.forEach((p,i)=>i?this.marks.lineTo(p.x,p.y):this.marks.moveTo(p.x,p.y));this.marks.strokePath();}
 update(dt){
  const s=this.s,p=s.local,m=this.mode;
  if(m==='stack'){this.stackPhase+=dt;this.stackSprite.x=300+Math.sin(this.stackPhase*1.55)*151;}
  if(s.down){
   this.move(p);if(this.cursor.alpha){if(['filling','ignite','makeup','polish'].includes(m))this.cursor.setPosition(p.x,p.y).setAngle(m==='ignite'?25:-25);else this.cursor.setPosition(p.x+29,p.y+33).setAngle(Math.sin(s.time.now/160)*8-15);}
   if(this.zip){const t=this.zip.points[this.zip.index];if(t&&dist(p,t)<37){this.zip.index++;this.burst(t.x,t.y,3);s.stepProgress=.75+.25*this.zip.index/this.zip.points.length;}}
   if(pathModes.has(m)){const path=this.paths.find(t=>!t.done);if(path){const next=path.points[path.index];if(dist(p,next)<31){if(path.index){const previous=path.points[path.index-1];if(['lace','tie','outline','cross-stitch','embellish'].includes(m))this.addStroke([previous,next],m==='lace'||m==='tie'?0xffe7f1:m==='embellish'?0x90af8c:0xdb85b0,m==='lace'?8:6);}
     path.index++;if(s.time.now-this.lastFx>85){this.burst(next.x,next.y,2,m==='iron'?'mist-cloud':'glint');this.lastFx=s.time.now;}if(path.index>=path.points.length){path.done=true;if(path.visual)this.s.tweens.add({targets:path.visual,alpha:0,duration:220});this.burst(p.x,p.y);}}
    s.stepProgress=this.paths.reduce((n,t)=>n+t.index/t.points.length,0)/this.paths.length;}}
   if(scrubModes.has(m)){const movement=this.lastPoint?dist(p,this.lastPoint):0;if(m==='makeup')this.makeupFocus=this.targets.filter(t=>!t.done).sort((a,b)=>dist(p,a)-dist(p,b))[0];for(const t of this.targets){if(!t.done&&(m!=='makeup'||t===this.makeupFocus)&&dist(p,t)<(m==='makeup'?28:m==='polish'?30:43)&&(movement>.5||['polish','makeup'].includes(m))){t.v=clamp(t.v+dt*(m==='polish'?1.05:1.4));const apply=['polish','makeup'].includes(m);t.visual.setAlpha(apply?t.v:(1-t.v)*.78);if(t.v>=1){t.done=true;this.burst(t.x,t.y);if(apply){this.permanent.add(t.visual);this.placed.push(t.visual);}}if(s.time.now-this.lastFx>110){this.burst(p.x,p.y,2,apply?'glint':'bubble');this.lastFx=s.time.now;}}}s.stepProgress=this.targets.reduce((n,t)=>n+t.v,0)/this.targets.length;}
   if(m==='mix'||m==='swirl'){const d=dist(p,this.center);if(d>this.radius*.35&&d<this.radius*1.8){const a=Math.atan2(p.y-this.center.y,p.x-this.center.x);if(this.anglePrev!==null){let da=a-this.anglePrev;if(da>Math.PI)da-=Math.PI*2;if(da<-Math.PI)da+=Math.PI*2;if(Math.abs(da)<.5)this.turns+=Math.abs(da);}this.anglePrev=a;this.swirlArt.angle=this.mode==='mix'?Math.sin(this.turns)*6:0;if(this.swirlReveal?.active)this.swirlReveal.setAlpha(.35+.65*clamp(this.turns/(Math.PI*8)));s.stepProgress=clamp(this.turns/(Math.PI*8));if(s.time.now-this.lastFx>110){this.burst(p.x,p.y,2,m==='mix'?'powder-stroke':'bubble');this.lastFx=s.time.now;}}else this.anglePrev=null;}
   if(['filling','fragrance','wax'].includes(m)){const t=this.targets.find(t=>!t.done);if(t&&(m==='filling'?Math.abs(p.x-t.x)<45&&p.y>=t.y-90&&p.y<=t.y+12:dist(p,t)<76)){this.holdTime+=dt;if(m==='filling')this.meter=clamp(this.holdTime/1.65);else{t.v=clamp(t.v+dt/(m==='wax'?3:2.4));this.meter=t.v;s.stepProgress=t.v;if(t.v>=1)t.done=true;}if(m==='fragrance')this.cursor.setPosition(t.x+25,t.y-85).setAngle(-35);if(s.time.now-this.lastFx>160){const drop=this.image('serum-drop',m==='filling'?this.cursor.x:t.x,m==='filling'?this.cursor.y:t.y-75,19,27);if(m==='filling')drop.setTint(0xffe2f3);this.s.tweens.add({targets:drop,x:t.x,y:t.y+5,alpha:.1,duration:350,onComplete:()=>drop.destroy()});this.lastFx=s.time.now;}}}
   if(m==='ignite'){const t=this.targets[0];if(dist(p,t)<38){t.v=clamp(t.v+dt/.9);s.stepProgress=t.v;if(t.v>=1)t.done=true;}}
   this.lastPoint={...p};
  }else if(this.cursor?.alpha){this.cursor.x+=((['filling','wax'].includes(m)?420:470)-this.cursor.x)*.1;this.cursor.y+=((['filling','wax'].includes(m)?422:445)-this.cursor.y)*.1;if(m==='filling')this.cursor.angle*=.85;}
  this.draw();
 }
 setStopCue(show){
  if(!show){if(this.stopCue?.active){this.s.tweens.killTweensOf(this.stopCue);this.stopCue.setVisible(false);}return;}
  if(this.stopCue?.visible)return;
  const target=this.targets.find(t=>!t.done);if(!target)return;
  if(!this.stopCue)this.stopCue=this.text('STOP!',target.x,target.y-108,44).setColor('#ba4367').setStroke('#fffaf0',6);
  const cue=this.stopCue;this.stage.bringToTop(cue);
  cue.setPosition(target.x,target.y-108).setVisible(true).setAlpha(1).setScale(1);
  if(!this.s.app.reducedMotion){
   cue.setY(target.y-88).setScale(.65).setAlpha(0);
   this.s.tweens.add({targets:cue,y:target.y-108,scaleX:1,scaleY:1,alpha:1,duration:150,ease:'Back.Out'});
  }
 }
 draw(){
  this.setStopCue(this.mode==='filling'&&this.s.down&&this.meter>=.66&&this.meter<=.94);
  const g=this.guides,m=this.mode;g.clear();const pulse=1+Math.sin(this.s.time.now/230)*.07;
  const ring=(x,y,r=22,color=0xc1f0b2)=>{g.lineStyle(3,0xffffff,.95);g.strokeCircle(x,y,r*pulse);g.lineStyle(3,color,.95);g.strokeCircle(x,y,(r-4)*pulse);};
  if(pathModes.has(m)){const path=this.paths.find(t=>!t.done);if(path){g.lineStyle(3,0x956c9d,.7);for(let i=path.index;i<path.points.length;i+=2)g.fillStyle(0xa078a9,.80).fillCircle(path.points[i].x,path.points[i].y,3);const p=path.points[path.index];ring(p.x,p.y,17);}}
  if(scrubModes.has(m))for(const t of this.targets)if(!t.done&&(m!=='makeup'||t===(!this.makeupFocus?.done&&this.makeupFocus||this.targets.find(v=>!v.done)))){const radius=m==='makeup'?17:m==='polish'?21:30;ring(t.x,t.y,radius);g.lineStyle(m==='makeup'?3:5,0xb6e693,1);g.beginPath();g.arc(t.x,t.y,m==='makeup'?14:25,-Math.PI/2,-Math.PI/2+t.v*Math.PI*2);g.strokePath();}
  if(dragModes.has(m)){for(const i of this.items){if(i.done)continue;const packing=i.rotate;g.lineStyle(3,0xb5d3ab,.9);if(packing||m.startsWith('sort-'))g.strokeRoundedRect(i.tx-i.w/2-6,i.ty-i.h/2-6,i.w+12,i.h+12,8);else ring(i.tx,i.ty,28);if(i.ordered&&this.items.find(t=>!t.done)!==i)continue;const ghost=this.s.textures.get(`ui-${i.key}`);if(ghost&&this.drag===i){g.lineStyle(4,0xf3dd8e,1);g.strokeCircle(i.tx,i.ty,35);}}
   if(m.startsWith('sort-')){g.lineStyle(3,0xc3a8c9,.65);for(let y=0;y<3;y++)for(let x=0;x<4;x++)g.strokeRoundedRect(155+x*74,135+y*92,68,84,8);}}
  if(['braid','fold','wrap'].includes(m)){const move=this.moves[this.sequence];if(move){ring(move.a.x,move.a.y,27);this.s.arrow(g,move.a.x,move.a.y,move.b.x,move.b.y,.85);ring(move.b.x,move.b.y,19);}}
  if(m==='mix'||m==='swirl'){g.lineStyle(3,0xffffff,.7);g.strokeCircle(this.center.x,this.center.y,this.radius);const a=this.s.time.now/500;ring(this.center.x+Math.cos(a)*this.radius,this.center.y+Math.sin(a)*this.radius,12);}
  if(['filling','wax','fragrance'].includes(m)){const t=this.targets.find(t=>!t.done);if(t){if(m!=='filling')this.meter=t.v;ring(t.x,t.y,54);if(m==='filling'){g.lineStyle(9,0xbbeaaf,1);g.beginPath();g.arc(t.x,t.y,53,-Math.PI/2+.66*Math.PI*2,-Math.PI/2+.94*Math.PI*2);g.strokePath();}g.lineStyle(6,m==='filling'&&this.meter>=.66&&this.meter<=.94?0x93d686:0xe0afd3,1);g.beginPath();g.arc(t.x,t.y,44,-Math.PI/2,-Math.PI/2+this.meter*Math.PI*2);g.strokePath();}
   this.pourArt.clear();if(m==='wax'){const source=this.waxReveal.texture.getSourceImage(),v=this.targets[0].v;this.waxReveal.setAlpha(1).setCrop(0,source.height*(1-v),source.width,source.height*v);if(this.s.down&&this.holdTime){this.cursor.setPosition(370,110).setAngle(-35);this.pourArt.lineStyle(9,0xe7b4e3,.9);this.pourArt.lineBetween(370,110,305,201);this.pourArt.lineStyle(3,0xfff3ee,.85);this.pourArt.lineBetween(370,110,303,199);}}}
  if(m==='stack'){g.lineStyle(3,0xffffff,.9);g.lineBetween(300,125,300,360);ring(300,185,27);}
  if(this.zip&&this.zip.index<this.zip.points.length){const t=this.zip.points[this.zip.index];ring(t.x,t.y,24);}
  if(m==='ignite'&&!this.targets[0].done){const t=this.targets[0];ring(t.x,t.y,25);g.lineStyle(4,0xffd177,1).beginPath().arc(t.x,t.y,20,-Math.PI/2,-Math.PI/2+t.v*Math.PI*2).strokePath();}
  this.counter?.setText(this.zip?'Pull the zipper closed':m==='stack'?`${this.stackCount} / 4 sweet layers`:m==='crush'?`${Math.min(8,this.pops)} / 8 little cracks`:m==='mix'||m==='swirl'?`${Math.min(4,Math.floor(this.turns/Math.PI/2))} / 4 soothing circles`:dragModes.has(m)?`${this.items.filter(i=>i.done).length} / ${this.items.length} perfectly placed`:pathModes.has(m)?`${this.paths.filter(t=>t.done).length} / ${this.paths.length} lovely strokes`:['wax','fragrance'].includes(m)?`${Math.round(this.s.stepProgress*100)}% filled`:m==='ignite'?'Hold the match at the wick':m==='filling'?(this.meter>=.66&&this.meter<=.94?'RELEASE NOW':'Hold, then release in the mint zone'):'');
 }
 finish(){
  const m=this.mode;this.doneStages.push(m);this.guides.clear();this.counter?.setText('');this.cursor?.setAlpha(0);
  // A rewarded skip resolves the same final material and placements as play.
  if(scrubModes.has(m))for(const t of this.targets){const apply=['makeup','polish'].includes(m);t.visual.setAlpha(apply?1:0);if(apply&&!t.done){this.permanent.add(t.visual);this.placed.push(t.visual);}t.done=true;t.v=1;}
  if(['lace','tie','outline','cross-stitch','embellish'].includes(m))for(const path of this.paths)if(!path.done)this.addStroke(path.points.slice(Math.max(0,path.index-1)),m==='lace'||m==='tie'?0xffe7f1:m==='embellish'?0x90af8c:0xdb85b0,m==='lace'?8:6);
  for(const item of this.items)if(!item.done){item.done=true;item.ghost?.setVisible(false);item.sprite.setPosition(item.tx,item.ty).setAngle(0);if(item.hide||item.remove)item.sprite.setVisible(false);else{this.permanent.add(item.sprite);this.placed.push(item.sprite);}}
  if(m==='filling')for(const t of this.targets)if(!t.done){const cream=this.image('foam-puff',t.x,t.y-10,90,47,this.permanent).setTint(0xffe2f3);this.placed.push(cream);}
  if(m==='stack')for(let i=this.stackCount;i<4;i++){const sweet=this.image('world-macaron-top',300,this.stackY-(i+1)*41,115,80,this.permanent);this.placed.push(sweet);}
  if(m==='layers'||m==='accessorize'){this.placed.forEach(p=>p.destroy());this.placed=[];}
  const swaps={braid:'hair-braided',dress:'dress-pink',layers:'dress-layered',accessorize:'dress-finished',fold:'laundry-folded',liner:'glam-finished',wrap:'bouquet-wrapped',polish:'nails-polished',embellish:'stitch-finished'};
  if(swaps[m]){this.marks.clear();this.ink=[];if(m==='liner'||m==='polish')this.placed.forEach(p=>p.setVisible(false));this.heroState(this.s.level.outfit?.states[m]||swaps[m]);}
  if(m==='ignite')this.lightCandle();
  if(m==='wax'){this.heroState('candle-filled');this.waxLevel=0;}
  if(m==='wick'){const gem=this.image('world-gem',300,320,49,49,this.permanent);this.placed.push(gem);}
  if(m==='pack-close'){this.addStroke([point(135,126),point(458,126),point(458,458)],0xe9bf66,7);}
  if(m==='swirl')this.heroState('bath-lavender');
  this.burst(300,280,20);if(!this.s.app.reducedMotion)this.s.tweens.add({targets:this.hero,angle:1.5,duration:150,yoyo:true,repeat:1});
 }
 hint(){const path=this.paths.find(p=>!p.done),item=this.items.find(i=>!i.done),t=this.targets.find(t=>!t.done),move=this.moves?.[this.sequence];const p=this.zip?.points[this.zip.index]||path?.points[path.index]||item?.sprite||move?.a||t||point(300,280);this.burst(p.x,p.y,16);this.s.app.toast(this.s.step.hint);}
 refreshAccessory(){
  this.charm?.destroy();this.charm=null;const item=this.s.app.save.equipped;
  if(item==='bow'||item==='butterfly'){const pos=this.s.level.outfit?[this.hero.x+this.hero.displayWidth*.1,this.hero.y-this.hero.displayHeight*.19]:{hair:[365,137],dress:[332,82],laundry:[345,205],glam:[366,139],kitten:[300,278],organizer:[465,104],nails:[311,462],sneaker:[374,193],jewels:[466,375],bouquet:[300,412],macaron:[413,392],candle:[420,385],stitch:[465,391],bath:[436,192],pouch:[453,442]}[this.s.level.id]||[430,400];this.charm=this.image(item==='bow'?'rose-bow':'butterfly',pos[0],pos[1],this.s.level.outfit?32:55,this.s.level.outfit?29:47,this.permanent);}
 }
 release(){this.setStopCue(false);if(this.drag&&!this.drag.move&&!this.drag.done)this.returnItem(this.drag);this.drag=null;this.anglePrev=null;this.lastPoint=null;this.holdTime=0;this.meter=0;}
 capture(){
  const c=document.createElement('canvas');c.width=c.height=600;const ctx=c.getContext('2d');
  const draw=im=>{
   if(!im?.visible||!im.active)return;let src=im.texture.getSourceImage();
   if(im.tintTopLeft!==0xffffff){
    const tinted=document.createElement('canvas');tinted.width=src.width;tinted.height=src.height;const t=tinted.getContext('2d');t.drawImage(src,0,0);
    const data=t.getImageData(0,0,src.width,src.height),rgb=[im.tintTopLeft>>16&255,im.tintTopLeft>>8&255,im.tintTopLeft&255];
    for(let i=0;i<data.data.length;i+=4)for(let j=0;j<3;j++)data.data[i+j]=data.data[i+j]*rgb[j]/255;t.putImageData(data,0,0);src=tinted;
   }
   ctx.save();ctx.globalAlpha=im.alpha;ctx.translate(im.x,im.y);ctx.rotate(im.rotation);ctx.drawImage(src,-im.displayWidth/2,-im.displayHeight/2,im.displayWidth,im.displayHeight);ctx.restore();
  };
  draw(this.hero);
  for(const line of this.ink){ctx.strokeStyle='#'+line.color.toString(16).padStart(6,'0');ctx.lineWidth=line.width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();line.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}
  for(const p of this.placed)draw(p);draw(this.charm);return c;
 }
 debug(){return {mechanic:this.mode,items:this.items.map(({x,y,tx,ty,angle,done,rotate,ordered,w,h})=>({x,y,tx,ty,angle,done,rotate,ordered,w,h})),paths:this.paths.map(p=>({points:p.points,index:p.index,done:p.done})),targets:this.targets.map(({x,y,v,done})=>({x,y,v,done})),zip:this.zip,moves:this.moves,sequence:this.sequence,center:this.center,radius:this.radius,meter:this.meter,stackX:this.stackSprite?.x,stackY:this.stackSprite?.y,stackCount:this.stackCount};}
 destroy(){this.s.tweens.killTweensOf(this.placed);this.s.tweens.killTweensOf(this.root.list);this.root.destroy();}
}

export function installWorkshop(Scene){
 const proto=Scene.prototype;
 const base=Object.fromEntries(['begin','showWelcome','nextStep','onDown','onMove','onUp','release','update','finishStep','hint','capturePortrait','debugState','refreshAccessory','resize'].map(k=>[k,proto[k]]));
 const stop=s=>{if(s.workshop){s.workshop.destroy();s.workshop=null;}for(const o of [s.portrait,...s.eyes,s.layer,s.patchLayer,s.guide,s.tool,s.targetText])o.setVisible(true);};
 proto.begin=function(index){stop(this);if(!LEVELS[index].kind)return base.begin.call(this,index);this.clear();this.runId=(this.runId||0)+1;this.levelIndex=index;this.level=LEVELS[index];this.stepIndex=0;this.active=true;this.frozen=false;this.elapsed=0;this.transitioning=false;this.character='workshop';for(const o of [this.portrait,...this.eyes,this.accessory,this.layer,this.patchLayer,this.guide,this.tool,this.targetText])o.setVisible(false);this.workshop=new Workshop(this);this.nextStep(true);this.resize();};
 proto.showWelcome=function(){stop(this);return base.showWelcome.call(this);};
 proto.nextStep=function(first=false){if(!this.workshop)return base.nextStep.call(this,first);this.step=this.level.steps[this.stepIndex];this.mode='workshop';this.stepProgress=0;this.transitioning=false;this.workshop.beginStage();this.app.stepChanged(this.level,this.stepIndex,this.step);};
 proto.onDown=function(p){if(!this.workshop)return base.onDown.call(this,p);if(!this.active||this.frozen||this.transitioning||this.pointerId!==null)return;this.pointerId=p.id;this.local=this.world(p);this.workshop.down(this.local);};
 proto.onMove=function(p){if(!this.workshop)return base.onMove.call(this,p);if(this.pointerId!==null&&p.id!==this.pointerId)return;this.local=this.world(p);};
 proto.onUp=function(p){if(!this.workshop)return base.onUp.call(this,p);if(p.id!==this.pointerId)return;this.local=this.world(p);this.workshop.up(this.local);this.down=false;this.pointerId=null;};
 proto.release=function(){if(this.workshop){this.workshop.release();this.down=false;this.pointerId=null;return;}return base.release.call(this);};
 proto.update=function(time,delta){if(!this.workshop)return base.update.call(this,time,delta);if(this.frozen||!this.active)return;const dt=Math.min(delta/1000,.05);this.elapsed+=dt;if(this.transitioning)return;this.workshop.update(dt);this.app.progress((this.stepIndex+this.stepProgress)/this.level.steps.length,this.elapsed);if(this.stepProgress>=.999)this.finishStep();};
 proto.finishStep=function(){if(!this.workshop)return base.finishStep.call(this);if(this.transitioning)return;this.transitioning=true;this.release();this.workshop.finish();this.app.progress((this.stepIndex+1)/this.level.steps.length,this.elapsed);const run=this.runId;this.time.delayedCall(this.step.mechanic==='ignite'?1800:720,()=>{if(run!==this.runId||!this.active)return;this.stepIndex++;if(this.stepIndex===this.level.steps.length){this.active=false;this.transitioning=false;this.app.completed(this.levelIndex,this.elapsed);}else this.nextStep();});};
 proto.hint=function(){if(this.workshop)return this.workshop.hint();return base.hint.call(this);};
 proto.capturePortrait=function(asCanvas=false){if(!this.workshop)return base.capturePortrait.call(this,asCanvas);const c=this.workshop.capture();return asCanvas?c:c.toDataURL('image/webp',.9);};
 proto.debugState=function(){const d=base.debugState.call(this);if(this.workshop)d.workshop=this.workshop.debug();return d;};
 proto.refreshAccessory=function(){if(this.workshop)return this.workshop.refreshAccessory();return base.refreshAccessory.call(this);};
 proto.resize=function(){base.resize.call(this);if(this.workshop&&this.app.ui?.layout){const l=this.app.ui.layout,top=l.landscape?111:196,bottom=l.H-(l.landscape?112:205),fit=Math.min((l.W-28)/600,(bottom-top)/570)*l.pixelScale;this.fit=fit;this.root.setScale(fit).setPosition(l.x*this.app.pixelRatio+l.W/2*l.pixelScale-300*fit,l.y*this.app.pixelRatio+(top+bottom)/2*l.pixelScale-292*fit);}};
}
