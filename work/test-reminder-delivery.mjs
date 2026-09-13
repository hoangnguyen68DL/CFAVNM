import assert from 'node:assert/strict';
process.env.REMINDER_TO='learner@example.com';
process.env.RESEND_API_KEY='test-only';
const requests=[];
globalThis.fetch=async(url,options)=>{requests.push(options);return Response.json({id:'mock-email'});};
for(const kind of ['morning','evening']){
 const {default:handler,config}=await import('../netlify/functions/'+kind+'-reminder.mjs');
 assert.equal(config.schedule,kind==='morning'?'30 23 * * *':'0 14 * * *');
 const first=await handler(), second=await handler();
 assert(first instanceof Response);assert.equal(first.status,200);assert.equal(second.status,200);
 const [a,b]=requests.slice(-2);assert.equal(a.headers['Idempotency-Key'],b.headers['Idempotency-Key']);assert.equal(a.body,b.body);
 const {html}=JSON.parse(a.body);assert(html.includes('background:#18233c'));assert(html.includes('Mở kế hoạch học'));assert(!html.includes('Tiến độ hôm nay'));assert(!html.includes('undefined'));assert(!html.includes('NaN'));
}
assert.notEqual(requests[0].headers['Idempotency-Key'],requests[2].headers['Idempotency-Key']);
const {default:send}=await import('../netlify/functions/send-reminder.mjs');
const response=await send(new Request('https://example.com',{method:'POST',body:JSON.stringify({to:'learner@example.com',subject:'Test',html:'<p>Test</p>'})}));
assert(response instanceof Response);assert.equal((await response.json()).ok,true);
globalThis.fetch=async()=>Response.json({message:'Rejected'},{status:422});
const {default:morning}=await import('../netlify/functions/morning-reminder.mjs');
assert.equal((await morning()).status,422);
console.log('PASS: Response contract, preview layout, honest missing progress, distinct schedules, stable retry keys/payloads, provider failure. No emails sent.');
