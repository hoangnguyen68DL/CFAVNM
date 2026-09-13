import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
import { dayAt,due } from './reminder-core.mjs';
import { CharterEmailTemplate } from './email-template.mjs';
export async function run(kind){
 const store=getStore({name:'charterprep-reminders',consistency:'strong'}),p=await store.get('settings',{type:'json'}),now=new Date();
 if(!p||!due(p,kind,now))return new Response(null,{status:204});
 const date=dayAt(now,p.timezone),key='delivery/'+date+'/'+kind;
 let job=await store.get(key,{type:'json'});
 if(job?.sent)return new Response(null,{status:204});
 if(!job){
 const selected=p.planDate===date&&p.selected.length?p.selected:p.upcoming.slice(0,p.goal.target);
 const goal=p.goal.date===date?p.goal:{date,target:selected.length,completed:0,shortfall:selected.length};
 const subject='CharterPrep · '+(kind==='morning'?'Today’s study plan':'Daily study recap')+' · '+date;
 const tomorrowPlan=kind==='evening'&&p.planDate===dayAt(new Date(+now+86400000),p.timezone)&&p.selected.length;
 const html=CharterEmailTemplate({kind,language:'en',name:p.name,subject,goal,modules:tomorrowPlan?p.selected:selected,program:p.program,studyMinutes:p.studyMinutes});
 const draft={to:p.email,subject,html,from:process.env.RESEND_FROM||'CharterPrep <onboarding@resend.dev>'};
 await store.setJSON(key,draft,{onlyIfNew:true});job=await store.get(key,{type:'json'});
 }
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'charterprep/'+kind+'/'+date+'/'+createHash('sha256').update(job.to).digest('hex').slice(0,24)},body:JSON.stringify({from:job.from,to:[job.to],subject:job.subject,html:job.html})});
 const result=await response.json();if(!response.ok)return Response.json({error:result.message},{status:response.status});
 await store.setJSON(key,{...job,sent:true,id:result.id});return Response.json({ok:true});
}

