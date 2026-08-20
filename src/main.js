import * as THREE from 'three';
import './style.css';
import {CARS,TRACKS,EVENTS,ACHIEVEMENTS,UPGRADE_KEYS,upgradeCost} from './data.js';
import {AudioSystem} from './audio.js';
import {createVisualMaterials,createDetailedCar,decorateEnvironment,updateDetailedCarVisual,updateEnvironmentVisuals} from './visuals.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RaceVFX} from './vfx.js';
import {
  currentPlayer,
  firebaseConfigured,
  logoutPlayer,
  markInstalled,
  refreshPlayerToken,
  registerPlayer,
  setAnalyticsEnabled,
  setAnalyticsUser,
  setPlayerProperties,
  signInGoogle,
  startAnalytics,
  syncPlayerStats,
  trackEvent,
  trackScreen,
  watchAuth,
  watchPlayerAdmin
} from './firebase.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], clamp=THREE.MathUtils.clamp, lerp=THREE.MathUtils.lerp;
const SAVE_KEY='velocityLegendsFinal:v1';
const fresh={credits:3500,selectedCar:'vortex',unlocked:['vortex'],completed:{},best:{},upgrades:{},carColors:{},achievements:{},sound:true,music:true,quality:'high',camera:'dynamic',analytics:true,tiltSteering:true,vibration:true,daily:0,lastDaily:'',lastCreditGrantId:''};
let profile={...fresh};try{profile={...fresh,...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}}catch{}
profile.unlocked=Array.isArray(profile.unlocked)?profile.unlocked:['vortex'];profile.upgrades=profile.upgrades||{};profile.carColors=profile.carColors||{};profile.achievements=profile.achievements||{};
const save=()=>{localStorage.setItem(SAVE_KEY,JSON.stringify(profile));if(typeof firebaseUser!=='undefined'&&firebaseUser)syncPlayerStats(firebaseUser,{credits:profile.credits,selectedCar:profile.selectedCar,careerCompleted:Object.keys(profile.completed||{}).length}).catch(()=>{})};
const audio=new AudioSystem();
startAnalytics(profile.analytics!==false).then(()=>{setPlayerProperties({selected_car:profile.selectedCar,graphics_quality:profile.quality});});

let deferredPrompt = null;
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
let firstLaunchResolved = isStandalone();

async function requestInstallOnFirstLaunch() {
  if (isStandalone()) return 'installed';
  if (!deferredPrompt) return 'unavailable';
  try {
    trackEvent('install_prompt_opened', { source: 'startup_gate' });
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    trackEvent('install_prompt_result', { outcome: result.outcome, source: 'startup_gate' });
    return result.outcome;
  } catch (error) {
    console.info('Install prompt was not available:', error);
    return 'unavailable';
  } finally {
    deferredPrompt = null;
  }
}

const app=$('#app');app.innerHTML=`
<div id="game"></div><canvas id="minimap" width="190" height="130"></canvas>
<div id="fx"><div class="vignette"></div><div class="speedlines"></div><div class="chromatic"></div><div class="nitroFlash"></div><div class="cinematicBars"><i></i><i></i></div></div>
<div class="overlay" id="hud" hidden>
 <div class="topbar"><div class="hud-left"><div class="pill" id="lap">LAP 1/3</div><div class="pill weather" id="weatherHud">CLEAR</div></div><div class="hud-right"><div class="pill" id="modeHud">CLASSIC</div><div class="pill" id="pos">1 / 6</div><div class="pill" id="time">00:00.000</div><button id="pauseBtn" class="pauseBtn">Ⅱ</button></div></div>
 <div class="objective" id="objective"></div><div class="combo" id="combo"></div><div class="airtime" id="airtime"></div><div class="stunt" id="stunt"></div><div class="knockdowns" id="knockdowns"></div>
 <div class="nitro-label">NITRO <b id="nitroState"></b></div><div class="nitro"><i id="nitroFill"></i></div>
 <div class="speed"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52"></circle><path id="speedArc" d="M 20 84 A 48 48 0 1 1 100 84"></path></svg><div><b id="speed">0</b><br><small>KM/H</small><em id="gear">N</em></div></div>
 <div class="mobile"><button class="touch brakeMobile" id="brake">BRAKE</button><button class="touch boost" id="boost">N₂O</button></div>
</div>
<div id="countdown" class="countdown"></div><div id="toastZone"></div><div id="shell" class="menu"></div>`;
const shell=$('#shell');
let activeMenu='boot';
let historyRender=false;
let tiltRaw=0,tiltNeutral=0,tiltFiltered=0,tiltPermissionAsked=false;
history.replaceState({vlScreen:'boot'},'',location.href);

function pushGameHistory(screen){
  activeMenu=screen;
  if(historyRender){historyRender=false;return;}
  if(history.state?.vlScreen===screen)return;
  history.pushState({vlScreen:screen},'',location.href);
}
function vibrate(pattern){
  if(profile.vibration!==false&&navigator.vibrate) navigator.vibrate(pattern);
}
function orientationSteer(event){
  const angle=screen.orientation?.angle ?? window.orientation ?? 0;
  let value=Number(event.gamma||0);
  if(Math.abs(angle)===90) value=(angle===90?-1:1)*Number(event.beta||0);
  tiltRaw=clamp(value/28,-1,1);
}
addEventListener('deviceorientation',orientationSteer,true);
async function enableTiltControl(){
  if(profile.tiltSteering===false)return false;
  try{
    if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'&&!tiltPermissionAsked){
      tiltPermissionAsked=true;
      const allowed=await DeviceOrientationEvent.requestPermission();
      if(allowed!=='granted')return false;
    }
    tiltNeutral=tiltRaw;
    return true;
  }catch{return false}
}
function tiltInput(){
  if(profile.tiltSteering===false)return 0;
  const target=clamp((tiltRaw-tiltNeutral)*1.55,-1,1);
  tiltFiltered=lerp(tiltFiltered,target,.16);
  return Math.abs(tiltFiltered)<.06?0:tiltFiltered;
}
let firebaseUser = null;
let stopAdminWatch = null;
let gameBooted = false;

function removeAccountGate(){
  document.querySelector('#accountGate')?.remove();
}

function accountGate(content){
  removeAccountGate();
  const gate=document.createElement('div');
  gate.id='accountGate';
  gate.className='accountGate';
  gate.innerHTML=`<div class="accountCard"><img class="accountLogo" src="${import.meta.env.BASE_URL}icons/icon-192.png" alt="Velocity Legends"><div class="accountBrand">VELOCITY LEGENDS</div>${content}</div>`;
  document.body.append(gate);
  return gate;
}

async function firstLaunchGate(next){
  if(isStandalone()) return next();
  const gate=accountGate(`<small>INSTALL VELOCITY LEGENDS</small><h2>PLAY LIKE A REAL APP</h2><p>Install the game for full-screen play, the Velocity Legends icon, faster repeat loading and offline-ready game files.</p><button class="button accountMain" id="continueFirstLaunch">INSTALL & CONTINUE</button><button class="accountLink" id="continueWeb">CONTINUE IN BROWSER</button><div class="accountError" id="installHelp"></div>`);
  const proceed=()=>{firstLaunchResolved=true;removeAccountGate();next();};
  gate.querySelector('#continueFirstLaunch').onclick=async()=>{
    audio.resume();
    const outcome=await requestInstallOnFirstLaunch();
    if(outcome==='accepted'||isStandalone()) return proceed();
    if(outcome==='dismissed') return;
    const help=gate.querySelector('#installHelp');
    help.textContent=/iPhone|iPad|iPod/i.test(navigator.userAgent)
      ? 'On iPhone/iPad: Share → Add to Home Screen.'
      : 'Chrome has not offered installation yet. Use browser menu → Install app / Add to Home screen.';
  };
  gate.querySelector('#continueWeb').onclick=proceed;
}

function showFirebaseMissing(){
  accountGate(`<small>SETUP REQUIRED</small><h2>FIREBASE NOT CONNECTED</h2><p>Add your Firebase values to the project environment before publishing this build.</p>`);
}

function showLogin(){
  const gate=accountGate(`<small>PLAYER ACCOUNT</small><h2>SIGN IN TO PLAY</h2><p>Your game progress stays on this device. Your verified account lets the game identify your player profile.</p><button class="googleLogin" id="googleLogin"><span>G</span> CONTINUE WITH GOOGLE</button><div class="accountError" id="accountError"></div>`);
  gate.querySelector('#googleLogin').onclick=async()=>{
    const btn=gate.querySelector('#googleLogin'),err=gate.querySelector('#accountError');
    btn.disabled=true;err.textContent='';
    try{
      const user=await signInGoogle();
      firebaseUser=user;
      setAnalyticsUser(user.uid);
      await registerPlayer(user,isStandalone());
      finishAccountLogin(user);
    }catch(error){
      console.warn(error);
      err.textContent=error?.code==='auth/popup-closed-by-user'?'Sign-in was cancelled.':'Google sign-in failed. Check Firebase Authentication setup.';
      btn.disabled=false;
    }
  };
}

function showBlocked(){
  state='blocked';
  $('#hud').hidden=true;
  $('#minimap').style.display='none';
  shell.style.display='none';
  accountGate(`<small>ACCOUNT STATUS</small><h2>ACCESS BLOCKED</h2><p>This player account has been blocked by the game administrator.</p><button class="button secondary" id="blockedLogout">SIGN OUT</button>`).querySelector('#blockedLogout').onclick=async()=>{await logoutPlayer();showLogin()};
}

function applyAdminControls(data={}){
  if(data.blocked===true){showBlocked();return}

  let changed=false;

  // Admin can edit either creditsOverride or the visible lastKnownCredits field.
  const adminCredits=data.creditsOverride ?? data.lastKnownCredits;
  if(adminCredits!==undefined && Number.isFinite(Number(adminCredits)) && Number(adminCredits)>=0){
    const next=Math.round(Number(adminCredits));
    if(profile.credits!==next){profile.credits=next;changed=true}
  }

  // One-time add/remove credits. Change creditGrantId each time you want it applied.
  const grantId=String(data.creditGrantId||'').trim();
  const grant=Number(data.creditGrant||0);
  if(grantId && grantId!==profile.lastCreditGrantId && Number.isFinite(grant) && grant!==0){
    profile.credits=Math.max(0,profile.credits+Math.round(grant));
    profile.lastCreditGrantId=grantId;
    changed=true;
    if(gameBooted) toast(`${grant>0?'+':''}${Math.round(grant)} ADMIN CREDITS`,'good');
  }

  // Firestore array: unlockedCars = ['vortex','razor', ...]
  if(Array.isArray(data.unlockedCars)){
    const valid=[...new Set(data.unlockedCars.filter(id=>CARS.some(c=>c.id===id)))];
    if(!valid.includes('vortex'))valid.unshift('vortex');
    if(JSON.stringify(valid)!==JSON.stringify(profile.unlocked)){profile.unlocked=valid;changed=true}
  }

  // Firestore array: lockedCars = ['razor', ...] removes those cars from the garage.
  if(Array.isArray(data.lockedCars) && data.lockedCars.length){
    const locked=new Set(data.lockedCars);
    const next=profile.unlocked.filter(id=>id==='vortex'||!locked.has(id));
    if(JSON.stringify(next)!==JSON.stringify(profile.unlocked)){profile.unlocked=next;changed=true}
  }

  // Firestore array containing achievement IDs. This becomes the exact earned set.
  if(Array.isArray(data.unlockedAchievements)){
    const next={};
    for(const id of data.unlockedAchievements){if(ACHIEVEMENTS.some(a=>a.id===id))next[id]=true}
    if(JSON.stringify(next)!==JSON.stringify(profile.achievements)){profile.achievements=next;changed=true}
  }

  if(!profile.unlocked.includes(profile.selectedCar)){profile.selectedCar=profile.unlocked[0]||'vortex';changed=true}
  if(changed){save();if(gameBooted&&state==='menu')home()}
  if(state==='blocked') home();
}

function startAdminWatch(user){
  stopAdminWatch?.();
  stopAdminWatch=watchPlayerAdmin(user.uid,applyAdminControls,(error)=>console.warn('Player control sync failed:',error));
}

async function finishAccountLogin(user){
  firebaseUser=user;
  setAnalyticsUser(user.uid);
  await registerPlayer(user,isStandalone()).catch(()=>{});
  startAdminWatch(user);
  removeAccountGate();
  if(!gameBooted){
    gameBooted=true;
    home();
    buildWorld(EVENTS[0]);
    spawnRace();
    $('#minimap').style.display='none';
    animate(performance.now());
  }else if(state==='blocked'){
    home();
  }
}

function accountScreen(){
  const user=firebaseUser||currentPlayer();
  const email=user?.email||'Not available';
  menuChrome('ACCOUNT',`<div class="accountPanel"><div class="accountAvatar">${user?.photoURL?`<img src="${user.photoURL}" alt="">`:'VL'}</div><div><small>PLAYER</small><h3>${user?.displayName||'Velocity Legends Player'}</h3><p>${email}</p><p class="uidLine">UID ${user?.uid||'-'}</p></div></div><div class="resultBtns"><button class="button danger" id="logoutAccount">SIGN OUT</button><button class="button secondary" id="accountBack">← BACK</button></div>`);
  $('#logoutAccount').onclick=async()=>{stopAdminWatch?.();stopAdminWatch=null;firebaseUser=null;await logoutPlayer();showLogin()};
  $('#accountBack').onclick=settings;
}

function startAccountBoot(){
  firstLaunchGate(()=>{
    if(!firebaseConfigured()){showFirebaseMissing();return}
    watchAuth(async(user)=>{
      if(!user){firebaseUser=null;showLogin();return}
      firebaseUser=user;
      setAnalyticsUser(user.uid);
      try{await registerPlayer(user,isStandalone())}catch{}
      finishAccountLogin(user);
    });
  });
  setInterval(async()=>{
    if(!currentPlayer())return;
    try{await refreshPlayerToken()}catch{stopAdminWatch?.();stopAdminWatch=null;firebaseUser=null;showLogin()}
  },300000);
}

const carById=id=>CARS.find(c=>c.id===id)||CARS[0],eventById=id=>EVENTS.find(e=>e.id===id)||EVENTS[0], trackById=id=>TRACKS[id]||TRACKS.coast;
const credits=()=>profile.credits.toLocaleString('en-IN');
function ensureUpgrade(id){profile.upgrades[id]??={engine:0,handling:0,nitro:0};return profile.upgrades[id]}
function carColor(id){const c=carById(id);return Number.isFinite(profile.carColors[id])?profile.carColors[id]:c.color}
function tunedCar(id){const c={...carById(id)},u=ensureUpgrade(id);c.color=carColor(id);c.top+=u.engine*1.25;c.accel+=u.engine*1.05;c.handling+=u.handling*.035;c.nitro+=u.nitro*.035;return c}
function menuChrome(title,body,sub=''){pushGameHistory(title.toLowerCase());destroyGaragePreview();destroyHomePreview();shell.style.display='grid';shell.innerHTML=`<div class="gameTop"><div class="brandMini"><b>VL</b><span>VELOCITY LEGENDS</span></div><div class="topResource"><span>⚡ 12/12</span><span>◈ ${credits()}</span><span>⬡ ${Math.floor(profile.credits/12)}</span><button class="gearMini" id="topSettings">⚙</button></div></div><div class="panel wide"><div class="menuhead"><div><div class="eyebrow">VELOCITY LEGENDS • WORLD TOUR</div><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}</div></div>${body}</div>`;setTimeout(()=>{const x=$('#topSettings');if(x)x.onclick=settings},0);}
function toast(t,kind='info'){const zone=$('#toastZone');zone.replaceChildren();const x=document.createElement('div');x.className=`toast ${kind}`;x.textContent=t;zone.append(x);setTimeout(()=>x.remove(),2100)}
function todayKey(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}
function claimDaily(){const key=todayKey();if(profile.lastDaily===key)return false;profile.daily=(profile.daily||0)+1;const reward=500+Math.min(6,profile.daily%7)*250;profile.credits+=reward;profile.lastDaily=key;save();setTimeout(()=>{audio.reward();toast(`DAILY REWARD +${reward} CR`,'good')},450);return true}
function progressCount(){return Object.keys(profile.completed).length}
function checkAchievements(stats={}){const tests={firstwin:progressCount()>=1,collector:profile.unlocked.length>=4,speed250:(stats.topSpeed||0)>=250,drifter:(stats.maxCombo||0)>=5,career5:progressCount()>=5,career15:progressCount()>=15};ACHIEVEMENTS.forEach(a=>{if(tests[a.id]&&!profile.achievements[a.id]){profile.achievements[a.id]=true;profile.credits+=a.reward;audio.reward();toast(`ACHIEVEMENT: ${a.name} +${a.reward} CR`,'good')}});save()}

function home(){state='menu';trackScreen('home');claimDaily();const c={...carById(profile.selectedCar),color:carColor(profile.selectedCar)},done=progressCount();menuChrome('VELOCITY LEGENDS',`<div class="homeShowcase"><div class="homeNav"><button id="garage">▣ <span>GARAGE</span></button><button id="career">◆ <span>CAREER</span></button><button id="quick">◉ <span>QUICK RACE</span></button><button id="practice">∞ <span>ENDLESS</span></button><button id="ach">★ <span>ACHIEVEMENTS</span></button><button id="settings">⚙ <span>SETTINGS</span></button></div><div class="homeStage"><div id="home3d"></div><div class="homeCarName"><small>SELECTED • CLASS ${c.class}</small><b>${c.name}</b><span>WORLD TOUR ${done}/15 • GARAGE ${profile.unlocked.length}/12</span></div></div><aside class="homeEvents"><div class="eventPromo"><small>NEW CAR</small><b>${CARS[Math.min(profile.unlocked.length+2,CARS.length-1)].name}</b><span>Unlock through career progression</span></div><div class="eventPromo gold"><small>SPECIAL EVENT</small><b>LEGENDS TOUR</b><span>Win exclusive rewards</span></div><button class="playCareer" id="playCareer">PLAY <span>CAREER</span></button></aside></div><div class="homeFooter"><button id="help">⌨ <span>CONTROLS</span></button><span>HIGH-SPEED 3D ARCADE RACING</span><b>LV ${Math.max(1,done+1)}</b></div>`);mountHomePreview(c);$('#career').onclick=career;$('#playCareer').onclick=career;$('#quick').onclick=quickRace;$('#garage').onclick=garage;$('#ach').onclick=achievements;$('#settings').onclick=settings;$('#practice').onclick=endlessPractice;$('#help').onclick=help;audio.startMusic();}
function career(){trackScreen('career');trackEvent('career_opened',{completed_events:progressCount()});const chapters=[1,2,3,4];menuChrome('CAREER',`<div class="chapterTabs">${chapters.map(n=>`<button class="tab" data-ch="${n}">CHAPTER ${n}</button>`).join('')}</div><div id="careerEvents"></div><button class="button secondary" id="back">← BACK</button>`,'Win events to unlock the next challenge. Recommended class rises through the career.');
function render(ch=1){$('#careerEvents').innerHTML=`<div class="eventList">${EVENTS.filter(e=>e.chapter===ch).map((e)=>{const idx=EVENTS.indexOf(e),unlocked=idx===0||profile.completed[EVENTS[idx-1].id],tr=trackById(e.track),req=CARS[e.recommended]?.class||'D';return `<button class="eventCard ${unlocked?'':'locked'}" data-event="${e.id}" ${unlocked?'':'disabled'}><small>${tr.name} • ${e.mode}</small><b>${e.name}</b><span>${e.laps} laps • ${e.ai} rivals • REC. ${req}</span><em>◈ ${e.reward} CR</em>${profile.completed[e.id]?'<strong>✓ CLEARED</strong>':unlocked?'<strong class="ready">READY</strong>':'<strong>LOCKED</strong>'}</button>`}).join('')}</div>`;$$('[data-event]').forEach(b=>b.onclick=()=>raceSetup(eventById(b.dataset.event)));}
$$('[data-ch]').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');render(+b.dataset.ch)});$('.tab').classList.add('active');render(1);$('#back').onclick=home;}

function endlessPractice(){trackEvent('practice_selected');raceSetup({id:'practice',name:'Endless Practice',track:'practice',mode:'Practice',laps:999999,ai:0,reward:0,target:0,quick:true,endless:true});}
function quickRace(){trackScreen('quick_race');menuChrome('QUICK RACE',`<div class="trackGrid">${Object.entries(TRACKS).filter(([id])=>id!=='practice').map(([id,t])=>`<button class="trackCard" data-track="${id}" style="--accent:#${t.accent.toString(16).padStart(6,'0')}"><small>${t.weather.toUpperCase()}</small><b>${t.name}</b><span>${t.shape.toUpperCase()} CIRCUIT</span></button>`).join('')}<button class="trackCard" id="practiceCard" style="--accent:#54f6c7"><small>TRAINING</small><b>Endless Practice</b><span>NO RIVALS • NO MINIMAP • DRIVE FOREVER</span></button></div><div class="quickOptions"><label>MODE <select id="qmode"><option>Classic</option><option>Time Attack</option><option>Knockout</option></select></label><label>LAPS <select id="qlaps"><option>2</option><option selected>3</option><option>4</option><option>5</option></select></label></div><button class="button secondary" id="back">← BACK</button>`,'Practice or race any environment without affecting career unlock order.');
$$('[data-track]').forEach(b=>b.onclick=()=>{const mode=$('#qmode').value,laps=+$(' #qlaps'.trim()).value;raceSetup({id:'quick',name:`${trackById(b.dataset.track).name} Quick Race`,track:b.dataset.track,mode,laps,ai:6,reward:500,target:laps*36000,quick:true})});$('#practiceCard').onclick=endlessPractice;$('#back').onclick=home;}

function garage(){
 trackScreen('garage');
 state='garage';
 const selectedBase=carById(profile.selectedCar),selected={...selectedBase,color:carColor(selectedBase.id)},selectedOwned=profile.unlocked.includes(selected.id);
 const paintColors=[0xffffff,0x111318,0xff263f,0xff7a20,0xffd42a,0x24d970,0x15b8ff,0x3154ff,0x8e48ff,0xe23fd0,0xb9c2cc,0x7a2d15];
 menuChrome('GARAGE',`<div class="garageShowroom"><div class="showroomStage"><div id="garage3d" aria-label="3D preview of ${selected.name}"></div><div class="showroomFloor"></div><div class="showroomInfo"><small>${selected.style.toUpperCase()} • CLASS ${selected.class}</small><b>${selected.name}</b><span>Drag/rotate view automatically • Paint is saved per car</span></div></div><div class="paintPanel"><small>CUSTOMIZATION</small><h3>BODY PAINT</h3><div class="paintSwatches">${paintColors.map(v=>`<button class="paintSwatch ${v===selected.color?'active':''}" data-paint="${v}" style="--paint:#${v.toString(16).padStart(6,'0')}" ${selectedOwned?'':'disabled'} aria-label="Change paint"></button>`).join('')}</div><label class="customPaint">CUSTOM COLOR <input id="customPaint" type="color" value="#${selected.color.toString(16).padStart(6,'0')}" ${selectedOwned?'':'disabled'}></label><button class="button" id="upgradeSelected" ${selectedOwned?'':'disabled'}>TUNE SELECTED CAR</button></div></div><div class="carGrid">${CARS.map(c=>{const own=profile.unlocked.includes(c.id),sel=profile.selectedCar===c.id,u=ensureUpgrade(c.id),col=carColor(c.id);return `<div class="carCard ${sel?'selected':''}"><div class="classBadge">${c.class}</div><div class="carPreview ${c.style}" style="--car:#${col.toString(16).padStart(6,'0')}"><i></i><span class="wheel w1"></span><span class="wheel w2"></span></div><small>${own?'OWNED':'LOCKED'} • ${(c.style||'GT').toUpperCase()} • TUNE ${u.engine+u.handling+u.nitro}/15</small><b>${c.name}</b><div class="stats"><span>TOP<i style="width:${Math.min(100,c.top/74*100)}%"></i></span><span>ACC<i style="width:${Math.min(100,c.accel/41*100)}%"></i></span><span>HAND<i style="width:${Math.min(100,c.handling/1.5*100)}%"></i></span><span>N₂O<i style="width:${Math.min(100,c.nitro/1.35*100)}%"></i></span></div><button class="button carAction" data-car="${c.id}">${sel?'SELECTED':own?'SELECT':'BUY ◈ '+c.price.toLocaleString('en-IN')}</button></div>`}).join('')}</div><button class="button secondary" id="back">← BACK</button>`);
 mountGaragePreview(selected);
 $$('[data-car]').forEach(b=>b.onclick=()=>{audio.resume();const c=carById(b.dataset.car);if(profile.unlocked.includes(c.id)){profile.selectedCar=c.id;save();setPlayerProperties({selected_car:c.id});trackEvent('car_selected',{car_id:c.id,car_name:c.name,car_class:c.class});garage()}else if(profile.credits>=c.price){profile.credits-=c.price;profile.unlocked.push(c.id);profile.selectedCar=c.id;save();setPlayerProperties({selected_car:c.id});trackEvent('car_purchased',{car_id:c.id,car_name:c.name,car_class:c.class,price:c.price});checkAchievements();audio.reward();garage()}else toast('NOT ENOUGH CREDITS','bad')});
 $$('[data-paint]').forEach(b=>b.onclick=()=>{if(!selectedOwned)return;profile.carColors[selected.id]=Number(b.dataset.paint);save();trackEvent('car_paint_changed',{car_id:selected.id,paint:profile.carColors[selected.id].toString(16)});audio.tone?.(420,.08,'sine',.035,80);garage()});
 const custom=$('#customPaint');if(custom)custom.oninput=e=>{if(!selectedOwned)return;profile.carColors[selected.id]=parseInt(e.target.value.slice(1),16);save();trackEvent('car_paint_changed',{car_id:selected.id,paint:e.target.value});updateGaragePreviewPaint(profile.carColors[selected.id]);};if(custom)custom.onchange=()=>garage();
 $('#upgradeSelected').onclick=()=>upgrades(profile.selectedCar);$('#back').onclick=home;
}
function upgrades(id){const c=carById(id),u=ensureUpgrade(id);menuChrome('TUNING',`<div class="tuningHero"><div class="carPreview giant" style="--car:#${carColor(c.id).toString(16).padStart(6,'0')}"><i></i></div><div><small>${c.class} CLASS</small><h3>${c.name}</h3><p>Each system can be upgraded five times.</p></div></div><div class="upgradeGrid">${UPGRADE_KEYS.map(k=>{const l=u[k],cost=upgradeCost(l);return `<div class="upgradeCard"><small>${k.toUpperCase()}</small><b>LEVEL ${l}/5</b><div class="upgradePips">${[0,1,2,3,4].map(x=>`<i class="${x<l?'on':''}"></i>`).join('')}</div><button class="button" data-up="${k}" ${l>=5?'disabled':''}>${l>=5?'MAXED':'UPGRADE ◈ '+cost}</button></div>`}).join('')}</div><button class="button secondary" id="back">← GARAGE</button>`);
$$('[data-up]').forEach(b=>b.onclick=()=>{const key=b.dataset.up,l=u[key],cost=upgradeCost(l);if(l>=5)return;if(profile.credits<cost)return toast('NOT ENOUGH CREDITS','bad');profile.credits-=cost;u[key]++;save();audio.reward();upgrades(id)});$('#back').onclick=garage;}

function achievements(){trackScreen('achievements');menuChrome('ACHIEVEMENTS',`<div class="achievementList">${ACHIEVEMENTS.map(a=>`<div class="achievement ${profile.achievements[a.id]?'earned':''}"><div><small>${profile.achievements[a.id]?'✓ EARNED':'CHALLENGE'}</small><b>${a.name}</b><span>${a.desc}</span></div><em>◈ ${a.reward} CR</em></div>`).join('')}</div><button class="button secondary" id="back">← BACK</button>`);$('#back').onclick=home;}
function settings(){trackScreen('settings');menuChrome('SETTINGS',`<div class="settingRows"><label>Sound Effects <button class="button secondary" id="sound">${profile.sound?'ON':'OFF'}</button></label><label>Music <button class="button secondary" id="music">${profile.music?'ON':'OFF'}</button></label><label>Tilt Steering <button class="button secondary" id="tiltToggle">${profile.tiltSteering!==false?'ON':'OFF'}</button></label><label>Collision Vibration <button class="button secondary" id="vibrationToggle">${profile.vibration!==false?'ON':'OFF'}</button></label><label>Graphics <select id="quality"><option value="high">HIGH</option><option value="medium">MEDIUM</option><option value="low">LOW</option></select></label><label>Camera <select id="cameraSet"><option value="dynamic">DYNAMIC</option><option value="close">CLOSE</option><option value="far">FAR</option></select></label><label>Usage Analytics <button class="button secondary" id="analyticsToggle">${profile.analytics!==false?'ON':'OFF'}</button></label><label>Account <button class="button secondary" id="accountBtn">ACCOUNT</button></label><label>Reset Progress <button class="button danger" id="reset">RESET SAVE</button></label></div><button class="button secondary" id="back">← BACK</button>`);$('#quality').value=profile.quality;$('#cameraSet').value=profile.camera;$('#sound').onclick=()=>{profile.sound=!profile.sound;save();audio.setEnabled(profile.sound);settings()};$('#music').onclick=()=>{profile.music=!profile.music;save();profile.music?audio.startMusic():audio.stopMusic();settings()};$('#tiltToggle').onclick=async()=>{profile.tiltSteering=profile.tiltSteering===false;save();if(profile.tiltSteering)await enableTiltControl();settings()};$('#vibrationToggle').onclick=()=>{profile.vibration=profile.vibration===false;save();if(profile.vibration)vibrate(35);settings()};$('#quality').onchange=e=>{profile.quality=e.target.value;save();applyQuality()};$('#cameraSet').onchange=e=>{profile.camera=e.target.value;save()};$('#analyticsToggle').onclick=()=>{profile.analytics=profile.analytics===false;save();setAnalyticsEnabled(profile.analytics);settings()};$('#accountBtn').onclick=accountScreen;$('#reset').onclick=()=>{if(confirm('Reset all cars, upgrades, career progress and credits?')){profile=structuredClone(fresh);save();home()}};$('#back').onclick=home;}
function help(){trackScreen('controls');menuChrome('CONTROLS',`<div class="helpGrid"><div class="helpCard"><b>KEYBOARD</b><span>W / ↑ — Accelerate</span><span>S / ↓ — Brake / Reverse</span><span>A D / ← → — Steer</span><span>SPACE — Drift</span><span>SHIFT — Nitro</span><span>ESC — Pause</span><span>R — Restart</span></div><div class="helpCard"><b>GAMEPAD</b><span>Left Stick — Steer</span><span>RT / A — Accelerate</span><span>LT / B — Brake</span><span>X — Drift</span><span>LB / RB — Nitro</span><span>Start — Pause</span></div><div class="helpCard"><b>MOBILE</b><span>Tilt phone left / right — Steer</span><span>On-screen steering also available</span><span>Throttle + brake</span><span>Dedicated DRIFT button</span><span>N₂O boost button</span><span>Landscape recommended</span></div></div><button class="button secondary" id="back">← BACK</button>`);$('#back').onclick=home;}
function raceSetup(e){trackScreen('race_setup');const c=tunedCar(profile.selectedCar),tr=trackById(e.track);menuChrome('RACE READY',`<div class="setupGrid"><div class="setupTrack" style="--accent:#${tr.accent.toString(16).padStart(6,'0')}"><small>${e.mode.toUpperCase()}</small><b>${e.name}</b><span>${tr.name} • ${e.laps} LAPS • ${e.ai} RIVALS</span><em>${tr.weather.toUpperCase()}</em></div><div class="setupCar"><small>YOUR CAR • CLASS ${c.class}</small><b>${c.name}</b><span>TOP ${Math.round(c.top*6.2)} KM/H • TUNED</span><button class="button secondary" id="changeCar">CHANGE CAR</button></div></div><div class="raceBrief"><b>OBJECTIVE</b><span>${e.mode==='Time Attack'?`Beat ${formatTime(e.target)}`:e.mode==='Knockout'?'Stay out of last place at every elimination':'Finish in 1st place'}</span></div><button class="button huge" id="start">START RACE</button><button class="button secondary" id="back">← BACK</button>`);$('#start').onclick=async()=>{await enableTiltControl();startRace(e)};$('#changeCar').onclick=garage;$('#back').onclick=e.quick?quickRace:career;}

// ----- HOME 3D HERO -----
let homePreview=null;
function destroyHomePreview(){if(!homePreview)return;try{homePreview.renderer.dispose();homePreview.renderer.domElement.remove()}catch{}homePreview=null;}
function addShowcaseCity(sc,{garage=false}={}){
 const sky=document.createElement('canvas');sky.width=1024;sky.height=512;const x=sky.getContext('2d');
 const gr=x.createLinearGradient(0,0,0,512);gr.addColorStop(0,garage?'#07111c':'#13283f');gr.addColorStop(.48,garage?'#0b1119':'#8b4f42');gr.addColorStop(.72,garage?'#11151b':'#ff9b55');gr.addColorStop(1,'#080b10');x.fillStyle=gr;x.fillRect(0,0,1024,512);
 if(!garage){const rg=x.createRadialGradient(700,330,5,700,330,190);rg.addColorStop(0,'#fff4c4');rg.addColorStop(.08,'#ffc96e');rg.addColorStop(.32,'#d65a46aa');rg.addColorStop(1,'#00000000');x.fillStyle=rg;x.fillRect(0,0,1024,512)}
 const tex=new THREE.CanvasTexture(sky);tex.colorSpace=THREE.SRGBColorSpace;sc.background=tex;
 const city=new THREE.Group();const rnd=(n)=>{const v=Math.sin(n*91.7)*43758.5453;return v-Math.floor(v)};
 if(!garage){for(let i=0;i<38;i++){const w=.7+rnd(i)*1.5,h=2.5+rnd(i+4)*8,d=.8+rnd(i+9)*1.6;const mat=new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(.57,.12,.09+rnd(i+2)*.08),roughness:.7,metalness:.2});const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);const side=i%2?-1:1;b.position.set(side*(8+rnd(i+8)*12),h/2-1.2,-5-rnd(i+1)*18);city.add(b);for(let yy=.4;yy<h-.5;yy+=.75){const win=new THREE.Mesh(new THREE.PlaneGeometry(w*.62,.16),new THREE.MeshBasicMaterial({color:rnd(i+yy)>.45?0xffc16a:0x69cfff,transparent:true,opacity:.35}));win.position.set(b.position.x-side*(w/2+.006),yy-1.2,b.position.z);win.rotation.y=side>0?-Math.PI/2:Math.PI/2;city.add(win)}}
  const bridge=new THREE.Mesh(new THREE.BoxGeometry(30,.18,.6),new THREE.MeshStandardMaterial({color:0x252b32,metalness:.65,roughness:.3}));bridge.position.set(0,3.2,-12);city.add(bridge);
  for(const sx of[-11,11]){const tower=new THREE.Mesh(new THREE.BoxGeometry(.35,6,.35),new THREE.MeshStandardMaterial({color:0x2b3037,metalness:.7}));tower.position.set(sx,3,-12);city.add(tower)}
 }
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(70,45),new THREE.MeshPhysicalMaterial({color:garage?0x0b1017:0x11161a,metalness:.55,roughness:garage?.14:.2,clearcoat:1,clearcoatRoughness:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=-.43;floor.receiveShadow=true;city.add(floor);
 if(!garage){for(let i=-4;i<=4;i++){const dash=new THREE.Mesh(new THREE.PlaneGeometry(.12,3.6),new THREE.MeshBasicMaterial({color:0xf3f0df}));dash.rotation.x=-Math.PI/2;dash.position.set(i*2.9,-.415,3.8);city.add(dash)}
  for(const side of[-1,1])for(let i=0;i<7;i++){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,3.2,10),new THREE.MeshStandardMaterial({color:0x303943,metalness:.8}));pole.position.set(side*6.4,1.2,-7+i*3.8);city.add(pole);const lamp=new THREE.PointLight(i%2?0xffb66b:0x9adfff,3.5,7);lamp.position.set(side*6.4,2.8,-7+i*3.8);city.add(lamp)}}
 else{for(let i=-5;i<=5;i++){const strip=new THREE.Mesh(new THREE.PlaneGeometry(.055,18),new THREE.MeshBasicMaterial({color:i%2?0x18cfff:0xff2945,transparent:true,opacity:.26}));strip.rotation.x=-Math.PI/2;strip.position.set(i*1.8,-.415,0);city.add(strip)}}
 sc.add(city);return city;
}
function mountHomePreview(def){destroyHomePreview();const host=$('#home3d');if(!host)return;const r=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});r.setPixelRatio(Math.min(devicePixelRatio,1.8));r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.3;r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFShadowMap;host.append(r.domElement);const sc=new THREE.Scene();sc.fog=new THREE.Fog(0x111820,18,52);const cam=new THREE.PerspectiveCamera(32,1,.1,100);cam.position.set(11.6,3.25,11.8);cam.lookAt(0,.65,0);addShowcaseCity(sc);sc.add(new THREE.HemisphereLight(0xbfe6ff,0x1b1411,2.5));const key=new THREE.DirectionalLight(0xffd3a0,7);key.position.set(7,11,5);key.castShadow=true;sc.add(key);const rim=new THREE.DirectionalLight(0xff2447,6);rim.position.set(-7,3,-6);sc.add(rim);const blue=new THREE.PointLight(0x18cfff,40,24);blue.position.set(6,2,-7);sc.add(blue);const car=createDetailedCar({...def,color:carColor(def.id)},{world:null});car.scale.setScalar(1.03);car.rotation.y=-.48;car.position.set(.3,.08,.2);sc.add(car);const resize=()=>{if(!homePreview||homePreview.host!==host)return;const w=Math.max(420,host.clientWidth),h=Math.max(300,host.clientHeight);r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()};homePreview={renderer:r,scene:sc,camera:cam,car,host,resize,born:performance.now()};resize();}
function renderHomePreview(now){if(!homePreview)return;if(!document.body.contains(homePreview.host)){destroyHomePreview();return}homePreview.resize();const age=Math.min(1,(now-homePreview.born)/1200),ease=1-Math.pow(1-age,3);homePreview.car.rotation.y=-.50+Math.sin(now*.00028)*.045;homePreview.car.position.y=.08+Math.sin(now*.0015)*.008;homePreview.camera.position.x=14.5-(2.9*ease)+Math.sin(now*.00018)*.18;homePreview.camera.position.y=4.15-.9*ease;homePreview.camera.lookAt(.2,.7,0);for(const w of homePreview.car.userData.wheels||[])w.rotation.x+=.0025;homePreview.renderer.render(homePreview.scene,homePreview.camera);}

// ----- GARAGE 3D SHOWROOM -----
let garagePreview=null;
function destroyGaragePreview(){if(!garagePreview)return;try{garagePreview.renderer.dispose();garagePreview.renderer.domElement.remove()}catch{}garagePreview=null;}
function mountGaragePreview(def){
 const host=$('#garage3d');if(!host)return;
 const r=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});r.setPixelRatio(Math.min(devicePixelRatio,1.8));r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.15;host.append(r.domElement);
 const sc=new THREE.Scene();addShowcaseCity(sc,{garage:true});sc.fog=new THREE.Fog(0x080c12,18,42);const cam=new THREE.PerspectiveCamera(34,1,.1,100);cam.position.set(11.2,3.8,11.7);cam.lookAt(0,.72,0);
 sc.add(new THREE.HemisphereLight(0xdff5ff,0x1b2028,2.3));const key=new THREE.DirectionalLight(0xffffff,5.2);key.position.set(5,9,7);sc.add(key);const rim=new THREE.DirectionalLight(0x59cfff,4.0);rim.position.set(-6,4,-5);sc.add(rim);const fill=new THREE.PointLight(0xff4ed6,25,18);fill.position.set(4,2,-5);sc.add(fill);
 const car=createDetailedCar({...def,color:carColor(def.id)},{world:null});car.scale.setScalar(.82);car.position.y=.1;sc.add(car);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(9,64),new THREE.MeshPhysicalMaterial({color:0x10151d,metalness:.65,roughness:.12,clearcoat:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.40;sc.add(floor);
 const ring=new THREE.Mesh(new THREE.RingGeometry(4.7,5.0,64),new THREE.MeshBasicMaterial({color:0x22cfff,transparent:true,opacity:.28,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-.36;sc.add(ring);
 const resize=()=>{if(!garagePreview||garagePreview.host!==host)return;const w=Math.max(320,host.clientWidth),h=Math.max(220,host.clientHeight);r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()};resize();
 garagePreview={renderer:r,scene:sc,camera:cam,car,host,resize,last:performance.now(),born:performance.now()};
}
function updateGaragePreviewPaint(color){if(!garagePreview?.car)return;garagePreview.car.traverse(o=>{if(o.isMesh&&o.material?.userData?.bodyPaint)o.material.color.setHex(color)});}
function renderGaragePreview(now){if(!garagePreview)return;if(!document.body.contains(garagePreview.host)){destroyGaragePreview();return}garagePreview.resize();const a=Math.min(1,(now-garagePreview.born)/900);garagePreview.car.rotation.y=-.42+Math.sin(now*.00022)*.13;garagePreview.car.position.y=.08+Math.sin(now*.0013)*.009;garagePreview.camera.position.x=12.6-1.4*a;garagePreview.camera.position.y=4.3-.5*a;garagePreview.camera.lookAt(0,.7,0);for(const w of garagePreview.car.userData.wheels||[])w.rotation.x+=.002;garagePreview.renderer.render(garagePreview.scene,garagePreview.camera);}

// ----- 3D ENGINE -----
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.autoUpdate=true;$('#game').append(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.1,3200),world=new THREE.Group();scene.add(world);
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.55,.55,.74);composer.addPass(bloom);composer.addPass(new OutputPass());
const vfx=new RaceVFX(scene);
const hemi=new THREE.HemisphereLight(0xe7f7ff,0x26301e,1.8);scene.add(hemi);const sun=new THREE.DirectionalLight(0xfff0d4,3.3);sun.position.set(-100,150,80);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-620;sun.shadow.camera.right=620;sun.shadow.camera.top=620;sun.shadow.camera.bottom=-620;scene.add(sun);
let visualMats=null;
const mats={road:new THREE.MeshStandardMaterial({color:0x20242b,roughness:.76}),line:new THREE.MeshBasicMaterial({color:0xffffff}),white:new THREE.MeshStandardMaterial({color:0xf5f7fa}),red:new THREE.MeshStandardMaterial({color:0xe8354f}),rail:new THREE.MeshStandardMaterial({color:0xaeb8c4,metalness:.75,roughness:.28}),dark:new THREE.MeshStandardMaterial({color:0x0d1118,metalness:.55,roughness:.25}),glass:new THREE.MeshStandardMaterial({color:0x1a455d,metalness:.25,roughness:.08,transparent:true,opacity:.76}),ramp:new THREE.MeshStandardMaterial({color:0x333b45,metalness:.45,roughness:.48}),tire:new THREE.MeshStandardMaterial({color:0x08090b,roughness:.82})};
let curve,trackLength=1,trackSamples=[],roadHalf=13,currentEvent=EVENTS[0],state='menu',player=null,ai=[],ramps=[],pickups=[],weatherParticles=null,raceStart=0,countdownUntil=0,knockoutClock=0,prev=performance.now(),eliminated=[],finishAt=0,lastPause=false,startLights=[],cameraShake=0,boostPulse=0,lastDriftTap=0;
let stuntMessageUntil=0;
const COUNTDOWN_MS=3600;
// Long-form circuits: wide straights between corner complexes so the cars can actually build speed.
const trackTemplates={
oval:[[-360,-20],[-340,-155],[-245,-230],[-55,-245],[145,-238],[305,-170],[365,-55],[350,80],[255,180],[80,225],[-120,218],[-290,155],[-365,65]],
kidney:[[-390,15],[-365,-125],[-265,-215],[-80,-230],[70,-195],[165,-110],[305,-170],[405,-80],[420,55],[330,150],[190,178],[70,125],[-45,205],[-220,220],[-355,140]],
wide:[[-430,0],[-405,-135],[-300,-225],[-125,-270],[85,-265],[260,-220],[405,-120],[440,20],[405,165],[280,245],[90,280],[-110,262],[-285,210],[-410,120]],
city:[[-390,-35],[-365,-175],[-245,-235],[-75,-235],[55,-165],[150,-65],[285,-145],[400,-75],[425,65],[345,180],[190,215],[65,160],[-30,70],[-120,205],[-285,230],[-405,135]],
figure8:[[-405,0],[-360,-150],[-235,-235],[-70,-130],[35,-35],[155,-150],[300,-235],[410,-80],[410,70],[300,235],[155,150],[35,35],[-70,130],[-235,235],[-360,150]],
practice:[[-1050,-50],[-1000,-390],[-760,-620],[-400,-700],[10,-650],[380,-470],[690,-520],[980,-300],[1120,30],[1010,350],[720,560],[320,650],[-90,620],[-440,470],[-760,520],[-1040,300]],
};
function makeCurve(shape){const pts=(trackTemplates[shape]||trackTemplates.oval).map(([x,z])=>new THREE.Vector3(x,0,z));return new THREE.CatmullRomCurve3(pts,true,'catmullrom',.18)}
function pointAt(t){return curve.getPointAt((t%1+1)%1)}
function tangentAt(t){return curve.getTangentAt((t%1+1)%1).setY(0).normalize()}
function sideAt(t){const f=tangentAt(t);return new THREE.Vector3(f.z,0,-f.x)}
const ROAD_SURFACE_Y=.035;
function carGroundY(mesh){
 const scale=mesh?.scale?.y||1,offset=(mesh?.userData?.groundOffset??.065)*scale;
 return ROAD_SURFACE_Y+offset+.006;
}
function settleCarOnRoad(mesh,dt=0,instant=false){
 if(!mesh)return;const target=carGroundY(mesh);
 mesh.position.y=instant?target:lerp(mesh.position.y,target,1-Math.pow(.0000005,Math.max(dt,.001)));
 if(Math.abs(mesh.position.y-target)<.0015)mesh.position.y=target;
}
function clearWorld(){startLights=[];vfx.clear();while(world.children.length){const o=world.children.pop();o.traverse?.(x=>{x.geometry?.dispose?.();if(x.material?.dispose&& !Object.values(mats).includes(x.material))x.material.dispose()})}ramps=[];pickups=[];trackSamples=[];weatherParticles=null;}
function roadGeometry(width=roadHalf,y=.03){const n=760,pos=[],uv=[],idx=[];if(width===roadHalf)trackSamples=[];for(let i=0;i<=n;i++){const t=i/n,p=pointAt(t),s=sideAt(t);if(width===roadHalf)trackSamples.push(p.clone());for(const sign of[-1,1]){const q=p.clone().addScaledVector(s,width*sign);pos.push(q.x,y,q.z);uv.push(i/5,(sign+1)/2)}}for(let i=0;i<n;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function buildWorld(e){
 clearWorld();const tr=trackById(e.track);curve=makeCurve(tr.shape);trackLength=curve.getLength();visualMats=createVisualMaterials(tr);
 scene.background=new THREE.Color(tr.sky);scene.fog=new THREE.FogExp2(tr.fog,tr.weather==='night'?.00175:tr.weather==='snow'?.00062:.00105);
 sun.color.set(tr.weather==='night'?0x8aaeff:tr.weather==='dust'?0xffc27b:tr.weather==='snow'?0xd9ecff:0xfff0d4);sun.intensity=tr.weather==='night'?.9:tr.weather==='snow'?2.15:tr.weather==='cloudy'||tr.weather==='rain'?1.65:3.4;hemi.intensity=tr.weather==='night'?.65:tr.weather==='snow'?1.18:1.6;hemi.color.set(tr.weather==='snow'?0xb8d7e8:0xffffff);hemi.groundColor.set(tr.weather==='snow'?0x46535b:0x334455);
 const groundSize=e.endless?5200:1900;const ground=new THREE.Mesh(new THREE.PlaneGeometry(groundSize,groundSize,1,1),visualMats.ground);ground.rotation.x=-Math.PI/2;ground.position.y=-.05;ground.receiveShadow=true;world.add(ground);
 const shoulder=new THREE.Mesh(roadGeometry(roadHalf+3,.0),visualMats.shoulder);shoulder.receiveShadow=true;world.add(shoulder);
 const road=new THREE.Mesh(roadGeometry(roadHalf,.035),visualMats.road);road.receiveShadow=true;world.add(road);
 // realistic edge lines, rumble strips, guardrails, posts and track lights
 for(let i=0;i<360;i++){const t=i/360,p=pointAt(t),f=tangentAt(t),s=sideAt(t),yaw=Math.atan2(f.x,f.z);
   if(i%4===0){const dash=new THREE.Mesh(new THREE.BoxGeometry(.13,.018,2.8),mats.line);dash.position.copy(p).setY(.073);dash.rotation.y=yaw;world.add(dash)}
   for(const sign of[-1,1]){const edge=p.clone().addScaledVector(s,(roadHalf-.55)*sign);const line=new THREE.Mesh(new THREE.BoxGeometry(.16,.02,2.7),mats.line);line.position.copy(edge).setY(.075);line.rotation.y=yaw;world.add(line);
     const c=p.clone().addScaledVector(s,(roadHalf+.55)*sign),curb=new THREE.Mesh(new THREE.BoxGeometry(2.6,.14,1.0),i%2?visualMats.red:visualMats.white);curb.position.copy(c).setY(.11);curb.rotation.y=yaw;world.add(curb);
     if(i%2===0){const rr=p.clone().addScaledVector(s,(roadHalf+3.5)*sign),rail=new THREE.Mesh(new THREE.BoxGeometry(3.2,.38,.16),visualMats.rail);rail.position.copy(rr).setY(.72);rail.rotation.y=yaw;world.add(rail);const post=new THREE.Mesh(new THREE.BoxGeometry(.14,1.15,.14),visualMats.rail);post.position.copy(rr).setY(.38);world.add(post)}
   }
   if(i%25===0){const skid=new THREE.Mesh(new THREE.BoxGeometry(.14,.012,5.8),new THREE.MeshBasicMaterial({color:0x090a0b,transparent:true,opacity:.28}));skid.position.copy(p).addScaledVector(s,(i%50?2.2:-2.2)).setY(.081);skid.rotation.y=yaw;world.add(skid)}
 }
 // start/finish gantry
 {const p=pointAt(.99),f=tangentAt(.99),s=sideAt(.99),yaw=Math.atan2(f.x,f.z),metal=visualMats.dark;for(const sign of[-1,1]){const q=p.clone().addScaledVector(s,(roadHalf+1.7)*sign);const col=new THREE.Mesh(new THREE.BoxGeometry(.45,6,.45),metal);col.position.copy(q).setY(3);world.add(col)}const bar=new THREE.Mesh(new THREE.BoxGeometry(roadHalf*2+4,.7,.55),metal);bar.position.copy(p).setY(5.75);bar.rotation.y=yaw;world.add(bar);for(let j=-2;j<=2;j++){const lm=new THREE.MeshStandardMaterial({color:0x32050a,emissive:0x220000,emissiveIntensity:.2,roughness:.2});const lamp=new THREE.Mesh(new THREE.SphereGeometry(.32,14,10),lm);lamp.position.copy(p).addScaledVector(s,j*1.6).setY(5.75);world.add(lamp);startLights.push(lamp)}}
 decorateEnvironment({world,track:tr,pointAt,sideAt,tangentAt,roadHalf,materials:visualMats,quality:profile.quality});
 // sculpted ramps and luminous nitro pickups
 [0.11,0.28,0.46,0.64,0.83].forEach((t,i)=>{const p=pointAt(t),f=tangentAt(t),s=sideAt(t),lane=((i%3)-1)*4.4,q=p.clone().addScaledVector(s,lane);const barrel=i%2===1;const rg=new THREE.BoxGeometry(barrel?6.6:8.2,.82,barrel?12:10,4,2,8),r=new THREE.Mesh(rg,visualMats.dark);r.position.copy(q).setY(.44);r.rotation.y=Math.atan2(f.x,f.z);r.rotation.x=barrel?-.16:-.105;r.rotation.z=barrel?(i%4===1?.18:-.18):0;r.castShadow=true;world.add(r);ramps.push({t,p:q.clone(),barrel})});
 for(let i=0;i<9;i++){const t=.07+i*.105,p=pointAt(t).addScaledVector(sideAt(t),(i%3-1)*4.3),grp=new THREE.Group(),core=new THREE.Mesh(new THREE.OctahedronGeometry(.68,1),new THREE.MeshPhysicalMaterial({color:tr.accent,emissive:tr.accent,emissiveIntensity:2.2,metalness:.35,roughness:.18,clearcoat:1})),ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.08,8,24),new THREE.MeshBasicMaterial({color:tr.accent,transparent:true,opacity:.8}));grp.add(core,ring);grp.position.copy(p).setY(1.45);world.add(grp);pickups.push({mesh:grp,taken:false})}
 buildWeather(tr.weather);
}
function buildWeather(weather){if(!['rain','snow','dust'].includes(weather))return;const count=profile.quality==='low'?350:900,arr=new Float32Array(count*3);for(let i=0;i<count;i++){arr[i*3]=(Math.random()-.5)*900;arr[i*3+1]=Math.random()*90+5;arr[i*3+2]=(Math.random()-.5)*900}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));const m=new THREE.PointsMaterial({color:weather==='snow'?0xd9e9f0:weather==='dust'?0xe4a761:0xb9ddff,size:weather==='rain'?.08:weather==='snow'?.22:.23,transparent:true,opacity:weather==='snow'?.42:.7,depthWrite:false});weatherParticles=new THREE.Points(g,m);world.add(weatherParticles);}
function createCar(def,aiCar=false){return createDetailedCar(def,{ai:aiCar,world});}
function spawnRace(){if(player?.mesh)world.remove(player.mesh);ai.forEach(a=>world.remove(a.mesh));ai=[];const def=tunedCar(profile.selectedCar),startT=.992,p=pointAt(startT),f=tangentAt(startT);player={mesh:createCar(def),def,speed:0,angle:Math.atan2(f.x,f.z),nitro:100,lap:1,lastT:startT,progress:startT,air:0,vy:0,drift:0,combo:0,maxCombo:0,comboTime:0,topSpeed:0,shock:false,finished:false,airStart:0,stunt:null,stuntRot:0,stunts:0,knockdowns:0,nearMiss:0};player.mesh.position.copy(p);settleCarOnRoad(player.mesh,0,true);player.mesh.rotation.y=player.angle;const palette=[0xff304f,0x47ef7a,0xffd33f,0x9d6cff,0xffffff,0xff7c32,0x3b7cff,0xf03fca,0x5ef0dd];for(let i=0;i<currentEvent.ai;i++){const carIndex=(Math.max(0,currentEvent.recommended||0)+i*2+1)%CARS.length,d={...CARS[carIndex],color:palette[i%palette.length]},t=.982-i*.0105,q=pointAt(t).addScaledVector(sideAt(t),(i%2?1:-1)*(3.0+(i%3)*.35)),m=createCar(d,true);m.position.copy(q);settleCarOnRoad(m,0,true);const tf=tangentAt(t);m.rotation.y=Math.atan2(tf.x,tf.z);const pace=34+(currentEvent.recommended||0)*1.15+(i/Math.max(1,currentEvent.ai))*5+Math.random()*2.0;ai.push({mesh:m,t,lap:1,speed:pace,baseSpeed:pace,maxSpeed:pace*1.16,lane:(i%3-1)*2.8,boost:Math.random()*4,gridY:carGroundY(m)})}}

const keys={},touchState={};
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE'&&state==='race')trigger360();if(e.code==='Escape'&&['race','countdown','paused'].includes(state))togglePause();if(e.code==='KeyR'&&['race','paused'].includes(state))restartRace()});
addEventListener('keyup',e=>keys[e.code]=false);
['brake','boost'].forEach(id=>{const el=$('#'+id);if(!el)return;['pointerdown','pointerenter'].forEach(ev=>el.addEventListener(ev,e=>{if(ev==='pointerenter'&&!e.buttons)return;touchState[id]=true;audio.resume();e.preventDefault()}));['pointerup','pointercancel','pointerleave'].forEach(ev=>el.addEventListener(ev,e=>{touchState[id]=false;e.preventDefault()}))});
const pauseButton=$('#pauseBtn');if(pauseButton)pauseButton.onclick=togglePause;
function gamepad(){const g=navigator.getGamepads?.()[0];if(!g)return null;return{steer:Math.abs(g.axes[0])>.12?g.axes[0]:0,gas:g.buttons[7]?.value||g.buttons[0]?.value||0,brake:g.buttons[6]?.value||g.buttons[1]?.value||0,boost:g.buttons[4]?.pressed||g.buttons[5]?.pressed,drift:g.buttons[2]?.pressed,stunt:g.buttons[3]?.pressed,pause:g.buttons[9]?.pressed}}
function nearestTrack(pos){let best=0,bd=Infinity;for(let i=0;i<trackSamples.length;i++){const d=trackSamples[i].distanceToSquared(pos);if(d<bd){bd=d;best=i}}return{t:best/(trackSamples.length-1),point:trackSamples[best],dist:Math.sqrt(bd)}}
function startRace(e){pushGameHistory('race');trackEvent('race_started',{event_id:e.id,mode:e.mode,track:e.track,car_id:profile.selectedCar,rivals:e.ai,endless:Boolean(e.endless)});audio.resume();audio.stopMusic();currentEvent=e;buildWorld(e);spawnRace();shell.style.display='none';$('#hud').hidden=false;$('#minimap').style.display=e.endless?'none':'block';restartRace();}
function restartRace(){spawnRace();raceStart=performance.now();countdownUntil=raceStart+COUNTDOWN_MS;knockoutClock=raceStart+20000;eliminated=[];state='countdown';cameraShake=0;boostPulse=0;$('#countdown').textContent='3';$('#stunt').textContent='';$('#knockdowns').textContent='';$('#objective').textContent=currentEvent.endless?'FREE DRIVE • NO FINISH':currentEvent.mode==='Time Attack'?`TARGET ${formatTime(currentEvent.target)}`:currentEvent.mode==='Knockout'?'LAST PLACE ELIMINATED EVERY 20s':'FINISH 1ST';audio.countdown(3)}
function togglePause(){if(state==='paused'){state='race';shell.style.display='none';$('#hud').hidden=false;raceStart+=performance.now()-pauseStamp;knockoutClock+=performance.now()-pauseStamp;audio.resume();return}if(!['race','countdown'].includes(state))return;pauseStamp=performance.now();state='paused';$('#hud').hidden=true;menuChrome('PAUSED',`<div class="pauseMenu"><button class="button huge" id="resume">RESUME</button><button class="button secondary" id="restart">RESTART RACE</button><button class="button secondary" id="quit">QUIT TO HOME</button></div>`);$('#resume').onclick=togglePause;$('#restart').onclick=()=>{shell.style.display='none';$('#hud').hidden=false;restartRace()};$('#quit').onclick=()=>{state='menu';$('#hud').hidden=true;$('#minimap').style.display='none';home()}}
let pauseStamp=0,lastPadStunt=false;
function flashFx(type){const f=$('.nitroFlash');f.className='nitroFlash '+type;requestAnimationFrame(()=>setTimeout(()=>f.className='nitroFlash',type==='shock'?260:120))}
function announceStunt(text){$('#stunt').textContent=text;stuntMessageUntil=performance.now()+1300;audio.stunt?.();}
function trigger360(){if(!player||state!=='race'||player.stunt)return;if(Math.abs(player.speed)<18)return;player.stunt={type:'360',time:0,duration:player.air>0?.72:.62};player.stuntRot=0;player.stunts++;player.nitro=Math.min(100,player.nitro+10);announceStunt('360° SPIN');}
function triggerBarrel(){if(!player||player.stunt)return;player.stunt={type:'barrel',time:0,duration:.88};player.stuntRot=0;player.stunts++;announceStunt('BARREL ROLL');}
function endStunt(){if(!player?.stunt)return;const name=player.stunt.type==='barrel'?'BARREL ROLL':'360°';player.nitro=Math.min(100,player.nitro+(player.stunt.type==='barrel'?28:20));toast(`${name} • NITRO BONUS`,'good');player.stunt=null;player.stuntRot=0;player.mesh.rotation.x=0;player.mesh.rotation.z=0;}
function updateStunt(dt){if(!player?.stunt)return;player.stunt.time+=dt;const u=clamp(player.stunt.time/player.stunt.duration,0,1),ease=1-Math.pow(1-u,2);player.stuntRot=ease*Math.PI*2;if(player.stunt.type==='360')player.mesh.rotation.y=player.angle+player.stuntRot;else player.mesh.rotation.z=player.stuntRot;if(u>=1&&player.stunt.type==='360')endStunt();}
function knockdown(a){if(eliminated.includes(a)||a.knocked)return;a.knocked=true;a.crashTime=1.25;player.knockdowns++;player.nitro=Math.min(100,player.nitro+22);cameraShake=Math.max(cameraShake,.7);vfx.burst(a.mesh.position.clone().add(new THREE.Vector3(0,.6,0)),'spark',24);vfx.burst(a.mesh.position.clone().add(new THREE.Vector3(0,.4,0)),'smoke',7);audio.knockdown?.();vibrate([65,35,110]);announceStunt('KNOCKDOWN');flashFx('crash');}
function collideCars(){for(const a of ai){if(eliminated.includes(a)||a.crashTime>0)continue;const d=player.mesh.position.distanceTo(a.mesh.position);if(d<4.15){if((player.shock||player.stunt)&&Math.abs(player.speed)>28){knockdown(a);player.speed*=.96}else{const push=player.mesh.position.clone().sub(a.mesh.position).setY(0).normalize();player.mesh.position.addScaledVector(push,.32);player.speed*=.79;player.combo=0;cameraShake=Math.max(cameraShake,.42);vfx.burst(player.mesh.position.clone().add(new THREE.Vector3(0,.35,0)),'spark',12,push);audio.impact?.(Math.min(1,d/4.15+.35));vibrate([45,25,70]);flashFx('crash')}}}}
function updatePlayer(dt,now){
 const gp=gamepad();if(gp?.pause&&!lastPause){togglePause();lastPause=true}if(!gp?.pause)lastPause=false;if(gp?.stunt&&!lastPadStunt)trigger360();lastPadStunt=!!gp?.stunt;
 const mobileDrive=matchMedia('(pointer: coarse)').matches;const acc=mobileDrive||keys.KeyW||keys.ArrowUp||gp?.gas>.1,br=keys.KeyS||keys.ArrowDown||touchState.brake||gp?.brake>.1;let steer=(keys.KeyA||keys.ArrowLeft?1:0)-(keys.KeyD||keys.ArrowRight?1:0);if(gp?.steer)steer=-gp.steer;else if(Math.abs(steer)<.01)steer=-tiltInput();
 const drifting=(keys.Space||touchState.drift||gp?.drift)&&Math.abs(player.speed)>14&&Math.abs(steer)>.08&&!player.stunt;audio.skid?.(drifting?Math.min(1,Math.abs(player.speed)/45):0);const boost=(keys.ShiftLeft||keys.ShiftRight||touchState.boost||gp?.boost)&&player.nitro>0&&player.speed>8,perfect=boost&&player.nitro>32&&player.nitro<62;player.shock=boost&&player.nitro>82;
 const max=player.def.top*(player.shock?1.22:perfect?1.11:boost?1.065:1);if(acc&&!br)player.speed+=player.def.accel*dt;else if(!br)player.speed=Math.max(0,player.speed-8.5*dt);if(br)player.speed=Math.max(0,player.speed-42*dt);player.speed=clamp(player.speed,0,max);if(boost){player.speed+=21*player.def.nitro*dt;player.nitro=Math.max(0,player.nitro-(player.shock?38:perfect?24:29)*dt)}else player.nitro=Math.min(100,player.nitro+(drifting?14.5:5.2)*dt);
 if(player.shock){boostPulse+=dt;cameraShake=Math.max(cameraShake,.10);if(boostPulse>.045){boostPulse=0;const back=new THREE.Vector3(-Math.sin(player.angle),.3,-Math.cos(player.angle));vfx.trail(player.mesh.position.clone().addScaledVector(back,3.3),0xaeefff,1.8)}}else boostPulse=0;audio.engineSpeed(player.speed,boost);
 let handling=player.def.handling;if(drifting){handling*=1.47;player.drift+=Math.abs(player.speed)*dt;player.comboTime=now+1450;player.combo=Math.max(player.combo,1+Math.floor(player.drift/28));player.maxCombo=Math.max(player.maxCombo,player.combo);player.speed*=Math.pow(.987,dt*60);if(Math.random()<dt*22){const s=new THREE.Vector3(Math.cos(player.angle),0,-Math.sin(player.angle));vfx.burst(player.mesh.position.clone().addScaledVector(s,(Math.random()>.5?1.4:-1.4)),'smoke',1)}}else player.drift=Math.max(0,player.drift-16*dt);
 const steerPower=(.45+Math.min(Math.abs(player.speed)/24,1))*handling;player.angle+=steer*steerPower*dt*Math.sign(player.speed||1);const f=new THREE.Vector3(Math.sin(player.angle),0,Math.cos(player.angle));player.mesh.position.addScaledVector(f,player.speed*dt);if(!player.stunt||player.stunt.type!=='360')player.mesh.rotation.y=player.angle;
 if(player.air<=0&&Math.abs(player.mesh.position.y-carGroundY(player.mesh))<.18){for(const r of ramps){if(player.mesh.position.distanceTo(r.p)<5.8&&Math.abs(player.speed)>20){player.air=r.barrel?1.05:.88;player.airStart=now;player.vy=r.barrel?10.2:8.8;if(r.barrel)triggerBarrel();audio.tone(260,.18,'sine',.08,260);break}}}
 {const groundY=carGroundY(player.mesh),airborneNow=player.air>0||player.mesh.position.y>groundY+.012||Math.abs(player.vy)>.02;if(airborneNow){player.air=Math.max(0,player.air-dt);player.vy-=18*dt;player.mesh.position.y+=player.vy*dt;if(!player.stunt){player.mesh.rotation.z=lerp(player.mesh.rotation.z,-steer*.16,.12);player.mesh.rotation.x=lerp(player.mesh.rotation.x,-.04,.1)}if(player.mesh.position.y<=groundY&&player.vy<=0){const airborne=now-player.airStart;player.mesh.position.y=groundY;player.air=0;player.vy=0;if(player.stunt?.type==='barrel')endStunt();player.mesh.rotation.z=0;player.mesh.rotation.x=0;player.nitro=Math.min(100,player.nitro+18+Math.min(12,airborne/80));cameraShake=Math.max(cameraShake,.24);vfx.burst(player.mesh.position.clone(),'smoke',3);audio.landing?.();vibrate(22)}}else{player.air=0;player.vy=0;settleCarOnRoad(player.mesh,dt,false)}}
 updateStunt(dt);
 for(const p of pickups){if(!p.taken&&player.mesh.position.distanceTo(p.mesh.position)<3){p.taken=true;p.mesh.visible=false;player.nitro=Math.min(100,player.nitro+35);vfx.burst(p.mesh.position,'nitro',10);audio.pickup();toast('NITRO +35','good')}}updateDetailedCarVisual(player.mesh,player.speed,boost,drifting,dt,steer);if(player.air<=0&&!player.stunt){player.mesh.rotation.x=lerp(player.mesh.rotation.x,0,1-Math.pow(.00001,dt));const targetRoll=drifting?clamp(-steer*.055,-.065,.065):0;player.mesh.rotation.z=lerp(player.mesh.rotation.z,targetRoll,1-Math.pow(.00001,dt));if(Math.abs(player.mesh.rotation.x)<.002)player.mesh.rotation.x=0;if(Math.abs(player.mesh.rotation.z)<.002&&!drifting)player.mesh.rotation.z=0;}
 const n=nearestTrack(player.mesh.position);if(n.dist>roadHalf-1&&player.air<=0){player.speed*=Math.pow(.22,dt);player.mesh.position.lerp(n.point,Math.min(1,dt*.32))}if(n.dist>roadHalf+8){player.mesh.position.lerp(n.point,Math.min(1,dt*1.35));player.speed*=.78}let tn=n.t;if(player.lastT>.82&&tn<.18&&player.speed>4){player.lap++;if(!currentEvent.endless&&player.lap>currentEvent.laps)finishRace()}player.lastT=tn;player.progress=(player.lap-1)+tn;player.topSpeed=Math.max(player.topSpeed,Math.abs(player.speed)*6.2);if(player.combo&&now>player.comboTime){player.nitro=Math.min(100,player.nitro+player.combo*5.5);player.combo=0;player.drift=0}collideCars();
}
function updateStartLights(rem){
  if(!startLights.length)return;const elapsed=COUNTDOWN_MS-rem;const stage=Math.max(0,Math.min(5,Math.floor(elapsed/600)));
  startLights.forEach((l,i)=>{const on=i<stage&&rem>0;l.material.color.setHex(on?0xff1d35:rem<=0?0x28ff77:0x32050a);l.material.emissive.setHex(on?0xff1028:rem<=0?0x18ff62:0x220000);l.material.emissiveIntensity=on?5:rem<=0?6:.2});
}
function updateGridAnimation(dt,now,rem){
  const pulse=Math.sin(now*.028),rev=Math.max(0,1-rem/COUNTDOWN_MS);
  if(player){player.mesh.position.y=carGroundY(player.mesh)+Math.max(0,pulse)*.018;updateDetailedCarVisual(player.mesh,4+rev*12,rem<650,false,dt);}
  ai.forEach((a,i)=>{a.mesh.position.y=(a.gridY||.1)+Math.max(0,Math.sin(now*.026+i*.9))*.016;updateDetailedCarVisual(a.mesh,5+rev*10,rem<520&&i%2===0,false,dt)});
  audio.engineSpeed(10+rev*22);updateStartLights(rem);
}
function updateStartCamera(dt,now,rem){
  if(!player)return;const f=new THREE.Vector3(Math.sin(player.angle),0,Math.cos(player.angle)),s=new THREE.Vector3(f.z,0,-f.x),elapsed=COUNTDOWN_MS-rem;
  let desired,look;
  if(elapsed<1100){const u=elapsed/1100;desired=player.mesh.position.clone().addScaledVector(s,lerp(-14,10,u)).addScaledVector(f,lerp(-4,-10,u)).add(new THREE.Vector3(0,4.2,0));look=player.mesh.position.clone().add(new THREE.Vector3(0,1.15,0));}
  else{const u=clamp((elapsed-1100)/1900,0,1);desired=player.mesh.position.clone().addScaledVector(f,lerp(-10,-13,u)).addScaledVector(s,lerp(4,0,u)).add(new THREE.Vector3(0,lerp(4.8,7.1,u),0));look=player.mesh.position.clone().addScaledVector(f,lerp(2,8,u)).add(new THREE.Vector3(0,1.2,0));}
  camera.position.lerp(desired,1-Math.pow(.0008,dt));camera.lookAt(look);camera.fov=lerp(camera.fov,64,dt*5);camera.updateProjectionMatrix();
}
function updateAI(dt,now){ai.forEach((a,i)=>{if(eliminated.includes(a)){a.mesh.visible=false;return}if(a.crashTime>0){a.crashTime-=dt;a.mesh.position.y+=dt*2.1;a.mesh.rotation.z+=dt*7.5;a.mesh.rotation.x+=dt*3.4;a.speed*=Math.pow(.18,dt);if(a.crashTime<=0){a.knocked=false;settleCarOnRoad(a.mesh,0,true);a.mesh.rotation.x=a.mesh.rotation.z=0;a.t=Math.max(0,a.t-.014);a.speed=Math.max(a.baseSpeed*.82,a.speed)}return}
  a.boost-=dt;if(a.boost<0)a.boost=2.4+Math.random()*4.6;const boosting=a.boost<.42;const aiProgress=(a.lap-1)+a.t,delta=(player?.progress??aiProgress)-aiProgress;const catchup=clamp(delta*.16,-.045,.085);const racePhase=clamp(((a.lap-1)+a.t)/Math.max(1,currentEvent.laps||1),0,1);const stamina=1-.012*racePhase;const target=a.baseSpeed*(1+catchup)*stamina*(boosting?1.08:1);a.speed=lerp(a.speed,target,1-Math.pow(.025,dt));a.speed=Math.max(a.baseSpeed*.84,Math.min(a.maxSpeed,target*1.05));
  a.t+=(a.speed/trackLength)*dt*(1+Math.sin(now*.00065+i)*.012);if(a.t>=1){a.t-=1;a.lap++}const lane=a.lane+Math.sin(now*.00045+i*1.7)*.42,p=pointAt(a.t).addScaledVector(sideAt(a.t),lane),f=tangentAt(a.t);a.mesh.position.set(p.x,.1+Math.max(0,Math.sin(now*.008+i))*.008,p.z);a.mesh.rotation.y=Math.atan2(f.x,f.z);if(boosting&&Math.random()<dt*12){const back=f.clone().multiplyScalar(-2.8);vfx.trail(a.mesh.position.clone().add(back).add(new THREE.Vector3(0,.3,0)),0x76dfff,.7)}updateDetailedCarVisual(a.mesh,a.speed,boosting,false,dt,Math.sin(now*.00045+i)*.25)})}

function getPosition(){if(!player)return 1;const list=[{p:player.progress,who:'p'},...ai.filter(a=>!eliminated.includes(a)).map(a=>({p:(a.lap-1)+a.t,who:a}))].sort((a,b)=>b.p-a.p);return list.findIndex(x=>x.who==='p')+1}
function knockout(now){if(currentEvent.mode!=='Knockout'||now<knockoutClock)return;knockoutClock=now+20000;const alive=ai.filter(a=>!eliminated.includes(a));if(!alive.length)return;const all=[{who:'p',p:player.progress},...alive.map(a=>({who:a,p:(a.lap-1)+a.t}))].sort((a,b)=>b.p-a.p);const last=all.at(-1).who;if(last==='p')finishRace(true);else{eliminated.push(last);audio.tone(320,.18,'square',.08,-100);toast('RIVAL ELIMINATED','good')}}
function finishRace(knocked=false){if(state==='finished')return;state='finished';player.finished=true;finishAt=performance.now();const elapsed=finishAt-countdownUntil,place=getPosition();const success=!knocked&&(currentEvent.mode==='Time Attack'?elapsed<=currentEvent.target:currentEvent.mode==='Knockout'?place===1:place===1);trackEvent('race_completed',{event_id:currentEvent.id,mode:currentEvent.mode,track:currentEvent.track,car_id:profile.selectedCar,position:place,success,elapsed_ms:Math.round(elapsed),top_speed:Math.round(player.topSpeed),stunts:player.stunts,knockdowns:player.knockdowns});let reward=currentEvent.quick?Math.max(300,success?500:250):(success?currentEvent.reward:Math.max(250,Math.round(currentEvent.reward*.2)));reward+=Math.round(player.maxCombo*45)+player.stunts*90+player.knockdowns*140;profile.credits+=reward;if(success&&!currentEvent.quick)profile.completed[currentEvent.id]=true;if(!currentEvent.quick)profile.best[currentEvent.id]=Math.min(profile.best[currentEvent.id]||Infinity,elapsed);save();checkAchievements({topSpeed:player.topSpeed,maxCombo:player.maxCombo});setTimeout(()=>results(success,place,elapsed,reward,knocked),450)}
function results(success,place,elapsed,reward,knocked){$('#hud').hidden=true;$('#minimap').style.display='none';audio.engineSpeed(0);audio.reward();menuChrome(success?'VICTORY':'RACE COMPLETE',`<div class="resultHero ${success?'win':''}"><div><small>${currentEvent.mode.toUpperCase()}</small><b>${knocked?'KNOCKED OUT':currentEvent.name}</b></div><span>${formatTime(elapsed)}</span></div><div class="grid four"><div class="card"><small>POSITION</small><b>${place} / ${currentEvent.ai+1}</b></div><div class="card"><small>TOP SPEED</small><b>${Math.round(player.topSpeed)} km/h</b></div><div class="card"><small>STUNTS / KOs</small><b>${player.stunts} / ${player.knockdowns}</b></div><div class="card"><small>REWARD</small><b>+${reward} CR</b></div></div><div class="resultBtns"><button class="button" id="again">RACE AGAIN</button>${!currentEvent.quick?'<button class="button" id="next">NEXT EVENT</button>':''}<button class="button secondary" id="homeBtn">HOME</button></div>`);$('#again').onclick=()=>startRace(currentEvent);$('#homeBtn').onclick=home;if($('#next'))$('#next').onclick=()=>{const i=EVENTS.findIndex(e=>e.id===currentEvent.id);raceSetup(EVENTS[Math.min(EVENTS.length-1,i+1)])};}
function updateCamera(dt){if(!player)return;const f=new THREE.Vector3(Math.sin(player.angle),0,Math.cos(player.angle)),speed=Math.abs(player.speed),cfg=profile.camera==='close'?{back:9,height:5.2}:profile.camera==='far'?{back:17,height:9}:{back:13,height:7.1};const driftSide=new THREE.Vector3(f.z,0,-f.x).multiplyScalar(player.drift>3?Math.sin(performance.now()*.018)*.68:0),desired=player.mesh.position.clone().addScaledVector(f,-cfg.back-speed*.032).add(new THREE.Vector3(0,cfg.height+speed*.023,0)).add(driftSide);camera.position.lerp(desired,1-Math.pow(.0015,dt));cameraShake=Math.max(0,cameraShake-dt*2.2);if(cameraShake>0){camera.position.x+=(Math.random()-.5)*cameraShake;camera.position.y+=(Math.random()-.5)*cameraShake*.55;camera.position.z+=(Math.random()-.5)*cameraShake}camera.lookAt(player.mesh.position.clone().addScaledVector(f,8+speed*.06).add(new THREE.Vector3(0,1.35,0)));camera.fov=lerp(camera.fov,65+Math.min(speed,75)*.25+(player.shock?7:0),dt*6);camera.updateProjectionMatrix();$('.speedlines').style.opacity=player.shock?'.92':speed>44?'.32':'0';$('.chromatic').style.opacity=player.shock?'.75':speed>55?'.18':'0';document.documentElement.style.setProperty('--boost',player.shock?'1':'0')}
function formatTime(ms){ms=Math.max(0,ms||0);const m=Math.floor(ms/60000),s=Math.floor(ms/1000)%60,x=Math.floor(ms%1000);return`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(x).padStart(3,'0')}`}
function hud(now){const kph=Math.round(Math.abs(player.speed)*6.2);$('#speed').textContent=kph;$('#speedArc').style.strokeDashoffset=String(280-Math.min(280,kph/420*280));$('#gear').textContent=player.speed<-.5?'R':kph<8?'N':Math.min(7,1+Math.floor(kph/45));$('#nitroFill').style.width=player.nitro+'%';$('#nitroFill').className=player.shock?'shock':player.nitro>32&&player.nitro<62?'perfect':'';$('#nitroState').textContent=player.shock?'NITRO SHOCKWAVE':player.nitro>32&&player.nitro<62?'PERFECT NITRO':'';$('#lap').textContent=currentEvent.endless?'ENDLESS':`LAP ${Math.min(player.lap,currentEvent.laps)}/${currentEvent.laps}`;$('#pos').textContent=currentEvent.endless?'PRACTICE':`${getPosition()} / ${currentEvent.ai+1-eliminated.length}`;$('#modeHud').textContent=currentEvent.mode.toUpperCase();$('#weatherHud').textContent=trackById(currentEvent.track).weather.toUpperCase();$('#time').textContent=formatTime(now-countdownUntil);$('#combo').textContent=player.combo?`PERFECT DRIFT ×${player.combo}`:'';$('#airtime').textContent=player.air>0?`AIRTIME ${((now-player.airStart)/1000).toFixed(1)}s`:'';if(now>stuntMessageUntil)$('#stunt').textContent='';$('#knockdowns').textContent=player.knockdowns?`KNOCKDOWNS ${player.knockdowns}`:'';if(currentEvent.mode==='Knockout')$('#objective').textContent=`ELIMINATION IN ${Math.max(0,Math.ceil((knockoutClock-now)/1000))}s`;if(!currentEvent.endless)drawMinimap();}
function drawMinimap(){const c=$('#minimap'),ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;for(const p of trackSamples){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minZ=Math.min(minZ,p.z);maxZ=Math.max(maxZ,p.z)}const sx=(w-18)/Math.max(1,maxX-minX),sy=(h-18)/Math.max(1,maxZ-minZ),sc=Math.min(sx,sy),map=p=>[9+(p.x-minX)*sc,9+(p.z-minZ)*sc];ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=3;ctx.beginPath();trackSamples.forEach((p,i)=>{const [x,y]=map(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.stroke();const draw=(p,col,r)=>{const[x,y]=map(p);ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()};ai.filter(a=>!eliminated.includes(a)).forEach(a=>draw(a.mesh.position,'#ff667f',2));draw(player.mesh.position,'#65e6ff',4)}
function weatherTick(dt){if(!weatherParticles)return;const arr=weatherParticles.geometry.attributes.position.array,weather=trackById(currentEvent.track).weather;for(let i=0;i<arr.length;i+=3){arr[i+1]-=dt*(weather==='snow'?7:weather==='dust'?2:45);if(arr[i+1]<0)arr[i+1]=90;if(weather==='dust')arr[i]+=dt*7}weatherParticles.geometry.attributes.position.needsUpdate=true;if(player)weatherParticles.position.x=player.mesh.position.x*.15,weatherParticles.position.z=player.mesh.position.z*.15}
function animate(now){requestAnimationFrame(animate);if(state==='garage')renderGaragePreview(now);if(state==='menu'&&homePreview)renderHomePreview(now);const dt=Math.min(.035,(now-prev)/1000);prev=now;if(state==='countdown'){const rem=countdownUntil-now;$('.cinematicBars').classList.add('on');if(rem<=0){state='race';$('.cinematicBars').classList.remove('on');settleCarOnRoad(player.mesh,0,true);ai.forEach(a=>settleCarOnRoad(a.mesh,0,true));updateStartLights(0);$('#countdown').textContent='GO!';audio.countdown(0);audio.engineSpeed(0);cameraShake=.38;setTimeout(()=>$('#countdown').textContent='',560)}else{const n=Math.min(3,Math.ceil(rem/1000));if($('#countdown').textContent!==String(n)){audio.countdown(n);$('#countdown').textContent=n}updateGridAnimation(dt,now,rem)}}else if(state==='race'){updatePlayer(dt,now);updateAI(dt,now);knockout(now);hud(now)}if(state==='countdown')updateStartCamera(dt,now,countdownUntil-now);else if(state!=='paused')updateCamera(dt);weatherTick(dt);updateEnvironmentVisuals(world,dt,now);vfx.update(dt);pickups.forEach((p,i)=>{if(!p.taken){p.mesh.rotation.y+=dt*2.2;p.mesh.rotation.x+=dt*.8;p.mesh.position.y=1.35+Math.sin(now*.004+i)*.28}});if(profile.quality==='low')renderer.render(scene,camera);else composer.render()}
function applyQuality(){const q=profile.quality;renderer.setPixelRatio(Math.min(devicePixelRatio,q==='high'?1.65:q==='medium'?1.2:1));renderer.shadowMap.enabled=q!=='low';sun.shadow.mapSize.set(q==='high'?2048:1024,q==='high'?2048:1024)}applyQuality();audio.setEnabled(profile.sound);
addEventListener('popstate',e=>{
  // Android back button and back gesture use browser history.
  if(state==='race'||state==='countdown'){
    history.pushState({vlScreen:'race'},'',location.href);
    if(state!=='paused')togglePause();
    return;
  }
  if(state==='paused'){
    shell.style.display='none';
    $('#hud').hidden=false;
    state='race';
    audio.resume();
    history.pushState({vlScreen:'race'},'',location.href);
    return;
  }
  const target=e.state?.vlScreen||'home';
  historyRender=true;
  if(target==='career')career();
  else if(target==='quick race')quickRace();
  else if(target==='garage')garage();
  else if(target==='settings')settings();
  else if(target==='achievements')achievements();
  else if(target==='controls')help();
  else if(target==='tuning')garage();
  else if(target==='account')settings();
  else if(target==='race ready')career();
  else home();
});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);bloom.resolution.set(innerWidth,innerHeight)});addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;trackEvent('install_available')});addEventListener('appinstalled',()=>{deferredPrompt=null;firstLaunchResolved=true;trackEvent('pwa_installed');const u=currentPlayer();if(u)markInstalled(u).catch(()=>{});if($('#toastZone'))toast('VELOCITY LEGENDS INSTALLED','good')});if('serviceWorker' in navigator){window.addEventListener('load',async()=>{try{const wanted=new URL(`${import.meta.env.BASE_URL}sw.js`,location.href).href;const regs=await navigator.serviceWorker.getRegistrations();for(const reg of regs){const url=reg.active?.scriptURL||reg.waiting?.scriptURL||reg.installing?.scriptURL||'';if(url&&url!==wanted)await reg.unregister()}await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)}catch(error){console.warn('Service worker registration failed:',error)}})}window.addEventListener('contextmenu',e=>e.preventDefault());addEventListener('pointerdown',()=>{audio.resume();setTimeout(()=>{if(profile.music&&state==='menu')audio.startMusic()},0)},{once:true});
startAccountBoot();
