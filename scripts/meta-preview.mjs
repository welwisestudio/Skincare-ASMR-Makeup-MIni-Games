import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('test-results/meta',{recursive:true});
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const p=await b.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log(e.message);});p.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
await p.goto('http://localhost:5173');await p.waitForSelector('#start-button');
const modes=['levels','rewards','daily','wheel','boxes','coins','shop','purchase','cards','card-detail','pass','items','help','modes','mode-offer','bonus','reward','ad','playing','pause','result'];
for(const [label,width,height] of [['phone',390,844],['wide',844,390],['square',876,876]]){
 await p.setViewportSize({width,height});
 for(const mode of modes){
  await p.evaluate(async mode=>{const a=window.__spa.app;a.metaStack=[];a.metaData={index:2,id:'bubbles',kind:'hint'};a.bonus={id:'bubbles',popped:[],stacked:0,finished:false,start:performance.now()};
   if(mode==='card-detail')a.metaData.id='fresh';
   if(mode==='reward')a.metaData={title:'A lovely surprise',rewards:[{coins:200,boxes:1}],art:'grand-bundle',extra:'Your new treats are ready.'};
   if(['playing','pause','result'].includes(mode)){await a.start(0);if(mode==='result')a.completed(0,25);a.freeze();}
   a.ui.show(mode);
  },mode);
  await p.waitForTimeout(650);await p.screenshot({path:`test-results/meta/${label}-${mode}.png`});
 }
}
await writeFile('test-results/meta/preview-errors.json',JSON.stringify(errors));await b.close();if(errors.length)throw Error(errors.join('\n'));console.log('63 monetization and game previews captured.');
