const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('work/study-preservation.js','utf8');
const pomo={mode:'focus',remaining:1920000,end:1770000000000,checkpoint:1769998080000,rounds:2,moduleId:'module-67'};
const meta={totalDays:25,weakTopics:[],charterPrep:{curriculum:[{id:'m_custom',name:'Custom module',topic:'CUSTOM',day:1}]}};
const store=new Map([
 ['cfa-meta',JSON.stringify(meta)],
 ['cfa-progress',JSON.stringify({m_custom:true})],
 ['cfa-timelog',JSON.stringify({'2026-09-12':0})],
 ['cfa-sessions',JSON.stringify([{date:'2026-09-12',startHour:10,minutes:70},{date:'2026-09-12',startHour:12,minutes:35}])],
 ['charter-pomo-v2',JSON.stringify(pomo)]
]);
const launch=()=>{const context={window:{},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};vm.runInNewContext(source,context);return context};
let context=launch();
assert.equal(JSON.parse(store.get('cfa-timelog'))['2026-09-12'],105);
assert.equal(context.window.StudyPreservation.recoveredMinutes,105);
const backupKey=[...store.keys()].find(k=>k.startsWith('charter-study-backup-')),backup=JSON.parse(store.get(backupKey));
assert.deepEqual(JSON.parse(backup.data['charter-pomo-v2']),pomo);
assert(JSON.parse(store.get('charter-study-snapshot-v2')).data['cfa-meta']);
for(const key of ['cfa-meta','cfa-progress','charter-pomo-v2'])store.delete(key);
context=launch();
assert(context.window.__charterRecoveredSnapshot);
assert.equal(JSON.parse(store.get('cfa-meta')).charterPrep.curriculum[0].name,'Custom module');
assert.equal(JSON.parse(store.get('cfa-progress')).m_custom,true);
assert.deepEqual(JSON.parse(store.get('charter-pomo-v2')),pomo);
assert.equal(JSON.parse(store.get('cfa-timelog'))['2026-09-12'],105);
assert.equal(context.window.StudyPreservation.mergeTime({'2026-09-12':105},{'2026-09-12':10})['2026-09-12'],105);
console.log('PASS: restore time, custom curriculum, progress and active Pomodoro state after a deployment-style data reset.');
