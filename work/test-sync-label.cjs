const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('fs'),assert=require('assert/strict');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Could not parse CSS'))errors.push(e)});
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://sync-label.test/#/modules',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
 w.scrollTo=()=>{};w.IntersectionObserver=class{observe(){}disconnect(){}};w.HTMLElement.prototype.scrollIntoView=function(){};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 w.TextEncoder=TextEncoder;w.alert=()=>{};w.fetch=async()=>{throw Error('Network disabled for test')};w.localStorage.setItem('cfa-auth','1');
}});
const w=dom.window,wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 await wait(400);assert.equal(errors.length,0,errors[0]?.stack);
 w.eval("SYNC_CODE='test-label';setSyncStatus('on')");w.CharterI18n.apply('en');
 const label=w.document.getElementById('cpSyncLabel');assert.equal(label.textContent,'Synced');
 const changes=[];const observer=new w.MutationObserver(()=>changes.push(label.textContent));observer.observe(label,{childList:true,characterData:true,subtree:true});
 // The real one-second timer and translation observer continue running.
 await wait(3200);assert.deepEqual(changes,[]);assert.equal(label.textContent,'Synced');
 w.CharterI18n.apply('vi');assert.equal(label.textContent,'Đã đồng bộ');await wait(100);changes.length=0;
 await wait(2200);assert.deepEqual(changes,[]);
 w.eval("setSyncStatus('syncing')");assert.equal(label.textContent,'Đang đồng bộ…');assert(!w.document.getElementById('cpSyncDot').classList.contains('on'));
 w.eval("setSyncStatus('error')");assert.match(label.textContent,/Chưa đồng bộ/);
 w.CharterI18n.apply('en');assert.match(label.textContent,/Sync failed/);
 w.eval("setSyncStatus('on')");assert.equal(label.textContent,'Synced');
 w.eval("SYNC_CODE='';setSyncStatus('off')");assert.equal(label.textContent,'Saved on this device');
 observer.disconnect();assert.equal(errors.length,0,errors[0]?.stack);w.close();
 console.log('PASS: live sync label has zero text mutations while unchanged in both languages; syncing, success, error and local-only states still update.');
})().catch(e=>{console.error(e);w.close();process.exitCode=1});
