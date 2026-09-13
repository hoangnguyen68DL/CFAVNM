(()=>{
const keys=['cfa-progress','cfa-studylog','cfa-timelog','cfa-sessions','cfa-cp-session','cfa-timer-start','cfa-meta'];
function backup(){try{const data={};for(const key of keys){const value=localStorage.getItem(key);if(value!==null)data[key]=value}if(Object.keys(data).length)localStorage.setItem('charter-study-backup-'+Date.now(),JSON.stringify({at:new Date().toISOString(),data}))}catch{}}
function mergeTime(local,remote){const result={...local};for(const [day,min]of Object.entries(remote||{})){if(Number.isFinite(min)&&min>=0)result[day]=Math.max(Number(result[day])||0,min)}return result}
function mergeSessions(local,remote){const result=[...(local||[])],counts=new Map();for(const x of result){const key=JSON.stringify(x);counts.set(key,(counts.get(key)||0)+1)}const seen=new Map();for(const x of remote||[]){const key=JSON.stringify(x),n=(seen.get(key)||0)+1;seen.set(key,n);if(n>(counts.get(key)||0))result.push(x)}return result}
window.StudyPreservation={backup,mergeTime,mergeSessions};backup();
try{
 const parse=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
 const current=parse('cfa-timelog',{}),archive=parse('charter-study-hours-archive',{}),fromSessions={};
 for(const entry of parse('cfa-sessions',[])){if(/^\d{4}-\d{2}-\d{2}$/.test(entry.date)&&Number.isFinite(entry.minutes)&&entry.minutes>0)fromSessions[entry.date]=(fromSessions[entry.date]||0)+entry.minutes}
 const restored=mergeTime(mergeTime(current,archive),fromSessions);
 const recovered=Object.entries(restored).reduce((sum,[day,min])=>sum+Math.max(0,min-(current[day]||0)),0);
 if(recovered>0){localStorage.setItem('cfa-timelog',JSON.stringify(restored));window.StudyPreservation.recoveredMinutes=recovered}
 localStorage.setItem('charter-study-hours-archive',JSON.stringify(restored));
}catch{}

})();