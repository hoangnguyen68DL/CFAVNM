/* Baseline-inspired editorial styling around the existing study workflow. */
(()=>{
const root=document.getElementById('appRoot'),goal=document.getElementById('dailyModuleGoal'),home=document.getElementById('ux-page-today');
root.querySelector('.side-brand small')?.replaceChildren(document.createTextNode('CFA CHARTERHOLDER'));
document.body.classList.add('academy-design');
home.prepend(goal);
const account=root.querySelector('.side-bottom'),profile=account.querySelector('.side-profile'),signout=document.getElementById('logoutBtn');
profile.querySelectorAll('br').forEach(n=>n.remove());
signout.innerHTML='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M14 8l4 4-4 4M8 12h10"/></svg><span>Đăng xuất</span>';
account.append(signout);
const avatar=profile.querySelector('.cp-avatar'),candidate=document.getElementById('cpCandidateLabel');
const updateAvatar=()=>{const initial=(candidate.textContent.trim()[0]||'C').toUpperCase();if(avatar.textContent!==initial)avatar.textContent=initial};
new MutationObserver(updateAvatar).observe(candidate,{childList:true,characterData:true,subtree:true});updateAvatar();
const goalTimer=document.createElement('div');goalTimer.className='goal-session-clock';
goalTimer.innerHTML='<div><span class="goal-session-label">PHIÊN HỌC HÔM NAY</span><strong id="goalSessionTime">00:00:00</strong><span id="goalSessionState">Sẵn sàng</span></div><button type="button" id="goalSessionToggle">Bắt đầu</button>';
goal.querySelector('.daily-goal-main').after(goalTimer);
document.getElementById('goalSessionToggle').onclick=()=>document.getElementById('timerBtn').click();
const updateSessionBefore=updateTimerDisplay;
updateTimerDisplay=function(){
 updateSessionBefore();
 const time=document.getElementById('cpLiveSession').textContent,running=!!CharterPrep.getSession().since,elapsed=CharterPrep.sessionMs()>0;
 document.getElementById('goalSessionTime').textContent=time;
 document.getElementById('goalSessionState').textContent=running?'Đang học':elapsed?'Đã tạm dừng':'Sẵn sàng';
 document.getElementById('goalSessionToggle').textContent=running?'Ⅱ Tạm dừng':elapsed?'▶ Tiếp tục':'▶ Bắt đầu';
 goalTimer.classList.toggle('is-running',running);
 document.title=(running?'▶ '+time+' · ':elapsed?'Ⅱ '+time+' · ':'')+'CharterPrep';
};
addEventListener('focus',()=>updateTimerDisplay());
document.addEventListener('visibilitychange',()=>updateTimerDisplay());
updateTimerDisplay();
const label=document.createElement('span');label.className='academy-edition';label.textContent='CHARTERPREP / STUDY ACADEMY';goal.prepend(label);
const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');let lastRoute='';
function reveal(){const route=CharterExperience.getRoute();if(route===lastRoute)return;lastRoute=route;const page=document.getElementById('ux-page-'+route);if(!reduced?.matches&&page?.animate)page.animate([{opacity:.3,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:460,easing:'cubic-bezier(.16,1,.3,1)'});root.querySelector('.header').dataset.section=String(['today','modules','practice','cards','roadmap','schedule','review','mocks','analytics','journal','settings'].indexOf(route)+1).padStart(2,'0')}
addEventListener('charter-route',reveal);reveal();
// Spring feedback runs only while settling, with no scroll or data side effects.
const springs=new WeakMap();function spring(el,target){if(reduced?.matches||innerWidth<=768)return;let state=springs.get(el);if(!state){state={x:0,v:0,target:0,frame:0,last:0};springs.set(el,state)}state.target=target;if(state.frame)return;state.last=performance.now();function tick(t){const dt=Math.min(.025,(t-state.last)/1000);state.last=t;state.v+=(-240*(state.x-state.target)-26*state.v)*dt;state.x+=state.v*dt;el.style.translate=`0 ${state.x}px`;if(Math.abs(state.x-state.target)<.025&&Math.abs(state.v)<.025){el.style.translate=state.target?`0 ${state.target}px`:'';state.frame=0;return}state.frame=requestAnimationFrame(tick)}state.frame=requestAnimationFrame(tick)}
document.addEventListener('pointerover',e=>{const el=e.target.closest('.academy-design .btn,.academy-design .studio-stat');if(el&&!el.contains(e.relatedTarget))spring(el,-1)});document.addEventListener('pointerout',e=>{const el=e.target.closest('.academy-design .btn,.academy-design .studio-stat');if(el&&!el.contains(e.relatedTarget))spring(el,0)});
})();

