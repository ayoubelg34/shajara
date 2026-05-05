'use strict';

// ═══════════════════════════ DATA ═══════════════════════════
const PRAYERS_DEF = [
  { id:'fajr',    label:'Fajr',    arabic:'الفجر',   icon:'🌅', sub:"2 rak'ât" },
  { id:'dhuhr',   label:'Dhuhr',   arabic:'الظهر',  icon:'☀️', sub:"4 rak'ât" },
  { id:'asr',     label:'Asr',     arabic:'العصر',   icon:'🌤', sub:"4 rak'ât" },
  { id:'maghrib', label:'Maghrib', arabic:'المغرب', icon:'🌆', sub:"3 rak'ât" },
  { id:'isha',    label:'Isha',    arabic:'العشاء',  icon:'🌙', sub:"4 rak'ât" },
];
const SUNNAH_DEF = [
  { id:'s_fajr',    label:"Sounnah Fajr",    arabic:'سنة الفجر',    icon:'☽', sub:"2 avant Fajr" },
  { id:'s_dhuhr',   label:"Sounnah Dhuhr",   arabic:'سنة الظهر',   icon:'☽', sub:"4 avant + 2 après" },
  { id:'s_maghrib', label:"Sounnah Maghrib",  arabic:'سنة المغرب',  icon:'☽', sub:"2 après Maghrib" },
  { id:'s_isha',    label:"Sounnah Isha",     arabic:'سنة العشاء',  icon:'☽', sub:"2 après Isha" },
  { id:'s_witr',    label:"Witr",             arabic:'الوتر',       icon:'🌙', sub:"Min. 1 rak'ât" },
];
const ADHKAR_DEF = [
  { id:'a_morning', label:"Adhkâr du Matin",    arabic:'أذكار الصباح',  icon:'📿', sub:"Après Fajr" },
  { id:'a_evening', label:"Adhkâr du Soir",     arabic:'أذكار المساء',  icon:'📿', sub:"Après Asr" },
  { id:'a_quran',   label:"Récitation Quran",    arabic:'تلاوة القرآن',  icon:'📖', sub:"Min. 1 page" },
  { id:'a_salawat', label:"Salawat ﷺ ×100",      arabic:'الصلاة على النبي', icon:'✨', sub:"Vendredi recommandé" },
];
const CATS = [
  { id:'spiritual', label:'Spirituel', icon:'🌿', color:'#c9a84c' },
  { id:'work',      label:'Travail',   icon:'💼', color:'#4a9fd4' },
  { id:'health',    label:'Santé',     icon:'💪', color:'#38c47a' },
  { id:'knowledge', label:'Savoir',    icon:'📚', color:'#9b72cf' },
  { id:'personal',  label:'Personnel', icon:'⭐', color:'#d4763b' },
  { id:'family',    label:'Famille',   icon:'🤲', color:'#e88090' },
];

// CONTEXTUAL REMINDERS by prayer time
const CONTEXTUAL_REMINDERS = {
  fajr: [
    { ar:"مَنْ صَلَّى الْفَجْرَ فِي جَمَاعَةٍ فَكَأَنَّمَا صَلَّى اللَّيْلَ كُلَّهُ", fr:'"Celui qui prie le Fajr en groupe, c\'est comme s\'il avait prié toute la nuit."', src:'Muslim' },
    { ar:"اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ", fr:'"Ô Allah, par Toi nous atteignons le matin et le soir, par Toi nous vivons et mourons."', src:'At-Tirmidhi' },
  ],
  dhuhr: [
    { ar:"مَنْ حَافَظَ عَلَى أَرْبَعِ رَكَعَاتٍ قَبْلَ الظُّهْرِ وَأَرْبَعٍ بَعْدَهَا حَرَّمَهُ اللَّهُ عَلَى النَّارِ", fr:'"Celui qui persévère à prier 4 rak\'at avant et après Dhuhr, Allah lui interdit le Feu."', src:'At-Tirmidhi' },
    { ar:"أَقْرَبُ مَا يَكُونُ الرَّبُّ مِنَ الْعَبْدِ فِي جَوْفِ اللَّيْلِ الْآخِرِ", fr:'"Le plus proche qu\'Allah est de Son serviteur est au milieu de la dernière partie de la nuit."', src:'At-Tirmidhi' },
  ],
  asr: [
    { ar:"مَنْ تَرَكَ صَلَاةَ الْعَصْرِ فَقَدْ حَبِطَ عَمَلُهُ", fr:'"Celui qui délaisse la prière d\'Asr, ses œuvres seront vaines."', src:'Bukhari' },
    { ar:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ", fr:'"Ô Allah, je cherche refuge auprès de Toi contre l\'inquiétude et la tristesse."', src:'Bukhari' },
  ],
  maghrib: [
    { ar:"إِذَا غَرَبَتِ الشَّمْسُ فَكُفُّوا صِبْيَانَكُمْ", fr:'"Quand le soleil se couche, les portes du ciel s\'ouvrent pour l\'invocation."', src:'Muslim' },
    { ar:"أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ", fr:'"Nous voici au soir et la royauté appartient à Allah."', src:'Muslim' },
  ],
  isha: [
    { ar:"مَنْ صَلَّى الْعِشَاءَ فِي جَمَاعَةٍ فَكَأَنَّمَا قَامَ نِصْفَ اللَّيْلِ", fr:'"Celui qui prie Isha en groupe, c\'est comme s\'il avait prié la moitié de la nuit."', src:'Muslim' },
    { ar:"إِنَّ فِي اللَّيْلِ لَسَاعَةً لَا يُوَافِقُهَا رَجُلٌ مُسْلِمٌ يَسْأَلُ اللَّهَ خَيْرًا إِلَّا أَعْطَاهُ إِيَّاهُ", fr:'"Il y a une heure la nuit durant laquelle aucun musulman ne demande du bien sans qu\'Allah le lui accorde."', src:'Muslim' },
  ],
  friday: [
    { ar:"إِنَّ مِنْ أَفْضَلِ أَيَّامِكُمْ يَوْمَ الْجُمُعَةِ", fr:'"Le meilleur de vos jours est le vendredi."', src:'Abu Dawud' },
    { ar:"أَكْثِرُوا الصَّلَاةَ عَلَيَّ يَوْمَ الْجُمُعَةِ", fr:'"Multipliez la prière sur moi le vendredi."', src:'Abu Dawud' },
    { ar:"مَنْ قَرَأَ سُورَةَ الْكَهْفِ يَوْمَ الْجُمُعَةِ أَضَاءَ لَهُ مِنَ النُّورِ مَا بَيْنَ الْجُمُعَتَيْنِ", fr:'"Celui qui lit Sourate Al-Kahf le vendredi, une lumière l\'éclairera entre les deux vendredis."', src:'Al-Hakim' },
  ],
  fasting: [
    { ar:"مَنْ صَامَ يَوْمًا فِي سَبِيلِ اللَّهِ بَعَّدَ اللَّهُ وَجْهَهُ عَنِ النَّارِ سَبْعِينَ خَرِيفًا", fr:'"Quiconque jeûne un jour pour Allah, Allah éloignera son visage du Feu de 70 ans."', src:'Bukhari & Muslim' },
  ],
  general: [
    { ar:"إِنَّ مَعَ الْعُسْرِ يُسْرًا", fr:'"Certes, avec la difficulté vient la facilité."', src:'Al-Inshirah 94:6' },
    { ar:"وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", fr:'"Quiconque place sa confiance en Allah, Il lui suffira."', src:'At-Talaq 65:3' },
    { ar:"الصَّلَاةُ عِمَادُ الدِّينِ", fr:'"La prière est le pilier de la religion."', src:'Al-Bayhaqi' },
    { ar:"خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", fr:'"Le meilleur d\'entre vous est celui qui apprend le Quran et l\'enseigne."', src:'Bukhari' },
  ],
};

const BADGES_DEF = [
  { id:'fajr_done',    icon:'🌅', label:'Fajr accompli',     check: d => !!d.fard?.fajr },
  { id:'all_fard',     icon:'🕌', label:'5 prières ✓',       check: d => PRAYERS_DEF.every(p=>d.fard?.[p.id]) },
  { id:'all_spiritual',icon:'💎', label:'Iman complet',       check: d => getScore(d)>=90 },
  { id:'witr',         icon:'🌙', label:'Witr accompli',      check: d => !!d.sunnah?.s_witr },
  { id:'quran',        icon:'📖', label:'Quran récité',       check: d => !!d.adhkar?.a_quran },
  { id:'morning_eve',  icon:'📿', label:'Adhkâr ×2',         check: d => !!(d.adhkar?.a_morning && d.adhkar?.a_evening) },
  { id:'tasks3',       icon:'✦',  label:'3 tâches faites',    check: d => (d.custom||[]).filter(t=>t.done).length >= 3 },
];

// ═══════════════════════════ STATE ═══════════════════════════
let selectedDate = dateKey(new Date());
let db = {};
try { db = JSON.parse(localStorage.getItem('shajara_v3')||'{}'); } catch {}
let modalCat = 'spiritual';
let animating = false;
let prayerTimesCache = null;
let userLocation = null;
try { userLocation = JSON.parse(localStorage.getItem('shajara_loc')); } catch {}

function dateKey(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function getDay(k){ if(!db[k]) db[k]={fard:{},sunnah:{},adhkar:{},custom:[]}; if(!db[k].custom) db[k].custom=[]; return db[k]; }
function save(){
  try{ localStorage.setItem('shajara_v3',JSON.stringify(db)); }catch{}
  if(typeof syncSaveToCloud === 'function') syncSaveToCloud(db, userLocation);
}

function getScore(d){
  let done=0,total=0;
  PRAYERS_DEF.forEach(p=>{ total+=3; if(d.fard?.[p.id]) done+=3; });
  SUNNAH_DEF.forEach(s=>{ total+=1.5; if(d.sunnah?.[s.id]) done+=1.5; });
  ADHKAR_DEF.forEach(a=>{ total+=1; if(d.adhkar?.[a.id]) done+=1; });
  (d.custom||[]).forEach(t=>{ total+=0.5; if(t.done) done+=0.5; });
  return total===0 ? 0 : Math.min(100,Math.round(done/total*100));
}

// ═══════════════════════════ GEOLOCATION & PRAYER API ═══════════════════════════
const CITIES = {
  'paris':     {lat:48.8566,lng:2.3522},
  'lyon':      {lat:45.7640,lng:4.8357},
  'marseille': {lat:43.2965,lng:5.3698},
  'toulouse':  {lat:43.6047,lng:1.4442},
  'lille':     {lat:50.6292,lng:3.0573},
  'bordeaux':  {lat:44.8378,lng:-0.5792},
  'strasbourg':{lat:48.5734,lng:7.7521},
  'nantes':    {lat:47.2184,lng:-1.5536},
  'nice':      {lat:43.7102,lng:7.2620},
  'montpellier':{lat:43.6108,lng:3.8767},
  'rennes':    {lat:48.1173,lng:-1.6778},
  'alger':     {lat:36.7538,lng:3.0588},
  'casablanca':{lat:33.5731,lng:-7.5898},
  'tunis':     {lat:36.8065,lng:10.1815},
  'bruxelles': {lat:50.8503,lng:4.3517},
};

function requestGeolocation(){
  if(!navigator.geolocation){
    showToast('⚠️ Géolocalisation non supportée');
    showManualCity();
    return;
  }
  document.getElementById('locGeoBtn').textContent='📍 Recherche...';
  navigator.geolocation.getCurrentPosition(
    pos => {
      userLocation = {lat:pos.coords.latitude, lng:pos.coords.longitude, src:'geo'};
      localStorage.setItem('shajara_loc',JSON.stringify(userLocation));
      save();
      document.getElementById('locOverlay').classList.remove('open');
      showToast('📍 Position enregistrée — Barak Allahu fik !');
      fetchPrayerTimes().then(()=>{ applyAutoTheme(); render(); });
    },
    () => {
      showToast('⚠️ Permission refusée — saisis ta ville');
      document.getElementById('locGeoBtn').textContent='📍 Utiliser ma position';
      showManualCity();
    }
  );
}
function showManualCity(){ document.getElementById('locManual').classList.add('show'); document.getElementById('locCity').focus(); }
function saveManualCity(){
  const city = document.getElementById('locCity').value.trim().toLowerCase();
  if(!city) return;
  const match = CITIES[city];
  if(match){
    userLocation = {lat:match.lat, lng:match.lng, city, src:'manual'};
  } else {
    userLocation = {lat:48.8566, lng:2.3522, city, src:'manual-default'};
    showToast('Ville non trouvée — Paris par défaut');
  }
  localStorage.setItem('shajara_loc',JSON.stringify(userLocation));
  save();
  document.getElementById('locOverlay').classList.remove('open');
  fetchPrayerTimes().then(()=>{ applyAutoTheme(); render(); });
}

async function fetchPrayerTimes(){
  if(!userLocation) return;
  const today = new Date();
  const dd = today.getDate(), mm = today.getMonth()+1, yy = today.getFullYear();
  try{
    const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yy}?latitude=${userLocation.lat}&longitude=${userLocation.lng}&method=3`;
    const res = await fetch(url);
    const data = await res.json();
    if(data.code===200){
      const t = data.data.timings;
      prayerTimesCache = {
        fajr:t.Fajr, dhuhr:t.Dhuhr, asr:t.Asr, maghrib:t.Maghrib, isha:t.Isha,
        sunrise:t.Sunrise, sunset:t.Sunset, date:dateKey(today)
      };
      localStorage.setItem('shajara_prayer_cache',JSON.stringify(prayerTimesCache));
    }
  }catch(e){
    console.warn('Prayer API error',e);
  }
  if(!prayerTimesCache){
    try{ prayerTimesCache = JSON.parse(localStorage.getItem('shajara_prayer_cache')); }catch{}
  }
}

function getPrayerTimesArray(){
  const now = new Date();
  if(prayerTimesCache){
    const parse = (s)=>{ const [h,m]=s.split(':').map(Number); const d=new Date(now); d.setHours(h,m,0,0); return d; };
    return [
      {id:'fajr',label:'Fajr',time:parse(prayerTimesCache.fajr),icon:'🌅'},
      {id:'dhuhr',label:'Dhuhr',time:parse(prayerTimesCache.dhuhr),icon:'☀️'},
      {id:'asr',label:'Asr',time:parse(prayerTimesCache.asr),icon:'🌤'},
      {id:'maghrib',label:'Maghrib',time:parse(prayerTimesCache.maghrib),icon:'🌆'},
      {id:'isha',label:'Isha',time:parse(prayerTimesCache.isha),icon:'🌙'},
    ];
  }
  // Fallback Paris
  const setHM=(h,m)=>{const d=new Date(now);d.setHours(h,m,0,0);return d;};
  return [
    {id:'fajr',label:'Fajr',time:setHM(4,30),icon:'🌅'},
    {id:'dhuhr',label:'Dhuhr',time:setHM(13,0),icon:'☀️'},
    {id:'asr',label:'Asr',time:setHM(17,0),icon:'🌤'},
    {id:'maghrib',label:'Maghrib',time:setHM(21,0),icon:'🌆'},
    {id:'isha',label:'Isha',time:setHM(22,30),icon:'🌙'},
  ];
}

function getCurrentPrayerPeriod(){
  const times = getPrayerTimesArray();
  const now = new Date();
  for(let i=times.length-1;i>=0;i--){
    if(now>=times[i].time) return times[i].id;
  }
  return 'isha';
}

// ═══════════════════════════ AUTO THEME ═══════════════════════════
function applyAutoTheme(){
  const manualOverride = sessionStorage.getItem('shajara_manual_theme');
  if(manualOverride) return;
  const times = getPrayerTimesArray();
  const now = new Date();
  const fajr = times[0].time;
  const maghrib = times[3].time;
  const isDark = now >= maghrib || now < fajr;
  document.documentElement.setAttribute('data-theme', isDark?'dark':'light');
}

document.getElementById('themeToggle').addEventListener('click', ()=>{
  const html=document.documentElement;
  const next = html.getAttribute('data-theme')==='dark'?'light':'dark';
  html.setAttribute('data-theme', next);
  sessionStorage.setItem('shajara_manual_theme', next);
});
