// Scripted Playgama Bridge double for browser tests. Exposes window.host:
// host.audio(bool), host.pause(), host.resume(), host.finishAd(earned).
// Storage goes through page.exposeFunction('__cloudRead'/'__cloudWrite') when present.
export function bridgeDouble({audio=true,language='en',rewarded='manual'}={}){
  return `
  const E={AUDIO_STATE_CHANGED:'audio_state_changed',PAUSE_STATE_CHANGED:'pause_state_changed',INTERSTITIAL_STATE_CHANGED:'interstitial_state_changed',REWARDED_STATE_CHANGED:'rewarded_state_changed'};
  const emitter=()=>({l:{},on(e,f){(this.l[e]??=[]).push(f);},off(e,f){this.l[e]=(this.l[e]||[]).filter(x=>x!==f);},emit(e,v){(this.l[e]||[]).slice().forEach(f=>f(v));}});
  const platform=Object.assign(emitter(),{id:'playgama',language:${JSON.stringify(language)},isAudioEnabled:${audio},isPaused:false,sendMessage:()=>Promise.resolve()});
  const ad=Object.assign(emitter(),{isInterstitialSupported:true,isRewardedSupported:true,interstitialState:'closed',rewardedState:'closed'});
  const set=(kind,s)=>{ad[kind+'State']=s;ad.emit(kind==='interstitial'?E.INTERSTITIAL_STATE_CHANGED:E.REWARDED_STATE_CHANGED,s);};
  ad.showInterstitial=()=>{set('interstitial','loading');set('interstitial','failed');};
  ad.showRewarded=()=>{set('rewarded','loading');set('rewarded','opened');${rewarded==='auto'?"setTimeout(()=>host.finishAd(true),40);":""}};
  let memory='';
  const read=()=>typeof __cloudRead==='function'?__cloudRead():memory;
  const write=v=>typeof __cloudWrite==='function'?__cloudWrite(v):(memory=v);
  window.host={
    audio:v=>{platform.isAudioEnabled=v;platform.emit(E.AUDIO_STATE_CHANGED,v);},
    pause:()=>{platform.isPaused=true;platform.emit(E.PAUSE_STATE_CHANGED,true);},
    resume:()=>{platform.isPaused=false;platform.emit(E.PAUSE_STATE_CHANGED,false);},
    finishAd:earned=>{if(earned)set('rewarded','rewarded');set('rewarded','closed');},
  };
  window.bridge={EVENT_NAME:E,platform,advertisement:ad,initialize:()=>Promise.resolve(),
    storage:{async get(keys){const v=await read();return keys.map(()=>v===''?null:v);},async set(keys,values){await write(values[0]);}}};`;
}
