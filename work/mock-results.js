// Completed attempts are immutable. Question sets are shared across repeated attempts.
(()=>{
  'use strict';
  window.createMockResults=function({panel,getLibrary,getTopic,onView,onReview,onTopics,onDelete}){
    const clone=x=>JSON.parse(JSON.stringify(x));
    const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const hasAnswer=(q,a)=>Number.isInteger(a)&&a>=0&&a<q.options.length;
    const hasKey=q=>typeof q.correctAnswer==='number'?Number.isInteger(q.correctAnswer)&&q.correctAnswer>=0&&q.correctAnswer<q.options.length:typeof q.correctAnswer==='string'&&q.options.some((o,i)=>(o.label||String.fromCharCode(65+i)).toUpperCase()===q.correctAnswer.trim().toUpperCase());
    const correct=(q,a)=>hasAnswer(q,a)&&hasKey(q)&&(typeof q.correctAnswer==='number'?a===q.correctAnswer:(q.options[a].label||String.fromCharCode(65+a)).toUpperCase()===q.correctAnswer.trim().toUpperCase());
    function summarize(questions,answers={}){
      const s={score:0,total:questions.length,gradedTotal:0,wrong:0,blank:0,ungraded:0,topics:{}};
      for(let i=0;i<questions.length;i++){
        const q=questions[i],a=answers[i];if(!hasAnswer(q,a))s.blank++;
        if(!hasKey(q)){s.ungraded++;continue}
        s.gradedTotal++;if(correct(q,a))s.score++;else if(hasAnswer(q,a))s.wrong++;
        const topic=getTopic(q);
        if(!Object.hasOwn(s.topics,topic))Object.defineProperty(s.topics,topic,{value:{correct:0,total:0},enumerable:true,writable:true});
        s.topics[topic].total++;if(correct(q,a))s.topics[topic].correct++;
      }
      return s;
    }
    function addQuestionSet(entry){
      const serialized=JSON.stringify(entry.questions),sets={...entry.questionSets};
      let id=Object.keys(sets).find(k=>JSON.stringify(sets[k])===serialized);
      if(!id){let n=Object.keys(sets).length+1;while(sets['questions-'+n])n++;id='questions-'+n;sets[id]=clone(entry.questions)}
      return {sets,id};
    }
    function capture(entry,{id,at=null}={}){
      const {sets,id:questionSetId}=addQuestionSet(entry),attempt=entry.attempt||{};
      const remaining=Number.isFinite(attempt.seconds)?Math.max(0,attempt.seconds):null;
      const elapsedSeconds=remaining===null?null:Math.max(0,entry.durationMinutes*60-remaining);
      const record={id:id||'attempt-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),at,questionSetId,...summarize(entry.questions,attempt.answers),answers:clone(attempt.answers||{}),flags:[...(attempt.flags||[])],current:attempt.current||0,seconds:remaining,elapsedSeconds,durationMinutes:elapsedSeconds===null?null:elapsedSeconds/60,allottedMinutes:entry.durationMinutes};
      return {record,sets};
    }
    function archive(entry){
      const old=entry.history||[];
      if(entry.status!=='submitted'||!entry.attempt)return entry;
      if(entry.lastSubmittedAttemptId&&old.some(h=>h.id===entry.lastSubmittedAttemptId&&h.questionSetId))return entry;
      const last=old.at(-1),summary=summarize(entry.questions,entry.attempt.answers);
      const enrich=last&&!last.questionSetId&&last.score===summary.score&&last.total===summary.total;
      const id=enrich?(last.id||'legacy-'+entry.id+'-'+(old.length-1)):'saved-'+entry.id;
      const {record,sets}=capture(entry,{id,at:enrich?last.at||null:null});
      const history=enrich?[...old.slice(0,-1),{...last,...record}]:[...old,record];
      return {...entry,history,questionSets:sets,lastSubmittedAttemptId:id};
    }
    function submit(entry){
      const {record,sets}=capture(entry,{at:new Date().toISOString()});
      return {...entry,status:'submitted',history:[...(entry.history||[]),record],questionSets:sets,lastSubmittedAttemptId:record.id};
    }
    const questionsFor=(entry,h)=>entry.questionSets?.[h.questionSetId]||null;
    function rows(){return getLibrary().flatMap(raw=>{
      const entry=archive(raw);
      return (entry.history||[]).map((h,index)=>{
        const questions=questionsFor(entry,h),stats=questions?summarize(questions,h.answers):{score:h.score,total:h.total,gradedTotal:h.gradedTotal??h.total,wrong:null,blank:null,ungraded:null,topics:{}};
        const elapsedSeconds=h.elapsedSeconds??(typeof h.durationMinutes==='number'?h.durationMinutes*60:null);
        return {entry,h:{...h,id:h.id||'legacy-'+entry.id+'-'+index},index,questions,stats,elapsedSeconds,pct:stats.gradedTotal>0?stats.score/stats.gradedTotal*100:null};
      });
    })}
    function reclassify(entry,questions){
      const sets={};
      for(const [id,list]of Object.entries(entry.questionSets||{}))sets[id]=list.map(q=>{
        const edited=questions.find(n=>n.id===q.id&&n.stem===q.stem);
        return edited?{...q,topic:edited.topic,topicSource:edited.topicSource}:q;
      });
      return {...entry,questions,...(entry.questionSets?{questionSets:sets}:{})};
    }
    function removeAttempts(raw,ids){
      const entry=archive(raw);
      // Materialize legacy IDs before removal so the remaining rows keep their identity.
      const history=(entry.history||[]).map((h,i)=>({...h,id:h.id||'legacy-'+entry.id+'-'+i})).filter(h=>!ids.has(h.id));
      const referenced=new Set(history.map(h=>h.questionSetId).filter(Boolean));
      const next={...entry,history,questionSets:Object.fromEntries(Object.entries(entry.questionSets||{}).filter(([id])=>referenced.has(id)))};
      if(entry.status==='submitted'&&(ids.has(entry.lastSubmittedAttemptId)||!history.length)){
        next.status='todo';delete next.attempt;delete next.lastSubmittedAttemptId;
      }
      return next;
    }
    const kind=e=>e.reviewOf||e.type==='review'?'review':e.type==='practice'||/^practice/i.test(e.title)?'practice':'mock';
    let filter='all',bankFilter='all',page=0,selected=null,lastLanguage=null,compareBank=null,compareFrom=null,compareTo=null;
    const pageSize=6;
    const source='https://www.cfainstitute.org/programs/cfa-program/candidate-resources/understanding-your-results';
    const levelOne='https://www.cfainstitute.org/programs/cfa-program/candidate-resources/level-i-exam';
    function copy(){return document.body.dataset.language==='en'?{
      eyebrow:'ATTEMPT HISTORY',title:'Mock & practice results',intro:'Keep every completed attempt and see how your results change.',all:'All',mock:'Mock',practice:'Practice',review:'Incorrect review',allBanks:'All exams',attempts:'Completed attempts',average:'Average score',best:'Best score',time:'Average time',empty:'Your results will appear here after you submit an exam.',exam:'Exam / attempt',date:'Submitted',score:'Score',breakdown:'Correct / wrong / blank',duration:'Time spent',change:'vs previous',analyze:'Analyze',attempt:'Attempt',undated:'Date unavailable',summaryOnly:'Summary only',previous:'Previous',next:'Next',detail:'Selected attempt',answers:'View answers',retry:'Practice incorrect',topic:'Performance by subject',reference:'50% and 70% are reference marks, not passing scores by subject.',weak:'Subjects to prioritize',noTopics:'This older attempt has no saved subject breakdown.',unassigned:'Assign subjects to see a useful breakdown.',assign:'Assign subjects',correct:'correct',wrong:'wrong',blank:'blank',missing:'questions without an answer key',scoring:'How this score is calculated',scoringBody:'All scorable questions have equal weight; wrong and blank answers earn zero points. Percentages use the questions with a valid answer key. Topic weights arise from the questions in this exam and are not applied a second time.',official:'CFA Level I reports a scale score from 1000 to 1900, with an MPS of 1600. A practice percentage cannot be converted into that official score. This page shows your own attempts; it does not estimate a cohort average, confidence interval or pass/fail outcome.',reportLink:'CFA score report guide',rulesLink:'CFA Level I scoring',seconds:'sec/question',trend:'Recent attempts',noComparable:'—',points:'pp',saved:'Answers saved',legacy:'Only the overall score was saved for this older attempt. Its answers and topic details cannot be reconstructed.',comparison:'Compare attempts',fromAttempt:'Earlier attempt',toAttempt:'Later attempt',scoreChange:'Score change',timeChange:'Time change',improved:'Wrong → correct',stillWrong:'Still incorrect',regressed:'Correct → wrong',sameSet:'Question changes are available when both attempts use the same question set.',chooseTwo:'Choose two different attempts to compare.',subjectChange:'Change by subject'
    }:{
      eyebrow:'LỊCH SỬ LƯỢT THI',title:'Kết quả Mock & Practice',intro:'Giữ từng lượt đã nộp và theo dõi mức tiến bộ khi làm lại.',all:'Tất cả',mock:'Mock',practice:'Practice',review:'Ôn câu sai',allBanks:'Tất cả bộ đề',attempts:'Lượt đã nộp',average:'Điểm trung bình',best:'Điểm cao nhất',time:'Thời gian trung bình',empty:'Kết quả sẽ xuất hiện ở đây sau khi bạn nộp bài.',exam:'Bộ đề / lượt thi',date:'Ngày nộp',score:'Điểm',breakdown:'Đúng / sai / trống',duration:'Thời gian làm',change:'So với lượt trước',analyze:'Phân tích',attempt:'Lượt',undated:'Chưa có ngày lưu',summaryOnly:'Chỉ có điểm tổng',previous:'Trước',next:'Sau',detail:'Lượt đang xem',answers:'Xem đáp án',retry:'Làm lại câu sai',topic:'Kết quả từng môn',reference:'Mốc 50% và 70% dùng để tham khảo, không phải ngưỡng đậu từng môn.',weak:'Môn cần ưu tiên ôn',noTopics:'Lượt cũ này chưa lưu chi tiết từng môn.',unassigned:'Bổ sung môn cho câu hỏi để xem phân tích hữu ích hơn.',assign:'Phân môn',correct:'đúng',wrong:'sai',blank:'bỏ trống',missing:'câu chưa có đáp án để chấm',scoring:'Cách tính điểm',scoringBody:'Mỗi câu có đáp án hợp lệ có trọng số như nhau; câu sai và bỏ trống được 0 điểm. Tỷ lệ đúng tính trên số câu chấm được. Tỷ trọng môn đã nằm trong số câu của đề, không nhân trọng số thêm lần nữa.',official:'CFA Level I báo điểm trên thang 1000–1900, MPS là 1600. Không thể quy đổi tỷ lệ đúng của đề luyện sang điểm chính thức này. Trang này dùng các lượt làm của bạn, không ước tính điểm trung bình thí sinh, khoảng tin cậy hay kết luận đậu/rớt.',reportLink:'Hướng dẫn báo điểm CFA',rulesLink:'Cách chấm CFA Level I',seconds:'giây/câu',trend:'Các lượt gần đây',noComparable:'—',points:'điểm %',saved:'Đã lưu đáp án',legacy:'Lượt cũ này chỉ lưu điểm tổng. Không còn dữ liệu để khôi phục đáp án và phân tích từng môn.',comparison:'So sánh hai lượt',fromAttempt:'Lượt trước',toAttempt:'Lượt sau',scoreChange:'Thay đổi điểm',timeChange:'Thay đổi thời gian',improved:'Sai → đúng',stillWrong:'Tiếp tục sai',regressed:'Đúng → sai',sameSet:'Chỉ phân tích thay đổi từng câu khi hai lượt dùng cùng bộ câu hỏi.',chooseTwo:'Chọn hai lượt khác nhau để so sánh.',subjectChange:'Thay đổi theo môn'
    }}
    const pct=n=>n===null?'—':Number(n.toFixed(1))+'%';
    const duration=n=>n===null||!Number.isFinite(n)?'—':Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');
    const rowKey=r=>r.entry.id+'::'+r.h.id;
    function comparison(r,all,t){
      const attempts=all.filter(x=>x.entry.id===r.entry.id&&x.pct!==null).sort((a,b)=>a.index-b.index);if(attempts.length<2)return'';
      if(compareBank!==r.entry.id||!attempts.some(x=>rowKey(x)===compareFrom)||!attempts.some(x=>rowKey(x)===compareTo)){compareBank=r.entry.id;compareFrom=rowKey(attempts.at(-2));compareTo=rowKey(attempts.at(-1))}
      const from=attempts.find(x=>rowKey(x)===compareFrom),to=attempts.find(x=>rowKey(x)===compareTo),options=value=>attempts.map(x=>'<option value="'+esc(rowKey(x))+'"'+(rowKey(x)===value?' selected':'')+'>'+t.attempt+' '+(x.index+1)+' · '+pct(x.pct)+'</option>').join('');
      if(!from||!to||from===to)return'<section class="mock-comparison"><h4>'+t.comparison+'</h4><div class="mock-compare-controls"><label>'+t.fromAttempt+'<select id="mockCompareFrom">'+options(compareFrom)+'</select></label><label>'+t.toAttempt+'<select id="mockCompareTo">'+options(compareTo)+'</select></label></div><p>'+t.chooseTwo+'</p></section>';
      const delta=to.pct-from.pct,timeDelta=from.elapsedSeconds===null||to.elapsedSeconds===null?null:to.elapsedSeconds-from.elapsedSeconds,comparable=from.questions&&to.questions&&from.h.questionSetId===to.h.questionSetId&&from.questions.length===to.questions.length;let improved=null,stillWrong=null,regressed=null;
      if(comparable){improved=stillWrong=regressed=0;for(let i=0;i<to.questions.length;i++){const before=correct(to.questions[i],from.h.answers?.[i]),after=correct(to.questions[i],to.h.answers?.[i]);if(!before&&after)improved++;else if(!before&&!after)stillWrong++;else if(before&&!after)regressed++}}
      const topics=[...new Set([...Object.keys(from.stats.topics),...Object.keys(to.stats.topics)])].map(name=>{const a=from.stats.topics[name],b=to.stats.topics[name],av=a?.total?a.correct/a.total*100:null,bv=b?.total?b.correct/b.total*100:null;return{name,av,bv,delta:av===null||bv===null?null:bv-av}}).filter(x=>x.delta!==null).sort((a,b)=>a.delta-b.delta);
      const signed=n=>n===null?'—':(n>0?'+':'')+Number(n.toFixed(1))+' '+t.points,timeText=timeDelta===null?'—':(timeDelta>0?'+':'−')+duration(Math.abs(timeDelta));
      return'<section class="mock-comparison"><header><div><small>MOCK COMPARISON</small><h4>'+t.comparison+'</h4></div><span>'+t.attempt+' '+(from.index+1)+' → '+t.attempt+' '+(to.index+1)+'</span></header><div class="mock-compare-controls"><label>'+t.fromAttempt+'<select id="mockCompareFrom">'+options(compareFrom)+'</select></label><label>'+t.toAttempt+'<select id="mockCompareTo">'+options(compareTo)+'</select></label></div><div class="mock-compare-metrics"><div><strong class="'+(delta>=0?'positive':'negative')+'">'+signed(delta)+'</strong><span>'+t.scoreChange+'</span></div><div><strong>'+timeText+'</strong><span>'+t.timeChange+'</span></div><div><strong>'+(improved??'—')+'</strong><span>'+t.improved+'</span></div><div><strong>'+(stillWrong??'—')+'</strong><span>'+t.stillWrong+'</span></div><div><strong>'+(regressed??'—')+'</strong><span>'+t.regressed+'</span></div></div>'+(!comparable?'<p>'+t.sameSet+'</p>':'')+(topics.length?'<div class="mock-compare-topics"><h5>'+t.subjectChange+'</h5>'+topics.map(x=>'<div><span>'+esc(x.name)+'</span><b class="'+(x.delta>=0?'positive':'negative')+'">'+signed(x.delta)+'</b><small>'+pct(x.av)+' → '+pct(x.bv)+'</small></div>').join('')+'</div>':'')+'</section>';
    }
    function render(){
      lastLanguage=document.body.dataset.language||'vi';const t=copy(),all=rows();
      const banks=[...new Map(all.map(r=>[r.entry.id,r.entry.title]))];
      if(!banks.some(([id])=>id===bankFilter))bankFilter='all';
      const filtered=all.filter(r=>(filter==='all'||kind(r.entry)===filter)&&(bankFilter==='all'||r.entry.id===bankFilter));
      const ordered=[...filtered].sort((a,b)=>(Date.parse(b.h.at)||0)-(Date.parse(a.h.at)||0)||b.index-a.index);
      const scored=filtered.filter(r=>r.pct!==null),timed=filtered.filter(r=>r.elapsedSeconds!==null);
      if(!ordered.some(r=>rowKey(r)===selected))selected=ordered[0]?rowKey(ordered[0]):null;
      page=Math.max(0,Math.min(page,Math.ceil(ordered.length/pageSize)-1));
      const selectedRow=ordered.find(r=>rowKey(r)===selected),visible=ordered.slice(page*pageSize,(page+1)*pageSize);
      const metric=(value,label)=>'<div><strong>'+value+'</strong><span>'+label+'</span></div>';
      panel.className='mock-results-dashboard';panel.setAttribute('translate','no');
      panel.innerHTML='<header class="mock-results-head"><div><small>'+t.eyebrow+'</small><h2>'+t.title+'</h2><p>'+t.intro+'</p></div><select id="mockResultsBank" aria-label="'+t.allBanks+'"><option value="all">'+t.allBanks+'</option>'+banks.map(([id,name])=>'<option value="'+esc(id)+'"'+(id===bankFilter?' selected':'')+'>'+esc(name)+'</option>').join('')+'</select></header>'+
        '<div class="mock-results-tabs">'+['all','mock','practice','review'].map(k=>'<button type="button" data-result-kind="'+k+'" class="'+(filter===k?'active':'')+'">'+t[k]+'</button>').join('')+'</div>'+
        '<div class="mock-results-metrics">'+metric(filtered.length,t.attempts)+metric(scored.length?pct(scored.reduce((n,r)=>n+r.pct,0)/scored.length):'—',t.average)+metric(scored.length?pct(Math.max(...scored.map(r=>r.pct))):'—',t.best)+metric(timed.length?duration(timed.reduce((n,r)=>n+r.elapsedSeconds,0)/timed.length):'—',t.time)+'</div>'+
        (ordered.length?'<div class="mock-results-table-wrap"><table class="mock-results-table"><thead><tr>'+[t.exam,t.date,t.score,t.breakdown,t.duration,t.change,''].map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+visible.map((r,i)=>{
          const prev=all.find(x=>x.entry.id===r.entry.id&&x.index===r.index-1),comparable=prev&&r.pct!==null&&prev.pct!==null&&((r.h.questionSetId&&r.h.questionSetId===prev.h.questionSetId)||(!r.h.questionSetId&&!prev.h.questionSetId&&r.stats.total===prev.stats.total));
          const delta=comparable?r.pct-prev.pct:null;
          return '<tr class="'+(rowKey(r)===selected?'is-selected':'')+'"><td><strong>'+esc(r.entry.title)+'</strong><small>'+t.attempt+' '+(r.index+1)+' · '+t[kind(r.entry)]+'</small></td><td>'+esc(r.h.at&&!Number.isNaN(Date.parse(r.h.at))?new Date(r.h.at).toLocaleString(lastLanguage==='en'?'en-GB':'vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):t.undated)+'</td><td><b>'+pct(r.pct)+'</b><small>'+r.stats.score+'/'+r.stats.gradedTotal+'</small></td><td>'+r.stats.score+' / '+(r.stats.wrong??'—')+' / '+(r.stats.blank??'—')+'</td><td>'+duration(r.elapsedSeconds)+'</td><td class="'+(delta>0?'positive':delta<0?'negative':'')+'">'+(delta===null?'—':(delta>0?'+':'')+Number(delta.toFixed(1))+' '+t.points)+'</td><td><button type="button" data-result-select="'+i+'">'+t.analyze+'</button></td></tr>';
        }).join('')+'</tbody></table></div><div class="mock-results-pagination"><span>'+Math.min(page*pageSize+1,ordered.length)+'–'+Math.min((page+1)*pageSize,ordered.length)+' / '+ordered.length+'</span><button id="mockResultsPrev"'+(page===0?' disabled':'')+'>'+t.previous+'</button><button id="mockResultsNext"'+((page+1)*pageSize>=ordered.length?' disabled':'')+'>'+t.next+'</button></div>':'<p class="mock-results-empty">'+t.empty+'</p>')+
        (onDelete&&ordered.length?'<div class="mock-results-cleanup"><button type="button" id="mockResultsClear">'+(lastLanguage==='en'?'Clear filtered results':'Xoá kết quả đang lọc')+' ('+ordered.length+')</button><span>'+(lastLanguage==='en'?'Exam question banks are kept.':'Giữ nguyên bộ đề. Chỉ xoá các lượt trong bộ lọc hiện tại.')+'</span></div>':'')+
        (selectedRow?detail(selectedRow,all,t):'')+
        '<details class="mock-results-method"><summary>'+t.scoring+'</summary><p>'+t.scoringBody+'</p><p>'+t.official+'</p><a href="'+levelOne+'" target="_blank" rel="noopener noreferrer">'+t.rulesLink+'</a> · <a href="'+source+'" target="_blank" rel="noopener noreferrer">'+t.reportLink+'</a></details>';
      panel.querySelector('#mockResultsBank').onchange=e=>{bankFilter=e.target.value;page=0;selected=null;render()};
      panel.querySelectorAll('[data-result-kind]').forEach(b=>b.onclick=()=>{filter=b.dataset.resultKind;page=0;selected=null;render()});
      panel.querySelectorAll('[data-result-select]').forEach(b=>b.onclick=()=>{selected=rowKey(visible[Number(b.dataset.resultSelect)]);render()});
      const previous=panel.querySelector('#mockResultsPrev'),next=panel.querySelector('#mockResultsNext');if(previous)previous.onclick=()=>{page--;render()};if(next)next.onclick=()=>{page++;render()};
      panel.querySelector('#mockResultsAnswers')?.addEventListener('click',()=>onView(selectedRow.entry,selectedRow.h));
      panel.querySelector('#mockResultsRetry')?.addEventListener('click',()=>onReview(selectedRow.entry,selectedRow.h));
      panel.querySelector('#mockResultsTopics')?.addEventListener('click',()=>onTopics(selectedRow.entry.id));
      panel.querySelector('#mockCompareFrom')?.addEventListener('change',e=>{compareFrom=e.target.value;render()});
      panel.querySelector('#mockCompareTo')?.addEventListener('change',e=>{compareTo=e.target.value;render()});
      panel.querySelector('#mockResultsDelete')?.addEventListener('click',()=>onDelete([selectedRow]));
      panel.querySelector('#mockResultsClear')?.addEventListener('click',()=>onDelete(ordered));
    }
    function detail(r,all,t){
      const topics=Object.entries(r.stats.topics).sort((a,b)=>a[1].correct/a[1].total-b[1].correct/b[1].total);
      const prior=all.filter(x=>x.entry.id===r.entry.id&&x.pct!==null).slice(-12);
      const unassigned=topics.some(([name])=>name==='Chưa phân môn');
      return '<section class="mock-result-detail"><header><div><small>'+t.detail+' · '+t.attempt+' '+(r.index+1)+'</small><h3>'+esc(r.entry.title)+'</h3></div><strong>'+pct(r.pct)+'</strong></header>'+
        '<div class="mock-result-detail-meta"><span>'+r.stats.score+' '+t.correct+'</span><span>'+(r.stats.wrong??'—')+' '+t.wrong+'</span><span>'+(r.stats.blank??'—')+' '+t.blank+'</span><span>'+duration(r.elapsedSeconds)+'</span>'+(r.elapsedSeconds!==null&&r.stats.total?'<span>'+Math.round(r.elapsedSeconds/r.stats.total)+' '+t.seconds+'</span>':'')+'</div>'+
        (r.stats.ungraded?'<p>'+r.stats.ungraded+' '+t.missing+'</p>':'')+
        (r.questions?'<div class="mock-result-detail-actions"><button class="btn" id="mockResultsAnswers">'+t.answers+'</button>'+((r.stats.score<r.stats.gradedTotal)?'<button class="btn ghost" id="mockResultsRetry">'+t.retry+'</button>':'')+'<span>'+t.saved+'</span></div>':'<p>'+t.legacy+'</p>')+
        (onDelete?'<button type="button" class="mock-result-delete" id="mockResultsDelete">'+(document.body.dataset.language==='en'?'Delete this attempt':'Xoá lượt này')+'</button>':'')+
        (prior.length>1?'<div class="mock-results-trend"><h4>'+t.trend+'</h4><div>'+prior.map(x=>'<span title="'+t.attempt+' '+(x.index+1)+'"><b>'+pct(x.pct)+'</b><i style="height:'+Math.max(2,x.pct*.65)+'px"></i><small>'+t.attempt+' '+(x.index+1)+'</small></span>').join('')+'</div></div>':'')+
        (prior.length>1?comparison(r,all,t):'')+
        '<div class="mock-topic-stats"><h4>'+t.topic+'</h4><p>'+t.reference+'</p>'+topics.map(([name,v])=>{
          const value=v.correct/v.total*100;
          return '<div class="mock-result-topic"><span>'+esc(name)+'</span><div class="mock-result-topic-track" role="img" aria-label="'+esc(name)+': '+pct(value)+'"><i style="width:'+value+'%"></i><b class="mark-50"></b><b class="mark-70"></b></div><strong>'+v.correct+'/'+v.total+' · '+pct(value)+'</strong></div>';
        }).join('')+(topics.length?'<div class="mock-topic-axis"><span>0%</span><span>50%</span><span>70%</span><span>100%</span></div>':'<p>'+t.noTopics+'</p>')+'</div>'+
        (topics.some(([name,v])=>name!=='Chưa phân môn'&&v.correct/v.total<.7)?'<p class="mock-results-weak"><b>'+t.weak+':</b> '+topics.filter(([name,v])=>name!=='Chưa phân môn'&&v.correct/v.total<.7).slice(0,3).map(([name,v])=>esc(name)+' ('+pct(v.correct/v.total*100)+')').join(' · ')+'</p>':'')+
        (unassigned?'<p class="mock-results-unassigned">'+t.unassigned+' <button id="mockResultsTopics">'+t.assign+'</button></p>':'')+'</section>';
    }
    return {archive,submit,rows,summarize,questionsFor,reclassify,removeAttempts,correct,hasKey,render,localize:()=>{if(lastLanguage!==(document.body.dataset.language||'vi'))render()}};
  };
})();
