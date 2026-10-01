import {playables} from './playables.js';
const localPreview=['localhost','127.0.0.1','[::1]'].includes(window.location.hostname);
const allowTestReward=localPreview||import.meta.env.DEV||import.meta.env.VITE_TEST_REWARDED_FALLBACK==='true';
export class YouTubeRewardedProvider {
  constructor(){this.pending=null;}
  async show(placement){
    if(this.pending||playables.paused||playables.adBusy)return{status:'unavailable'};
    this.pending={placement};
    try{
      const result=await playables.rewarded(placement);
      if(!playables.enabled&&allowTestReward&&result.status==='unavailable'){
        await playables.whenActive();
        return{status:'rewarded',receipt:`test-${crypto.randomUUID()}`};
      }
      return result;
    }finally{this.pending=null;}
  }
  // YouTube owns its ad UI and cancellation. The game cannot dismiss platform ads.
  cancel(){}
}
