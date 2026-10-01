import {platform} from './platform.js';
const localPreview=['localhost','127.0.0.1','[::1]'].includes(window.location.hostname);
const allowTestReward=localPreview||import.meta.env.DEV||import.meta.env.VITE_TEST_REWARDED_FALLBACK==='true';
export class RewardedProvider {
  constructor(){this.pending=null;}
  async show(placement){
    if(this.pending||platform.paused||platform.adBusy)return{status:'unavailable'};
    this.pending={placement};
    try{
      const result=await platform.rewarded(placement);
      // Local preview runs on the Bridge mock platform, which has no ads.
      if((!platform.enabled||platform.id==='mock')&&allowTestReward&&result.status==='unavailable'){
        await platform.whenActive();
        return{status:'rewarded',receipt:`test-${crypto.randomUUID()}`};
      }
      return result;
    }finally{this.pending=null;}
  }
  // The host owns its ad UI and cancellation. The game cannot dismiss platform ads.
  cancel(){}
}
