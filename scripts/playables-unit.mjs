import assert from 'node:assert/strict';
import {Playables} from '../src/playables.js';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
function fixture(){
 const callbacks={},calls={saves:[],scores:[],ads:0,rewards:[]};
 const sdk={IN_PLAYABLES_ENV:true,system:{isAudioEnabled:()=>false,onAudioEnabledChange:f=>callbacks.audio=f,onPause:f=>callbacks.pause=f,onResume:f=>callbacks.resume=f},health:{logWarning(){},logError(){}},game:{loadData:async()=>'',saveData:async data=>{calls.saves.push(data);},gameReady(){}},engagement:{sendScore:async score=>{calls.scores.push(score.value);}},ads:{requestInterstitialAd:async()=>{calls.ads++;},requestRewardedAd:async id=>{calls.rewards.push(id);return true;}}};
 let now=0;const api=new Playables(sdk,{now:()=>now});return{api,sdk,callbacks,calls,setTime:t=>now=t};
}
{
 const f=fixture(),a=f.api;assert.equal(a.save('before-load'),false);assert.equal(f.calls.saves.length,0);
 await a.load();a.acceptLoad();const first=deferred();f.sdk.game.saveData=data=>{f.calls.saves.push(data);return first.promise;};
 a.save('first');a.save('second');a.save('latest');assert.deepEqual(f.calls.saves,['first']);first.resolve();await a.saving;assert.deepEqual(f.calls.saves,['first','latest']);
 let fail=true;f.sdk.game.saveData=async data=>{if(fail)throw Error();f.calls.saves.push(data);};a.save('failed');await a.saving;assert.equal(a.pendingSave,'failed');fail=false;a.save('newest');await a.saving;assert.equal(f.calls.saves.at(-1),'newest');
 f.callbacks.pause();a.save('on-pause');await a.flush(true);assert.equal(f.calls.saves.at(-1),'on-pause');f.callbacks.resume();
 assert.equal(a.save('x'.repeat(3*1024*1024/2)),false);
}
{
 const f=fixture(),a=f.api;await a.interstitial();assert.equal(f.calls.ads,1);f.setTime(29999);await a.interstitial();assert.equal(f.calls.ads,1);f.setTime(30000);await a.interstitial();assert.equal(f.calls.ads,2);
 f.setTime(60000);f.sdk.ads.requestInterstitialAd=async()=>{f.calls.ads++;throw Error();};assert.equal(await a.interstitial(),'unavailable');assert.equal(a.lastInterstitialRequestCompleted,30000);await a.interstitial();assert.equal(f.calls.ads,4);
 const pending=deferred();f.sdk.ads.requestInterstitialAd=()=>pending.promise;const task=a.interstitial();assert.equal(await a.interstitial(),'skipped');assert.equal((await a.rewarded('coins')).status,'unavailable');f.callbacks.pause();pending.resolve();await tick();assert.equal(a.adBusy,true);f.callbacks.resume();await task;assert.equal(a.adBusy,false);
}
{
 const f=fixture(),a=f.api;const one=await a.rewarded('coins'),two=await a.rewarded('coins');assert.equal(one.status,'rewarded');assert.notEqual(one.receipt,two.receipt);assert.deepEqual(f.calls.rewards,['skincare-coins','skincare-coins']);
 f.sdk.ads.requestRewardedAd=async()=>false;assert.equal((await a.rewarded('coins')).status,'cancelled');f.sdk.ads.requestRewardedAd=async()=>{throw Error();};assert.equal((await a.rewarded('coins')).status,'unavailable');
 a.score(3);await a.sendingScore;a.score(3);a.score(2);await tick();assert.deepEqual(f.calls.scores,[3]);a.score(4);await a.sendingScore;assert.deepEqual(f.calls.scores,[3,4]);
 f.callbacks.audio(true);assert.equal(a.audioEnabled,true);
}
{
 const a=new Playables({IN_PLAYABLES_ENV:false});assert.equal(await a.load(),'');assert.equal(a.save('{}'),false);assert.equal(await a.interstitial(),'skipped');assert.equal((await a.rewarded('coins')).status,'unavailable');
}
console.log('PASS: cloud-only queue, no writes before load, coalescing, retry/latest snapshot, pause flush, size cap, 30s request throttle/error/single-flight, rewarded true/false/reject/stable IDs, score deduplication, no-op SDK');
