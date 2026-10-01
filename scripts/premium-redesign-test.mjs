import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const p=await b.newPage({viewport:{width:454,height:886}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');await p.evaluate(()=>{const a=window.__spa.app;a.audio.enabled=false;a.save.premiumUnlocked=Array.from({length:12},(_,i)=>42+i);a.save.premiumSkipped=[];});
for(const index of [42,43,44,46,48,49,50,53]){
 const steps=await p.evaluate(async index=>{const a=window.__spa.app;await a.start(index);a.scene.frozen=true;return a.scene.level.steps.length},index);
 for(let step=0;step<steps;step++){
 const result=await p.evaluate(step=>{const s=window.__spa.app.scene;s.stepIndex=step;s.nextStep();const q=s.premiumRitual;
 const drag=(t,to,via)=>{q.down({...t});if(via)q.move(via);q.move(to);q.up(to);};
 const initial=s.stepProgress;q.down({x:300,y:350});q.update(10);q.up({x:300,y:350});if(s.stepProgress!==initial)throw Error('Stationary auto completion');
 if(q.mode==='pickup')for(const t of [...q.litter].reverse())drag(t,{x:470,y:590});
 if(q.mode==='vacuum')for(const t of q.crumbs.filter(t=>!t.done)){q.down({x:t.x-20,y:t.y});q.move({x:t.x+20,y:t.y});q.up({x:t.x+20,y:t.y});}
 let passes=0;
 if(q.cells.length){
  for(;passes<5&&s.stepProgress<1;passes++){
   if(q.mode==='groom'){for(let x=q.bounds.x+5;x<q.bounds.x+q.bounds.w;x+=11)q.stroke({x,y:q.bounds.y},{x,y:q.bounds.y+q.bounds.h},q.bounds.h);}
   else for(let y=q.bounds.y+5;y<q.bounds.y+q.bounds.h;y+=11)q.stroke({x:q.bounds.x,y},{x:q.bounds.x+q.bounds.w,y},q.bounds.w);
  }
  q.draw();
 }
 if(q.mode==='shop'){
  // Reject a second item of one category, and support returning an item.
  drag(q.items[0],{x:140,y:512});drag(q.items[1],{x:300,y:512});if(q.items.filter(t=>t.selected).length!==1)throw Error('Duplicate category accepted');
  drag(q.items[0],{...q.items[0].home});if(q.items.some(t=>t.selected))throw Error('Cannot return item');
  // Most expensive selections exceed the budget; at least one must be rejected.
  for(let category=0;category<4;category++)drag(q.items.filter(t=>t.category===category).sort((a,b)=>b.price-a.price)[0],{x:300,y:512});
  if(q.items.filter(t=>t.selected).length===4)throw Error('Over budget accepted');
  for(const t of q.items.filter(t=>t.selected))drag(t,{...t.home});
  for(let category=0;category<4;category++)drag(q.items.filter(t=>t.category===category).sort((a,b)=>a.price-b.price)[0],{x:300,y:512});
 }
 if(q.mode==='checkout'){
  drag(q.items[0],{x:465,y:550},{x:500,y:145});if(q.items[0].done)throw Error('Unscanned purchase accepted');
  const first=q.items[0];q.down(first);q.move({x:300,y:260});q.move({x:300,y:410});if(!first.scanned)throw Error('Fast scanner crossing ignored');q.up({x:465,y:550});for(const t of [...q.items].reverse().filter(t=>!t.done))drag(t,{x:465,y:550},{x:300,y:330});
 }
 if(q.mode==='arrange'||q.mode==='pack'){
  const t=q.items[0];drag(t,{x:65,y:30});if(t.done)throw Error('Wrong slot accepted');
  for(const t of [...q.items].reverse())drag(t,{...t.target});
 }
 const out={mode:q.mode,progress:s.stepProgress,passes,remaining:q.cells.filter(t=>t.v<.95).length};q.finish();return out;},step);
 assert.ok(result.progress>=.999,`${index} ${step}: ${JSON.stringify(result)}`);
 console.log(index,step,result.mode,'complete',result.passes);
 if(index===42&&(step===0||step===3||step===6))await p.screenshot({path:`test-results/premium-redesign/jet-step-${step}.png`});
 if(index===43&&step===4)await p.screenshot({path:'test-results/premium-redesign/rug-complete.png'});
 }
}
for(const index of [45,51]){
 await p.evaluate(async index=>{const a=window.__spa.app;await a.start(index);a.scene.frozen=true;},index);
 for(const step of [3,4]){
 const progress=await p.evaluate(step=>{const s=window.__spa.app.scene;s.stepIndex=step;s.nextStep();const r=s.romance;for(const path of r.paths){r.down(path.points[0]);for(const pt of path.points)r.move(pt);r.up(path.points.at(-1));}return s.stepProgress;},step);assert.ok(progress>.999);
 }
 await p.evaluate(()=>{const s=window.__spa.app.scene;s.stepIndex=6;s.nextStep();s.romance.slide({x:532.5,y:506});});await p.screenshot({path:`test-results/premium-redesign/outfit-${index}.png`});
}
for(const index of [47,52]){
 const report=await p.evaluate(async index=>{const a=window.__spa.app;await a.start(index);const s=a.scene;s.frozen=true;const out=[];for(let step=0;step<s.level.steps.length;step++){s.stepIndex=step;s.nextStep();if(['paint','wipe'].includes(s.mode)){for(let n=0;n<12;n++)for(const cell of s.grid.filter(g=>g.v<1)){s.local={x:cell.x,y:cell.y};s.paint(.2);}}else if(s.mode==='dab'){for(const t of s.targets){s.local={x:t.x,y:t.y};s.interactTargets(s.step.seconds/s.targets.length+1);}}else if(s.mode==='peel'){for(const t of s.targets){s.drag=t;s.dragStart={x:t.x,y:t.y};s.local={x:t.x,y:t.y+500};s.interactTargets(.05);}}out.push({step,mode:s.mode,progress:s.stepProgress});}return out;},index);
 for(const r of report)assert.ok(r.progress>=.99,`${index} ${JSON.stringify(r)}`);console.log('10 facial steps completed',index);await p.screenshot({path:`test-results/premium-redesign/makeup-${index}.png`});
}
assert.deepEqual(errors,[]);console.log('PASS: cleaning coverage, ordered fabric finishing, shopping budget/returns/scanning/packing, 20 facial stages, no stationary cleaning');
}finally{await b.close();}
