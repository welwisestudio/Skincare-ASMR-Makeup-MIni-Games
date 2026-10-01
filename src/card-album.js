import { CARDS } from './meta-content.js';

export function installCardAlbum(UI) { Object.assign(UI.prototype, {
  drawCards() {
    const {cx,top,H,W,landscape}=this.metaHeader('Achievement Cards'),a=this.app;
    this.text(`${a.save.cards.length} / ${CARDS.length} treasured moments`,cx,top+153,20,{color:'#fff9ff',stroke:'#553563',thickness:2});
    const cols=landscape?4:2,cw=landscape?145:164,ch=landscape?201:226,gap=landscape?24:22;
    const width=cols*cw+(cols-1)*gap+16,left=cx-width/2-19,y=top+191,height=H-y-87;
    const rowHeight=ch+22,contentHeight=Math.ceil(CARDS.length/cols)*rowHeight-22+16;
    this.cardsViewport={left,y,width,height,rowHeight,max:Math.max(0,contentHeight-height)};
    this.cardsContent=this.add.container(left+8,y+8);this.root.add(this.cardsContent);
    this.cardsContent.setData('scrollClip',{x:left,y,width,height});
    const l=this.layout,ratio=a.pixelRatio;
    this.cardsMaskShape=this.make.graphics({add:false}).fillStyle(0xffffff).fillRect((l.x+left*l.scale)*ratio,(l.y+y*l.scale)*ratio,width*l.pixelScale,height*l.pixelScale);
    this.cardsMask=this.cardsMaskShape.createGeometryMask();this.cardsContent.setMask(this.cardsMask);
    const scroll=document.createElement('div');scroll.id='cards-scroll';scroll.className='cards-scroll';scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Achievement card collection. Scroll to explore.');
    Object.assign(scroll.style,{left:`${l.x+left*l.scale}px`,top:`${l.y+y*l.scale}px`,width:`${width*l.scale}px`,height:`${height*l.scale}px`});
    const inner=document.createElement('div');Object.assign(inner.style,{position:'relative',height:`${contentHeight*l.scale}px`,width:'100%'});scroll.append(inner);
    document.getElementById('ui-accessibility').append(scroll);this.cardsScroller=scroll;this.cardTiles=[];
    CARDS.forEach((c,i)=>{
      const x=cw/2+i%cols*(cw+gap),py=ch/2+Math.floor(i/cols)*rowHeight,owned=a.save.cards.includes(c.id);
      const g=this.add.container(x,py);this.cardsContent.add(g);this.image('achievement-frame',0,0,cw,ch,g);
      this.art(c.art,0,-24,cw*.73,ch*.54,g);
      if(!owned)this.image('achievement-frame',0,0,cw,ch,g).setTint(0x000000).setAlpha(.6);
      this.text(c.name,0,ch*.31,17,{color:'#fff9ff',stroke:'#604178',thickness:2,maxWidth:cw-32,fitWidth:cw-32,fitHeight:44},g);
      if(!owned)this.art('lock',0,-20,28,36,g);else this.art('star',cw*.32,-ch*.36,24,24,g);
      const hit=this.hit(`achievement-${c.id}`,`${c.name}. ${owned?'Collected':c.goal}`,left+8+x,y+8+py,cw,ch,()=>a.openMeta('card-detail',{id:c.id}),null);
      inner.append(hit);Object.assign(hit.style,{left:`${(x-cw/2+8)*l.scale}px`,top:`${(py-ch/2+8)*l.scale}px`,width:`${cw*l.scale}px`,height:`${ch*l.scale}px`,touchAction:'pan-y'});
      this.cardTiles.push(g);
    });
    const arrowX=left+width+28,mid=y+height/2;
    this.cardUp=this.icon('cards-up','back','Scroll cards up',arrowX,mid-44,40,()=>this.scrollCards(-rowHeight)).setAngle(90);
    this.cardDown=this.icon('cards-down','back','Scroll cards down',arrowX,mid+44,40,()=>this.scrollCards(rowHeight)).setAngle(-90);
    this.cardScrollTrack=this.image('progress-track',arrowX,mid,28,10).setAngle(90);
    this.cardScrollThumb=this.image('progress-green',arrowX,mid-10,7,7);
    this.cardPosition=this.text('',cx,H-47,16,{color:'#fff9ff',stroke:'#553563',thickness:2,fitWidth:360});
    const sync=()=>{
      const offset=scroll.scrollTop/l.scale;a.cardScroll=offset;this.cardsContent.y=y+8-offset;
      this.cardTiles.forEach(g=>g.setVisible(g.y-offset+ch/2>=0&&g.y-offset-ch/2<=height));
      document.getElementById('cards-up').disabled=offset<1;document.getElementById('cards-down').disabled=offset>=this.cardsViewport.max-1;
      this.cardUp.setAlpha(offset<1?.45:1);this.cardDown.setAlpha(offset>=this.cardsViewport.max-1?.45:1);this.cardScrollThumb.y=mid-10+20*offset/Math.max(1,this.cardsViewport.max);
      const row=Math.floor(offset/rowHeight),last=Math.min(CARDS.length,(Math.ceil((offset+height)/rowHeight))*cols);
      this.cardPosition.setText(`${row*cols+1}–${last} of ${CARDS.length}  ·  Swipe to explore`);
    };
    scroll.addEventListener('scroll',()=>{this.cardLastScroll=performance.now();sync();},{passive:true});
    // Native scrolling handles touch and wheel input. Mouse / pen users can
    // also grab the cards, without opening a detail when the drag ends.
    let drag=null,suppressClick=false;
    scroll.addEventListener('pointerdown',event=>{
      if(!event.isPrimary||event.button!==0)return;
      suppressClick=false;
      drag={id:event.pointerId,y:event.clientY,top:scroll.scrollTop,native:event.pointerType==='touch',moved:false};
    });
    scroll.addEventListener('pointermove',event=>{
      if(!drag||drag.id!==event.pointerId)return;
      const distance=event.clientY-drag.y;
      if(!drag.moved&&Math.abs(distance)<6)return;
      drag.moved=true;suppressClick=true;
      if(drag.native)return;
      if(!scroll.hasPointerCapture(event.pointerId))scroll.setPointerCapture(event.pointerId);
      scroll.classList.add('is-dragging');event.preventDefault();
      scroll.scrollTo({top:drag.top-distance,behavior:'instant'});
    });
    const release=event=>{
      if(!drag||drag.id!==event.pointerId)return;
      drag=null;scroll.classList.remove('is-dragging');
      if(scroll.hasPointerCapture(event.pointerId))scroll.releasePointerCapture(event.pointerId);
    };
    scroll.addEventListener('pointerup',release);
    scroll.addEventListener('pointercancel',release);
    scroll.addEventListener('lostpointercapture',release);
    scroll.addEventListener('pointerleave',event=>{if(drag&&!drag.moved)release(event);});
    scroll.addEventListener('click',event=>{
      if(suppressClick&&event.detail!==0){event.preventDefault();event.stopImmediatePropagation();}
    },true);
    scroll.addEventListener('dragstart',event=>event.preventDefault());
    scroll.scrollTop=Math.min(a.cardScroll||0,this.cardsViewport.max)*l.scale;sync();
    scroll.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(event.key)){event.preventDefault();const direction=['ArrowUp','PageUp'].includes(event.key)?-1:1;this.scrollCards(event.key==='Home'?-contentHeight:event.key==='End'?contentHeight:rowHeight*direction);}});
  },
  scrollCards(delta) {
    this.cardsScroller?.scrollBy({top:delta*this.layout.scale,behavior:this.app.reducedMotion?'instant':'smooth'});
  },
}); }
