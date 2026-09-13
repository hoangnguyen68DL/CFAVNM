import { getStore } from '@netlify/blobs';
import { validateSettings } from '../lib/reminder-core.mjs';
export default async request=>{
 const store=getStore({name:'charterprep-reminders',consistency:'strong'});
 if(request.method==='GET')return Response.json({settings:await store.get('settings',{type:'json'})});
 if(request.method!=='POST')return new Response(null,{status:405});
 try{
 const raw=await request.text();if(raw.length>200000)return new Response(null,{status:413});
 const p=validateSettings(JSON.parse(raw));
 const recipient=String(process.env.REMINDER_TO||'').trim().toLowerCase();
 if(!recipient||p.email!==recipient)return Response.json({error:'Email nhận phải trùng với REMINDER_TO đã đặt trên Netlify.'},{status:400});
 await store.setJSON('settings',p);
 return Response.json({ok:true,updatedAt:p.updatedAt});
 }catch(e){return Response.json({error:e.message||'Chưa lưu được lịch.'},{status:400});}
};
