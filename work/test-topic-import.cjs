const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('assert/strict');
const key='charterprep.mockLibrary.v2';
function boot(entries=[]){
 const w=new JSDOM('<section id="ux-page-mocks"></section>',{url:'https://topics.test',runScripts:'outside-only'}).window;
 w.confirm=()=>true;w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 w.localStorage.setItem(key,JSON.stringify(entries));w.eval(fs.readFileSync('work/mock-results.js','utf8'));w.eval(fs.readFileSync('work/mock-room.js','utf8'));return w;
}
const q=(fields={})=>({stem:'A sample question?',options:[{label:'A',text:'One'},{label:'B',text:'Two'},{label:'C',text:'Three'}],correctAnswer:'A',...fields});
async function upload(w,bank,practiceSubject){
 const d=w.document;
 d.querySelector('[data-import-type="'+(practiceSubject?'practice':'mock')+'"]').click();
 d.getElementById('mockImportName').value=bank.title;
 if(practiceSubject){d.getElementById('practiceSubject').value=practiceSubject;d.getElementById('practiceIssuer').value=bank.title}
 d.getElementById('mockImportChoose').click();
 const input=d.getElementById('mockRoomImport');Object.defineProperty(input,'files',{configurable:true,value:[{text:async()=>JSON.stringify(bank)}]});
 await input.onchange({target:input});return JSON.parse(w.localStorage.getItem(key)).at(-1);
}
(async()=>{
 const w=boot();
 let entry=await upload(w,{title:'Mixed',questions:[q({topic:'GENERAL',subject:'FRA'}),q({topic:{name:'quant'}}),q({category:'ethics'}),q({topic:'Inventory',subject:'FSA'}),q({topic:' Generall '})]});
 assert.deepEqual(entry.questions.map(q=>q.topic),['Financial Statement Analysis','Quantitative Methods','Ethical and Professional Standards','Financial Statement Analysis','GENERAL']);
 assert(w.document.getElementById('mockCatalogNotice').textContent.includes('1 câu chưa phân môn'));
 entry=await upload(w,{title:'Section exam',sections:[{title:'Corporate Finance',questions:[q(),q({topic:'equity'})]},{subject:'Fixed Income',questions:[q({topic:'GENERAL'})]}]});
 assert.deepEqual(entry.questions.map(q=>q.topic),['Corporate Issuers','Equity Investments','Fixed Income']);
 entry=await upload(w,{title:'Referenced',sections:[{id:'a',subject:'Derivatives'},{startQuestion:2,endQuestion:2,subject:'Portfolio Management'}],questions:[q({sectionId:'a'}),q()]});
 assert.deepEqual(entry.questions.map(q=>q.topic),['Derivatives','Portfolio Management']);
 entry=await upload(w,{title:'Practice',questions:[q({topic:'GENERAL'}),q({subject:'FSA'})]},'Quant');
 assert.deepEqual(entry.questions.map(q=>q.topic),['Quantitative Methods','Financial Statement Analysis']);
 entry=await upload(w,{title:'Bank metadata',metadata:{subject:'Economics'},questions:[q()]});assert.equal(entry.questions[0].topic,'Economics');
 const count=JSON.parse(w.localStorage.getItem(key)).length;
 await upload(w,{title:'Bad',questions:[null]});assert.equal(JSON.parse(w.localStorage.getItem(key)).length,count);
 w.close();

 // Correct an old submitted bank without changing its persisted attempt or history.
 const attempt={answers:{0:0,1:1},flags:[1],seconds:640,current:1};
 const saved={id:'old',title:'Old bank',status:'submitted',durationMinutes:45,attempt,history:[{score:1,total:3,at:'2026-09-01'}],questions:[q({topic:'FRA'}),q({topic:'GENERAL'}),q({topic:'GENERAL',stem:'<img src=x onerror=alert(1)> What is the value?'})]};
 const v=boot([saved]),d=v.document;
 d.querySelector('[data-manage-topics="old"]').click();
 assert(d.getElementById('mockTopicDialog').open);assert.equal(d.querySelectorAll('#mockTopicRows img').length,0);
 d.getElementById('mockTopicFrom').value=2;d.getElementById('mockTopicTo').value=3;d.getElementById('mockTopicBulkSubject').value='Financial Statement Analysis';d.getElementById('mockTopicApply').click();
 assert(d.getElementById('mockTopicCount').textContent.includes('Tất cả'));d.getElementById('mockTopicSave').click();
 const result=JSON.parse(v.localStorage.getItem(key))[0];
 assert.deepEqual(result.attempt,attempt);assert.deepEqual(result.history,saved.history);assert.equal(result.status,saved.status);
 assert.equal(d.querySelectorAll('.mock-result-topic').length,1);
 assert.match(d.querySelector('.mock-topic-stats').textContent,/1\/3 · 33\.3%/); // Blank answers count against accuracy.
 assert(result.questions.every(q=>q.topic==='Financial Statement Analysis'));
 d.querySelector('[data-manage-topics="old"]').click();d.getElementById('mockTopicBulkSubject').value='Economics';d.getElementById('mockTopicApply').click();d.getElementById('mockTopicCancel').click();
 assert.deepEqual(JSON.parse(v.localStorage.getItem(key))[0],result);
 const data=JSON.parse(v.localStorage.getItem(key));v.close();const reload=boot(data);
 assert.equal(reload.document.querySelectorAll('.mock-result-topic').length,1);assert.match(reload.document.querySelector('.mock-topic-stats').textContent,/1\/3 · 33\.3%/);reload.close();
 console.log('PASS: question aliases, mixed sections, section ranges, practice defaults, JSON metadata, malformed input, manual range assignment, escaping, cancel/reload and unchanged answers/history.');
})().catch(e=>{console.error(e);process.exit(1)});
