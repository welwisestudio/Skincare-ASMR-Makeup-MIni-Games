// Direct JavaScript SDK adapter. No Unity bridge and no browser persistence.
export class Playables {
  constructor(sdk=typeof ytgame==='undefined'?undefined:ytgame,{now=()=>performance.now()}={}){
    this.sdk=sdk;this.enabled=!!sdk?.IN_PLAYABLES_ENV;this.now=now;
    this.paused=false;this.audioEnabled=true;this.listeners=new Set();this.resumeWaiters=[];
    this.loaded=false;this.pendingSave=null;this.saving=null;this.retryTimer=null;
    this.adBusy=false;this.lastInterstitialRequestCompleted=-Infinity;
    this.scoreWanted=-1;this.scoreSent=-1;this.sendingScore=null;
    this.onSaveState=()=>{};
    if(this.enabled){
      this.audioEnabled=sdk.system.isAudioEnabled();
      sdk.system.onAudioEnabledChange(enabled=>{this.audioEnabled=enabled;this.emit();});
      sdk.system.onPause(()=>{this.paused=true;this.emit();});
      sdk.system.onResume(()=>{this.paused=false;this.emit();this.resumeWaiters.splice(0).forEach(resolve=>resolve());this.flush();this.flushScore();});
    }
  }
  emit(){for(const listener of this.listeners)listener();}
  subscribe(listener){this.listeners.add(listener);listener();return()=>this.listeners.delete(listener);}
  whenActive(){return this.paused?new Promise(resolve=>this.resumeWaiters.push(resolve)):Promise.resolve();}
  warning(){try{if(this.enabled)this.sdk.health.logWarning();}catch{}}
  error(){try{if(this.enabled)this.sdk.health.logError();}catch{}}
  async load(){
    if(!this.enabled){this.loaded=true;return '';}
    let timeout;
    const data=await Promise.race([
      this.sdk.game.loadData(),
      new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Cloud load timed out')),15000);}),
    ]).finally(()=>clearTimeout(timeout));
    if(typeof data!=='string')throw new Error('Invalid cloud save response');
    // Do not authorize writes until the application has also validated its schema.
    return data;
  }
  acceptLoad(){this.loaded=true;}
  save(data){
    if(!this.loaded)return false;
    if(data.length*2>=3*1024*1024){this.error();this.onSaveState('error');return false;}
    if(!this.enabled)return false; // Local preview is session-only; never localStorage.
    this.pendingSave=data;this.flush();return true;
  }
  flush(force=false){
    if(force)this.forceFlush=true;
    if(!this.enabled||!this.loaded||this.saving||(!this.forceFlush&&this.paused)||this.pendingSave===null)return this.saving;
    clearTimeout(this.retryTimer);this.retryTimer=null;
    this.saving=(async()=>{
      while(this.pendingSave!==null&&(!this.paused||this.forceFlush)){
        const data=this.pendingSave;this.pendingSave=null;this.forceFlush=false;this.onSaveState('saving');
        try{await this.sdk.game.saveData(data);this.onSaveState('saved');}
        catch{
          // Keep the newest snapshot; never retry an old snapshot over a newer one.
          if(this.pendingSave===null)this.pendingSave=data;
          this.warning();this.onSaveState('error');
          this.retryTimer=setTimeout(()=>{this.flush();},5000);break;
        }
      }
    })().finally(()=>{this.saving=null;this.flushScore();});
    return this.saving;
  }
  score(value){this.scoreWanted=Math.max(this.scoreWanted,value);this.flushScore();}
  flushScore(){
    if(!this.enabled||this.paused||this.saving||this.pendingSave!==null||this.sendingScore||this.scoreWanted<=this.scoreSent)return;
    this.sendingScore=(async()=>{
      while(!this.paused&&this.scoreWanted>this.scoreSent){
        const value=this.scoreWanted;
        try{await this.sdk.engagement.sendScore({value});this.scoreSent=value;}
        catch{this.warning();break;}
      }
    })().finally(()=>{this.sendingScore=null;});
  }
  ready(){if(this.enabled)this.sdk.game.gameReady();}
  async rewarded(placement){
    if(!this.enabled||this.paused||this.adBusy)return{status:'unavailable'};
    this.adBusy=true;this.emit();
    try{
      const earned=await this.sdk.ads.requestRewardedAd(`skincare-${placement}`);
      await this.whenActive();
      return earned===true?{status:'rewarded',receipt:crypto.randomUUID()}:{status:'cancelled'};
    }catch{this.warning();await this.whenActive();return{status:'unavailable'};}
    finally{this.adBusy=false;this.emit();}
  }
  async interstitial(){
    if(!this.enabled||this.paused||this.adBusy||this.now()-this.lastInterstitialRequestCompleted<30000)return 'skipped';
    this.adBusy=true;this.emit();
    try{
      await this.sdk.ads.requestInterstitialAd();
      // v1 returns void: resolved request is NOT proof of an impression.
      // Conservative request throttle; errors never consume the interval.
      this.lastInterstitialRequestCompleted=this.now();
      await this.whenActive();return 'request-completed';
    }catch{this.warning();await this.whenActive();return 'unavailable';}
    finally{this.adBusy=false;this.emit();}
  }
}

export const playables=new Playables();
