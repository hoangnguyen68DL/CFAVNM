const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('assert/strict');
const bank=JSON.parse(fs.readFileSync('outputs/Mock-1-Session-1-2026.json','utf8'));
function boot(storage={}){const d=new JSDOM('<section id="ux-page-mocks"></section>',{url:'https://test.invalid',runScripts:'outside-only'}),w=d.window;w.confirm=()=>true;w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};for(const [k,v] of Object.entries(storage))w.localStorage.setItem(k,v);w.eval(fs.readFileSync('work/mock-results.js','utf8'));w.eval(fs.readFileSync('work/mock-room.js','utf8'));return w}
function snapshot(w){return Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]))}
async function upload(w,title,raw=bank){const get=id=>w.document.getElementById(id);get('mockImportName').value=title;get('mockImportSession').value='1';get('mockImportYear').value='2026';get('mockImportChoose').click();const input=get('mockRoomImport');assert.equal(input.parentElement,w.document.body);Object.defineProperty(input,'files',{configurable:true,value:[{text:async()=>typeof raw==='string'?raw:JSON.stringify(raw)}]});await input.onchange({target:input})}
const count=(w,tab)=>Number(w.document.querySelector('[data-catalog-tab="'+tab+'"] span').textContent);
(async()=>{let w=boot({'charterprep.deletedMocks':JSON.stringify([bank.title]),'charterprep.mockBank':JSON.stringify(bank)});assert.equal(count(w,'all'),0);
await upload(w,'Mock 1');assert.equal(count(w,'all'),1);assert.equal(count(w,'todo'),1);
await upload(w,'Mock 2');assert.equal(count(w,'all'),2);
await upload(w,'Bad','{broken');assert.equal(count(w,'all'),2);assert(w.document.getElementById('mockCatalogNotice').textContent.includes('Không thể'));
w.document.querySelector('[data-open]').click();w.document.querySelector('[data-answer="1"]').click();w.document.getElementById('mockRoomExit').click();assert.equal(count(w,'progress'),1);
let saved=snapshot(w);w.close();w=boot(saved);assert.equal(count(w,'all'),2);assert.equal(count(w,'progress'),1);w.document.querySelector('[data-open]').click();assert(w.document.querySelector('[data-answer="1"]').classList.contains('is-selected'));w.document.getElementById('mockRoomExit').click();
w.document.querySelector('[data-delete]').click();assert.equal(count(w,'all'),1);assert.equal(count(w,'progress'),0);
saved=snapshot(w);w.close();w=boot(saved);assert.equal(count(w,'all'),1);await upload(w,'Mock 1');assert.equal(count(w,'all'),2);
await upload(w,'Mock 1');assert.equal(count(w,'all'),2);assert.equal(count(w,'todo'),2);
w.document.getElementById('mockCatalogSearch').value='not found';w.document.getElementById('mockCatalogSearch').oninput();assert.equal(count(w,'all'),2);assert.equal(w.document.querySelectorAll('[data-open]').length,0);
await upload(w,'Third');assert.equal(count(w,'all'),3);assert.equal(w.document.querySelectorAll('[data-open]').length,3);
w.close();console.log('PASS: real file change handler, migration, invalid JSON, multiple banks, counters, progress, deletion/reload, reimport and search reset.');})().catch(e=>{console.error(e);process.exit(1)});
