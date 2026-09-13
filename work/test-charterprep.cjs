const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('fs'),assert=require('assert/strict');
const file='C:/Users/hoang/Documents/Codex/2026-09-08/b/outputs/index.html';
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Could not parse CSS'))errors.push(e)});
let now=new Date('2026-09-08T12:00:00+07:00').getTime();
const dom=new JSDOM(fs.readFileSync(file,'utf8'),{url:'https://test.invalid',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.IntersectionObserver=class{observe(){}disconnect(){}};w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};w.alert=()=>{};w.fetch=async()=>{throw Error('Network forbidden in tests')};w.TextEncoder=TextEncoder;const NativeDate=w.Date;w.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}};w.localStorage.setItem('cfa-auth','1');}});
const w=dom.window,d=w.document;
const wait=()=>new Promise(r=>setTimeout(r,35));
const click=id=>d.getElementById(id).click();
const set=(id,value,type='change')=>{const el=d.getElementById(id);el.value=value;el.dispatchEvent(new w.Event(type,{bubbles:true}))};
(async()=>{
await wait();if(errors.length)throw errors[0];assert(w.CharterPrep,'CharterPrep initialized');assert.equal(d.title,'CharterPrep — CFA Study Master Dashboard');
const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length,'all IDs unique');assert.equal(d.querySelectorAll('[data-mid]').length,133);assert.equal(d.querySelectorAll('[data-weight-topic]').length,10);
set('searchInput','Module 55.1','input');await wait();assert.equal(d.querySelectorAll('#moduleGroups [data-mid]').length,1);assert(d.querySelector('.mname').textContent.includes('Module 55.1:'));
set('searchInput','','input');d.querySelector('[data-complete=m1]').click();await wait();assert.equal(w.eval('progress.m1'),true);assert.equal(JSON.parse(w.localStorage.getItem('cfa-progress')).m1,true);assert.equal(d.getElementById('cpStatModules').textContent,'1 / 133');assert(w.eval('meta.charterPrep.completedAt.m1'));
d.querySelector('[data-rate="5"][data-module="m1"]').click();await wait();assert.equal(w.eval('difficulty.m1'),5);assert(d.getElementById('weakTitle').textContent.includes('Module 39 1'));
set('totalDaysInput','90');await wait();assert.equal(d.querySelectorAll('.daycell').length,90);d.querySelector('[data-range=fortnight]').click();assert.equal(d.querySelectorAll('.daycell').length,14);d.querySelector('[data-range=mock]').click();assert.equal(d.querySelectorAll('.daycell').length,7);d.querySelector('[data-range=all]').click();
const select=d.querySelector('[data-schedule=m1]');select.value='60';select.dispatchEvent(new w.Event('change'));assert.equal(w.eval('dayOverride.m1'),60);
click('timerBtn');now+=61000;click('timerBtn');assert.equal(w.CharterPrep.sessionMs(),61000);now+=60000;assert.equal(w.CharterPrep.sessionMs(),61000);click('timerBtn');now+=59000;click('cpTimerCommit');assert.equal(w.CharterPrep.sessionMs(),0);assert.equal(w.eval('Object.values(timeLog).reduce((a,b)=>a+b,0)'),2);assert.equal(w.CharterPrep.getSession().since,null);
click('cpFocusTop');assert(d.getElementById('focusOverlay').classList.contains('open'));click('cpPomoStart');assert(w.CharterPrep.getPomo().end>now);now+=20000;click('cpPomoStart');assert.equal(w.CharterPrep.getPomo().remaining,1480000);click('cpPomoReset');assert.equal(w.CharterPrep.getPomo().remaining,1500000);w.closeFocusMode();
click('addMockBtn');set('mockName','Mock 1');set('mockDate','2026-09-08');set('mockTotal','100');set('mockCorrect','80');w.addMockTest();assert.equal(w.eval('mockTests.length'),1);assert.equal(d.getElementById('cpMockLatest').textContent,'80.0%');assert(d.getElementById('cpMockBadge').textContent.includes('Đạt'));
set('cpMockGoal','85');assert(d.getElementById('cpMockBadge').textContent.includes('5.0'));
w.openPlanner(2);set('blockStart','19:00');set('blockEnd','20:00');set('blockLabel','Buổi 1');w.addBlock();assert.equal(w.eval('timeBlocks[2].length'),1);set('blockStart','19:30');set('blockEnd','21:00');w.addBlock();assert.equal(w.eval('timeBlocks[2].length'),1);w.closePlanner();
w.openVideoModal('m1');set('videoUrlInput','https://www.youtube.com/watch?v=dQw4w9WgXcQ');w.saveVideoLink('m1');assert(d.getElementById('cpVideoNoteForm'));set('cpNoteTime','02:30');set('cpNoteText','<img onerror=alert(1)> **note**');d.getElementById('cpVideoNoteForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(w.eval('meta.charterPrep.videoNotes.m1[0].seconds'),150);assert.equal(d.querySelectorAll('#cpVideoNotesList img').length,0);d.querySelector('[data-seek]').click();assert(d.querySelector('#vmBody iframe').src.includes('start=150'));w.closeVideoModal();
set('journalInput','# Recall\n**formula**\n<img src=x>','input');click('cpJournalPreview');assert(d.querySelector('#cpJournalRendered strong'));assert.equal(d.querySelectorAll('#cpJournalRendered img').length,0);click('cpJournalPreview');
assert.equal(d.querySelectorAll('#heatmapGrid div.hcell').length,90);
set('cpWeightYear','2027');assert(d.querySelector('[data-weight-topic=ETHICS]').textContent.includes('10–15%'));
assert.equal(w.eval('MODULES.length'),133);assert(!errors.length,errors.map(e=>e.message).join('\n'));
// Verify an unsaved journal draft survives unrelated dashboard changes.
set('journalInput','Draft still being typed','input');d.querySelector('[data-complete=m2]').click();assert.equal(d.getElementById('journalInput').value,'Draft still being typed');
// Review completion is stored with a date, and can be undone the same day.
w.eval('meta.charterPrep.completedAt.m1 = new Date(Date.now()-8*86400000).toISOString(); renderWeeklyReview();');
d.querySelector('[data-review=m1]').click();assert.equal(w.eval('meta.charterPrep.reviewDates.m1.length'),1);d.querySelector('[data-review=m1]').click();assert.equal(w.eval('meta.charterPrep.reviewDates.m1.length'),0);
// A session crossing midnight attributes minutes to each local day.
now=new Date(2026,8,9,23,59,30).getTime();click('timerBtn');now+=90000;w.eval("updateTimerDisplay()");click('cpTimerCommit');assert.equal(w.eval('timeLog["2026-09-09"]'),.5);assert.equal(w.eval('timeLog["2026-09-10"]'),1);
// An unavailable sync record must never trigger an automatic overwrite.
const requests=[];w.fetch=async(url,opts)=>{requests.push(opts?.method||'GET');throw Error('Offline')};set('syncCodeInput','test-no-write');await wait();w.eval('queueSync()');await new Promise(r=>setTimeout(r,1100));assert(!requests.includes('POST'));assert(d.getElementById('cpSyncLabel').textContent.includes('Chưa đồng bộ'));
console.log('PASS: initialization, 133 unchanged modules, 10 topic weights, search, completion persistence, difficulty, 90-day roadmap filters, rescheduling, pause/resume/commit, Pomodoro, mock goals, planner overlap guards, video notes and seeking, escaped Markdown, 90-day heatmap.');
console.log('PASS: unsaved journal draft, dated spaced reviews and undo, midnight time allocation, no overwrite after failed sync.');
w.close();
})().catch(e=>{console.error(e.stack);w.close();process.exitCode=1});
