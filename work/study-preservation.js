(()=>{
const keys=['cfa-progress','cfa-studylog','cfa-timelog','cfa-sessions','cfa-cp-session','cfa-timer-start','cfa-meta','cfa-schedule','cfa-reviewed','cfa-mocktests','cfa-difficulty','cfa-journal','cfa-milestones','cfa-videolinks','charter-pomo-v2','charter-study-hours-archive','charterprep.formulaLibrary.v2','charterprep.mockLibrary.v2'];
const snapshotKey='charter-study-snapshot-v2';
const read=key=>{try{return localStorage.getItem(key)}catch{return null}};
const parse=(key,fallback)=>{try{return JSON.parse(read(key))||fallback}catch{return fallback}};
function collect(){const data={};for(const key of keys){const value=read(key);if(value!==null)data[key]=value}return data}
function validatePortable(data){if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Bản sao thiết bị không hợp lệ.');for(const [key,value]of Object.entries(data)){if(!keys.includes(key)||typeof value!=='string')throw Error('Bản sao thiết bị chứa dữ liệu không hợp lệ.');try{JSON.parse(value)}catch{if(key!=='cfa-timer-start')throw Error('Bản sao thiết bị bị lỗi.')}}return data}
function saveSnapshot(){try{const data=collect();if(Object.keys(data).length)localStorage.setItem(snapshotKey,JSON.stringify({version:2,at:new Date().toISOString(),data}));return data}catch{return{}}}
function restorePortable(data){validatePortable(data);for(const [key,value]of Object.entries(data))localStorage.setItem(key,value);saveSnapshot()}
function recover(){try{const saved=JSON.parse(read(snapshotKey)||'null');if(saved?.version!==2||!saved.data)return;validatePortable(saved.data);const currentMeta=parse('cfa-meta',null),savedMeta=JSON.parse(saved.data['cfa-meta']||'null'),lostCore=!currentMeta||read('cfa-progress')===null,lostCurriculum=Array.isArray(savedMeta?.charterPrep?.curriculum)&&!Array.isArray(currentMeta?.charterPrep?.curriculum);if(lostCore||lostCurriculum){for(const [key,value]of Object.entries(saved.data))if(read(key)===null||lostCurriculum&&key==='cfa-meta')localStorage.setItem(key,value);window.__charterRecoveredSnapshot=true}}catch{}}
function backup(){try{const data=saveSnapshot();if(Object.keys(data).length)localStorage.setItem('charter-study-backup-'+Date.now(),JSON.stringify({at:new Date().toISOString(),data}))}catch{}}
function mergeTime(local,remote){const result={...local};for(const [day,min]of Object.entries(remote||{})){if(Number.isFinite(min)&&min>=0)result[day]=Math.max(Number(result[day])||0,min)}return result}
function mergeSessions(local,remote){const result=[...(local||[])],counts=new Map();for(const x of result){const key=JSON.stringify(x);counts.set(key,(counts.get(key)||0)+1)}const seen=new Map();for(const x of remote||[]){const key=JSON.stringify(x),n=(seen.get(key)||0)+1;seen.set(key,n);if(n>(counts.get(key)||0))result.push(x)}return result}
recover();
window.StudyPreservation={backup,saveSnapshot,portable:collect,restorePortable,validatePortable,mergeTime,mergeSessions};backup();
try{
 const current=parse('cfa-timelog',{}),archive=parse('charter-study-hours-archive',{}),fromSessions={};
 for(const entry of parse('cfa-sessions',[])){if(/^\d{4}-\d{2}-\d{2}$/.test(entry.date)&&Number.isFinite(entry.minutes)&&entry.minutes>0)fromSessions[entry.date]=(fromSessions[entry.date]||0)+entry.minutes}
 const restored=mergeTime(mergeTime(current,archive),fromSessions);
 const recovered=Object.entries(restored).reduce((sum,[day,min])=>sum+Math.max(0,min-(current[day]||0)),0);
 if(recovered>0){localStorage.setItem('cfa-timelog',JSON.stringify(restored));window.StudyPreservation.recoveredMinutes=recovered}
 localStorage.setItem('charter-study-hours-archive',JSON.stringify(restored));saveSnapshot();
}catch{}
if(typeof setInterval==='function')setInterval(saveSnapshot,10000);
if(typeof addEventListener==='function')addEventListener('pagehide',saveSnapshot);
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.hidden)saveSnapshot()});
})();
