const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const bank=JSON.parse(fs.readFileSync('outputs/Mock-1-Session-1-2026.json','utf8'));
assert.equal(bank.questions.length,90);
const dom=new JSDOM('<section id="ux-page-mocks"></section>',{url:'https://test.invalid',runScripts:'outside-only'}),w=dom.window;
w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
w.localStorage.setItem('charterprep.mockBank',JSON.stringify(bank));
w.eval(fs.readFileSync('work/mock-results.js','utf8'));w.eval(fs.readFileSync('work/mock-room.js','utf8'));
for(let i=0;i<90;i++){
 w.document.querySelector('[data-q="'+i+'"]').click();
 const q=bank.questions[i];
 assert.equal(w.document.getElementById('mockRoomStem').textContent,q.stem);
 assert.deepEqual([...w.document.querySelectorAll('.mock-room-option span')].map(e=>e.textContent),q.options.map(o=>o.text));
 assert.equal(q.options.length,3);assert('ABC'.includes(q.correctAnswer));assert(q.explanation.length>10);
 w.document.querySelector('.mock-room-option').click();assert(w.document.querySelector('.mock-room-option.is-selected'));
}
setTimeout(()=>{w.close();console.log('PASS: all 90 questions import, display 270 choices and accept selections; 90 keys/explanations present.');},0);
