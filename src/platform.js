// Playgama Bridge adapter. Progress persists only through bridge.storage;
// ads, pause and audio state come from the Bridge host events.
const SAVE_KEY='skincare_progress';
const INIT_TIMEOUT=15000,LOAD_TIMEOUT=15000,AD_START_TIMEOUT=20000;
const withTimeout=(promise,ms,message)=>{let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),ms);})]).finally(()=>clearTimeout(timer));};

export class PlaygamaPlatform {
  constructor(sdk=typeof window==='undefined'?undefined:window.bridge){
    this.sdk=sdk;this.enabled=false;this.id='none';this.language=(typeof navigator==='undefined'?'en':navigator.language)||'en';
    this.paused=false;this.audioEnabled=true;this.listeners=new Set();this.resumeWaiters=[];
    this.loaded=false;this.pendingSave=null;this.saving=null;this.retryTimer=null;
    this.adBusy=false;this.readySent=false;
    this.onSaveState=()=>{};
  }
  async init(){
    if(!this.sdk)return false;
    try{await withTimeout(Promise.resolve().then(()=>this.sdk.initialize()),INIT_TIMEOUT,'Bridge initialization timed out');}
    catch(error){console.error('Playgama Bridge initialization failed:',error?.message??error);return false;}
    const {platform,EVENT_NAME}=this.sdk;
    this.enabled=true;this.id=platform.id;this.language=platform.language||this.language;
    // The initial host state must be applied manually; events fire only on change.
    this.audioEnabled=platform.isAudioEnabled!==false;this.paused=platform.isPaused===true||['loading','opened'].includes(this.sdk.advertisement?.interstitialState);
    platform.on(EVENT_NAME.AUDIO_STATE_CHANGED,enabled=>{this.audioEnabled=enabled!==false;this.emit();});
    platform.on(EVENT_NAME.PAUSE_STATE_CHANGED,paused=>{
      this.paused=paused===true;this.emit();
      if(!this.paused){this.resumeWaiters.splice(0).forEach(resolve=>resolve());this.flush();}
    });
    return true;
  }
  emit(){for(const listener of this.listeners)listener();}
  subscribe(listener){this.listeners.add(listener);listener();return()=>this.listeners.delete(listener);}
  whenActive(){return this.paused?new Promise(resolve=>this.resumeWaiters.push(resolve)):Promise.resolve();}
  warning(message){if(message)console.warn(message);}
  error(message){if(message)console.error(message);}
  message(name,options){if(!this.enabled)return;try{Promise.resolve(this.sdk.platform.sendMessage(name,options)).catch(()=>{});}catch{}}
  async load(){
    if(!this.enabled){this.loaded=true;return '';}
    // One storage call for the whole snapshot; keep the raw JSON string.
    const data=await withTimeout(this.sdk.storage.get([SAVE_KEY],false),LOAD_TIMEOUT,'Progress load timed out');
    const value=Array.isArray(data)?data[0]:data;
    if(value===null||value===undefined)return '';
    if(typeof value==='string')return value;
    if(typeof value==='object')return JSON.stringify(value);
    throw new Error('Invalid storage response');
  }
  acceptLoad(){this.loaded=true;}
  save(data){
    if(!this.loaded||!this.enabled)return false;
    this.pendingSave=data;this.flush();return true;
  }
  flush(){
    if(!this.enabled||!this.loaded||this.saving||this.pendingSave===null)return this.saving;
    clearTimeout(this.retryTimer);this.retryTimer=null;
    this.saving=(async()=>{
      while(this.pendingSave!==null){
        const data=this.pendingSave;this.pendingSave=null;this.onSaveState('saving');
        try{await this.sdk.storage.set([SAVE_KEY],[data]);this.onSaveState('saved');}
        catch(error){
          // Keep the newest snapshot; never retry an old snapshot over a newer one.
          if(this.pendingSave===null)this.pendingSave=data;
          console.warn('Progress save failed:',error?.message??error);this.onSaveState('error');
          this.retryTimer=setTimeout(()=>{this.flush();},5000);break;
        }
      }
    })().finally(()=>{this.saving=null;});
    return this.saving;
  }
  ready(){if(this.readySent)return;this.readySent=true;this.message('game_ready');}
  // Waits for the ad flow to settle. Resolves with the last state seen.
  watchAd(kind,show){
    const {advertisement,EVENT_NAME}=this.sdk,event=kind==='rewarded'?EVENT_NAME.REWARDED_STATE_CHANGED:EVENT_NAME.INTERSTITIAL_STATE_CHANGED;
    return new Promise(resolve=>{
      let earned=false,opened=false,settled=false,timer;
      const finish=state=>{if(settled)return;settled=true;clearTimeout(timer);advertisement.off(event,handler);resolve({state,earned,opened});};
      const handler=state=>{
        if(state==='opened'){opened=true;clearTimeout(timer);}
        else if(state==='rewarded')earned=true;
        else if(state==='closed'||state==='failed')finish(state);
      };
      advertisement.on(event,handler);
      // An ad that never starts must not lock navigation forever.
      timer=setTimeout(()=>finish('timeout'),AD_START_TIMEOUT);
      try{show();}catch{finish('failed');return;}
      // Bridge ignores a request silently while another ad is in progress.
      const current=kind==='rewarded'?advertisement.rewardedState:advertisement.interstitialState;
      if(!settled&&!['loading','opened','rewarded'].includes(current))finish(current||'failed');
    });
  }
  async rewarded(placement){
    if(!this.enabled||this.paused||this.adBusy||!this.sdk.advertisement.isRewardedSupported)return{status:'unavailable'};
    this.adBusy=true;this.emit();
    try{
      const result=await this.watchAd('rewarded',()=>this.sdk.advertisement.showRewarded(placement));
      await this.whenActive();
      // Grant only on the 'rewarded' state, never on a plain close.
      return result.earned?{status:'rewarded',receipt:crypto.randomUUID()}:result.opened?{status:'cancelled'}:{status:'unavailable'};
    }finally{this.adBusy=false;this.emit();}
  }
  async interstitial(placement){
    if(!this.enabled||this.paused||this.adBusy||!this.sdk.advertisement.isInterstitialSupported)return 'skipped';
    this.adBusy=true;this.emit();
    try{
      // Bridge enforces minimumDelayBetweenInterstitial and reports 'failed' when throttled.
      const result=await this.watchAd('interstitial',()=>this.sdk.advertisement.showInterstitial(placement));
      await this.whenActive();
      return result.opened?'shown':'skipped';
    }finally{this.adBusy=false;this.emit();}
  }
}

export const platform=new PlaygamaPlatform();
