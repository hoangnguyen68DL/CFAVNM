const fs=require('fs'),p='work/mock-room.js';let s=fs.readFileSync(p,'utf8');
s=s.replace("  const catalogSeed=", "  const catalogSeed=");
const begin=s.indexOf('  const catalogSeed=');const end=s.indexOf("  $('mockCatalogSearch').oninput",begin);
s=s.slice(0,begin)+`
  const libraryKey='charterprep.mockLibrary.v2';
  let library=[],activeId=null;
  const escapeText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const notice=document.createElement('p');notice.id='mockCatalogNotice';notice.setAttribute('role','status');catalog.querySelector('.mock-catalog-head').after(notice);
  const report=(message,error=false)=>{notice.textContent=message;notice.style.color=error?'#b42318':'#167249'};
  function commit(next){localStorage.setItem(libraryKey,JSON.stringify(next));library=next}
  function renderCatalog(){
    const query=$('mockCatalogSearch').value.trim().toLowerCase();
    catalog.querySelectorAll('[data-catalog-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.catalogTab===catalogTab);b.querySelector('span').textContent=library.filter(e=>b.dataset.catalogTab==='all'||e.status===b.dataset.catalogTab).length});
    const topics=[...new Set(library.flatMap(e=>e.questions.map(q=>q.topic)))].sort();
    $('mockCatalogTopic').innerHTML='<option value="all">Tất cả chủ đề</option>'+topics.map(t=>'<option value="'+escapeText(t)+'">'+escapeText(t)+'</option>').join('');
    if(!topics.includes(catalogTopic))catalogTopic='all';$('mockCatalogTopic').value=catalogTopic;
    let entries=library.filter(e=>e.title.toLowerCase().includes(query)&&(catalogTab==='all'||e.status===catalogTab)&&(catalogTopic==='all'||e.questions.some(q=>q.topic===catalogTopic)));
    if(catalogSort==='name')entries.sort((a,b)=>a.title.localeCompare(b.title));if(catalogSort==='duration')entries.sort((a,b)=>a.durationMinutes-b.durationMinutes);
    $('mockCatalogCount').textContent=entries.length+' đề';$('mockCatalogGrid').classList.toggle('is-list',!catalogGrid);
    $('mockCatalogGrid').innerHTML=entries.map(e=>'<article class="mock-exam-card is-imported"><div class="mock-exam-card-top"><span class="mock-exam-icon">▤</span><span class="mock-exam-pill">'+({todo:'Chưa làm',progress:'Đang làm dở',submitted:'Đã nộp'}[e.status])+'</span><button class="mock-exam-delete" data-delete="'+escapeText(e.id)+'" aria-label="Xoá '+escapeText(e.title)+'">×</button></div><h2>'+escapeText(e.title)+'</h2><div class="mock-exam-meta"><span>'+e.questions.length+' câu</span><span>◷ '+e.durationMinutes+' phút</span></div><div class="mock-exam-divider"></div><p>'+({todo:'Sẵn sàng bắt đầu',progress:'Đã trả lời '+Object.keys(e.attempt?.answers||{}).length+'/'+e.questions.length,submitted:'Đã hoàn thành bài thi'}[e.status])+'</p><button class="mock-exam-action primary" data-open="'+escapeText(e.id)+'">'+({todo:'Bắt đầu',progress:'Làm tiếp',submitted:'Xem kết quả'}[e.status])+'</button></article>').join('')||'<div class="mock-catalog-empty">'+(library.length?'Không có đề phù hợp với bộ lọc.':'Chưa có đề thi. Bấm “Thêm đề JSON” để thêm đề của bạn.')+'</div>';
    catalog.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openBank(b.dataset.open));
    catalog.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{const entry=library.find(e=>e.id===b.dataset.delete);if(!confirm('Xoá “'+entry.title+'” và bài làm của đề này?'))return;try{commit(library.filter(e=>e.id!==entry.id));if(activeId===entry.id){activeId=null;clearInterval(timer);dialog.close()}renderCatalog();report('Đã xoá '+entry.title)}catch{report('Chưa xoá được vì không thể lưu dữ liệu. Hãy thử lại.',true)}});
  }
  function saveAttempt(){if(!activeId)return;const next=library.map(e=>e.id===activeId?{...e,status:e.status==='submitted'?'submitted':'progress',attempt:{answers:{...answers},flags:[...flags],current,seconds}}:e);try{commit(next)}catch{report('Không lưu được bài làm. Hãy kiểm tra dung lượng lưu trữ.',true)}}
  function openBank(id){const e=library.find(e=>e.id===id);if(!e)return;activeId=id;demo=e.questions;bankTitle=e.title;current=e.attempt?.current||0;answers={...e.attempt?.answers};flags=new Set(e.attempt?.flags||[]);seconds=e.attempt?.seconds??e.durationMinutes*60;clearInterval(timer);render();dialog.showModal();if(e.status==='submitted'){showResult();return}saveAttempt();renderCatalog();timer=setInterval(()=>{seconds=Math.max(0,seconds-1);$('mockRoomClock').textContent=fmt(seconds);if(seconds%15===0)saveAttempt();if(!seconds)submitBank(false)},1000)}
  function showResult(){const marked=demo.filter(q=>q.correctAnswer!==undefined&&q.correctAnswer!==null);const score=marked.filter(q=>{const i=demo.indexOf(q);return typeof q.correctAnswer==='number'?answers[i]===q.correctAnswer:q.options[answers[i]]?.label===String(q.correctAnswer).toUpperCase()}).length;$('mockRoomStem').textContent='Đã nộp bài · '+bankTitle;$('mockRoomOptions').textContent=marked.length?'Đúng '+score+'/'+marked.length+' câu có đáp án. Đã trả lời '+Object.keys(answers).length+'/'+demo.length+' câu.':'Đã lưu bài làm. Đề này chưa có đáp án để chấm điểm.';$('mockRoomSubmit').disabled=true}
  function submitBank(ask=true){if(!activeId)return;if(ask&&!confirm('Nộp bài với '+Object.keys(answers).length+'/'+demo.length+' câu đã trả lời?'))return;clearInterval(timer);saveAttempt();try{commit(library.map(e=>e.id===activeId?{...e,status:'submitted'}:e));renderCatalog();showResult()}catch{report('Chưa lưu được kết quả. Hãy thử lại.',true)}}
`+s.slice(end);
const obs=s.indexOf('new MutationObserver(');const start=s.indexOf("  $('mockRoomStart').onclick",obs);
s=s.slice(0,obs)+'renderCatalog();\n'+s.slice(start);
const a=s.indexOf("  $('mockRoomStart').onclick");const b=s.indexOf("  $('mockRoomSettings').onclick",a);
s=s.slice(0,a)+`
  $('mockRoomStart').onclick=()=>{if(library[0])openBank(library[0].id)};
  $('mockRoomExit').onclick=()=>{saveAttempt();clearInterval(timer);dialog.close();renderCatalog()};
  dialog.addEventListener('cancel',()=>{saveAttempt();clearInterval(timer);renderCatalog()});
  $('mockRoomPrev').onclick=()=>{if(current){current--;render()}};$('mockRoomNext').onclick=()=>{if(current<demo.length-1){current++;render()}else $('mockRoomSubmit').focus()};
  $('mockRoomFlag').onclick=()=>{flags.has(current)?flags.delete(current):flags.add(current);render()};$('mockRoomClear').onclick=()=>{delete answers[current];render()};$('mockRoomNote').onclick=()=>{$('mockRoomNote').classList.toggle('is-flagged')};
  $('mockRoomSubmit').onclick=()=>submitBank();
  window.addEventListener('pagehide',saveAttempt);
`+s.slice(b);
const c=s.indexOf('    demo=normalized;');const z=s.indexOf("  render();\n})();",c);
s=s.slice(0,c)+`
    const title=meta.title||parsed.title||'CFA Mock · Bộ đề đã tải';
    const existing=library.find(e=>e.title===title);
    if(existing&&!confirm('Đề “'+title+'” đã có. Thay nội dung đề và đặt lại bài làm?'))return false;
    const entry={id:existing?.id||('mock-'+Date.now()+'-'+Math.random().toString(36).slice(2)),title,questions:normalized,durationMinutes:Number(parsed.durationMinutes)>0?Number(parsed.durationMinutes):135,status:'todo'};
    commit([...library.filter(e=>e.id!==entry.id),entry]);
    activeId=null;demo=normalized;bankTitle=title;current=0;answers={};flags.clear();
    catalogTab='all';catalogTopic='all';$('mockCatalogSearch').value='';renderCatalog();render();report('Đã thêm '+title+' · '+normalized.length+' câu.');return true;
  }
  // Keep the file control outside a closed dialog so the browser can open it.
  document.body.append($('mockRoomImport'));
  $('mockImportChoose').onclick=()=>{const form=importDialog.querySelector('form');if(!form.reportValidity())return;const name=$('mockImportName').value.trim(),session=$('mockImportSession').value,year=$('mockImportYear').value;importMeta={title:name+' · Session '+session+' · '+year};$('mockRoomImport').click()};
  $('mockRoomImport').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(importBank(await file.text(),importMeta))importDialog.close()}catch(err){const message='Không thể thêm đề: '+err.message;report(message,true);importDialog.querySelector('.mock-import-hint').textContent=message}finally{e.target.value=''}};
  try{const stored=localStorage.getItem(libraryKey);if(stored!==null){const parsed=JSON.parse(stored);if(!Array.isArray(parsed))throw Error('Danh sách đề không hợp lệ');library=parsed}else{const old=localStorage.getItem('charterprep.mockBank');if(old){const bank=JSON.parse(old);if(!deletedCatalog.has(bank.title))importBank(bank,{})}}}catch(err){report('Chưa đọc được danh sách đề đã lưu: '+err.message,true)}
  renderCatalog();
`+s.slice(z);
s=s.replace("    const q=demo[current];", "    const q=demo[current];if(!q)return;const submitted=library?.find(e=>e.id===activeId)?.status==='submitted';$('mockRoomSubmit').disabled=!!submitted;");
s=s.replace("button.dataset.answer=i;", "button.disabled=!!submitted;button.dataset.answer=i;");
s=s.replace("    $('mockRoomNav').innerHTML", "    saveAttempt();\n    $('mockRoomNav').innerHTML");
fs.writeFileSync(p,s);
