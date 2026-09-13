const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('assert/strict');
const key='charterprep.mockLibrary.v2',bank=JSON.parse(fs.readFileSync('outputs/Mock-1-Session-1-2026.json','utf8'));
const entries=['progress','submitted'].map((status,i)=>({id:'bank'+i,title:'Mock '+i,questions:bank.questions,durationMinutes:135,status,attempt:{answers:{0:1},flags:[0],current:4,seconds:456}}));
function boot(saved){const d=new JSDOM('<section id="ux-page-mocks"></section>',{url:'https://test.invalid',runScripts:'outside-only'}),w=d.window;w.confirm=()=>true;w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};w.localStorage.setItem(key,saved);w.eval(fs.readFileSync('work/mock-results.js','utf8'));w.eval(fs.readFileSync('work/mock-room.js','utf8'));return w}
let w=boot(JSON.stringify(entries));const read=()=>JSON.parse(w.localStorage.getItem(key));
assert.equal(w.document.querySelectorAll('[data-reset]').length,2);
assert.equal(w.document.querySelector('[data-reset]').previousElementSibling.dataset.open,'bank0');
w.confirm=()=>false;w.document.querySelector('[data-reset="bank0"]').click();assert.deepEqual(read(),entries);
w.confirm=()=>true;w.document.querySelector('[data-open="bank0"]').click();w.document.getElementById('mockRoomExit').click();
w.document.querySelector('[data-reset="bank0"]').click();w.dispatchEvent(new w.Event('pagehide'));
assert.equal(read()[0].status,'todo');assert.equal(read()[0].attempt,undefined);assert.deepEqual(read()[0].questions,bank.questions);assert.deepEqual(read()[1],entries[1]);
const saved=w.localStorage.getItem(key);w.close();w=boot(saved);
assert(!w.document.querySelector('[data-reset="bank0"]'));
w.document.querySelector('[data-open="bank0"]').click();assert.equal(w.document.getElementById('mockRoomClock').textContent,'02:15:00');assert.equal(w.document.getElementById('mockRoomCounter').textContent,'Câu 1/90');assert(!w.document.querySelector('.mock-room-option.is-selected'));w.document.getElementById('mockRoomExit').click();
w.document.querySelector('[data-reset="bank1"]').click();assert.equal(read()[1].status,'todo');assert(!read()[1].attempt);
w.close();console.log('PASS: adjacent reset, cancel, reset active/submitted attempt, preserve questions/other bank, pagehide/reload and full timer.');
