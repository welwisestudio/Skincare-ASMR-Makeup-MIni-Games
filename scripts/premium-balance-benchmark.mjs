import {chromium} from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const p=await b.newPage();
try{
await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');await p.evaluate(()=>{const a=window.__spa.app;a.audio.enabled=false;a.save.purchased=Array.from({length:54},(_,i)=>i);a.save.premiumUnlocked=Array.from({length:12},(_,i)=>42+i);});const reports=[];
for(const index of [0,4,42,43,46,47,48,50,52,53]){
 const report=await p.evaluate(async index=>{const a=window.__spa.app;await a.start(index);const s=a.scene;s.frozen=true;let seconds=0;const steps=[];const speed=600;
 for(let step=0;step<s.level.steps.length;step++){
  s.stepIndex=step;s.nextStep();let time=0,actions=0;
  if(s.premiumRitual){const q=s.premiumRitual;q.update(1);const drag=(t,to)=>{q.down({...t});q.move(to);q.up(to);time+=Math.hypot(t.home.x-to.x,t.home.y-to.y)/speed+.3;actions++;};
   if(q.mode==='pickup')while(q.litter.some(t=>!t.done)&&actions<20)drag(q.litter.find(t=>!t.done),{x:470,y:590});
   if(q.mode==='arrange')for(const t of q.items)drag(t,t.target);
   if(q.mode==='vacuum'&&!q.cells.length){let pos={x:450,y:550};while(q.crumbs.some(t=>!t.done)){const t=q.crumbs.filter(t=>!t.done).sort((a,b)=>Math.hypot(a.x-pos.x,a.y-pos.y)-Math.hypot(b.x-pos.x,b.y-pos.y))[0],to={x:t.x,y:t.y};q.down(pos);q.move(to);q.up(to);time+=Math.hypot(to.x-pos.x,to.y-pos.y)/speed+.12;pos=to;actions++;if(actions>100)throw Error('vacuum stuck');}}
   if(q.cells.length){const radius=q.brushRadius??(q.mode==='glass'?40:27),b=q.bounds,vertical=q.mode==='groom',spacing=radius*1.2;let pos={x:510,y:560};for(let pass=0;pass<5&&s.stepProgress<1;pass++){
    for(let v=(vertical?b.x:b.y)+spacing/2;v<(vertical?b.x+b.w:b.y+b.h)&&s.stepProgress<1;v+=spacing){const cells=q.cells.filter(t=>t.v<.99&&Math.abs((vertical?t.x:t.y)-v)<spacing/2);if(!cells.length)continue;const values=cells.map(t=>vertical?t.y:t.x),min=Math.min(...values),max=Math.max(...values),from=vertical?{x:v,y:min-5}:{x:min-5,y:v},to=vertical?{x:v,y:max+5}:{x:max+5,y:v};q.stroke(from,to,Math.hypot(to.x-from.x,to.y-from.y));time+=(Math.hypot(from.x-pos.x,from.y-pos.y)+Math.hypot(to.x-from.x,to.y-from.y))/speed+.12;pos=to;actions++;}
   }for(let n=0;n<100&&s.stepProgress<1;n++){const t=q.cells.filter(c=>c.v<.99).sort((a,b)=>a.v-b.v)[0];if(!t)break;const from={x:t.x,y:t.y-5},to={x:t.x,y:t.y+10};q.stroke(from,to,15);time+=(Math.hypot(from.x-pos.x,from.y-pos.y)+15)/speed+.12;pos=to;actions++;}}if(s.stepProgress<.999)throw Error(index+' '+step+' '+s.stepProgress);q.finish();q.update(1);time+=.85;
  }else{
   if(['paint','wipe'].includes(s.mode)){
    let pos={x:450,y:500},iterations=0;
    while(s.stepProgress<.94&&iterations++<1400){const r=s.step.brush*1.2,cells=s.grid.filter(t=>t.v<.98);let best=cells[0],score=-1;for(const c of cells){let sum=0;for(const t of cells)if(Math.hypot(c.x-t.x,c.y-t.y)<r)sum+=1-t.v;if(sum>score){score=sum;best=c;}}
     const travel=Math.hypot(best.x-pos.x,best.y-pos.y)/speed,n=Math.max(1,Math.ceil(travel/.05));for(let i=1;i<=n&&s.stepProgress<.94;i++){s.local={x:pos.x+(best.x-pos.x)*i/n,y:pos.y+(best.y-pos.y)*i/n};s.paint(travel/n);time+=travel/n;}pos={x:best.x,y:best.y};
     for(let i=0;i<3&&s.stepProgress<.94;i++){s.local=pos;s.paint(.05);time+=.05;}actions++;
    }
   }else if(s.mode==='dab'){for(const t of s.targets){s.local={x:t.x,y:t.y};time+=.15;while(!t.done){s.interactTargets(.05);time+=.05;}}}
   else if(s.mode==='peel'){for(const t of s.targets){s.drag=t;s.dragStart={x:t.x,y:t.y};s.local={x:t.x,y:t.y+160};s.interactTargets(.05);time+=160/speed+.15;}}
   if(s.stepProgress<.94)throw Error('face stuck '+index+' '+step);time+=.42;
  }
  steps.push({step,mode:s.premiumRitual?.mode||s.mode,seconds:+time.toFixed(1),actions});seconds+=time;
 }
 return{index,name:s.level.name,seconds:+seconds.toFixed(1),steps};},index);
 reports.push(report);console.log(report.name,report.seconds);if((process.env.BALANCE_LABEL||'after')==='after'&&index>=42)assert.ok(report.seconds>=15&&report.seconds<=36,`Pacing outlier: ${report.name} ${report.seconds}s`);
}
fs.mkdirSync('test-results/balance',{recursive:true});fs.writeFileSync(`test-results/balance/${process.env.BALANCE_LABEL||'after'}.json`,JSON.stringify({method:'Fixed 600 scene-unit/sec gestures, .15s targeting, measured engine coverage. Model estimate, not human telemetry.',reports},null,2));
}finally{await b.close();}
