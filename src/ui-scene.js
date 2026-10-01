import { installAlbumPaging } from './album-swipe.js';
import { installPremiumUI } from './premium-access.js';
import * as Phaser from 'phaser';
import { LEVELS, LEVEL_ORDER, levelNumber } from './levels.js';
import { t, shortLabel } from './i18n.js';
import { unlocked } from './save.js';
import { installEngagementUI } from './engagement.js';
import { installMetaUI, META_MODES } from './meta-ui.js';
import { LEVEL_PRICES, dailyReady } from './meta-content.js';
import { installRewardFX } from './reward-fx.js';
import { installCardAlbum } from './card-album.js';
import { installModalBackdrop } from './modal-backdrop.js';

// CSS coordinates describe the layout. Only the render transform uses device
// pixels; invisible semantic buttons stay aligned with the painted controls.
export class IllustratedUI extends Phaser.Scene {
  constructor(app){super('IllustratedUI');this.app=app;this.mode='levels';this.buttons=[];}
  create(){
    this.backdrop=this.add.image(0,0,'ui-celebration').setDepth(-3);this.scrim=this.add.graphics().setDepth(-1);
    this.root=this.add.container(0,0);this.effects=this.add.container(0,0);this.installAlbumSwipe();
    this.scale.on('resize',()=>this.resize());this.resize();this.app.uiReady(this);
  }
  resize(){
    const w=innerWidth,h=innerHeight,landscape=w/h>=1.25;
    let W=landscape?Phaser.Math.Clamp(w/h*620,850,1200):(w/h>.86?620:480);
    let H=landscape?620:Phaser.Math.Clamp(h/w*W,780,1040);
    const scale=Math.min(w/W,h/H,1.65);
    if(landscape){W=w/scale;H=h/scale;}
    const x=(w-W*scale)/2,y=(h-H*scale)/2;
    const pixelScale=scale*this.app.pixelRatio;
    this.layout={W,H,scale,pixelScale,x,y,landscape};this.screenLayout=this.layout;
    this.root.setPosition(x*this.app.pixelRatio,y*this.app.pixelRatio).setScale(pixelScale);
    this.effects.setPosition(this.root.x,this.root.y).setScale(pixelScale);
    if(this.app.ui){this.resizeModalBackdrop();this.render(false);}this.app.scene?.resize();
  }
  show(mode){const previousMode=this.mode;this.prepareModalBackdrop(mode);this.mode=mode;this.render(true);if(mode==='levels')this.app.onLevelMenuShown(previousMode);}
  clear(){
    this.albumSwipe=null;this.albumSliding=false;this.albumCurrent=null;this.albumNeighbor=null;
    this.chestVisual=null;this.chestMeter=null;
    this.cardsMask?.destroy();this.cardsMask=null;this.cardsMaskShape?.destroy();this.cardsMaskShape=null;this.cardsContent=null;this.cardsScroller=null;this.coinOrigin=null;this.coinAnchor=null;
    this.tweens.killAll();this.root.removeAll(true);this.effects.removeAll(true);this.buttons=[];this.soundSprites=[];this.regions=[];
    this.scoreText=null;this.coinText=null;this.progressText=null;this.progressFill=null;this.fillParts=null;this.timerText=null;this.giftTime=null;this.stepTitle=null;this.stepHint=null;this.stepStars=[];this.toastText=null;this.soundLabel=null;
    this.wheel=null;this.chest=null;this.adCounter=null;this.adContinue=null;this.movingStone=null;this.bonusTip=null;this.bonusCounter=null;
    document.getElementById('ui-accessibility').replaceChildren();
  }
  image(key,x,y,w,h,parent=this.root){const im=this.add.image(x,y,`ui-${key}`).setDisplaySize(w,h);parent.add(im);return im;}
  text(value,x,y,size=22,options={},parent=this.root){
    const {color='#ffffff',stroke='#725286',thickness=1.8,maxWidth,fitWidth,fitHeight,align='center'}=options;
    const text=this.add.text(x,y,String(value),{fontFamily:'Nunito',fontStyle:'900',fontSize:`${size}px`,resolution:Math.max(2,Math.ceil(this.layout.pixelScale)),color,stroke,strokeThickness:thickness,align,padding:{left:4,right:4,top:3,bottom:4},wordWrap:maxWidth?{width:maxWidth,useAdvancedWrap:true}:undefined}).setOrigin(.5);
    parent.add(text);if(fitWidth||fitHeight)this.fitText(text,fitWidth,fitHeight);return text;
  }
  fitText(text,width=Infinity,height=Infinity){
    const size=text.getData('baseFontSize')||parseFloat(text.style.fontSize);text.setData('baseFontSize',size);text.setFontSize(size);
    for(let i=0;i<12;i++){const fit=Math.min(1,width/text.width,height/text.height);if(fit>=.999)break;text.setFontSize(parseFloat(text.style.fontSize)*fit*.98);}
    text.setData('textLimits',{width,height});return text;
  }
  region(name,x,y,w,h){this.regions.push({name,x:x-w/2,y:y-h/2,w,h});}
  pop(object,delay=0){
    if(!this.animate||this.app.reducedMotion)return object;
    const x=object.scaleX,y=object.scaleY,alpha=object.alpha;
    object.setScale(x*.88,y*.88).setAlpha(0);
    this.tweens.add({targets:object,scaleX:x,scaleY:y,alpha,duration:520,delay,ease:'Back.Out'});return object;
  }
  hit(id,label,x,y,w,h,callback,visual,{disabled=false,className='',level}={}){
    if(this.albumPreview)return;
    const button=document.createElement('button');button.id=id;button.className=`ui-hit ${className}`;button.setAttribute('aria-label',t(label));button.textContent=t(label);button.disabled=disabled;
    if(level!==undefined)button.dataset.level=level;
    const l=this.layout;button.style.left=`${l.x+(x-w/2)*l.scale}px`;button.style.top=`${l.y+(y-h/2)*l.scale}px`;button.style.width=`${w*l.scale}px`;button.style.height=`${h*l.scale}px`;
    button.onclick=event=>{event.stopPropagation();if(!disabled)callback(event);};
    if(visual&&!disabled){
      // Capture final scale, not the temporary entrance-animation scale.
      const sx=visual.getData('baseX')??visual.scaleX,sy=visual.getData('baseY')??visual.scaleY;
      const spring=(factor,duration)=>{if(!visual.active)return;this.tweens.killTweensOf(visual);this.tweens.add({targets:visual,scaleX:sx*factor,scaleY:sy*factor,alpha:1,duration:this.app.reducedMotion?0:duration,ease:'Back.Out'});};
      button.onpointerdown=()=>spring(.94,90);button.onpointerup=()=>spring(1,260);button.onpointercancel=()=>spring(1,220);button.onpointerleave=()=>spring(1,220);button.onpointerenter=()=>spring(1.035,210);button.onfocus=()=>spring(1.035,210);button.onblur=()=>spring(1,220);
    }
    document.getElementById('ui-accessibility').append(button);this.buttons.push({id,x,y,w,h});return button;
  }
  icon(id,key,label,x,y,size,callback){const im=this.image(key,x,y,size,size);this.hit(id,label,x,y,size+6,size+6,callback,im);return im;}
  button(id,label,x,y,w=244,h=72,callback,kind='green-button',size=31,iconOverride,iconSide='left'){
    const group=this.add.container(x,y);this.root.add(group);const background=this.image(kind,0,0,w,h,group),spaPass=label==='SPA PASS';
    const icon=spaPass?'chest':iconOverride||(label==='RESTART'||label==='REPLAY'||label==='BACK'?'restart':label==='LEVELS'?'levels':label==='NEXT'?'next':label==='FINISH'?'finish':'play');
    const iconSize=h*(spaPass?.64:.40),gap=spaPass?5:10,text=this.text(w<200?shortLabel(label):label,0,-2,size,{stroke:kind==='green-button'?'#527934':'#604281',thickness:2.4},group);
    this.fitText(text,w*.80-iconSize-gap,h*.65);
    const contentWidth=text.width+iconSize+gap;
    const iconX=(iconSide==='right'?1:-1)*(contentWidth/2-iconSize/2);
    if(spaPass){
      this.royalGlow(iconX,-2,iconSize*.48,group);
      if(!this.app.reducedMotion)background.preFX?.addShine(.35,.22,3);
    }
    this.art(spaPass?'chest-open':icon==='bow'?'rose-bow':icon==='coins'?'reward-coin':`symbol-${kind==='green-button'?'green':'purple'}-${icon}`,iconX,-2,iconSize,iconSize,group);text.x=(iconSide==='right'?-1:1)*(contentWidth/2-text.width/2);
    this.hit(id,label,x,y,w,h,callback,group);return group;
  }
  ribbon(label,x,y,w=370,gold=false,size=30){
    const group=this.add.container(x,y);this.root.add(group);
    this.image(gold?'ribbon-gold':'ribbon-pink',0,0,w,w/4.2,group);
    this.text(label,0,-w/4.2*.13,size,{stroke:gold?'#aa742e':'#a24d79',thickness:2,fitWidth:w*.73,fitHeight:w/4.2*.48},group);
    return group;
  }
  render(animate=false){
    if(!this.layout)return;
    this.layout=this.screenLayout;
    if(this.mode==='level-chest'&&this.layout.landscape){
      // Keep the portrait treasure composition intact on wide screens.
      const W=480,H=780,scale=Math.min(innerWidth/W,innerHeight/H,1.65);
      this.layout={W,H,scale,pixelScale:scale*this.app.pixelRatio,x:(innerWidth-W*scale)/2,y:(innerHeight-H*scale)/2,landscape:false};
    }
    const layout=this.layout;
    this.root.setPosition(layout.x*this.app.pixelRatio,layout.y*this.app.pixelRatio).setScale(layout.pixelScale);
    this.effects.setPosition(this.root.x,this.root.y).setScale(layout.pixelScale);
    this.clear();this.animate=animate;this.scrim.clear();
    const playing=this.mode==='playing',onLevel=playing||this.mode==='card-earned';this.app.scene?.root.setVisible(onLevel);this.app.scene?.background.setVisible(onLevel);
    this.backdrop.setVisible(!onLevel);
    const key=this.mode==='levels'?'ui-tiles':'ui-celebration';this.backdrop.setTexture(key);
    const source=this.textures.get(key).getSourceImage(),s=Math.max(this.scale.width/source.width,this.scale.height/source.height);
    this.backdrop.setPosition(this.scale.width/2,this.scale.height/2).setScale(s);
    this.drawModalBackdrop();
    if(this.mode==='card-earned')this.drawCardEarned();else if(this.mode==='puzzle-failed')this.drawPuzzleFailure();else if(META_MODES.includes(this.mode))this.drawMeta();else if(this.mode==='levels')this.drawLevels();else if(playing)this.drawGame();else if(this.mode==='pause')this.drawPause();else if(this.mode==='result')this.drawResult();else this.drawCollection();
    this.app.scene?.resize();
  }
  drawLevels(){
    const {W,H,landscape}=this.layout;
    this.pop(this.image('studio-logo',W/2,63,206,108));
    if(this.app.state==='playing'||this.app.state==='result')this.icon('modal-close','back','Back to the game',40,40,50,()=>this.app.closeModal());else this.soundIcon(40,40);
    this.icon('settings-button','settings','Settings',W-40,40,50,()=>this.app.openPause());
    this.walletBadge(W/2,141,142,true);
    this.hit('menu-wallet','Open coin boutique',W/2,141,142,44,()=>this.app.openMeta('coins'));
    this.icon('menu-daily','calendar','Daily rewards',49,127,52,()=>this.app.openMeta('daily'));
    if(dailyReady(this.app.save))this.image('star',69,105,22,22);
    this.icon('menu-wheel','lucky-wheel','Lucky wheel',W-49,127,55,()=>this.app.openMeta('wheel'));
    this.text('Daily Gifts',49,163,13,{color:'#fff9ff',stroke:'#78528a',thickness:2,fitWidth:94});
    this.text('Lucky Spin',W-49,163,13,{color:'#fff9ff',stroke:'#78528a',thickness:2,fitWidth:94});
    this.albumCurrent=this.drawAlbumPage(this.app.albumPage||0,true);
    this.albumPager('album',H-105);
    this.pop(this.button('start-button',this.app.save.stars.every(Boolean)?'PLAY AGAIN':'PLAY',W/2,H-105,250,65,()=>this.app.startNext(),'green-button',31),180);
    [['rewards','MY GIFTS','bow'],['cards','CARDS','levels'],['pass','SPA PASS','finish']].forEach(([mode,label,symbol],i)=>this.button(`nav-${mode}`,label,W/2+(i-1)*156,H-38,152,47,()=>this.app.openMeta(mode),'purple-button',18,symbol));
  }
  albumPager(kind,y){
    const {W}=this.layout,key=kind==='album'?'albumPage':'shopPage',page=this.app[key]||0,total=Math.ceil(LEVELS.length/5);
    // Paging is an update within the menu, not a new screen entrance.
    this.icon(`${kind}-prev`,'back','Previous five levels',W/2-179,y,44,()=>{if(kind==='album')this.finishAlbumSwipe(-1);else{this.app[key]=(page+total-1)%total;this.render(true);}});
    this.icon(`${kind}-next`,'back','Next five levels',W/2+179,y,44,()=>{if(kind==='album')this.finishAlbumSwipe(1);else{this.app[key]=(page+1)%total;this.render(true);}}).setFlipX(true);
    const label=this.text(`${page*5+1} - ${Math.min(LEVELS.length,page*5+5)}`,W/2,y-46,14,{color:'#fff8ff',stroke:'#765087',thickness:2,fitWidth:100});
    if(kind==='album')this.albumPageLabel=label;
  }
  card(index,x,y,w,h){
    if(LEVELS[index]?.premium)return this.premiumCard(index,x,y,w,h);
    const collection=index===LEVELS.length,level=LEVELS[index],available=collection||unlocked(this.app.save,index),stars=collection?this.app.save.stars.reduce((a,b)=>a+b,0):this.app.save.stars[index];
    const g=this.add.container(x,y);this.root.add(g);g.setAngle(index%2?1:-1);
    this.image('polaroid',0,0,w,h,g);const photoY=-h*.045;
    this.image('celebration',0,photoY,w*.77,h*.61,g);
    if(collection){this.art('bonus-bubbles',0,photoY-h*.04,w*.62,h*.35,g);this.text('BONUS',0,h*.20,Math.min(16,h*.115),{stroke:'#543d69',fitWidth:w*.65,fitHeight:h*.18},g);}
    else{
      const portrait=level.hero?this.art(level.hero,0,photoY-(available?2:h*.075),w*.68,h*(available?.55:.37),g):this.add.image(0,photoY-2,level.character).setDisplaySize(h*.85,h*.85);if(!level.hero)g.add(portrait);
      const toolKey=level.steps[0].tool,tool=this.art(toolKey,w*.23,h*.10,w*.25,h*.31,g).setAngle(12);
      if(!available){const source=tool.texture.getSourceImage(),scale=Math.min(w*.19/source.width,h*.20/source.height);tool.setPosition(w*.23,-h*.07).setScale(scale);}
      if(!available){
        portrait.setTint(0x8f809e);tool.setTint(0x8f809e);
        const shade=this.add.graphics();shade.fillStyle(0x241a35,.58).fillRect(-w*.385,photoY-h*.305,w*.77,h*.61);g.add(shade);
        this.image('lock',0,photoY-h*.025,w*.22,h*.23,g);
      }
      if(!available){
        const coinSize=h*.13,gap=w*.035;
        const price=this.text(String(LEVEL_PRICES[index]),0,h*.17,Math.min(25,h*.15),{stroke:'#543d69',thickness:2.2,fitWidth:w*.70-coinSize-gap,fitHeight:h*.19},g);
        const rowWidth=coinSize+gap+price.width;
        this.image('reward-coin',-rowWidth/2+coinSize/2,h*.17,coinSize,coinSize,g);
        price.x=rowWidth/2-price.width/2;
      }
    }
    this.image('polaroid-front',0,0,w,h,g);
    if(!collection)this.text(String(levelNumber(index)),w*.37,h*.379,Math.min(23,h*.14),{stroke:'#ae5592',fitWidth:w*.17,fitHeight:h*.19},g);
    for(let i=0;i<3;i++)if(collection?stars===LEVELS.length*3:stars>i)this.image('star',(-.18+i*.18)*w,h*.35,w*.17,w*.17,g);
    this.hit(collection?'collection-card':`level-card-${index}`,collection?'Bonus games':`Level ${levelNumber(index)}: ${level.name}${available?'':`, buy for ${LEVEL_PRICES[index]} coins`}`,x,y,w,h,()=>collection?this.app.openMeta('modes'):available?this.app.start(index):this.app.openMeta('purchase',{index}),g,{className:collection?'collection-card':'level-card',level:collection?undefined:index});
    this.pop(g,((levelNumber(index)-1+5)%5)*55);
  }
  soundIcon(x,y,id='sound-button',size=44){
    const sprite=this.icon(id,this.app.audio.enabled?'sound':'muted',this.app.audio.enabled?'Mute sound':'Enable sound',x,y,size,()=>this.app.toggleSound());this.soundSprites.push(sprite);
    document.getElementById(id)?.setAttribute('aria-pressed',String(this.app.audio.enabled));return sprite;
  }
  drawGame(){
    const {W,H,landscape}=this.layout,level=this.app.scene.level||LEVELS[0];
    this.icon('pause-button','pause','Pause game',40,40,52,()=>this.app.openPause());
    const a=W/2-76,b=W/2+85;
    this.image('score',a,38,138,43);this.scoreText=this.text('',a+19,41,19,{color:'#584270',stroke:'#ffffff',thickness:.8});
    this.image('coins',b,38,117,39);this.coinText=this.text('',b+15,39,19,{stroke:'#71538e',thickness:1});
    this.coinAnchor={x:b-117*.37,y:38};
    this.icon('hint-button','hint','Get a hint',W-40,40,52,()=>this.app.requestHelp('hint'));
    this.art('ad-badge',W-23,59,22,22);
    this.button('skip-button','SKIP',W-57,127,89,44,()=>this.app.requestHelp('skip'),'purple-button',16,'ad');
    if(level.kind==='puzzle'||level.kind==='romance')this.button('puzzle-retry','RETRY',W-155,127,100,44,()=>this.app.start(this.app.scene.levelIndex),'purple-button',16,'restart');
    else{this.icon('wardrobe-button','rose-bow','Rewarded spa items',W-143,127,48,()=>this.app.openMeta('items'));
      this.text('STYLE',W-143,157,12,{color:'#79567f',thickness:0});}
    this.text(`LV ${levelNumber(this.app.scene.levelIndex)||1}`,W-40,87,13,{color:'#79567f',thickness:0});
    const barW=250,barX=W/2,barY=85;
    this.image('progress-track',barX,barY,barW,24);
    const texture=this.textures.get('ui-progress-green'),source=texture.getSourceImage(),sh=source.height-6,sw=source.width-6,cap=Math.floor(sh/2);
    if(!texture.has('left')){texture.add('left',0,3,3,cap,sh);texture.add('body',0,3+cap,3,sw-cap*2,sh);texture.add('right',0,3+sw-cap,3,cap,sh);}
    this.fillParts=['left','body','right'].map(frame=>{const image=this.add.image(0,barY,'ui-progress-green',frame).setOrigin(0,.5);this.root.add(image);return image;});
    this.fillGeometry={x:barX-barW*.447,w:barW*.894,h:13};this.progressFill=this.fillParts[0];
    this.progressText=this.text('0%',barX,barY-1,14,{stroke:'#5b744c',thickness:1});
    this.drawGiftHUD();
    this.icon('home-button','back','Open level album',46,H-43,58,()=>this.app.openLevels());this.soundIcon(W-46,H-43,'sound-button',58);
    const tx=W/2,ty=H-(landscape?91:146);
    this.stepTitle=this.text('',tx,ty,landscape?18:23,{color:'#795087',thickness:0,maxWidth:landscape?680:430});
    this.stepHint=this.text('',tx,ty+(landscape?28:46),landscape?14:18,{color:'#8b6489',thickness:0,maxWidth:landscape?710:390});
    const starY=H-(landscape?23:43),n=level.steps.length,gap=Math.min(landscape?25:34,(W-184)/Math.max(1,n-1)),size=Math.min(landscape?21:30,gap*.88);
    for(let i=0;i<n;i++)this.stepStars.push(this.image('star',tx+(i-(n-1)/2)*gap,starY,size,size));
    this.updateCounters();this.updateProgress();this.updateStep(false);
    this.region('instructions',tx,ty+(landscape?14:25),landscape?710:430,landscape?56:95);
  }
  updateCounters(){this.scoreText?.setText(`${this.app.save.stars.reduce((a,b)=>a+b,0)}/${LEVELS.length*3}`);this.coinText?.setText(String(this.walletValue()));}
  updateProgress(){
    if(!this.progressFill?.active)return;const value=this.app.lastPercent/100,{x,w,h}=this.fillGeometry,width=w*value,r=Math.min(h/2,width/2);
    const [left,body,right]=this.fillParts;left.setVisible(value>0).setPosition(x,left.y).setDisplaySize(Math.max(.01,r),h);body.setVisible(width>r*2).setPosition(x+r,body.y).setDisplaySize(Math.max(.01,width-r*2),h);right.setVisible(value>0).setPosition(x+width-r,right.y).setDisplaySize(Math.max(.01,r),h);
    this.progressText?.setText(`${this.app.lastPercent}%`);
    const second=Math.floor(this.app.elapsed||0);this.timerText?.setText(`${String(Math.floor(second/60)).padStart(2,'0')}:${String(second%60).padStart(2,'0')}`);
  }
  updateStep(animate=true){
    if(!this.stepTitle?.active)return;const step=this.app.currentStep;if(!step)return;
    if(this.toastText){this.tweens.killTweensOf(this.toastText);this.toastText.destroy();this.toastText=null;}this.stepHint.setVisible(true);
    this.stepTitle.setText(step.name);this.stepHint.setText(step.hint);
    this.fitText(this.stepTitle,this.layout.landscape?680:430,36);this.fitText(this.stepHint,this.layout.landscape?710:390,49);
    this.stepStars.forEach((sprite,i)=>sprite.setTint(i<=this.app.currentStepIndex?0xffffff:0xbbacc6).setAlpha(i<=this.app.currentStepIndex?1:.6));
    if(animate&&!this.app.reducedMotion){for(const t of [this.stepTitle,this.stepHint]){this.tweens.killTweensOf(t);t.setAlpha(0);this.tweens.add({targets:t,alpha:1,duration:420});}const star=this.stepStars[this.app.currentStepIndex];if(star){const sx=star.scaleX,sy=star.scaleY;this.tweens.add({targets:star,scaleX:sx*1.3,scaleY:sy*1.3,duration:250,yoyo:true,ease:'Sine.Out'});}}
  }
  refreshSound(){this.soundSprites.forEach(s=>s.setTexture(this.app.audio.enabled?'ui-sound':'ui-muted'));for(const id of ['sound-button','modal-sound']){const b=document.getElementById(id);if(b){b.setAttribute('aria-pressed',String(this.app.audio.enabled));b.setAttribute('aria-label',t(this.app.audio.enabled?'Mute sound':'Enable sound'));}}this.soundLabel?.setText(this.app.audio.enabled?'Sound on':'Sound off');}
  drawPuzzleFailure(){
    const {W,H}=this.layout,cx=W/2,cy=H/2;
    // Screen-space sizing keeps the dialog readable even on small game boards.
    this.pop(this.image('panel',cx,cy,410,300));
    this.text('Almost there!',cx,cy-79,30,{color:'#684378',thickness:0,fitWidth:340});
    this.text(this.app.scene.puzzle?.failureMessage||'A fresh shuffle. You can do this!',cx,cy-19,20,{color:'#684378',thickness:0,maxWidth:330,fitWidth:340,fitHeight:70});
    this.pop(this.button('puzzle-failed-retry','TRY AGAIN',cx,cy+84,270,70,()=>this.app.scene.puzzle?.retry(),'green-button',27,'restart'),70);
  }
  drawPause(){
    const {W,H}=this.layout,cx=W/2,cy=H/2;
    this.pop(this.image('panel',cx,cy+12,420,530));
    this.pop(this.ribbon(this.app.state==='welcome'?'Settings':'Paused',cx,cy-220,370),40);
    this.icon('modal-close','back','Close settings',cx+187,cy-207,58,()=>this.app.closeModal());
    this.soundLabel=this.text(this.app.audio.enabled?'Sound on':'Sound off',cx-30,cy-125,25,{color:'#79558b',thickness:0});this.soundIcon(cx+110,cy-125,'modal-sound',49);
    this.pop(this.button('resume-button',this.app.pauseReturn?.mode==='playing'?'RESUME':'BACK',cx,cy-27,256,74,()=>this.app.closeModal()),90);
    if(this.app.pauseReturn?.mode==='playing')this.pop(this.button('restart-button','RESTART',cx,cy+68,240,68,()=>this.app.start(this.app.scene.levelIndex),'purple-button',28),140);
    this.pop(this.button('menu-button','LEVELS',cx,cy+163,240,68,()=>this.app.openLevels(),'purple-button',28),190);
    this.region('pause-heading',cx,cy-220,370,88);this.region('sound',cx,cy-125,280,53);this.region('resume',cx,cy-27,256,74);this.region('restart',cx,cy+68,240,68);this.region('levels',cx,cy+163,240,68);
  }
  resultPhoto(x,y,w,h){
    const g=this.add.container(x,y);this.root.add(g);this.image('polaroid',0,0,w,h,g);this.image('celebration',0,-h*.045,w*.77,h*.61,g);
    if(this.app.resultCanvas){if(this.textures.exists('ui-result-face'))this.textures.remove('ui-result-face');this.textures.addCanvas('ui-result-face',this.app.resultCanvas);const im=this.add.image(0,-h*.045,'ui-result-face'),src=im.texture.getSourceImage();im.setScale(Math.min(w*.72/src.width,h*.60/src.height));g.add(im);}
    this.image('polaroid-front',0,0,w,h,g);
    for(let i=0;i<3;i++)this.image('star',(i-1)*w*.18,h*.35,w*.17,w*.17,g);
    this.text(String(levelNumber(this.app.resultIndex)),w*.37,h*.38,23,{stroke:'#ac5c91',fitWidth:w*.17,fitHeight:h*.19},g);return g;
  }
  rewardStars(x,y){
    for(let i=0;i<3;i++){const star=this.image('star',x+(i-1)*73,y+(i===1?-9:0),i===1?75:61,i===1?75:61);this.pop(star,220+i*170);}
  }
  drawResult(){
    const {W,H,landscape}=this.layout,cx=W/2,centeredBase=(H-740)/2;
    this.walletBadge(W-91,26,124);
    this.button('result-pass','SPA PASS',125,29,104,36,()=>this.app.openMeta('pass'),'purple-button',14,'finish');
    this.button('result-gifts','MY GIFTS',244,29,104,36,()=>this.app.openMeta('rewards'),'purple-button',14,'bow');
    // Reserve a separate top row for navigation and the wallet, even when the
    // portrait layout reaches its minimum height. Flow the artwork below it.
    const titleY=landscape?94:Math.max(116,centeredBase+49);
    const starsY=landscape?186:Math.max(centeredBase+145,titleY+100);
    const photoX=landscape?W*.29:cx,photoY=landscape?341:Math.max(centeredBase+282,starsY+132);
    const base=photoY-282,compact=!landscape&&photoY>centeredBase+282,actionOffset=compact?-10:0;
    this.pop(this.ribbon('Level complete!',cx,titleY,390,true,29));
    this.rewardStars(photoX,starsY);
    this.pop(this.resultPhoto(photoX,photoY,landscape?171:148,landscape?213:182),110);
    const bx=landscape?W*.70:cx,coinY=landscape?191:base+391,timeY=landscape?230:base+426;
    this.pop(this.text(this.app.resultCoins?`+${this.app.resultCoins} coins`:'Beautiful again!',bx,coinY,26,{color:'#b17b31',thickness:0}),300);
    this.drawChestProgress(bx,timeY,265);
    const pending=this.app.save.pendingResult,tripled=!!pending&&pending.id===this.app.resultId&&pending.tripled;
    if(this.app.resultCoins){
      const x3=this.button('result-x3',tripled?'TRIPLED!':'CLAIM x3',bx,landscape?291:base+481+actionOffset,255,61,()=>this.app.tripleReward(),'green-button',28,tripled?'finish':'ad');
      if(tripled)this.disable('result-x3',x3);
    }else this.text('All ritual stars already collected',bx,landscape?288:base+481+actionOffset,17,{color:'#8a6492',thickness:0});
    const ny=landscape?373:base+553+actionOffset,ry=landscape?446:base+622+actionOffset;
    this.pop(this.button('next-button','NEXT',bx,ny,247,64,()=>this.app.continueCampaign(this.app.resultIndex),'green-button',30),220);
    this.pop(this.button('replay-button','REPLAY',bx,ry,201,53,()=>this.app.start(this.app.resultIndex),'purple-button',24),280);
    this.button('result-offer','BONUS GAME',bx,landscape?527:base+690+actionOffset,247,51,()=>this.app.offerMode(this.app.resultIndex%2?'stones':'bubbles'),'purple-button',22,'ad');
    this.icon('result-menu','back','All levels',34,34,46,()=>this.app.openLevels());
    this.region('heading',cx,titleY,390,93);this.region('stars',photoX,starsY,215,79);this.region('photo',photoX,photoY,171,landscape?213:182);
    this.region('coins',bx,coinY,270,36);this.region('time',bx,timeY,280,23);this.region('x3',bx,landscape?291:base+481+actionOffset,255,61);
    this.region('next',bx,ny,247,64);this.region('replay',bx,ry,201,53);this.region('offer',bx,landscape?527:base+690+actionOffset,247,51);
    if(this.app.save.levelChest.steps===5&&this.app.chestSequence?.id===this.app.resultId&&!this.app.chestSequence.offered)for(const id of ['result-x3','next-button','replay-button','result-offer','result-menu','result-chest','result-pass','result-gifts']){const button=document.getElementById(id);if(button)button.disabled=true;}
    if(this.animate)this.confetti();
  }
  drawCollection(){
    const {W,H,landscape}=this.layout,cx=W/2,total=this.app.save.stars.reduce((a,b)=>a+b,0),cy=H/2;
    this.pop(this.ribbon(total===LEVELS.length*3?'Perfect care!':'Your stars',cx,cy-(landscape?211:235),390,true));
    this.pop(this.image('trophy',cx,cy-40,240,187),150);
    this.text(`${total} / ${LEVELS.length*3} stars`,cx,cy+112,34,{color:'#ad7b31',thickness:0});
    this.pop(this.button('collection-menu','LEVELS',cx,cy+221,265,78,()=>this.app.openLevels(),'green-button',33),300);
    this.icon('collection-home','back','Back to the level album',35,35,46,()=>this.app.transition('menu',()=>this.app.welcome()));
    if(this.animate&&total===LEVELS.length*3)this.confetti();
  }
  confetti(){
    if(this.app.reducedMotion)return;const {W,H}=this.layout;
    for(let i=0;i<28;i++){
      const key=i%3===0?'glint':i%3===1?'petal':'heart',size=10+Math.random()*12,x=Math.random()*W;
      const p=this.image(key,x,-40-Math.random()*120,size,size,this.effects).setAlpha(.72);
      this.tweens.add({targets:p,x:x+Math.sin(i)*100,y:H+40,angle:(i%2?1:-1)*160,alpha:.1,duration:2700+Math.random()*1500,delay:i*28,ease:'Sine.In',onComplete:()=>p.destroy()});
    }
  }
  toast(message){
    if(this.mode!=='playing')return;if(this.toastText){this.tweens.killTweensOf(this.toastText);this.toastText.destroy();}const {W,H,landscape}=this.layout;
    // Transient hints share the reserved instruction band, never the face/HUD.
    const hint=this.stepHint;hint?.setVisible(false);
    this.toastText=this.text(message,W/2,H-(landscape?63:100),landscape?14:18,{color:'#a25d8a',thickness:0,maxWidth:landscape?710:390,fitWidth:landscape?710:390,fitHeight:landscape?36:49});
    const target=this.toastText;this.tweens.add({targets:target,alpha:0,delay:1500,duration:300,onComplete:()=>{target.destroy();if(this.toastText===target){this.toastText=null;if(hint?.active)hint.setVisible(true);}}});
  }
}
installMetaUI(IllustratedUI);
installEngagementUI(IllustratedUI);
installRewardFX(IllustratedUI);
installCardAlbum(IllustratedUI);
installModalBackdrop(IllustratedUI);

installPremiumUI(IllustratedUI);

installAlbumPaging(IllustratedUI);
