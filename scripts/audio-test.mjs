import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {bridgeDouble} from './bridge-double.mjs';

const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
  for(const initialEnabled of [false,true]){
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/playgama-bridge.js',route=>route.fulfill({contentType:'application/javascript',body:bridgeDouble({audio:initialEnabled})}));
    await page.goto(process.env.GAME_URL||'http://localhost:5173');
    await page.waitForSelector('#start-button');
    await page.waitForFunction(()=>window.__spa.app.audio.music.readyState>=2);
    const check=async expected=>{
      await page.waitForFunction(wanted=>{
        const a=window.__spa.app.audio;
        return a.audible===wanted&&a.music.muted===!wanted&&a.music.paused===!wanted;
      },expected);
    };
    await check(initialEnabled);
    assert.ok(await page.evaluate(()=>window.__spa.app.audio.music.loop));
    // Host mute is absolute, including repeated local toggles and resume attempts.
    await page.evaluate(()=>host.audio(false));
    for(let i=0;i<4;i++){
      await page.evaluate(()=>{const a=window.__spa.app;a.toggleSound();a.audio.unlock();a.audio.resume();});
      await check(false);
    }
    await page.evaluate(()=>host.audio(true));
    await check(true);
    const time=await page.evaluate(()=>window.__spa.app.audio.music.currentTime);
    await page.waitForFunction(t=>window.__spa.app.audio.music.currentTime>t+.1,time);
    // Unmuting the host must preserve the user's local music-off preference.
    await page.evaluate(()=>window.__spa.app.toggleSound());
    await page.evaluate(()=>{host.audio(false);host.audio(true);host.pause();host.resume();});
    await check(false);
    await page.evaluate(()=>window.__spa.app.toggleSound());
    await check(true);
    await page.evaluate(()=>host.pause());
    await check(false);
    await page.evaluate(()=>{host.audio(false);host.resume();});
    await check(false);
    await page.evaluate(()=>host.audio(true));
    await check(true);
    // Ad completion must not bypass a host mute received during the ad.
    await page.evaluate(()=>{window.adResult=window.__spa.app.platform.rewarded('audio-test');});
    await check(false);
    await page.evaluate(async()=>{host.audio(false);host.finishAd(true);await window.adResult;});
    await check(false);
    await page.evaluate(()=>host.audio(true));
    await check(true);
    // The same music player survives starting a level.
    await page.evaluate(()=>{window.originalMusic=window.__spa.app.audio.music;});
    await page.click('#start-button');
    await page.waitForFunction(()=>window.__spa.app.state==='playing');
    assert.ok(await page.evaluate(()=>window.originalMusic===window.__spa.app.audio.music));
    // Every non-puzzle stage has a mapped effect, and every retained file decodes.
    const inventory=await page.evaluate(async()=>{
      const {LEVELS}=await import('/src/levels.js');
      const {LEVEL_SOUNDS,soundForStep}=await import('/src/level-sounds.js');
      const missing=LEVELS.flatMap(l=>l.steps.filter(s=>s.mode!=='puzzle'&&!soundForStep(s)).map(s=>l.id+':'+s.mechanic));
      const context=new AudioContext();
      const urls=[...new Set(Object.values(LEVEL_SOUNDS))];
      for(const url of urls){const buffer=await context.decodeAudioData(await (await fetch(url)).arrayBuffer());if(!buffer.duration)throw Error(url);}
      await context.close();return {missing,count:urls.length};
    });
    assert.deepEqual(inventory,{missing:[],count:22});
    await page.evaluate(()=>{
      const a=window.__spa.app.audio;
      a.prepareStep({sound:'wipe'});
      a.levelProgress({active:true,stepProgress:.1,mode:'wipe'});
    });
    assert.ok(await page.evaluate(()=>{const a=window.__spa.app.audio;return a.effect&&!a.effect.paused&&!a.effect.muted;}));
    await page.evaluate(()=>host.audio(false));
    for(let i=0;i<4;i++)await page.evaluate(()=>{const a=window.__spa.app;a.toggleSound();a.audio.cue('pencil');});
    assert.ok(await page.evaluate(()=>{const a=window.__spa.app.audio;return [...a.effects.values()].every(p=>p.paused&&p.muted);}));
    await page.evaluate(()=>host.audio(true));
    // Unmute does not replay a stale action.
    assert.ok(await page.evaluate(()=>[...window.__spa.app.audio.effects.values()].every(p=>p.paused)));
    await page.evaluate(()=>{const a=window.__spa.app.audio;a.lastEffect=-Infinity;a.cue('pencil');host.pause();});
    assert.ok(await page.evaluate(()=>[...window.__spa.app.audio.effects.values()].every(p=>p.paused&&p.muted)));
    await page.evaluate(()=>host.resume());
    // Verify a real successful skincare gesture triggers its effect.
    await page.evaluate(()=>{const a=window.__spa.app.audio;a.prepareStep(window.__spa.app.scene.step);a.played=0;const play=a.playEffect.bind(a);a.playEffect=url=>{a.played++;play(url);};});
    const point=await page.evaluate(()=>{const s=window.__spa.app.scene,d=window.__spa.app.pixelRatio,g=s.grid.find(g=>g.v<.8);return {x:(s.root.x+g.x*s.fit)/d,y:(s.root.y+g.y*s.fit)/d};});
    await page.mouse.move(point.x,point.y);await page.mouse.down();await page.waitForTimeout(200);await page.mouse.up();
    assert.ok(await page.evaluate(()=>window.__spa.app.audio.played>0),'Actual level gesture must trigger audio');
    await page.evaluate(()=>window.__spa.app.openPause());
    assert.ok(await page.evaluate(()=>[...window.__spa.app.audio.effects.values()].every(p=>p.paused)));
    await page.evaluate(()=>window.__spa.app.closeModal());
    await check(true);
    // Seek near the end and verify actual looping of the supplied file.
    await page.evaluate(()=>{const m=window.__spa.app.audio.music;m.currentTime=m.duration-.15;});
    await page.waitForFunction(()=>window.__spa.app.audio.music.currentTime<2);
    assert.deepEqual(errors,[]);
    await page.close();
  }
  console.log('PASS: music decodes, plays and loops; initial host mute, local toggles, pause/resume, ads and level transitions; 22 effects decode; all stages mapped; real gesture, SFX mute and pause verified.');
}finally{await browser.close();}
