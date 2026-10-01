import {LEVEL_SOUNDS,soundForStep} from './level-sounds.js';
import backgroundMusicUrl from '../BackgroundMusic.ogg?url';

// One music player for the entire game, including menus and scene changes.
export class SpaAudio {
  constructor(enabled=true){
    this.enabled=enabled;
    this.effects=new Map();this.lastEffect=-Infinity;this.effectTimer=null;this.effect=null;this.stepProgress=0;
    // Stay silent until the initial host state has been applied.
    this.platformEnabled=false;
    this.blocked=false;
    this.music=new Audio(backgroundMusicUrl);
    this.music.loop=true;
    this.music.preload='auto';
    this.music.volume=.42;
    this.music.muted=true;
  }
  get audible(){return this.enabled&&this.platformEnabled&&!this.blocked;}
  sync(){
    // Apply the host gate synchronously, even while play() is still pending.
    this.music.muted=!this.audible;
    if(!this.audible){this.music.pause();this.stopEffects();return;}
    if(this.music.paused){
      // Autoplay may require a gesture. Never hold up game navigation on play().
      this.music.play().catch(()=>{});
    }
  }
  prepareStep(step){
    this.stopEffects();this.stepProgress=0;this.lastEffect=-Infinity;
    this.stepSound=soundForStep(step);
    if(this.stepSound)this.effectPlayer(this.stepSound);
  }
  effectPlayer(url){
    if(!this.effects.has(url)){
      const player=new Audio(url);player.preload='auto';player.volume=.48;player.muted=true;
      this.effects.set(url,player);
    }
    return this.effects.get(url);
  }
  stopEffects(){
    clearTimeout(this.effectTimer);
    for(const player of this.effects.values()){player.muted=true;player.pause();}
    this.effect=null;
  }
  playEffect(url){
    if(!url||!this.audible||performance.now()-this.lastEffect<420)return;
    this.lastEffect=performance.now();this.stopEffects();
    const player=this.effectPlayer(url);this.effect=player;
    player.currentTime=0;player.muted=false;player.play().catch(()=>{});
    // Short bounded snippets also stop if a gesture ends or the level stalls.
    this.effectTimer=setTimeout(()=>this.stopEffects(),650);
  }
  cue(name){this.playEffect(LEVEL_SOUNDS[name]);}
  levelProgress(scene){
    const value=scene?.stepProgress||0;
    if(value>this.stepProgress+0.00001&&scene.active&&!scene.frozen&&!scene.transitioning&&scene.mode!=='puzzle')this.playEffect(this.stepSound);
    this.stepProgress=value;
  }
  unlock(){this.sync();}
  setPlatformState(enabled,blocked){
    this.platformEnabled=enabled;
    this.blocked=blocked;
    this.sync();
  }
  toggle(){this.enabled=!this.enabled;this.sync();return this.enabled;}
  resume(){this.sync();}
}
