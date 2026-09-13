const fs=require('node:fs');
const p='work/email-settings.js';let s=fs.readFileSync(p,'utf8');
s=s.replace("manageInput.value=sessionStorage.getItem('reminder-edit-key')||'';",`try{manageInput.value=localStorage.getItem('reminder-edit-key')||sessionStorage.getItem('reminder-edit-key')||''}catch{}
manage.id='reminderAccess';
function rememberAccess(){try{localStorage.setItem('reminder-edit-key',manageInput.value.trim())}catch{}manage.hidden=true;manage.style.display='none';}
function showAccess(){manage.hidden=false;manage.style.display='';}
const changeAccess=document.createElement('button');changeAccess.type='button';changeAccess.className='btn ghost';changeAccess.textContent='Đổi mã kết nối';changeAccess.onclick=()=>{showAccess();manageInput.focus()};$('emailSettingsForm').append(changeAccess);`);
s=s.replace("sessionStorage.setItem('reminder-edit-key',manageInput.value.trim());",'rememberAccess();');
s=s.replace("const result=await response.json();if(!response.ok)throw Error(result.error||'Chưa lưu được lịch lên máy chủ.');", "const result=await response.json();if(response.status===401){showAccess();try{localStorage.removeItem('reminder-edit-key')}catch{}}if(!response.ok)throw Error(result.error||'Chưa lưu được lịch lên máy chủ.');");
s=s.replace("loadSchedule.textContent='Tải lịch đã lưu';", "loadSchedule.textContent='Kết nối';");
s=s.replace('const d=await r.json();if(!r.ok)throw Error(d.error);', 'const d=await r.json();if(!r.ok){showAccess();throw Error(d.error)}rememberAccess();');
const pos=s.lastIndexOf('})();');
s=s.slice(0,pos)+`// Validate remembered access on reload without replacing edits made while loading.
if(manageInput.value&&location.protocol!=='file:'){
 const before=JSON.stringify(readForm());
 fetch('/.netlify/functions/reminder-settings',{headers:{Authorization:'Bearer '+manageInput.value.trim()}}).then(async r=>{
 const d=await r.json();if(!r.ok){showAccess();return;}rememberAccess();
 if(d.settings&&JSON.stringify(readForm())===before){const p=d.settings;storedPlanDate=p.planDate;
 $('emailTomorrowModules').querySelectorAll('option').forEach(o=>o.selected=false);
 fill({...p,tomorrowModuleIds:p.planDate===onlinePayload(readForm()).planDate?p.selected.map(m=>m.id):[]});saved=validate(readForm());onlineEnabled=true;
 $('emailSettingsStatus').textContent='Đã kết nối lịch tự động. Chọn lịch và bấm Lưu tuỳ chọn để cập nhật.';
 }
 }).catch(()=>{});
}
`+s.slice(pos);
fs.writeFileSync(p,s);
const a=s.indexOf('const manage=document.createElement'),b=s.lastIndexOf('})();');
fs.writeFileSync('work/email-online-fragment.js',s.slice(a,b));
