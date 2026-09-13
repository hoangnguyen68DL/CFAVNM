const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('assert/strict');
const key='charterprep.mockLibrary.v2';
const options=[{label:'A',text:'First'},{label:'B',text:'Second'},{label:'C',text:'Third'}];
const questions=['A','B','C'].map((answer,i)=>({id:'q'+i,topic:i===0?'Ethics':'FSA',stem:'Question '+(i+1),options,correctAnswer:answer,explanation:'Explanation '+i}));
function boot(entries=[]){
 const w=new JSDOM('<section id="ux-page-mocks"></section>',{url:'https://results.test',runScripts:'outside-only'}).window;
 w.confirm=()=>true;w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 let timer;w.setInterval=fn=>{timer=fn;return 1};w.clearInterval=()=>{timer=null};w.advance=n=>{for(let i=0;i<n;i++)timer?.()};
 w.localStorage.setItem(key,JSON.stringify(entries));w.eval(fs.readFileSync('work/mock-results.js','utf8'));w.eval(fs.readFileSync('work/mock-room.js','utf8'));return w;
}
const entry={id:'bank',title:'Repeat · Session 1 · 2026',questions,type:'mock',status:'todo',durationMinutes:10};
(async()=>{
 let w=boot([entry]),d=w.document;
 const read=()=>JSON.parse(w.localStorage.getItem(key)),click=id=>d.getElementById(id).click();
 const answer=(i,a)=>{d.querySelector('[data-q="'+i+'"]').click();d.querySelector('[data-answer="'+a+'"]').click()};
 d.querySelector('[data-open="bank"]').click();answer(0,0);answer(1,0);w.advance(75);
 w.confirm=()=>false;click('mockRoomSubmit');assert.equal(read()[0].history,undefined);
 w.confirm=()=>true;click('mockRoomSubmit');let first=read()[0];
 assert.equal(first.history.length,1);assert.equal(first.history[0].score,1);assert.equal(first.history[0].wrong,1);assert.equal(first.history[0].blank,1);assert.equal(first.history[0].elapsedSeconds,75);
 const originalHistory=structuredClone(first.history[0]);assert.equal(Object.keys(first.questionSets).length,1);
 assert(!d.querySelector('.mock-review-grid'));assert.match(d.querySelector('.mock-results-table').textContent,/33\.3%/);
 click('mockRoomSubmit');assert.equal(read()[0].history.length,1);click('mockRoomExit');
 d.querySelector('[data-reset="bank"]').click();assert.deepEqual(read()[0].history[0],originalHistory);
 d.querySelector('[data-open="bank"]').click();assert.equal(d.querySelectorAll('.mock-room-nav-item.is-review').length,0);assert.equal(d.querySelectorAll('.mock-room-option.is-wrong').length,0);
 answer(0,0);answer(1,1);answer(2,2);w.advance(42);click('mockRoomSubmit');
 let second=read()[0];assert.equal(second.history.length,2);assert.equal(second.history[1].score,3);assert.equal(second.history[1].elapsedSeconds,42);assert.equal(Object.keys(second.questionSets).length,1);
 assert.deepEqual(second.history[0],originalHistory);assert.match(d.querySelector('.mock-results-table').textContent,/\+66\.7/);assert(d.querySelector('.mock-comparison'));assert.equal(d.querySelectorAll('.mock-compare-metrics strong')[2].textContent,'2');assert.equal(d.getElementById('mockCompareFrom').options.length,2);click('mockRoomExit');
 // A saved result is read-only, even while the same bank has a new in-progress attempt.
 d.querySelector('[data-reset="bank"]').click();d.querySelector('[data-open="bank"]').click();answer(0,1);click('mockRoomExit');
 const beforeView=w.localStorage.getItem(key);
 d.querySelector('[data-result-select="1"]').click();click('mockResultsAnswers');
 assert(d.getElementById('mockRoomSubmit').disabled);assert(d.getElementById('mockRoomClear').disabled);
 d.querySelector('[data-q="1"]').click();assert(d.querySelector('.mock-room-option.is-wrong'));assert.equal(d.querySelector('.mock-room-option.is-wrong span').textContent,'First');
 assert(d.querySelector('[data-q="1"]').classList.contains('is-review'));
 click('mockRoomNext');click('mockRoomExit');assert.equal(w.localStorage.getItem(key),beforeView);
 // Reimport revised questions without losing the two original completed attempts.
 d.getElementById('mockImportName').value='Repeat';d.getElementById('mockImportSession').value=1;d.getElementById('mockImportYear').value=2026;click('mockImportChoose');
 const file=d.getElementById('mockRoomImport');Object.defineProperty(file,'files',{configurable:true,value:[{text:async()=>JSON.stringify({questions:questions.map(q=>({...q,correctAnswer:'C',stem:q.stem+' revised'}))})}]});await file.onchange({target:file});
 assert.equal(read()[0].history.length,2);assert.equal(read()[0].questions[0].correctAnswer,'C');assert.equal(read()[0].questionSets[originalHistory.questionSetId][0].correctAnswer,'A');
 d.querySelector('[data-open="bank"]').click();answer(0,2);answer(1,2);answer(2,2);click('mockRoomSubmit');click('mockRoomExit');
 assert.equal(read()[0].history.length,3);assert.equal(Object.keys(read()[0].questionSets).length,2);
 // No comparison across different versions of the exam.
 assert.equal(d.querySelector('.mock-results-table tbody tr td:nth-child(6)').textContent,'—');
 const saved=read();w.close();w=boot(saved);d=w.document;
 assert.equal(d.querySelectorAll('.mock-results-table tbody tr').length,3);
 d.querySelector('[data-result-select="2"]').click();d.getElementById('mockResultsAnswers').click();assert.equal(d.getElementById('mockRoomStem').textContent.includes('revised'),false);d.getElementById('mockRoomExit').click();
 d.getElementById('mockResultsRetry').click();const review=JSON.parse(w.localStorage.getItem(key)).at(-1);assert.equal(review.type,'review');assert.equal(review.questions.length,2);assert.equal(review.reviewAttemptId,originalHistory.id);
 w.close();
 // Legacy score-only records remain visible; the current saved answers are archived on reset.
 const old={...entry,status:'submitted',attempt:{answers:{0:0},seconds:500,flags:[0],current:0},history:[{score:0,total:3,durationMinutes:2,at:'2026-09-01'},{score:1,total:3,durationMinutes:1,at:'2026-09-02'}]};
 const v=boot([old]);v.document.querySelector('[data-reset]').click();const migrated=JSON.parse(v.localStorage.getItem(key))[0];assert.equal(migrated.history.length,2);assert(!migrated.history[0].answers);assert.deepEqual(migrated.history[1].answers,{0:0});assert.equal(migrated.status,'todo');v.close();
 // Missing keys never become invented scores; unanswered keyed questions remain in the denominator.
 const x=boot([{...entry,status:'submitted',attempt:{answers:{0:0},seconds:100},questions:[questions[0],{...questions[1],correctAnswer:undefined}]}]);
 assert.match(x.document.querySelector('.mock-result-detail').textContent,/1 câu chưa có đáp án/);assert.match(x.document.querySelector('.mock-results-table').textContent,/100%/);x.close();
 // A storage failure cannot turn an unfinished attempt into a submitted result.
 const limited=boot([entry]);limited.document.querySelector('[data-open]').click();
 const storageBefore=limited.localStorage.getItem(key),nativeSet=limited.Storage.prototype.setItem;
 limited.Storage.prototype.setItem=function(k,v){if(k===key)throw new Error('Quota exceeded');return nativeSet.call(this,k,v)};
 limited.document.getElementById('mockRoomSubmit').click();assert.equal(limited.localStorage.getItem(key),storageBefore);assert(!limited.document.getElementById('mockRoomSubmit').disabled);assert.match(limited.document.getElementById('mockCatalogNotice').textContent,/Chưa lưu/);limited.close();
 // History is paged, and changing language does not drop stored attempts.
 const many=boot([{...entry,status:'todo',history:Array.from({length:9},(_,i)=>({score:i%4,total:3,durationMinutes:i,at:'2026-09-'+String(i+1).padStart(2,'0')}))}]);
 assert.equal(many.document.querySelectorAll('.mock-results-table tbody tr').length,6);many.document.getElementById('mockResultsNext').click();assert.equal(many.document.querySelectorAll('.mock-results-table tbody tr').length,3);
 many.document.body.dataset.language='en';many.MockRoomAnalytics.localize();assert.equal(many.document.querySelector('.mock-results-head h2').textContent,'Mock & practice results');assert.equal(JSON.parse(many.localStorage.getItem(key))[0].history.length,9);many.close();
 console.log('PASS: confirmed submission, exact elapsed time, immutable answers, retained history on retry/reimport/reload, shared question sets, read-only result navigation, historical incorrect review, legacy summaries, missing keys, quota failure, pagination and language changes.');
})().catch(e=>{console.error(e);process.exit(1)});
