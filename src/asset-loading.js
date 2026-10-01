import { LEVELS, TOOLS } from './levels.js';
import { UI_ASSETS } from './ui-assets.js';
import { META_ASSETS } from './meta-assets.js';
import { CARDS, ITEMS, DAILY, PASS, WHEEL, MODES } from './meta-content.js';
import { SUPPLIES } from './economy.js';

const baseNames=['cat','frog','bunny','patch-left','patch-right',...TOOLS.map(t=>t[0]),
  ...['cat','frog','bunny'].flatMap(name=>['left','right'].map(side=>`${name}-eye-${side}`))];
export const ALL_ASSETS=[
  ...new Set(baseNames),
].map(key=>({key,url:`./assets/${key}.webp`})).concat(
  [...new Set(UI_ASSETS)].map(name=>({key:`ui-${name}`,url:`./assets/ui/${name}.webp`})));

// Covers, collection artwork and menu dialogs must work before entering a level.
const menuNames=new Set([
  ...META_ASSETS,...[...CARDS,...ITEMS,...DAILY,...PASS,...WHEEL,...MODES,...SUPPLIES].map(item=>item.art),
  ...LEVELS.flatMap(level=>[level.hero||level.character,level.steps[0].tool]),
  'back','settings','hint','sound','muted','score','coins','star','green-button',
  'purple-button','polaroid','polaroid-front','panel','trophy','lock','logo','tiles',
  'celebration','ribbon-pink','ribbon-gold','progress-track','progress-green',
  'bubble','heart','petal','glint','hint-hand','reward-coin','reward-rays','vip-frame',
]);
export const MENU_ASSETS=ALL_ASSETS.filter(asset=>menuNames.has(asset.key.replace(/^ui-/,'')));

export function queueAssets(scene,assets){
  for(const asset of assets)if(!scene.textures.exists(asset.key))scene.load.image(asset.key,asset.url);
}

export function installAssetLoading(App){Object.assign(App.prototype,{
  async ensureGameAssets(){
    if(this.gameAssetsReady)return;
    if(this.assetsPromise)return this.assetsPromise;
    this.assetsLoading=true;this.freeze();this.platformState();
    const overlay=document.createElement('div');overlay.id='content-loading';
    overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');
    const logo=document.createElement('img');logo.src='./assets/ui/logo.webp';logo.alt='Skincare ASMR';
    const label=document.createElement('p');label.textContent='Loading all levels… 0%';
    const progress=document.createElement('progress');progress.max=1;progress.value=0;
    const retry=document.createElement('button');retry.textContent='TRY AGAIN';retry.hidden=true;
    overlay.append(logo,label,progress,retry);document.getElementById('app').append(overlay);
    this.assetsPromise=(async()=>{
      for(;;){
        const success=await new Promise(resolve=>{
          const loader=this.scene.load;let failed=false;
          const onProgress=value=>{progress.value=value;label.textContent=`Loading all levels… ${Math.round(value*100)}%`;};
          const onError=()=>{failed=true;};
          const onComplete=()=>{loader.off('progress',onProgress);loader.off('loaderror',onError);resolve(!failed);};
          loader.on('progress',onProgress);loader.on('loaderror',onError);loader.once('complete',onComplete);
          queueAssets(this.scene,ALL_ASSETS);loader.start();
        });
        if(success)break;
        this.platform.warning();label.textContent='Could not load all levels. Please try again.';retry.hidden=false;
        await new Promise(resolve=>{retry.onclick=resolve;});
        retry.hidden=true;progress.value=0;label.textContent='Loading all levels… 0%';
      }
      await this.platform.whenActive();
      this.gameAssetsReady=true;
      this.scene.background.setTexture('ui-spa-room');this.scene.resize();
    })().finally(()=>{overlay.remove();this.assetsLoading=false;this.assetsPromise=null;this.platformState();});
    return this.assetsPromise;
  },
});}
