import {LEVELS,LEVEL_ORDER} from './levels.js';

export function installAlbumPaging(UI){Object.assign(UI.prototype,{
 drawAlbumPage(page,interactive=false){
  const {W,H,landscape}=this.layout,parent=this.root,animate=this.animate;
  const group=this.add.container(0,0);parent.add(group);
  this.root=group;this.albumPreview=!interactive;this.animate=false;
  try{
   const cw=landscape?Math.min(163,(W-90)/6-12):Math.min(209,(H-348)/3-14)*.81;
   const ch=landscape?cw*1.28:cw/.81,row=(H-348)/3;
   for(let i=0;i<6;i++){
    const index=LEVEL_ORDER[page*5+i];
    const slot=i===5?Math.min(5,LEVEL_ORDER.length-page*5):i;
    if(i===5||index!==undefined)this.card(i===5?LEVELS.length:index,
     landscape?W/2+(slot-2.5)*(cw+13):W/2+(slot%2===0?-114:114),
     landscape?H*.52:181+row*(Math.floor(slot/2)+.5),cw,ch);
   }
  }finally{this.root=parent;this.albumPreview=false;this.animate=animate;}
  return group;
 },
 albumOffset(x){
  const direction=x<0?1:-1,span=this.layout.W+32;
  if(!this.albumNeighbor||this.albumDirection!==direction){
   this.albumNeighbor?.destroy();this.albumDirection=direction;
   const count=Math.ceil(LEVELS.length/5),page=((this.app.albumPage||0)+direction+count)%count;
   this.albumNeighbor=this.drawAlbumPage(page);
  }
  this.albumCurrent.x=x;this.albumNeighbor.x=x+direction*span;
 },
 finishAlbumSwipe(direction){
  if(this.albumSliding||!this.albumCurrent?.active)return;
  this.albumSliding=true;this.albumSwipe=null;
  this.suppressAlbumClickUntil=performance.now()+700;
  for(const button of document.querySelectorAll('.level-card,.collection-card,[id^="level-card-"]'))button.disabled=true;
  const motion={x:this.albumCurrent.x},target=direction?-direction*(this.layout.W+32):0;
  this.albumOffset(motion.x||-direction*.01);
  this.tweens.add({targets:motion,x:target,duration:this.app.reducedMotion?0:direction?300:220,ease:'Cubic.Out',
   onUpdate:()=>this.albumOffset(motion.x),onComplete:()=>{
    const count=Math.ceil(LEVELS.length/5);
    this.app.albumPage=((this.app.albumPage||0)+direction+count)%count;
    this.albumCurrent.destroy();this.albumNeighbor?.destroy();this.albumNeighbor=null;
    for(const button of document.querySelectorAll('[id^="level-card-"],#collection-card'))button.remove();
    this.buttons=this.buttons.filter(button=>!button.id.startsWith('level-card-')&&button.id!=='collection-card');
    this.albumCurrent=this.drawAlbumPage(this.app.albumPage,true);
    this.albumPageLabel.setText(`${this.app.albumPage*5+1} - ${Math.min(LEVELS.length,this.app.albumPage*5+5)}`);
    this.albumSliding=false;
   }});
 },
 installAlbumSwipe(){
  document.addEventListener('pointerdown',event=>{
   if(this.mode!=='levels'||this.albumSliding||!event.isPrimary||event.button!==0)return;
   const l=this.layout,y=(event.clientY-l.y)/l.scale;
   if(y<181||y>l.H-165)return;
   this.albumSwipe={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now(),dragging:false};
  },true);
  document.addEventListener('pointermove',event=>{
   const drag=this.albumSwipe;if(!drag||drag.id!==event.pointerId)return;
   const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
   if(!drag.dragging){
    if(Math.abs(dx)<10||Math.abs(dx)<Math.abs(dy)*1.3)return;
    drag.dragging=true;
    // Stop hover/press springs once the gesture becomes a page drag.
    for(const card of this.albumCurrent.list){this.tweens.killTweensOf(card);card.setScale(1).setAlpha(1);}
    event.target.setPointerCapture?.(event.pointerId);
   }
   this.suppressAlbumClickUntil=performance.now()+700;
   this.albumOffset(Math.max(-this.layout.W,Math.min(this.layout.W,dx/this.layout.scale)));
  },true);
  document.addEventListener('pointerup',event=>{
   const drag=this.albumSwipe;if(!drag||drag.id!==event.pointerId)return;
   this.albumSwipe=null;if(!drag.dragging)return;
   const dx=event.clientX-drag.x,elapsed=Math.max(1,performance.now()-drag.time);
   const turn=Math.abs(dx)>Math.min(100,innerWidth*.18)||(Math.abs(dx)>30&&Math.abs(dx)/elapsed>.45);
   this.finishAlbumSwipe(turn?(dx<0?1:-1):0);
  },true);
  const cancel=()=>{const drag=this.albumSwipe;this.albumSwipe=null;if(drag?.dragging)this.finishAlbumSwipe(0);};
  document.addEventListener('pointercancel',cancel,true);window.addEventListener('blur',cancel);
  document.addEventListener('click',event=>{
   if(event.detail&&this.mode==='levels'&&(this.albumSliding||performance.now()<this.suppressAlbumClickUntil)){event.preventDefault();event.stopImmediatePropagation();}
  },true);
 },
});}
