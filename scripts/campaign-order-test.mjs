import {ECONOMY} from '../src/economy.js';
import assert from 'node:assert/strict';
import {LEVELS,LEVEL_ORDER,V4_LEVEL_ORDER,V5_LEVEL_ORDER,LEGACY_LEVEL_ORDER,levelNumber,nextLevelIndex} from '../src/levels.js';
import {freshSave,normalizeSave,unlocked,reward} from '../src/save.js';
import {LEVEL_PRICES} from '../src/meta-content.js';
assert.equal(LEVELS.length,58);
assert.deepEqual([...LEVEL_ORDER].sort((a,b)=>a-b),LEVELS.map((_,i)=>i));
assert.equal(new Set(LEGACY_LEVEL_ORDER.slice(0,10).map(i=>LEVELS[i].puzzle||LEVELS[i].steps[0].mechanic)).size,10);
const save=freshSave();
for(const [position,index] of LEVEL_ORDER.entries()){
 assert.equal(levelNumber(index),position+1);assert.equal(nextLevelIndex(index),LEVEL_ORDER[position+1]);
 if(LEVELS[index].premium){assert.ok(!unlocked(save,index));save.premiumUnlocked.push(index);assert.equal(LEVEL_PRICES[index],0);}
 else if(LEVELS[index].free){assert.equal(LEVEL_PRICES[index],0);}
 else{const n=LEVEL_ORDER.filter(i=>!LEVELS[i].premium&&!LEVELS[i].free).indexOf(index);assert.equal(LEVEL_PRICES[index],n?Math.min(ECONOMY.unlock.max,ECONOMY.unlock.base+n*ECONOMY.unlock.step):0);}
 assert.ok(unlocked(save,index));assert.equal(reward(save,index,3),75);
}
assert.equal(unlocked(save,-1),false);assert.equal(unlocked(save,LEVELS.length),false);
for(let frontier=0;frontier<=42;frontier++){
 const stars=Array(42).fill(0);for(const i of LEGACY_LEVEL_ORDER.slice(0,frontier))stars[i]=3;
 const old={version:3,levelOrderVersion:3,stars,purchased:[31,40],coins:715};
 const migrated=normalizeSave(old);assert.deepEqual(migrated.stars.slice(0,42),stars);assert.equal(migrated.coins,715);
 for(const i of LEGACY_LEVEL_ORDER.slice(0,Math.min(42,frontier+1)))assert.ok(unlocked(migrated,i));
 for(let i=42;i<54;i++)assert.ok(!unlocked(migrated,i));
 assert.deepEqual(normalizeSave(migrated),migrated);
}
assert.deepEqual(normalizeSave(freshSave()),freshSave());
console.log('PASS: 58 unique levels, 12 gated VIP chapters, current-route prices, progression, legacy saves and reload stability');

assert.equal(LEVEL_ORDER[3],57);
assert.equal(LEVEL_ORDER[57],6);
assert.equal(LEVEL_ORDER[28],42);
for(let position=0;position<V4_LEVEL_ORDER.length;position++)if(![3,28,57].includes(position))assert.equal(LEVEL_ORDER[position],V4_LEVEL_ORDER[position]);
for(const premiumStatus of ['premiumUnlocked','premiumSkipped']){
 const old={...freshSave(),levelOrderVersion:4,coins:3542,[premiumStatus]:[42]};old.stars[13]=3;
 const migrated=normalizeSave(old);
 assert.ok(unlocked(migrated,6));assert.deepEqual(migrated[premiumStatus],[42]);
 assert.deepEqual(migrated.stars,old.stars);assert.equal(migrated.coins,3542);
 assert.deepEqual(normalizeSave(migrated),migrated);
}
console.log('PASS: prior 4/29 route retained with 4/58 swap, v4 access and VIP status retained');

for(let frontier=0;frontier<58;frontier++){
 const old={...freshSave(),levelOrderVersion:5};
 for(const index of V5_LEVEL_ORDER.slice(0,frontier))old.stars[index]=3;
 const migrated=normalizeSave(old);
 for(const index of V5_LEVEL_ORDER)if(!LEVELS[index].premium&&(LEVELS[index].free||V5_LEVEL_ORDER.indexOf(index)===0||old.stars[index]>0||old.stars[V5_LEVEL_ORDER.slice(0,V5_LEVEL_ORDER.indexOf(index)).reverse().find(i=>!LEVELS[i].premium)]>0||old.stars[V5_LEVEL_ORDER[V5_LEVEL_ORDER.indexOf(index)-1]]>0))assert.ok(unlocked(migrated,index));
 assert.deepEqual(migrated.stars,old.stars);
 assert.deepEqual(normalizeSave(migrated),migrated);
}
console.log('PASS: slots 4/58 swapped and v5 progress retained');
