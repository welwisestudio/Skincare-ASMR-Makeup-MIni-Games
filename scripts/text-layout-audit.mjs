import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {LEVELS} from '../src/levels.js';
import {CARDS,PASS,WHEEL,DAILY} from '../src/meta-content.js';

const folder='test-results/text-layout';await mkdir(folder,{recursive:true});
// Test oriented rectangles: axis-aligned boxes falsely collide on wheel labels.
function intersects(a,b){
  const points=o=>o.points||[{x:o.x,y:o.y},{x:o.x+o.w,y:o.y},{x:o.x+o.w,y:o.y+o.h},{x:o.x,y:o.y+o.h}];
  const ap=points(a),bp=points(b);
  for(const poly of [ap,bp])for(let i=0;i<4;i++){
    const p=poly[i],q=poly[(i+1)%4],len=Math.hypot(q.y-p.y,q.x-p.x),axis={x:(q.y-p.y)/len,y:(p.x-q.x)/len};
    const aa=ap.map(v=>v.x*axis.x+v.y*axis.y),bb=bp.map(v=>v.x*axis.x+v.y*axis.y);
    if(Math.min(Math.max(...aa),Math.max(...bb))-Math.max(Math.min(...aa),Math.min(...bb))<=1)return false;
  }return true;
}
const fixtures=[];
const add=(name,mode,extra={})=>fixtures.push({name,mode,...extra});
for(const mode of ['levels','pause','collection','rewards','daily','wheel','boxes','coins','shop','purchase','cards','pass','items','help','modes','mode-offer','bonus','reward','ad'])add(mode,mode);
for(let i=0;i<LEVELS.reduce((n,l)=>n+l.steps.length,0);i++){const stages=LEVELS.flatMap((l,index)=>l.steps.map((step,stage)=>({index,stage})));add(`stage-${i+1}`,'playing',stages[i]);}
for(let p=1;p<Math.ceil(LEVELS.length/5);p++){add(`album-page-${p+1}`,'levels',{album:p});add(`shop-page-${p+1}`,'shop',{album:p});add(`cards-page-${p+1}`,'cards',{page:p});}
for(const card of CARDS)add(`card-${card.id}`,'card-detail',{card:card.id});
add('cards-page-2','cards',{page:1});add('cards-owned','cards',{owned:true});
add('daily-wait','daily',{claimed:true});add('daily-day-7','daily',{day:6});add('daily-complete','daily',{day:7,claimed:true});
add('pass-complete','pass',{pass:7});add('pass-last','pass',{pass:6});
add('wardrobe-owned','items',{owned:true});add('help-skip','help',{kind:'skip'});
add('new-card','card-earned',{card:'fresh'});add('new-card-long','card-earned',{card:'devoted'});
add('purchase-rich','purchase',{coins:999999});add('purchase-owned','purchase',{owned:true});
add('bonus-stones','bonus',{bonus:'stones'});add('bonus-stones-high','bonus',{bonus:'stones',stacked:4});
add('bonus-done','bonus',{bonus:'stones',finished:true});add('bubbles-done','bonus',{finished:true});
add('mode-stones','mode-offer',{bonus:'stones'});add('mode-owned','mode-offer',{owned:true});
add('pause-muted','pause',{muted:true});add('settings','pause',{settings:true});
for(const value of [0,75,225])add(`result-${value}`,'result',{result:value});
add('result-final','result',{result:75,index:LEVELS.length-1});
add('wallet-max','levels',{coins:999999});add('hud-max','playing',{coins:999999,elapsed:59999});
add('boxes-max','boxes',{boxes:999999});add('hub-max','rewards',{boxes:999999});add('help-max','help',{hints:999999});
for(const [i,r] of PASS.entries())add(`reward-pass-${i+1}`,'reward',{rewards:[r],title:i===6?'The royal collection!':'Spa Pass reward!'});
for(const [i,r] of WHEEL.entries())add(`reward-wheel-${i+1}-pass7`,'reward',{rewards:[r,PASS[6]],title:'Lucky you!'});
add('reward-x3-pass7','reward',{rewards:[{coins:150},PASS[6]],title:'Triple the glow!',extra:'75 + 150 = 225 level coins\nSpa Pass 7/7 bonus included'});
add('reward-day7','reward',{rewards:[DAILY[6]],title:'Day 7 gift!'});
add('reward-unavailable','reward',{rewards:[],title:'Try again soon',extra:'The video is unavailable. Nothing was spent.'});
add('toast-pass','playing',{toast:'Spa Pass 7/7: Royal spa bundle'});
for(const toast of ['Press & hold until the ring fills','Start at the mint dot. Follow it slowly.','Grab a tab, then pull along the arrow','Drag a patch to its dotted outline','Sweep over the sparkling areas'])add(`toast-hint-${fixtures.length}`,'playing',{toast});
add('ad-ready','ad',{ready:true});add('wheel-spinning','wheel',{reveal:'wheel'});add('box-opening','boxes',{reveal:'box'});

const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errors=[],report=[],issues=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:5173');await page.waitForSelector('#start-button');
await page.evaluate(()=>{window.auditBase=JSON.stringify(window.__spa.app.save);window.__spa.app.reducedMotion=true;});
const sizes=process.env.QUICK?[[390,844],[844,390]]:[[320,240],[320,480],[390,844],[551,870],[844,390],[876,876],[768,1024],[1440,900],[2560,1080]];
const selectedFixtures=process.env.FIXTURE?fixtures.filter(f=>f.name.startsWith(process.env.FIXTURE)):fixtures;
for(const [width,height] of sizes){
  await page.setViewportSize({width,height});await page.waitForTimeout(80);
  for(const f of selectedFixtures){
    await page.evaluate(async f=>{
      const a=window.__spa.app,{LEVELS}=await import('/src/levels.js');a.ads.cancel();a.reveal=null;a.save=JSON.parse(window.auditBase);a.save.coins=f.coins||0;a.save.boxes=f.boxes??1;a.save.hints=f.hints||0;a.save.daily={claims:f.day||0,lastDay:f.claimed?new Date().toISOString().slice(0,10):''};a.save.passAds=f.pass||0;
      if(f.owned){a.save.items=['bow','butterfly','serum'];a.save.equipped='butterfly';a.save.cards=['fresh','berry','eyes','jade','glow','royal','lucky','devoted'];a.save.stars=[3,3,3,3,3];a.save.bonusUnlocked=['bubbles','stones'];}
      a.displayCoins=a.save.coins;a.observedCoins=a.save.coins;a.coinQueue=0;
      a.albumPage=f.album||0;a.shopPage=f.album||0;a.audio.enabled=!f.muted;a.cardScroll=(f.page||0)*480;a.metaData={index:4,id:f.card||f.bonus||'bubbles',kind:f.kind||'hint'};
      if(f.mode==='card-earned'){const {CARDS}=await import('/src/meta-content.js');a.cardCelebration={card:CARDS.find(c=>c.id===f.card),start:performance.now()};}
      a.bonus={id:f.bonus||'bubbles',popped:[],stacked:f.stacked||0,finished:!!f.finished,start:performance.now()};
      a.state=f.settings||f.mode==='levels'?'welcome':'playing';
      if(f.mode==='playing'||f.mode==='result'||f.mode==='pause'){
        a.scene.begin(f.index||0);const step=f.stage||0;a.scene.stepIndex=step;a.scene.nextStep(true);a.freeze();a.currentStep=LEVELS[f.index||0].steps[step];a.currentStepIndex=step;a.elapsed=f.elapsed||44;a.lastPercent=48;
      }
      if(f.mode==='result'){a.state='result';a.resultIndex=f.index||0;a.resultCoins=f.result??75;a.elapsedResult=62;a.resultCanvas=a.scene.capturePortrait(true);a.resultId='fixture';a.save.pendingResult={id:'fixture',base:75,tripled:f.result===225};}
      if(f.mode==='reward')a.metaData={title:f.title||'A lovely surprise',rewards:f.rewards||[{coins:100}],art:'grand-bundle',extra:f.extra||'Your rewards are already safe in your collection.'};
      if(f.reveal)a.reveal={type:f.reveal,index:0,start:performance.now()-7e8,duration:1e9};
      a.ui.mode=f.mode;a.ui.render(false);if(f.toast)a.ui.toast(f.toast);
      if(f.ready){a.ui.adCounter.setText('Your reward is ready!');a.ui.adContinue.setAlpha(1);}
      a.ui.update();
    },f);
    const data=await page.evaluate(()=>{
      const ui=window.__spa.app.ui,ratio=window.__spa.app.pixelRatio,texts=[],images=[];
      const geometry=o=>{const b=o.getBounds(),m=o.getWorldTransformMatrix(),ox=o.displayOriginX,oy=o.displayOriginY;return {x:b.x/ratio,y:b.y/ratio,w:b.width/ratio,h:b.height/ratio,points:[[0,0],[o.width,0],[o.width,o.height],[0,o.height]].map(([x,y])=>{const p=m.transformPoint(x-ox,y-oy);return{x:p.x/ratio,y:p.y/ratio};})};};
      const walk=(o,clip)=>{if(o.visible===false||o.alpha===0||o.getData?.('decorativeEffect'))return;
        const viewport=o.getData?.('scrollClip');if(viewport){const l=ui.layout;clip={x:l.x+viewport.x*l.scale,y:l.y+viewport.y*l.scale,w:viewport.width*l.scale,h:viewport.height*l.scale};}
        if(o.type==='Text'||o.type==='Image'){const bounds=geometry(o);if(clip&&(bounds.x<clip.x||bounds.y<clip.y||bounds.x+bounds.w>clip.x+clip.w||bounds.y+bounds.h>clip.y+clip.h))return;
          if(o.type==='Text'&&o.text)texts.push({text:o.text,...bounds,limits:o.getData('textLimits'),localWidth:o.width,localHeight:o.height});else if(o.type==='Image')images.push({key:o.texture.key,...bounds});}
        if(o.list)o.list.forEach(child=>walk(child,clip));};walk(ui.root);if(ui.mode==='playing'){walk(window.__spa.app.scene.targetText);if(window.__spa.app.scene.workshop)walk(window.__spa.app.scene.workshop.counter);const q=window.__spa.app.scene.puzzle;if(q){[q.counter,q.timer,q.movesText,q.statusText,...(q.panels||[]).map(p=>p.label)].filter(Boolean).forEach(t=>walk(t));}}
      if(ui.mode==='playing'&&window.__spa.app.scene.romance){const narrative=o=>{if(!o.visible||o.alpha===0)return;if(o.type==='Text')walk(o);if(o.list)o.list.forEach(narrative);};narrative(window.__spa.app.scene.romance.stage);}
      return {texts,images,buttons:[...document.querySelectorAll('.ui-hit')].map(e=>{const b=e.getBoundingClientRect(),parent=e.closest('.cards-scroll'),clip=parent?.getBoundingClientRect();const x=clip?Math.max(b.x,clip.x):b.x,y=clip?Math.max(b.y,clip.y):b.y,right=clip?Math.min(b.right,clip.right):b.right,bottom=clip?Math.min(b.bottom,clip.bottom):b.bottom;return {id:e.id,text:e.textContent,x,y,w:right-x,h:bottom-y};}).filter(b=>b.w>0&&b.h>0)};
    });
    const found=[];
    for(const t of data.texts){
      if(t.x<-.5||t.y<-.5||t.x+t.w>width+.5||t.y+t.h>height+.5)found.push({type:'text-offscreen',text:t.text,bounds:t});
      const surfaces=/^ui-(score|coins|progress-track|progress-green|polaroid|polaroid-front|celebration|ribbon-pink|ribbon-gold|panel|green-button|purple-button|reward-tile|bundle-tile|achievement-frame|lucky-wheel)$/;
      for(const im of data.images){if(surfaces.test(im.key)||!im.key.startsWith('ui-'))continue;if(intersects(t,im))found.push({type:'text-art',text:t.text,art:im.key});}
      if(t.limits&&((t.limits.width&&t.localWidth>t.limits.width+.5)||(t.limits.height&&t.localHeight>t.limits.height+.5)))found.push({type:'text-container',text:t.text});
      for(const b of data.buttons){const ox=Math.min(t.x+t.w,b.x+b.w)-Math.max(t.x,b.x),oy=Math.min(t.y+t.h,b.y+b.h)-Math.max(t.y,b.y);
        if(ox>2&&oy>2&&!(t.x>=b.x-1&&t.y>=b.y-1&&t.x+t.w<=b.x+b.w+1&&t.y+t.h<=b.y+b.h+1))found.push({type:'text-button',text:t.text,button:b.id,ox,oy});}
    }
    for(let i=0;i<data.texts.length;i++)for(let j=i+1;j<data.texts.length;j++){
      const a=data.texts[i],b=data.texts[j],ox=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),oy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
      if(ox>1&&oy>1&&intersects(a,b))found.push({type:'text-text',a:a.text,b:b.text,ox,oy});
    }
    report.push({width,height,fixture:f.name,texts:data.texts.length,issues:found.length});
    if(found.length){issues.push({width,height,fixture:f.name,found});await page.screenshot({path:`${folder}/${width}x${height}-${f.name}-issue.png`});}
    if((width===390||width===844)&&(!f.name.startsWith('reward-wheel')||f.name==='reward-wheel-3-pass7'))await page.screenshot({path:`${folder}/${width}x${height}-${f.name}.png`});
  }
}
await writeFile(`${folder}/report.json`,JSON.stringify({screens:report.length,report,issues,errors},null,2));console.log(JSON.stringify({screens:report.length,issueScreens:issues.length,examples:issues.slice(0,10),errors},null,2));await browser.close();
if(issues.length||errors.length)process.exitCode=1;
