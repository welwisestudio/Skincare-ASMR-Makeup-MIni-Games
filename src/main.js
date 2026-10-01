import {platform} from './platform.js';
import { setLanguage, t, loadFonts, installTextTranslation } from './i18n.js';
import { installAssetLoading } from './asset-loading.js';
import { installPremiumAccess, campaignDestination } from './premium-access.js';
import * as Phaser from 'phaser';
import './style.css';
import { SpaScene } from './scene.js';
import { IllustratedUI } from './ui-scene.js';
import { SpaAudio } from './audio.js';
import { loadSave, writeSave, reward, unlocked } from './save.js';
import { installEngagement } from './engagement.js';
import { installMeta } from './meta-controller.js';
import { LEVELS, levelNumber } from './levels.js';
import { CAMPAIGN_CARD_IDS } from './workshop-levels.js';

const $=id=>document.getElementById(id);
installTextTranslation(Phaser);

class SpaApp {
  constructor(save){
    this.platform=platform;this.save=save;this.audio=new SpaAudio(this.save.sound);this.state='loading';this.modalName=null;this.lastPercent=0;this.elapsed=0;
    this.initMeta();
    this.pixelRatio=Math.min(devicePixelRatio||1,2);this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Phaser defaults pixelArt to true when zoom !== 1; HiDPI zoom must keep smooth filtering.
    this.game=new Phaser.Game({type:Phaser.AUTO,autoFocus:false,parent:'game-canvas',width:Math.max(1,Math.round(innerWidth*this.pixelRatio)),height:Math.max(1,Math.round(innerHeight*this.pixelRatio)),backgroundColor:'#f8e7ed',pixelArt:false,antialias:true,antialiasGL:true,roundPixels:false,powerPreference:'low-power',scale:{mode:Phaser.Scale.NONE,zoom:1/this.pixelRatio},input:{activePointers:2,touch:{capture:true}},audio:{noAudio:true},scene:[new SpaScene(this),new IllustratedUI(this)],fps:{target:60},banner:false});
    // Only the host SDK controls automatic suspension, never browser focus.
    for(const name of ['onHidden','onVisible','onBlur','onFocus'])this.game[name]=()=>{};
    // Resizing a WebGL canvas clears its buffer. Do it at the START of the
    // Phaser frame, never in a second RAF after rendering a finished frame.
    window.addEventListener('resize',()=>{this.resizePending=true;});
    this.game.events.on(Phaser.Core.Events.PRE_STEP,()=>{
      if(!this.resizePending||!innerWidth||!innerHeight)return;this.resizePending=false;
      this.pixelRatio=Math.min(devicePixelRatio||1,2);const width=Math.round(innerWidth*this.pixelRatio),height=Math.round(innerHeight*this.pixelRatio);
      this.game.canvas.style.width=`${innerWidth}px`;this.game.canvas.style.height=`${innerHeight}px`;
      this.game.scale.zoom=1/this.pixelRatio;
      if(this.game.canvas.width!==width||this.game.canvas.height!==height)this.game.scale.resize(width,height);
      else this.game.scale.refresh();
      this.game.scale.updateBounds();
    });
    document.addEventListener('pointerdown',()=>this.audio.unlock(),{capture:true});
    document.addEventListener('keydown',event=>{this.audio.unlock();this.keydown(event);});
    this.platform.subscribe(()=>this.platformState());
    this.platform.onSaveState=state=>this.saveStatus(state);
    if(import.meta.env.DEV)window.__spa={app:this,getState:()=>this.scene?.debugState()};
  }
  platformState(){
    const blocked=this.platform.paused||this.platform.adBusy;
    this.audio.setPlatformState(this.platform.audioEnabled,blocked);
    let shield=$('platform-shield');if(!shield){shield=document.createElement('div');shield.id='platform-shield';shield.setAttribute('aria-hidden','true');document.body.append(shield);}
    shield.hidden=!blocked;
    if($('ui-accessibility'))$('ui-accessibility').inert=blocked||!!this.navigationBusy||!!this.assetsLoading;
    if(blocked){
      if(!this.platformSuspended){this.platformSuspended=true;this.suspendedAt=performance.now();this.freeze();this.game.loop.sleep();}
      if(this.platform.paused){writeSave(this.save);this.platform.flush();}
    }else if(this.platformSuspended){
      const gap=performance.now()-this.suspendedAt;
      for(const [obj,key] of [[this.reveal,'start'],[this.chestReveal,'started'],[this.chestSequence,'started'],[this.cardCelebration,'start'],[this.bonus,'start']])if(obj?.[key])obj[key]+=gap;
      this.platformSuspended=false;this.game.loop.wake();
      if(this.ui?.mode==='playing'&&!this.modalName&&!this.navigationBusy&&!this.rewardBusy&&!this.assetsLoading)this.unfreeze();
    }
  }
  saveStatus(state){
    let label=$('cloud-status');if(!label){label=document.createElement('button');label.id='cloud-status';label.onclick=()=>this.platform.flush();document.body.append(label);}
    label.hidden=state!=='error';label.textContent=t('Progress not saved yet. Tap to retry.');
  }
  async transition(placement,action){
    if(this.navigationBusy||this.rewardBusy||this.platform.paused||this.platform.adBusy)return;
    this.navigationBusy=true;this.freeze();$('ui-accessibility').inert=true;
    try{if(!this.applyingReward)await this.platform.interstitial(placement);await this.platform.whenActive();return await action();}
    finally{this.navigationBusy=false;$('ui-accessibility').inert=this.platform.paused||this.platform.adBusy;if(this.ui.mode==='playing'&&!this.modalName)this.unfreeze();}
  }
  ready(scene){this.scene=scene;if(!this.hasLoadError)scene.scene.launch('IllustratedUI');}
  uiReady(ui){this.ui=ui;$('loading').remove();this.welcome();this.platformState();this.platform.ready();}
  loadError(key){this.hasLoadError=true;console.error(`Could not load game asset: ${key}`);const text=document.createElement('p');text.textContent=t('Could not open the spa. Please refresh to try again.');$('loading').replaceChildren(text);}
  updateWallet(){$('star-count').textContent=`${this.save.stars.reduce((a,b)=>a+b,0)} / ${LEVELS.length*3}`;this.ui?.syncWallet();$('coin-count').textContent=this.displayCoins;}
  toggleSound(){this.save.sound=this.audio.toggle();writeSave(this.save);this.ui?.refreshSound();}
  welcome(){this.metaStack=[];this.modalName=null;this.unfreeze();this.state='welcome';this.scene.runId=(this.scene.runId||0)+1;this.scene.showWelcome();this.ui.show('levels');this.updateWallet();}
  async start(index,source='menu',afterBreak=false){
    if(!afterBreak)return this.transition('level-'+source,()=>this.start(index,source,true));
    if(!LEVELS[index])return;
    if(LEVELS[index].premium&&!unlocked(this.save,index)){if(source==='campaign'&&this.save.premiumSkipped.includes(index))return this.continueCampaign(index,true);this.offerPremium(index,source);return;}
    if(!unlocked(this.save,index)){this.openMeta('purchase',{index});return;}
    await this.ensureGameAssets();
    this.metaStack=[];this.metaData={};this.pauseReturn=null;
    await this.audio.unlock();this.audio.resume();this.modalName=null;this.unfreeze();this.state='playing';this.lastPercent=0;this.elapsed=0;this.albumPage=Math.floor((levelNumber(index)-1)/5);this.scene.begin(index);this.ui.show('playing');this.progress(0,0);this.persist();
    this.platform.message('level_started',{level:String(levelNumber(index))});
  }
  startNext(){this.start(campaignDestination(this.save,undefined),'campaign');}
  stepChanged(level,index,step){this.audio.prepareStep(step);this.currentStep=step;this.currentStepIndex=index;$('game-status').textContent=`${t(level.name)}. ${t(step.name)}. ${t(step.hint)}`;this.ui?.updateStep();}
  progress(value,elapsed){this.audio.levelProgress(this.scene);this.lastPercent=Math.min(100,Math.round(value*100));this.elapsed=elapsed;$('progress-label').textContent=`${this.lastPercent}%`;this.ui?.updateProgress();}
  toast(message){this.ui?.toast(message);$('game-status').textContent=t(message);}
  freeze(){this.audio.stopEffects();if(!this.scene)return;this.scene.pause();this.scene.time.paused=true;this.scene.tweens.pauseAll();}
  unfreeze(){if(!this.scene||this.platform.paused||this.platform.adBusy)return;this.scene.resume();this.scene.time.paused=false;this.scene.tweens.resumeAll();}
  closeModal(){if(this.ui.mode==='pause'&&this.pauseReturn){const back=this.pauseReturn;this.pauseReturn=null;this.modalName=back.modal;this.audio.resume();this.ui.show(back.mode);if(back.mode==='playing')this.unfreeze();else this.freeze();return;}if(this.metaStack.length){this.backMeta();return;}this.modalName=null;this.audio.resume();this.unfreeze();this.ui.show(this.state==='welcome'?'levels':this.state==='result'?'result':'playing');}
  openLevels(afterBreak=false){if(!afterBreak)return this.transition('menu',()=>this.openLevels(true));this.metaStack=[];this.modalName=this.state==='welcome'?null:'levels';this.freeze();this.ui.show('levels');}
  openPause(){if(this.ui.mode==='pause')return;this.pauseReturn={mode:this.ui.mode,modal:this.modalName};this.modalName=this.state==='welcome'?'settings':'pause';this.freeze();this.ui.show('pause');}
  completed(index,elapsed){
    if(this.finishedRun===this.scene.runId)return;this.finishedRun=this.scene.runId;this.advanceChest();
    this.resultIndex=index;this.elapsedResult=elapsed;this.resultCanvas=this.scene.capturePortrait(true);this.resultCoins=reward(this.save,index,3);this.state='result';this.modalName='result';this.updateWallet();this.freeze();
    const id=CAMPAIGN_CARD_IDS[index],newCard=!this.save.cards.includes(id);if(newCard)this.save.cards.push(id);
    this.resultId=crypto.randomUUID();this.save.pendingResult={id:this.resultId,base:this.resultCoins,tripled:false};this.persist();
    this.platform.message('level_completed',{level:String(levelNumber(index))});
    if(newCard)this.celebrateCard(id);else this.ui.show('result');
  }
  showCollection(){this.modalName='collection';this.freeze();this.ui.show('collection');}
  keydown(event){
    if(this.platform.paused||this.platform.adBusy||this.navigationBusy||this.rewardBusy||this.assetsLoading)return;
    if(event.key==='Escape'&&this.ui?.mode==='card-earned'){this.finishCardCelebration();return;}
    if(event.key==='Escape'){if(this.ads.pending||this.metaStack.length)this.backMeta();else if(this.modalName==='pause'||this.modalName==='settings'||this.modalName==='levels')this.closeModal();else if(this.state==='playing'&&!this.modalName)this.openPause();}
    if(event.key.toLowerCase()==='m'&&!event.ctrlKey&&!event.altKey)this.toggleSound();
  }
}

installMeta(SpaApp);
installAssetLoading(SpaApp);
installPremiumAccess(SpaApp);
installEngagement(SpaApp);
async function boot(){
  const loading=$('loading');
  let save;
  try{
    save=await loadSave();
  }catch(error){
    console.error('Progress load failed:',error?.code??error?.name??'Bridge rejection',error?.message??'No error details returned by Bridge');
    await platform.whenActive();loading.replaceChildren();
    const text=document.createElement('p');text.textContent=t('Could not load your progress. Please try again.');
    const retry=document.createElement('button');retry.id='cloud-retry';retry.textContent=t('TRY AGAIN');retry.onclick=()=>{retry.disabled=true;boot();};loading.append(text,retry);
    return;
  }
  try{
    // A font failure must not masquerade as a failed progress read.
    await loadFonts();
    await platform.whenActive();new SpaApp(save);
  }catch(error){
    console.error('Game startup failed:',error);
    const screen=$('loading')??document.createElement('div');screen.id='loading';screen.replaceChildren();
    const text=document.createElement('p');text.textContent=t('Could not start the game. Please reload to try again.');
    const retry=document.createElement('button');retry.textContent=t('RELOAD');retry.onclick=()=>location.reload();screen.append(text,retry);if(!screen.isConnected)document.body.append(screen);
  }
}
// The language comes from the Bridge once, right after initialization.
// Dev-only override for manual checks: ?lang=ru / ?lang=en. Production always uses the Bridge.
const devLanguage=import.meta.env.DEV?new URLSearchParams(location.search).get('lang'):null;
platform.init().then(()=>{setLanguage(devLanguage||platform.language);boot();});
