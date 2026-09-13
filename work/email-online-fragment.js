let onlineEnabled=false,savingOnline=false,storedPlanDate=null;
function onlinePayload(p){
 const goal=DailyModuleGoal.metrics(),tomorrow=new Date(goal.date+'T12:00:00Z');tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
 const items=MODULES.filter(m=>!progress[m.id]).sort((a,b)=>effectiveDay(a)-effectiveDay(b)||a.id.localeCompare(b.id));
 const selected=items.filter(m=>p.tomorrowModuleIds.includes(m.id)),completed=Object.values(progress).filter(Boolean).length,moduleMinutes=Math.max(10,Number(meta.charterPrep?.planning?.moduleMinutes)||45);
 return {...p,language:'en',name:meta.charterPrep?.candidate||'there',goal,planDate:tomorrow.toISOString().slice(0,10),selected,upcoming:items,program:{completed,total:MODULES.length},studyMinutes:Math.min(selected.length||goal.target,goal.target||selected.length)*moduleMinutes};
}
async function saveOnline(explicit){
 if(savingOnline)return;savingOnline=true;
 try{
 if(location.protocol==='file:')throw Error('Mở web online để lưu lịch gửi tự động.');

 const p=validate(readForm());
 const response=await fetch('/.netlify/functions/reminder-settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...onlinePayload(p),planDate:explicit?onlinePayload(p).planDate:(storedPlanDate||onlinePayload(p).planDate)})});
 const result=await response.json();if(!response.ok)throw Error(result.error||'Chưa lưu được lịch lên máy chủ.');
 localStorage.setItem(key,JSON.stringify(p));saved=p;storedPlanDate=explicit?onlinePayload(p).planDate:(storedPlanDate||onlinePayload(p).planDate);onlineEnabled=true;
 $('emailSettingsError').textContent='';$('emailSettingsStatus').textContent='Đã lưu lịch và module lên máy chủ. '+(p.morning||p.evening?'Email sẽ gửi theo giờ và ngày bạn chọn.':'Đã tắt nhắc email tự động.');
 }catch(e){$('emailSettingsError').textContent=e.message;if(explicit)onlineEnabled=false;}finally{savingOnline=false;}
}
// Refresh progress while the app is open, without silently saving unsaved form changes.
setInterval(()=>{if(onlineEnabled&&saved&&JSON.stringify(validateSafe())===JSON.stringify(saved))saveOnline(false)},60000);
function validateSafe(){try{return validate(readForm())}catch{return null}}
// Load saved settings without replacing edits made while loading.
if(location.protocol!=='file:'){
 const before=JSON.stringify(readForm());
 fetch('/.netlify/functions/reminder-settings').then(async r=>{
 const d=await r.json();if(!r.ok){return;}
 if(d.settings&&JSON.stringify(readForm())===before){const p=d.settings;storedPlanDate=p.planDate;
 $('emailTomorrowModules').querySelectorAll('option').forEach(o=>o.selected=false);
 fill({...p,tomorrowModuleIds:p.planDate===onlinePayload(readForm()).planDate?p.selected.map(m=>m.id):[]});saved=validate(readForm());onlineEnabled=true;
 $('emailSettingsStatus').textContent='Đã kết nối lịch tự động. Chọn lịch và bấm Lưu tuỳ chọn để cập nhật.';
 }
 }).catch(()=>{});
}
