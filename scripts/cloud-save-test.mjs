import assert from 'node:assert/strict';
import {parseCloudSave,loadSave} from '../src/save.js';

for(const raw of ['', '  ', '{}', 'null'])assert.equal(parseCloudSave(raw).coins,0);
for(const version of [undefined,1,2,3]){
 const s=parseCloudSave(JSON.stringify({version,stars:[3,2],coins:123,hints:4,sound:false}));
 assert.equal(s.version,3);assert.equal(s.coins,123);assert.equal(s.hints,4);assert.equal(s.sound,false);assert.deepEqual(s.stars.slice(0,2),[3,2]);
}
for(const raw of ['{bad json','[]','false','{"coins":123}','{"version":99,"stars":[3]}'])assert.throws(()=>parseCloudSave(raw));
let accepted=0;
const platform={load:async()=>'{bad json',acceptLoad(){accepted++;}};
await assert.rejects(loadSave(platform));assert.equal(accepted,0);
platform.load=async()=>{throw Error('SDK unavailable');};await assert.rejects(loadSave(platform));assert.equal(accepted,0);
platform.load=async()=>'{}';await loadSave(platform);assert.equal(accepted,1);
console.log('PASS: empty and legacy cloud saves, migration preserves progress, failed/invalid reads never authorize writes');
