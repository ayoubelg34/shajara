// ═══════════════════════════ CONTEXTUAL BANNER ═══════════════════════════
function renderContextBanner(){
  const now=new Date();
  const day=now.getDay();
  const period=getCurrentPrayerPeriod();
  let pool=[];
  let label='';
  let icon='';

  // Friday special
  if(day===5){
    pool=CONTEXTUAL_REMINDERS.friday;
    label='جمعة مباركة — Jumu\'a Mubarak';
    icon='🕌';
  }
  // Monday/Thursday fasting
  else if(day===1||day===4){
    pool=[...CONTEXTUAL_REMINDERS[period],...CONTEXTUAL_REMINDERS.fasting];
    const dayName=day===1?'Lundi':'Jeudi';
    label=`${CONTEXTUAL_REMINDERS[period]?'Heure de '+period.charAt(0).toUpperCase()+period.slice(1):''} — Jour de jeûne (${dayName})`;
    icon={fajr:'🌅',dhuhr:'☀️',asr:'🌤',maghrib:'🌆',isha:'🌙'}[period]||'📿';
  }
  else {
    pool=CONTEXTUAL_REMINDERS[period]||CONTEXTUAL_REMINDERS.general;
    const names={fajr:'Fajr الفجر',dhuhr:'Dhuhr الظهر',asr:'Asr العصر',maghrib:'Maghrib المغرب',isha:'Isha العشاء'};
    label=names[period]||'Rappel';
    icon={fajr:'🌅',dhuhr:'☀️',asr:'🌤',maghrib:'🌆',isha:'🌙'}[period]||'📿';
  }

  if(!pool.length)pool=CONTEXTUAL_REMINDERS.general;
  const q=pool[Math.floor(Date.now()/3600000)%pool.length];

  document.getElementById('bannerLabel').innerHTML=`${icon} ${label}`;
  document.getElementById('bannerArabic').textContent=q.ar;
  document.getElementById('bannerText').textContent=q.fr;
  document.getElementById('bannerSource').textContent='— '+q.src;
}

// ═══════════════════════════ RENDER TASKS ═══════════════════════════
function makeTaskRow(item,isDone,onToggle,onDelete,checkColor){
  const row=document.createElement('div');
  row.className='task-row'+(isDone?' done':'');
  row.style.setProperty('--cc',checkColor||'#888');
  const check=document.createElement('div');check.className='task-check';
  const icon=document.createElement('div');icon.className='task-icon';icon.textContent=item.icon||'•';
  const info=document.createElement('div');info.className='task-info';
  info.innerHTML=`<div class="task-label">${esc(item.label)}${item.arabic?` <span class="arabic-inline">— ${item.arabic}</span>`:''}</div>${item.sub?`<div class="task-sub">${esc(item.sub)}</div>`:''}${item.time?`<div class="task-sub">🕐 ${item.time}</div>`:''}`;
  row.appendChild(check);row.appendChild(icon);row.appendChild(info);
  if(item.cat){
    const cat=CATS.find(c=>c.id===item.cat)||CATS[4];
    const pill=document.createElement('span');pill.className='task-cat-pill';
    pill.textContent=cat.icon+' '+cat.label;
    pill.style.cssText=`background:${cat.color}18;color:${cat.color};border:1px solid ${cat.color}44;`;
    row.appendChild(pill);
  }
  if(onDelete){
    const del=document.createElement('button');del.className='task-del';del.title='Supprimer';del.textContent='×';
    del.addEventListener('click',e=>{e.stopPropagation();onDelete();});
    row.appendChild(del);
  }
  const toggle=()=>{onToggle();};
  check.addEventListener('click',e=>{e.stopPropagation();toggle();});
  row.addEventListener('click',toggle);
  return row;
}

function renderSection(defList,storeKey,bodyId,progId,checkColor,isSpiritualType){
  const body=document.getElementById(bodyId),prog=document.getElementById(progId);
  const d=getDay(selectedDate);body.innerHTML='';let done=0;
  defList.forEach(item=>{
    const isDone=!!d[storeKey]?.[item.id];if(isDone)done++;
    const row=makeTaskRow(item,isDone,()=>{
      const wasNot=!d[storeKey][item.id];d[storeKey][item.id]=!d[storeKey][item.id];save();
      if(wasNot&&isSpiritualType)triggerWatering();render();
    },null,checkColor);
    body.appendChild(row);
  });
  if(prog)prog.textContent=`${done}/${defList.length}`;
}

function renderCustom(){
  const body=document.getElementById('body-custom'),d=getDay(selectedDate);body.innerHTML='';
  (d.custom||[]).forEach((t,i)=>{
    const cat=CATS.find(c=>c.id===t.cat)||CATS[4];
    const row=makeTaskRow({label:t.label,icon:cat.icon,time:t.time,cat:t.cat},!!t.done,
      ()=>{const wn=!t.done;t.done=!t.done;save();if(wn&&t.cat==='spiritual')triggerWatering();render();},
      ()=>{d.custom.splice(i,1);save();render();},cat.color);
    body.appendChild(row);
  });
  const addRow=document.createElement('div');addRow.className='add-row';
  const inp=document.createElement('input');inp.className='add-input';inp.id='quickAdd';inp.placeholder='Ajouter une tâche rapide (Entrée)...';
  const btn=document.createElement('button');btn.className='add-advanced';btn.title='Options avancées';btn.textContent='⊞';
  btn.addEventListener('click',()=>openModal());
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&inp.value.trim()){addCustomTask(inp.value.trim());}});
  addRow.appendChild(inp);addRow.appendChild(btn);body.appendChild(addRow);
}

function addCustomTask(label){
  getDay(selectedDate).custom.push({id:Date.now().toString(),label,cat:modalCat,done:false});
  save();render();showToast('✦ Tâche ajoutée — Barak Allahu fik !');
}

// ═══════════════════════════ IMAN UI ═══════════════════════════
const LEVELS=[
  {min:0,max:15,label:'Graine 🌱',desc:'Commence ta journée avec Bismillah...'},
  {min:15,max:30,label:'Pousse 🌿',desc:'Les racines s\'ancrent dans la foi.'},
  {min:30,max:50,label:'Arbrisseau 🌳',desc:'Ton arbre prend forme — continue !'},
  {min:50,max:70,label:'Croissance 🌲',desc:'Les branches s\'élèvent vers Allah.'},
  {min:70,max:88,label:'Floraison 🌸',desc:'Ton iman fleurit — Alhamdulillah !'},
  {min:88,max:101,label:'Splendeur ✨',desc:'Quelle belle journée de dévotion ! 🌟'},
];

function updateImanUI(pct){
  document.getElementById('imanFill').style.width=pct+'%';
  document.getElementById('imanPct').textContent=pct+'%';
  const lv=LEVELS.find(l=>pct>=l.min&&pct<l.max)||LEVELS[LEVELS.length-1];
  document.getElementById('imanLvl').textContent=lv.label;
  document.getElementById('imanDesc').textContent=lv.desc;
}

// ═══════════════════════════ PRAYER TIMES UI ═══════════════════════════
function renderPrayerTimes(){
  const times=getPrayerTimesArray(),now=new Date();
  const grid=document.getElementById('prayerMiniGrid');grid.innerHTML='';
  let nextPrayer=null;
  times.forEach(p=>{
    const active=Math.abs(now-p.time)<45*60*1000||(p.time>now&&!nextPrayer);
    if(p.time>now&&!nextPrayer)nextPrayer=p;
    const div=document.createElement('div');div.className='prayer-mini'+(active?' active':'');
    div.innerHTML=`<div class="picon">${p.icon}</div><div class="pname">${p.label}</div><div class="ptime">${fmtTime(p.time)}</div>`;
    grid.appendChild(div);
  });
  if(!nextPrayer)nextPrayer=times[0];
  document.getElementById('nextPrayerName').textContent=nextPrayer.label;
  document.getElementById('nextPrayerTime').textContent=fmtTime(nextPrayer.time);
  updateCountdown(nextPrayer.time);
}

function fmtTime(d){return d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});}

function updateCountdown(target){
  const diff=target-new Date();
  if(diff<0){document.getElementById('countdownVal').textContent='—';return;}
  const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
  document.getElementById('countdownVal').textContent=`${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
}

// ═══════════════════════════ STATS ═══════════════════════════
function renderStats(){
  const container=document.getElementById('catStats');container.innerHTML='';
  const d=getDay(selectedDate),grouped={};
  PRAYERS_DEF.forEach(p=>{acc(grouped,'spiritual',!!d.fard?.[p.id]);});
  SUNNAH_DEF.forEach(s=>{acc(grouped,'spiritual',!!d.sunnah?.[s.id]);});
  ADHKAR_DEF.forEach(a=>{acc(grouped,'spiritual',!!d.adhkar?.[a.id]);});
  (d.custom||[]).forEach(t=>{acc(grouped,t.cat||'personal',!!t.done);});
  CATS.forEach(cat=>{
    const g=grouped[cat.id];if(!g||g.total===0)return;
    const pct=Math.round(g.done/g.total*100);
    const row=document.createElement('div');row.className='stat-row';
    row.innerHTML=`<span class="stat-icon">${cat.icon}</span><div class="stat-info"><div class="stat-name">${cat.label}</div><div class="stat-bar"><div class="stat-fill" style="width:${pct}%;background:${cat.color};color:${cat.color}"></div></div></div><span class="stat-count">${g.done}/${g.total}</span>`;
    container.appendChild(row);
  });
}
function acc(obj,cat,isDone){if(!obj[cat])obj[cat]={done:0,total:0};obj[cat].total++;if(isDone)obj[cat].done++;}

// ═══════════════════════════ BADGES ═══════════════════════════
function renderBadges(){
  const grid=document.getElementById('badgesGrid');grid.innerHTML='';const d=getDay(selectedDate);
  BADGES_DEF.forEach(b=>{
    const earned=b.check(d);const item=document.createElement('div');
    item.className='badge-item'+(earned?' earned':'');item.title=earned?'Acquis !':'Non débloqué';
    item.innerHTML=`<span class="badge-icon">${b.icon}</span><span>${b.label}</span>`;
    grid.appendChild(item);
  });
}

// ═══════════════════════════ STREAK ═══════════════════════════
function renderStreak(){
  const row=document.getElementById('streakRow');row.innerHTML='';
  const todayKey=dateKey(new Date()),today=new Date(),dow=today.getDay();
  const mon=new Date(today);mon.setDate(today.getDate()-(dow===0?6:dow-1));
  const DAY=['L','M','M','J','V','S','D'];
  for(let i=0;i<7;i++){
    const d=new Date(mon);d.setDate(mon.getDate()+i);const k=dateKey(d);
    const sc=getScore(getDay(k));const dot=document.createElement('div');
    dot.className='streak-dot'+(sc>=90?' full':sc>=40?' partial':'')+(k===todayKey?' today':'');
    dot.title=`${DAY[d.getDay()]} — ${sc}%`;dot.textContent=sc>=90?'✓':DAY[d.getDay()];
    row.appendChild(dot);
  }
}

// ═══════════════════════════ WEEK STRIP ═══════════════════════════
function renderWeek(){
  const strip=document.getElementById('weekStrip');strip.innerHTML='';
  const todayKey=dateKey(new Date()),today=new Date(),dow=today.getDay();
  const mon=new Date(today);mon.setDate(today.getDate()-(dow===0?6:dow-1));
  const DAYS=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  for(let i=0;i<7;i++){
    const d=new Date(mon);d.setDate(mon.getDate()+i);const k=dateKey(d);
    const sc=getScore(getDay(k));const btn=document.createElement('div');
    btn.className='day-btn'+(k===selectedDate?' active':'')+(k===todayKey?' today':'');
    btn.innerHTML=`<span class="dlabel">${DAYS[d.getDay()]}</span><span class="dnum">${d.getDate()}</span><span class="dscore">${sc>0?sc+'%':'—'}</span>`;
    btn.addEventListener('click',()=>{selectedDate=k;render();});
    strip.appendChild(btn);
  }
}

// ═══════════════════════════ DATE TITLE ═══════════════════════════
function renderDate(){
  const FDAYS=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const d=new Date(selectedDate+'T00:00:00'),todayKey=dateKey(new Date());
  const prefix=selectedDate===todayKey?"Aujourd'hui — ":'';
  document.title=`${prefix}${FDAYS[d.getDay()]} — شجرة الإيمان`;
}

// ═══════════════════════════ MODAL ═══════════════════════════
function renderCatGrid(){
  const g=document.getElementById('mCatGrid');g.innerHTML='';
  CATS.forEach(c=>{
    const btn=document.createElement('button');btn.className='cat-btn'+(modalCat===c.id?' sel':'');
    btn.style.setProperty('--sc',c.color);btn.textContent=c.icon+' '+c.label;
    btn.addEventListener('click',()=>{modalCat=c.id;renderCatGrid();});
    g.appendChild(btn);
  });
}
function openModal(){modalCat='spiritual';renderCatGrid();document.getElementById('overlay').classList.add('open');setTimeout(()=>document.getElementById('mDesc').focus(),200);}
function closeModal(){document.getElementById('overlay').classList.remove('open');document.getElementById('mDesc').value='';document.getElementById('mTime').value='';}
function maybeClose(e){if(e.target===document.getElementById('overlay'))closeModal();}
function saveModal(){
  const desc=document.getElementById('mDesc').value.trim();if(!desc)return;
  const time=document.getElementById('mTime').value;
  getDay(selectedDate).custom.push({id:Date.now().toString(),label:desc,cat:modalCat,time,done:false});
  save();closeModal();render();showToast('✦ Tâche ajoutée — Barak Allahu fik !');
}

// ═══════════════════════════ TOAST ═══════════════════════════
let toastTimer=null;
function showToast(msg){
  const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3000);
}

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// ═══════════════════════════ MASTER RENDER ═══════════════════════════
function render(){
  renderWeek();renderDate();renderContextBanner();
  renderSection(PRAYERS_DEF,'fard','body-fard','prog-fard','#d4763b',true);
  renderSection(SUNNAH_DEF,'sunnah','body-sunnah','prog-sunnah','#4a9fd4',true);
  renderSection(ADHKAR_DEF,'adhkar','body-adhkar','prog-adhkar','#c9a84c',true);
  renderCustom();
  const pct=getScore(getDay(selectedDate));
  updateImanUI(pct);
  renderStats();renderBadges();renderStreak();renderPrayerTimes();
  
  if (typeof checkEngagementPrompt === 'function') checkEngagementPrompt();
}

// ═══════════════════════════ KEYBOARD ═══════════════════════════
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')closeModal();
  if(e.key==='Enter'&&document.getElementById('overlay').classList.contains('open')&&document.activeElement.id!=='mDesc')saveModal();
});

// ═══════════════════════════ CLOCK TICK ═══════════════════════════
setInterval(()=>{
  const times=getPrayerTimesArray(),now=new Date();
  let next=times.find(p=>p.time>now);
  if(!next){
    next={...times[0]};
    next.time=new Date(next.time.getTime()+86400000); // Add 24 hours
  }
  updateCountdown(next.time);
},1000);
setInterval(()=>{renderPrayerTimes();applyAutoTheme();},60000);

// ═══════════════════════════ ACCORDION TOGGLE ═══════════════════════════
function initAccordions(){
  const sections = document.querySelectorAll('.section');
  sections.forEach(sec=>{
    const head=sec.querySelector('.section-head');
    if(!head)return;
    head.addEventListener('click',e=>{
      // Don't toggle if clicking a checkbox or button inside
      if(e.target.closest('.task-check,.task-del,.add-input,.add-advanced'))return;
      
      const isCollapsed = sec.classList.contains('collapsed');
      
      if(isCollapsed) {
        // Expand this one, collapse others
        sections.forEach(other => {
          if(other !== sec) other.classList.add('collapsed');
        });
        sec.classList.remove('collapsed');
        
        // Scroll into view smoothly after a small delay
        setTimeout(() => {
          head.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else {
        // Just collapse it
        sec.classList.add('collapsed');
      }
      
      // Save state
      const state = {};
      sections.forEach(s => {
        if(s.id) state[s.id] = s.classList.contains('collapsed');
      });
      sessionStorage.setItem('shajara_collapsed',JSON.stringify(state));
    });
  });
  
  // Restore collapsed state
  const saved=JSON.parse(sessionStorage.getItem('shajara_collapsed')||'{}');
  let hasSavedState = false;
  Object.entries(saved).forEach(([id,isCollapsed])=>{
    hasSavedState = true;
    const el=document.getElementById(id);
    if(el) {
      if(isCollapsed) el.classList.add('collapsed');
      else el.classList.remove('collapsed');
    }
  });
  
  // Default start state if no saved state: open the first one (fard), collapse the rest
  if(!hasSavedState){
    let first = true;
    sections.forEach(sec => {
      if(first) {
        sec.classList.remove('collapsed');
        first = false;
      } else {
        sec.classList.add('collapsed');
      }
    });
  }
}

// ═══════════════════════════ REGISTRATION PROMPT (UX) ═══════════════════════════
let hasPromptedRegistration = sessionStorage.getItem('shajara_prompted_reg') === 'true';

// 1. Exit Intent (Desktop only)
document.addEventListener('mouseleave', e => {
  if (e.clientY < 10 && !hasPromptedRegistration && getScore(getDay(selectedDate)) > 0) {
    hasPromptedRegistration = true;
    sessionStorage.setItem('shajara_prompted_reg', 'true');
    document.getElementById('profileOverlay').classList.add('open');
  }
});

// 2. Engagement Prompt
function checkEngagementPrompt() {
  if (hasPromptedRegistration || (typeof isLogged === 'function' && isLogged())) return;
  const score = getScore(getDay(selectedDate));
  if (score >= 30) {
    hasPromptedRegistration = true;
    sessionStorage.setItem('shajara_prompted_reg', 'true');
    setTimeout(() => { openProfileModal(); }, 2000);
  }
}

// 3. Auth UI Handlers
function openProfileModal() {
  const isL = typeof isLogged === 'function' && isLogged();
  document.getElementById('profileIcon').textContent = isL ? '🟢' : '☁️';
  document.getElementById('profileTitle').textContent = isL ? 'Compte Connecté' : 'Sauvegarde ton Arbre !';
  document.getElementById('profileDesc').textContent = isL ? 'Tes données sont synchronisées en toute sécurité sur le serveur.' : 'Ne perds pas ta progression ! Crée un compte gratuitement pour sauvegarder ton arbre sur tous tes appareils.';
  document.getElementById('authForm').style.display = isL ? 'none' : 'block';
  document.getElementById('loggedInView').style.display = isL ? 'block' : 'none';
  document.getElementById('profileOverlay').classList.add('open');
}

async function handleAuth(action) {
  const email = document.getElementById('authEmail').value;
  const pass = document.getElementById('authPassword').value;
  if (!email || !pass) return showToast('⚠️ Remplis tous les champs');
  
  try {
    if (action === 'login') await authLogin(email, pass);
    else await authRegister(email, pass);
    
    if(typeof syncSaveToCloud === 'function') syncSaveToCloud(db, userLocation);
    openProfileModal(); // Refresh view
  } catch (err) {}
}

// ═══════════════════════════ INIT ═══════════════════════════
(async function init(){
  // Cloud sync
  if(typeof syncLoadFromCloud === 'function' && isLogged()) {
    const cloud = await syncLoadFromCloud();
    if(cloud) {
      if(cloud.data && Object.keys(cloud.data).length > 0) {
        db = cloud.data;
        localStorage.setItem('shajara_v3', JSON.stringify(db));
      }
      if(cloud.location) {
        userLocation = cloud.location;
        localStorage.setItem('shajara_loc', JSON.stringify(userLocation));
      }
    }
  }

  if(!userLocation){
    document.getElementById('locOverlay').classList.add('open');
  } else {
    await fetchPrayerTimes();
  }
  applyAutoTheme();
  initAccordions();
  render();
  animateTreeWithEffects();
})();
