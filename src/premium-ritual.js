import {CLEANING_PACE,cleaningRadius} from './premium-balance.js';
import {LEVELS} from './levels.js';
import {t as tr} from './i18n.js';
import {CLEAN_SCENES,SHOP_CATALOGS} from './premium-scenes.js';
const B={x:80,y:0,w:440,h:550};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=v=>Math.max(0,Math.min(1,v));

const inside=(p,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;};
const canvas=()=>{const c=document.createElement('canvas');c.width=600;c.height=640;return c;};

export class PremiumRitual{
 constructor(s){
  this.s=s;this.bounds=s.level.scene==='sofa'?{x:20,y:100,w:560,h:422}:B;this.root=s.add.container();s.root.add(this.root);this.config=CLEAN_SCENES[s.level.scene];this.catalog=SHOP_CATALOGS[s.level.scene];this.bought=[];this.placed=[];
  this.key=`premium-board-${s.runId}`;this.texture=s.textures.createCanvas(this.key,600,640);this.ctx=this.texture.getContext();this.board=s.add.image(0,0,this.key).setOrigin(0);this.root.add(this.board);
  this.surfaces={};this.dust=canvas();this.particles=[];this.particleTravel=0;this.bagPulse=0;this.foam=canvas();this.nap=canvas();this.dirt=canvas();this.windowDirt=canvas();this.randomSeed=31+s.levelIndex;
  if(this.config){for(const [name,polys] of Object.entries(this.config))if(name!=='amenities')this.surfaces[name]=polys.map(p=>p.map(p=>this.point(p)));if(s.level.scene==='sofa'){this.fabricMask=canvas();const c=this.fabricMask.getContext('2d'),b=this.bounds;c.drawImage(this.source('clean-sofa-mask'),b.x,b.y,b.w,b.h);this.fabricMaskPixels=c.getImageData(0,0,600,640).data;}this.prepareMasks();this.prepareDirt();this.crumbs=this.scatter('floor',s.level.steps.some(t=>t.mechanic==='vacuum')?CLEANING_PACE.crumbs:0).map((p,i)=>({...p,size:3+i%4,done:false}));this.litter=this.scatter('floor',s.level.steps.some(t=>t.mechanic==='pickup')?CLEANING_PACE.litter:0).map((p,i)=>({...p,home:{...p},angle:(i%3-1)*.25,key:`clean-litter-${i%4}`,done:false}));}
  this.enter();
 }
 point([x,y]){const b=this.bounds;return{x:b.x+x*b.w,y:b.y+y*b.h};}
 prepareMasks(){
  this.masks={};this.maskPixels={};const source=canvas(),b=this.bounds;source.getContext('2d').drawImage(this.source(this.s.level.hero),b.x,b.y,b.w,b.h);
  for(const name of Object.keys(this.surfaces)){const mask=canvas(),c=mask.getContext('2d');c.save();this.clip(c,name);c.drawImage(source,0,0);c.restore();if(this.fabricMask&&['fabric','floor'].includes(name)){c.globalCompositeOperation='destination-in';c.drawImage(this.fabricMask,0,0);}this.masks[name]=mask;this.maskPixels[name]=c.getImageData(0,0,600,640).data;}
 }
 maskLayer(layer,name='fabric'){const mask=this.masks?.[name];if(!mask)return;const c=layer.getContext('2d');c.save();c.globalCompositeOperation='destination-in';c.drawImage(mask,0,0);c.restore();}
 rand(){this.randomSeed=(this.randomSeed*1664525+1013904223)>>>0;return this.randomSeed/4294967296;}
 scatter(surface,count){const out=[];for(let i=0;i<8000&&out.length<count;i++){const p={x:this.bounds.x+this.rand()*this.bounds.w,y:this.bounds.y+this.rand()*this.bounds.h};if(this.onSurface(p,surface))out.push(p);}return out;}
 onSurface(p,name){const pixels=this.maskPixels?.[name],x=Math.floor(p.x),y=Math.floor(p.y);if(pixels)return x>=0&&x<600&&y>=0&&y<640&&pixels[(y*600+x)*4+3]>230;return(this.surfaces[name]||[]).some(poly=>inside(p,poly));}
 clip(c,name){c.beginPath();c.rect(this.bounds.x,this.bounds.y,this.bounds.w,this.bounds.h);c.clip();c.beginPath();for(const poly of this.surfaces[name]||[]){poly.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}c.clip();}
 source(key){return this.s.textures.get(this.s.textures.exists(key)?key:'ui-'+key).getSourceImage();}
 drawArt(c,key,x,y,w,h=w,alpha=1,tint){let im=this.source(key);if(tint){this.tinted??=new Map();const id=key+':'+tint;if(!this.tinted.has(id)){const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const t=c.getContext('2d');t.drawImage(im,0,0);t.globalCompositeOperation='multiply';t.fillStyle='#'+tint.toString(16).padStart(6,'0');t.fillRect(0,0,c.width,c.height);t.globalCompositeOperation='destination-in';t.drawImage(im,0,0);this.tinted.set(id,c);}im=this.tinted.get(id);}const scale=Math.min(w/im.width,h/im.height);c.save();c.globalAlpha=alpha;c.drawImage(im,x-im.width*scale/2,y-im.height*scale/2,im.width*scale,im.height*scale);c.restore();}
 prepareDirt(){
  const stains=(layer,surface,count,color,radius)=>{const c=layer.getContext('2d');for(const p of this.scatter(surface,count)){const r=radius*(.6+this.rand()*.6);c.save();c.translate(p.x,p.y);c.rotate(this.rand()*6);c.scale(1,.5+this.rand()*.45);const g=c.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,`rgba(${color},.48)`);g.addColorStop(.45,`rgba(${color},.25)`);g.addColorStop(1,`rgba(${color},0)`);c.fillStyle=g;c.fillRect(-r,-r,r*2,r*2);c.restore();}this.maskLayer(layer,surface);};
  stains(this.dirt,'fabric',this.s.level.scene==='rug'?10:18,'99,70,51',34);
  if(this.s.level.steps.some(t=>t.mechanic==='vacuum')){const c=this.dust.getContext('2d');c.fillStyle='rgba(119,100,79,.43)';c.fillRect(0,0,600,640);for(const p of this.scatter('floor',1400)){c.fillStyle=this.rand()>.5?'rgba(235,212,171,.55)':'rgba(71,53,44,.38)';c.beginPath();c.arc(p.x,p.y,.5+this.rand()*1.6,0,Math.PI*2);c.fill();}this.maskLayer(this.dust,'floor');}
  stains(this.windowDirt,'glass',24,'155,144,132',27);const g=this.windowDirt.getContext('2d');for(const p of this.scatter('glass',65)){g.strokeStyle='rgba(237,222,194,.55)';g.lineWidth=1.4;g.beginPath();g.ellipse(p.x,p.y,2+this.rand()*3,3+this.rand()*4,0,0,Math.PI*2);g.stroke();}this.maskLayer(this.windowDirt,'glass');
 }
 emitParticles(p,travel){
  if(this.s.app.reducedMotion)return;this.particleTravel+=travel;if(this.particleTravel<14||this.particles.length>70)return;this.particleTravel=0;
  for(let i=0;i<3;i++){const angle=this.rand()*Math.PI*2,r=12+this.rand()*28,x=p.x+Math.cos(angle)*r,y=p.y+Math.sin(angle)*r;if(!this.onSurface({x,y},this.surface))continue;this.particles.push({x,y,tx:p.x,ty:p.y,age:0,life:.35+this.rand()*.3,r:1.5+this.rand()*2,kind:this.mode});}
 }
 drawParticles(c){for(const p of this.particles){const t=clamp(p.age/p.life),s=t*t,x=p.kind==='vacuum'?p.x+(p.tx-p.x)*s:p.x+(p.x-p.tx)*t*.4,y=p.kind==='vacuum'?p.y+(p.ty-p.y)*s:p.y-t*24;c.save();c.globalAlpha=(1-t)*.9;c.strokeStyle=p.kind==='vacuum'?'#cdb083':'#fff5dd';c.fillStyle=p.kind==='vacuum'?'#dbc69c':'#fffdf4';c.lineWidth=1.5;if(p.kind==='vacuum'){c.beginPath();c.moveTo(x-(p.tx-p.x)*.13,y-(p.ty-p.y)*.13);c.lineTo(x,y);c.stroke();}c.beginPath();c.arc(x,y,p.r*(1-t*.6),0,Math.PI*2);p.kind==='foam'||p.kind==='rinse'?c.stroke():c.fill();c.restore();}}

 text(value,x,y,size=20){const t=this.s.add.text(x,y,value,{fontFamily:'Nunito',fontStyle:'900',fontSize:size,resolution:3,color:'#725183',stroke:'#fff8ee',strokeThickness:2,align:'center',wordWrap:{width:500}}).setOrigin(.5);this.stage.add(t);return t;}
 art(key,x,y,w,h=w){const im=this.s.add.image(x,y,this.s.textures.exists(key)?key:'ui-'+key),src=im.texture.getSourceImage();im.setScale(Math.min(w/src.width,h/src.height));this.stage.add(im);return im;}
 enter(){
  const previousFrame=this.stage?this.capture():null;this.blend=null;
  this.release();if(this.stage)this.s.tweens.killTweensOf(this.stage);this.stage?.destroy();this.stage=this.s.add.container();this.root.add(this.stage);this.mode=this.s.step.mechanic;this.surface=this.s.step.surface;this.clock=0;this.strokeDistance=0;this.drag=null;this.items=[];this.cells=[];this.pointer={x:510,y:560};this.feedback='';this.finishing=false;
  if(['vacuum','foam','scrub','rinse','glass','groom'].includes(this.mode)){
   const name=this.mode==='glass'?'glass':this.mode==='vacuum'?'floor':'fabric';this.surface=name;
   for(let y=this.bounds.y+5;y<this.bounds.y+this.bounds.h;y+=11)for(let x=this.bounds.x+5;x<this.bounds.x+this.bounds.w;x+=11)if(this.onSurface({x,y},name))this.cells.push({x,y,v:0});
   if(this.mode==='foam')this.foam.getContext('2d').clearRect(0,0,600,640);
   if(this.mode==='groom'){const c=this.nap.getContext('2d');c.clearRect(0,0,600,640);c.save();this.clip(c,'fabric');c.strokeStyle='rgba(93,75,124,.34)';c.lineWidth=2;for(const p of this.cells){c.beginPath();c.moveTo(p.x-4,p.y+5);c.lineTo(p.x+6,p.y-4);c.stroke();}c.restore();}
  }
  this.brushRadius=cleaningRadius(this.cells.length,this.mode);
  if(this.mode==='arrange')this.items=this.config.amenities.map(([key,u,v,size],i)=>({key,x:155+i*140,y:590,home:{x:155+i*140,y:590},target:this.point([u,v]),size,done:false}));
  if(this.mode==='shop'){
   this.items=this.catalog.items.map(([key,category,price,tint],i)=>({key,category,price,tint,x:140+i%4*105,y:(this.s.level.scene==='beauty'?140:130)+Math.floor(i/4)*(this.s.level.scene==='beauty'?174:145),selected:false}));this.items.forEach(t=>t.home={x:t.x,y:t.y});
   this.shopInfo=this.text('',300,385,18);this.budget=this.text('',300,35,23);
  }
  if(this.mode==='checkout'||this.mode==='pack'){
   this.items=this.bought.map((t,i)=>({...t,done:false,scanned:false,x:140+i*105,y:this.mode==='pack'?560:145,home:{x:140+i*105,y:this.mode==='pack'?560:145},target:{x:205+i%2*190,y:225+Math.floor(i/2)*165}}));
   this.budget=this.text(this.mode==='checkout'?`YOUR HAUL  $${this.bought.reduce((n,t)=>n+t.price,0)}`:'PACK YOUR PURCHASES',300,38,23);
  }
  if(!['pickup','arrange','shop','checkout','pack'].includes(this.mode)){
   this.cursor=this.art(this.s.step.tool,510,560,130,145);const origin=this.mode==='foam'?[.12,.10]:this.mode==='glass'?[.5,.10]:this.s.step.tool==='clean-vacuum'?[.5,.91]:[.5,.80];this.cursor.setOrigin(...origin).setAlpha(.95);
  }else this.cursor=null;
  this.caption=this.text('',300,625,18);if(previousFrame){this.startBlend(previousFrame,.7);if(!this.s.app.reducedMotion){this.stage.setAlpha(0);this.s.tweens.add({targets:this.stage,alpha:1,duration:450,ease:'Sine.Out'});}}this.draw();
 }
 down(p){
  this.held=true;this.previous={...p};this.pointer={...p};
  const items=this.mode==='pickup'?this.litter:this.items;
  this.drag=items.filter(t=>!t.done&&dist(p,t)<(this.mode==='pickup'?32:48)).sort((a,b)=>dist(p,a)-dist(p,b))[0]||null;
  if(!this.drag)this.stroke(p,p,0);this.draw();
 }
 move(p){
  if(!this.held)return;
  if(this.drag){this.drag.x=p.x;this.drag.y=p.y;if(this.mode==='checkout'&&!this.drag.scanned){const a=this.previous||p,n=Math.max(1,Math.ceil(dist(a,p)/10));for(let i=1;i<=n;i++)if(Math.abs(a.x+(p.x-a.x)*i/n-300)<85&&Math.abs(a.y+(p.y-a.y)*i/n-330)<34){this.drag.scanned=true;break;}}}
  else this.stroke(this.previous||p,p,dist(this.previous||p,p));
  this.previous={...p};this.pointer={...p};this.cursor?.setPosition(p.x,p.y);this.draw();
 }
 stroke(a,b,travel){
  if(travel<1.5)return;
  if(this.mode==='groom'&&b.y<=a.y)return;
  const radius=this.brushRadius,n=Math.max(1,Math.ceil(travel/7));
  for(let i=1;i<=n;i++){
   const p={x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n};
   if(this.mode==='vacuum')for(const t of this.crumbs)if(!t.done&&dist(p,t)<radius){t.done=true;}
   if(!this.cells.length||(!this.onSurface(p,this.surface)&&!this.cells.some(cell=>dist(p,cell)<radius*.85)))continue;
   const productive=this.cells.some(cell=>cell.v<.99&&dist(p,cell)<radius*.85);if(productive)this.emitParticles(p,travel/n);this.strokeDistance+=travel/n;
   for(const cell of this.cells)if(dist(p,cell)<radius*.85)cell.v=clamp(cell.v+travel/n/CLEANING_PACE.strokeDistance);
   const target=this.mode==='vacuum'?this.dust:this.mode==='foam'||this.mode==='rinse'?this.foam:this.mode==='glass'?this.windowDirt:this.mode==='groom'?this.nap:this.dirt,c=target.getContext('2d');c.save();this.clip(c,this.surface);
   c.globalCompositeOperation=this.mode==='foam'?'source-over':'destination-out';
   const g=c.createRadialGradient(p.x,p.y,radius*.55,p.x,p.y,radius);g.addColorStop(0,this.mode==='foam'?'rgba(253,253,255,.5)':'rgba(0,0,0,.48)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,radius,0,Math.PI*2);c.fill();
   if(this.mode==='foam'){c.strokeStyle='rgba(226,225,253,.7)';c.lineWidth=1.2;for(let k=0;k<2;k++){c.beginPath();c.arc(p.x+(this.rand()-.5)*30,p.y+(this.rand()-.5)*30,2+this.rand()*4,0,Math.PI*2);c.stroke();}}
   c.restore();
  }
  if(this.cells.length){this.maskLayer(this.mode==='vacuum'?this.dust:this.mode==='foam'||this.mode==='rinse'?this.foam:this.mode==='glass'?this.windowDirt:this.mode==='groom'?this.nap:this.dirt,this.surface);this.s.stepProgress=this.cells.reduce((sum,t)=>sum+t.v,0)/this.cells.length;if(this.s.stepProgress>=CLEANING_PACE.coverage)this.s.stepProgress=1;}

 }
 up(p){
  const t=this.drag;
  if(t){
   if(this.mode==='pickup'){if(dist(p,{x:470,y:590})<70){t.done=true;this.bagPulse=.22;}else Object.assign(t,t.home);this.s.stepProgress=this.litter.filter(t=>t.done).length/this.litter.length;}
   if(this.mode==='arrange'||this.mode==='pack'){if(dist(p,t.target)<44){t.done=true;Object.assign(t,t.target);this.placed.push({...t});}else Object.assign(t,t.home);this.s.stepProgress=this.items.filter(t=>t.done).length/this.items.length;}
   if(this.mode==='shop'){
    const inBasket=p.y>440&&p.x>85&&p.x<520;
    if(t.selected&&!inBasket){t.selected=false;Object.assign(t,t.home);}
    else if(!t.selected&&inBasket){const selected=this.items.filter(v=>v.selected),sum=selected.reduce((n,v)=>n+v.price,0);if(selected.some(v=>v.category===t.category)){this.feedback='One item per category. Return one to the shelf to swap.';Object.assign(t,t.home);}else if(sum+t.price>this.catalog.budget){this.feedback='Over budget. Return an expensive item and choose another.';Object.assign(t,t.home);}else{t.selected=true;this.feedback='';}}
    else if(!t.selected)Object.assign(t,t.home);
    const selected=this.items.filter(v=>v.selected);selected.forEach((v,i)=>{v.x=140+i*105;v.y=512;});this.s.stepProgress=selected.length/4;if(selected.length===4)this.bought=selected.map(v=>({...v}));
   }
   if(this.mode==='checkout'){if(t.scanned&&dist(p,{x:465,y:550})<75){t.done=true;}else{Object.assign(t,t.home);this.feedback=t.scanned?'Now put the scanned item in the bag.':'Move the item across the glowing scanner first.';}this.s.stepProgress=this.items.filter(t=>t.done).length/this.items.length;}
  }
  this.drag=null;this.held=false;this.previous=null;this.draw();
 }
 release(){if(this.drag&&!this.drag.done){Object.assign(this.drag,this.drag.home);if(this.drag.selected){const selected=this.items.filter(t=>t.selected);selected.forEach((t,i)=>{t.x=140+i*105;t.y=512;});}}this.drag=null;this.held=false;this.previous=null;}
 startBlend(from,duration=.65){this.blend=this.s.app.reducedMotion?null:{from,time:0,duration};}
 update(dt){this.clock+=dt;const animate=this.blend||this.particles.length||this.bagPulse>0;this.bagPulse=Math.max(0,this.bagPulse-dt);for(const p of this.particles)p.age+=dt;this.particles=this.particles.filter(p=>p.age<p.life);if(this.blend){this.blend.time+=dt;if(this.blend.time>=this.blend.duration)this.blend=null;}if(animate)this.draw();}
 draw(){
  const c=this.ctx;c.clearRect(0,0,600,640);c.drawImage(this.source(this.s.level.hero),this.bounds.x,this.bounds.y,this.bounds.w,this.bounds.h);
  if(this.config){
   c.drawImage(this.dirt,0,0);c.drawImage(this.dust,0,0);c.save();c.globalAlpha=.72;c.drawImage(this.foam,0,0);c.restore();c.drawImage(this.windowDirt,0,0);c.drawImage(this.nap,0,0);
   for(const t of this.crumbs)if(!t.done){c.fillStyle='#69472f';c.fillRect(t.x,t.y,t.size,t.size*.7);c.fillStyle='#b18b59';c.fillRect(t.x,t.y,t.size-1,1);}
   for(const t of this.litter)if(!t.done){c.save();c.translate(t.x,t.y);c.rotate(t.angle);this.drawArt(c,t.key,0,0,43,43);c.restore();}

   for(const t of this.placed)if(this.mode!=='pack')this.drawArt(c,t.key,t.target.x,t.target.y,t.size);
   if(this.mode==='pickup')this.drawArt(c,'clean-trash-bag',470,575,124+this.bagPulse*40,112+this.bagPulse*30);
   this.drawParticles(c);
   if(this.mode==='arrange')for(const t of this.items){if(!t.done)this.drawArt(c,t.key,t.target.x,t.target.y,t.size,t.size,.30);this.drawArt(c,t.key,t.x,t.y,t.size);}
  }else this.drawShopping(c);
  const percentage=Math.round(this.s.stepProgress*100);this.caption?.setText(this.finishing?'Lovely!':this.feedback||(['pickup','arrange'].includes(this.mode)?`${Math.round(this.s.stepProgress*(this.mode==='pickup'?this.litter.length:this.items.length))} / ${this.mode==='pickup'?this.litter.length:this.items.length}`:['shop','checkout','pack'].includes(this.mode)?'Pick up and drag - release to place':`${percentage}% ${this.mode==='foam'?'covered':this.mode==='groom'?'smoothed':'clean'} - keep moving the tool`));if(this.blend){const t=clamp(this.blend.time/this.blend.duration),e=t*t*(3-2*t);c.save();c.globalAlpha=1-e;c.drawImage(this.blend.from,0,0);c.restore();}this.texture.refresh();
 }
 drawShopping(c){
  c.font='bold 18px Nunito';c.textAlign='center';
  if(this.mode==='shop'){
   const chosen=this.items.filter(t=>t.selected),sum=chosen.reduce((n,t)=>n+t.price,0);this.budget.setText(`BUDGET $${this.catalog.budget}   |   BASKET $${sum}`);
   this.shopInfo.setText(this.catalog.categories.map((name,i)=>(chosen.some(t=>t.category===i)?'[x] ':'[ ] ')+name).join('   '));
   c.fillStyle='rgba(255,244,230,.95)';c.strokeStyle='#a883ab';c.lineWidth=4;c.beginPath();c.roundRect(89,440,430,140,16);c.fill();c.stroke();c.fillStyle='#765484';c.fillText(tr('YOUR BASKET - drag out to return'),300,469);
   for(const t of this.items){this.drawArt(c,t.key,t.x,t.y,t.selected?62:77,t.selected?66:90,1,t.tint);if(!t.selected){c.fillStyle='#fff8e9';c.fillRect(t.x-28,t.y+46,56,26);c.fillStyle='#725183';c.fillText('$'+t.price,t.x,t.y+65);}}
  }
  if(this.mode==='checkout'){
   c.fillStyle='rgba(255,245,232,.94)';c.fillRect(90,80,430,455);c.fillStyle='#735784';c.beginPath();c.roundRect(205,289,190,82,14);c.fill();c.strokeStyle=this.drag?.scanned?'#aceda4':'#ffb8da';c.lineWidth=5;c.beginPath();c.moveTo(214,330);c.lineTo(386,330);c.stroke();c.fillStyle='#725183';c.fillText(tr('SCAN HERE'),300,408);this.drawArt(c,'clean-bag',465,550,130,150);
   for(const t of this.items)if(!t.done){this.drawArt(c,t.key,t.x,t.y,78,88,1,t.tint);if(t.scanned){c.fillStyle='#5d9d68';c.fillText(tr('SCANNED'),t.x,t.y+56);}}
  }
  if(this.mode==='pack'){
   c.fillStyle='#d9b2df';c.strokeStyle='#735080';c.lineWidth=6;c.beginPath();c.roundRect(100,105,400,405,30);c.fill();c.stroke();
   for(const t of this.items){c.fillStyle='#fff5e7';c.beginPath();c.roundRect(t.target.x-80,t.target.y-70,160,140,12);c.fill();if(!t.done)this.drawArt(c,t.key,t.target.x,t.target.y,96,105,.22,t.tint);this.drawArt(c,t.key,t.x,t.y,t.done?96:72,t.done?105:86,1,t.tint);}
  }
 }
 finish(){
  const previousFrame=this.capture();this.release();this.feedback='';this.finishing=true;this.s.tweens.killTweensOf(this.stage);
  if(this.mode==='pickup')this.litter.forEach(t=>t.done=true);
  if(this.mode==='vacuum'){this.crumbs.forEach(t=>t.done=true);this.dust.getContext('2d').clearRect(0,0,600,640);}
  if(this.mode==='foam'&&this.cells.some(t=>t.v<.9)&&this.cells.reduce((n,t)=>n+t.v,0)/this.cells.length<CLEANING_PACE.coverage){const c=this.foam.getContext('2d');c.save();this.clip(c,'fabric');c.fillStyle='rgba(253,253,255,.86)';c.fillRect(0,0,600,640);c.restore();this.maskLayer(this.foam);}
  if(this.mode==='scrub')this.dirt.getContext('2d').clearRect(0,0,600,640);
  if(this.mode==='rinse')this.foam.getContext('2d').clearRect(0,0,600,640);
  if(this.mode==='glass')this.windowDirt.getContext('2d').clearRect(0,0,600,640);
  if(this.mode==='groom')this.nap.getContext('2d').clearRect(0,0,600,640);
  if(this.mode==='shop'&&!this.bought.length){this.bought=this.catalog.categories.map((_,category)=>this.items.filter(t=>t.category===category).sort((a,b)=>a.price-b.price)[0]);}
  if(this.mode==='arrange')for(const t of this.items)if(!t.done){t.done=true;Object.assign(t,t.target);this.placed.push({...t});}
  this.startBlend(previousFrame);this.draw();this.caption.setText('Lovely!');if(!this.s.app.reducedMotion)this.s.tweens.add({targets:this.stage,alpha:0,duration:400,delay:250,ease:'Sine.In'});this.s.sparkle(300,275,15);
 }
 hintPlan(){
  if(this.cells.length){const p=this.cells.find(t=>t.v<.9);return p&&{kind:'rub',points:[{x:p.x-15,y:p.y-17},{x:p.x+15,y:p.y+17},{x:p.x-15,y:p.y+17}],instruction:'Move the tool across this unfinished area.'};}
  if(this.mode==='vacuum'){const p=this.crumbs.find(t=>!t.done);return p&&{kind:'drag',points:[{x:p.x-30,y:p.y},{x:p.x+30,y:p.y}],instruction:'Sweep the vacuum nozzle over these crumbs.'};}
  if(this.mode==='shop'){
   const selected=this.items.filter(t=>t.selected),sum=selected.reduce((n,t)=>n+t.price,0),missing=this.items.filter(t=>!selected.some(v=>v.category===t.category)).sort((a,b)=>a.price-b.price)[0];
   if(missing&&sum+missing.price>this.catalog.budget){const expensive=selected.filter(t=>this.items.some(v=>v.category===t.category&&v.price<t.price)).sort((a,b)=>b.price-a.price)[0];if(expensive)return{kind:'drag',points:[{x:expensive.x,y:expensive.y},{...expensive.home}],instruction:'Return this item to the shelf, then choose a less expensive option.'};}
  }
  const t=this.mode==='pickup'?this.litter.find(t=>!t.done):this.mode==='shop'?this.items.filter(t=>!t.selected&&!this.items.some(v=>v.selected&&v.category===t.category)).sort((a,b)=>a.price-b.price)[0]:this.items.find(t=>!t.done);
  if(!t)return null;const dest=this.mode==='pickup'?{x:470,y:590}:this.mode==='shop'?{x:300,y:510}:this.mode==='checkout'?{x:465,y:550}:t.target;
  return{kind:'drag',points:[{x:t.x,y:t.y},...(this.mode==='checkout'?[{x:300,y:330}]:[]),dest],instruction:this.mode==='checkout'?'Scan this item, then drop it in the bag.':'Pick up this item and drag it into place.'};
 }
 capture(){const c=canvas();c.getContext('2d').drawImage(this.texture.canvas,0,0);return c;}
 destroy(){this.blend=null;if(this.stage)this.s.tweens.killTweensOf(this.stage);this.stage?.destroy();this.root.destroy();this.s.textures.remove(this.key);}
}

export function installPremiumScene(Scene){
 const p=Scene.prototype,base=Object.fromEntries(['begin','showWelcome','nextStep','onDown','onMove','onUp','release','update','finishStep','capturePortrait','refreshAccessory','resize'].map(k=>[k,p[k]]));
 const stop=s=>{s.premiumRitual?.destroy();s.premiumRitual=null;};
 p.begin=function(index){stop(this);if(LEVELS[index].kind!=='premium')return base.begin.call(this,index);base.showWelcome.call(this);this.clear();this.runId=(this.runId||0)+1;this.levelIndex=index;this.level=LEVELS[index];this.stepIndex=0;this.elapsed=0;this.active=true;this.frozen=false;this.transitioning=false;this.character='premium';for(const o of [this.portrait,...this.eyes,this.accessory,this.layer,this.patchLayer,this.guide,this.tool,this.targetText])o.setVisible(false);this.step=this.level.steps[0];this.stepProgress=0;this.mode='premium';this.premiumRitual=new PremiumRitual(this);this.app.stepChanged(this.level,0,this.step);this.resize();};
 p.showWelcome=function(){stop(this);return base.showWelcome.call(this);};
 p.nextStep=function(first=false){if(!this.premiumRitual)return base.nextStep.call(this,first);this.release();this.step=this.level.steps[this.stepIndex];this.stepProgress=0;this.transitioning=false;this.premiumRitual.enter();this.app.stepChanged(this.level,this.stepIndex,this.step);this.resize();};
 p.onDown=function(pointer){if(!this.premiumRitual)return base.onDown.call(this,pointer);if(!this.active||this.frozen||this.transitioning||this.pointerId!==null)return;this.pointerId=pointer.id;this.local=this.world(pointer);this.premiumRitual.down(this.local);this.premiumRitual.move(this.local);};
 p.onMove=function(pointer){if(!this.premiumRitual)return base.onMove.call(this,pointer);if(pointer.id!==this.pointerId||this.frozen)return;this.local=this.world(pointer);this.premiumRitual.move(this.local);};
 p.onUp=function(pointer){if(!this.premiumRitual)return base.onUp.call(this,pointer);if(pointer.id!==this.pointerId||this.frozen)return;this.local=this.world(pointer);this.premiumRitual.up(this.local);this.down=false;this.pointerId=null;};
 p.release=function(){if(!this.premiumRitual)return base.release.call(this);this.premiumRitual.release();this.down=false;this.pointerId=null;};
 p.update=function(time,delta){if(!this.premiumRitual)return base.update.call(this,time,delta);if(!this.active||this.frozen)return;const dt=Math.min(delta/1000,.05);this.premiumRitual.update(dt);if(this.transitioning)return;this.elapsed+=dt;this.app.progress((this.stepIndex+this.stepProgress)/this.level.steps.length,this.elapsed);if(this.stepProgress>=.999)this.finishStep();};
 p.finishStep=function(){if(!this.premiumRitual)return base.finishStep.call(this);if(this.transitioning)return;this.transitioning=true;this.release();this.premiumRitual.finish();this.app.progress((this.stepIndex+1)/this.level.steps.length,this.elapsed);const run=this.runId;this.time.delayedCall(850,()=>{if(run!==this.runId||!this.active)return;this.stepIndex++;if(this.stepIndex===this.level.steps.length){this.active=false;this.transitioning=false;this.app.completed(this.levelIndex,this.elapsed);}else this.nextStep();});};
 p.capturePortrait=function(asCanvas=false){if(!this.premiumRitual)return base.capturePortrait.call(this,asCanvas);const c=this.premiumRitual.capture();return asCanvas?c:c.toDataURL('image/webp',.9);};
 p.refreshAccessory=function(){if(!this.premiumRitual)return base.refreshAccessory.call(this);};
 p.resize=function(){base.resize.call(this);if(!this.premiumRitual||!this.app.ui?.layout)return;const l=this.app.ui.layout,top=l.landscape?111:196,bottom=l.H-(l.landscape?112:205),fit=Math.min((l.W-24)/600,(bottom-top)/640)*l.pixelScale;this.fit=fit;this.root.setScale(fit).setPosition(l.x*this.app.pixelRatio+l.W/2*l.pixelScale-300*fit,l.y*this.app.pixelRatio+(top+bottom)/2*l.pixelScale-320*fit);};
}

