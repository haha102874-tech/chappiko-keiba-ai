const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const APPKEY="chappiko_slot_v9";
const LEGACY_APPKEY="chappiko_slot_v8";
const HISTORYKEY="chappiko_slot_sessions_v9";
const LEGACY_HISTORYKEY="chappiko_slot_sessions_v8";
const MACHINESKEY="chappiko_slot_machines_v9";
const LEGACY_MACHINESKEY="chappiko_slot_machines_v8";

const FAVORITESKEY="chappiko_slot_favorites_v9";
const RECENTSKEY="chappiko_slot_recents_v9";
if(!localStorage.getItem(MACHINESKEY)&&localStorage.getItem(LEGACY_MACHINESKEY))localStorage.setItem(MACHINESKEY,localStorage.getItem(LEGACY_MACHINESKEY));
if(!localStorage.getItem(HISTORYKEY)&&localStorage.getItem(LEGACY_HISTORYKEY))localStorage.setItem(HISTORYKEY,localStorage.getItem(LEGACY_HISTORYKEY));
if(!localStorage.getItem(APPKEY)&&localStorage.getItem(LEGACY_APPKEY))localStorage.setItem(APPKEY,localStorage.getItem(LEGACY_APPKEY));
if(!localStorage.getItem(FAVORITESKEY)&&localStorage.getItem("chappiko_slot_favorites_v8"))localStorage.setItem(FAVORITESKEY,localStorage.getItem("chappiko_slot_favorites_v8"));
if(!localStorage.getItem(RECENTSKEY)&&localStorage.getItem("chappiko_slot_recents_v8"))localStorage.setItem(RECENTSKEY,localStorage.getItem("chappiko_slot_recents_v8"));
let customMachines=JSON.parse(localStorage.getItem(MACHINESKEY)||"[]");
let currentMachine=null;
let selectedGgoItem="光剣";
let pickerMode="all";

function builtinMachines(){return window.ChappikoRegistry.all()}
function getMachineDef(id){
 const built=window.ChappikoRegistry.get(id);
 if(built)return built;
 const c=customMachines.find(x=>x.id===id);
 if(!c)return null;
 return {...window.ChappikoRegistry.get("platform_demo"),...c,profile:"generic",custom:true};
}
function getMainDefs(){return currentMachine?.main||[]}
function machineFeature(name){return !!currentMachine?.features?.[name]}
function defaultMachineNav(){
 return [
  {target:"sessionCard",label:"実戦"},
  {target:"mainCard",label:"小役"},
  {target:"hintNavigatorCard",label:"示唆"},
  {target:"dashboardCard",label:"分析"},
  {target:"timelineCard",label:"時系列"},
  {target:"historyCard",label:"履歴"}
 ];
}
function renderMachineNav(){
 const nav=$("#machineQuickNav"); if(!nav)return;
 const items=(currentMachine?.nav||defaultMachineNav()).filter(x=>{
   if(x.feature && !machineFeature(x.feature))return false;
   const el=document.getElementById(x.target);
   return !!el;
 });
 nav.innerHTML=items.map(x=>`<button data-jump="${esc(x.target)}">${esc(x.label)}</button>`).join("");
 nav.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>document.getElementById(b.dataset.jump)?.scrollIntoView({behavior:"smooth",block:"start"}));
}
function getFavorites(){try{return JSON.parse(localStorage.getItem(FAVORITESKEY)||"[]")}catch{return []}}
function getRecents(){try{return JSON.parse(localStorage.getItem(RECENTSKEY)||"[]")}catch{return []}}
function isFavorite(id){return getFavorites().includes(id)}
function toggleFavorite(id){
 const a=getFavorites();const next=a.includes(id)?a.filter(x=>x!==id):[...a,id];
 localStorage.setItem(FAVORITESKEY,JSON.stringify(next));renderMachinePicker();
}
function touchRecent(id){
 const a=getRecents().filter(x=>x!==id);a.unshift(id);
 localStorage.setItem(RECENTSKEY,JSON.stringify(a.slice(0,6)));
}
window.toggleFavorite=toggleFavorite;


const TESTERKEY="chappiko_test_tester_v1";
const FEEDBACKKEY="chappiko_test_feedback_v1";
function testerName(){return localStorage.getItem(TESTERKEY)||"はるか"}
function feedbacks(){try{return JSON.parse(localStorage.getItem(FEEDBACKKEY)||"[]")}catch{return []}}
function renderFeedback(){
 const el=$("#feedbackList"); if(!el)return;
 const rows=feedbacks();
 el.innerHTML=rows.length?rows.map((x,i)=>`<div class="history-item"><b>${esc(x.type)}</b><span>${esc(x.text)}</span><small>${esc(x.tester)}・${new Date(x.at).toLocaleString()}</small><button onclick="deleteFeedback(${i})">削除</button></div>`).join(""):`<p class="muted">まだ改善メモはありません。</p>`;
}
function deleteFeedback(i){const a=feedbacks();a.splice(i,1);localStorage.setItem(FEEDBACKKEY,JSON.stringify(a));renderFeedback()}
window.deleteFeedback=deleteFeedback;
function freshState(machineId){
 return {machineId,startedAt:Date.now(),meta:{playDate:new Date().toISOString().slice(0,10),hall:"",machineNo:"",games:0,lcdGames:0,syncGames:true,invest:0,returnYen:0,memo:""},
 main:{},special:{},hints:{},cond:{},end:{},trophy:{},miniEnding:{},miniRosario:{},czEvents:[],ggoEvents:[],koyakuEvents:[],scEvents:[],hintLog:[],scSession:null,linkWindow:5};
}
let state=freshState("sao2");


function migrateState(){
 state.special=state.special||{}; state.hints=state.hints||{}; state.koyakuEvents=state.koyakuEvents||[];
 state.czEvents=state.czEvents||[];
 state.ggoEvents=state.ggoEvents||[];
 state.scEvents=state.scEvents||[];
 state.hintLog=state.hintLog||[];
 state.scSession=state.scSession||null;
 state.linkWindow=+(state.linkWindow||5); state.meta.lcdGames=+(state.meta.lcdGames||0); state.meta.syncGames=state.meta.syncGames!==false;
}

function machineList(){return [...builtinMachines(),...customMachines.map(c=>getMachineDef(c.id)).filter(Boolean)]}
function renderMachinePicker(){
 const q=($("#machineSearch")?.value||"").trim().toLowerCase();
 const fav=getFavorites(),recent=getRecents();
 let rows=machineList().filter(m=>{
   const hay=[m.name,m.subtitle,...(m.search||[])].join(" ").toLowerCase();
   return !q||hay.includes(q);
 });
 if(pickerMode==="favorites")rows=rows.filter(m=>fav.includes(m.id));
 if(pickerMode==="recent")rows=rows.filter(m=>recent.includes(m.id)).sort((a,b)=>recent.indexOf(a.id)-recent.indexOf(b.id));
 $("#machineCards").innerHTML=rows.length?rows.map(m=>`<div class="machine-card-wrap">
   <button class="favorite-btn ${fav.includes(m.id)?"active":""}" onclick="event.stopPropagation();toggleFavorite('${m.id}')" aria-label="お気に入り">${fav.includes(m.id)?"★":"☆"}</button>
   <button class="machine-card" data-machine="${m.id}">
     <span class="tag">${m.testOnly?"TEST限定":m.custom?"カスタム":m.profile==="generic"?"汎用テンプレート":"専用カウンター"}</span>
     <div class="machine-icon">${m.icon||"🎰"}</div><h3>${esc(m.name)}</h3><p>${esc(m.subtitle||"カスタム機種")}</p>
   </button></div>`).join(""):`<div class="empty-search">該当する機種がありません。</div>`;
 $$(".machine-card").forEach(b=>b.onclick=()=>openMachine(b.dataset.machine));
}
function machineVisualClass(id){
 const map={sao2:"sao",tokyo_ghoul:"ghoul",otome5:"otome",vividred_test:"vivid",generic:"generic"};
 return map[id]||"generic";
}
function renderV11MachineRail(){
 const rail=$("#v11MachineRail"); if(!rail)return;
 const machines=machineList().filter(m=>m.id!=="generic");
 rail.innerHTML=machines.map(m=>`<button type="button" class="v11-machine-banner ${machineVisualClass(m.id)} ${currentMachine?.id===m.id?"selected":""}" data-v11-machine="${m.id}"><span class="banner-art" aria-hidden="true"></span><span class="banner-copy"><b>${esc(m.name)}</b><small>${esc(m.subtitle||"")}</small></span>${m.testOnly?'<i>TEST限定</i>':currentMachine?.id===m.id?'<i>選択中</i>':''}</button>`).join("");
 $$('[data-v11-machine]').forEach(b=>b.onclick=()=>openMachine(b.dataset.v11Machine));
}
function openMachine(id){
 currentMachine=getMachineDef(id)||builtinMachines()[0]; touchRecent(currentMachine.id);
 const saved=JSON.parse(localStorage.getItem(APPKEY)||"null");
 state=saved&&saved.machineId===id?saved:freshState(id); migrateState();
 $("#machinePicker").classList.add("hidden");
 $("#appHeader").classList.remove("hidden-app");$("#appMain").classList.remove("hidden-app");$("#feedbackFab").classList.remove("hidden-app");$("#appFooter").classList.remove("hidden-app");
 if($("#machineTitle")) $("#machineTitle").innerHTML=`${esc(currentMachine.name)} <span class="pill">v11.2</span>`;
 $("#machineSubtitle").textContent=currentMachine.subtitle||"専用カウンター";
 if($("#visualMachineName")) $("#visualMachineName").textContent=currentMachine.name;
 renderV11MachineRail();
 hydrateInputs(); render(); renderMachineNav();
 // v11.1: 小役カウンターを機種選択直後の主画面として必ず表示
 const mainCard=document.getElementById("mainCard");
 if(mainCard){ mainCard.style.display=""; }
 document.body.scrollTop=0;document.documentElement.scrollTop=0;
}
function showPicker(){
 save();
 $("#machinePicker").classList.remove("hidden");
 $("#appHeader").classList.add("hidden-app");$("#appMain").classList.add("hidden-app");$("#feedbackFab").classList.add("hidden-app");$("#appFooter").classList.add("hidden-app");
 renderMachinePicker();
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function rate(count){const g=+state.meta.games||0;return count>0&&g>0?`1/${(g/count).toFixed(1)}`:"1/—"}
function pct(a,b){return b>0?`${(100*a/b).toFixed(1)}%`:"—"}
function addGames(n){
 state.meta.games=Math.max(0,(+state.meta.games||0)+n);
 if(state.meta.syncGames) state.meta.lcdGames=Math.max(0,(+state.meta.lcdGames||0)+n);
 $("#games").value=state.meta.games; updateGameDisplays(); save();renderSummary();renderSettings();renderAutoLinks();
}
function addLcdGames(n){state.meta.lcdGames=Math.max(0,(+state.meta.lcdGames||0)+n);updateGameDisplays();save();renderAutoLinks()}
function updateGameDisplays(){if($("#currentGDisplay"))$("#currentGDisplay").textContent=(+state.meta.games||0)+"G";if($("#lcdGDisplay"))$("#lcdGDisplay").textContent=(+state.meta.lcdGames||0)+"G"}
window.addLcdGames=addLcdGames;
function inc(group,key,delta=1){
 if(group==="main" && delta>0){
   const defs=getMainDefs();
   const def=defs.find(x=>x[0]===key);
   const gameInput=$("#koyakuGame");
   const typed=gameInput && gameInput.value!=="" ? +gameInput.value : null;
   const game=typed!==null ? typed : (+state.meta.games||0);
   const lcdInput=$("#koyakuLcdGame");
   const lcdTyped=lcdInput && lcdInput.value!=="" ? +lcdInput.value : null;
   const lcdGame=lcdTyped!==null ? lcdTyped : (+state.meta.lcdGames||0);
   state.koyakuEvents=state.koyakuEvents||[];
   state.koyakuEvents.unshift({id:Date.now()+Math.random(),game,lcdGame,key,name:def?def[1]:key,at:Date.now()});
   if(gameInput) gameInput.value=""; if(lcdInput) lcdInput.value="";
 }
 state[group][key]=Math.max(0,(state[group][key]||0)+delta);
 if(delta>0 && ["end","trophy","miniEnding","miniRosario"].includes(group))logHint(group,key);
 if(group==="main" && delta<0){
   state.koyakuEvents=state.koyakuEvents||[];
   const idx=state.koyakuEvents.findIndex(x=>x.key===key);
   if(idx>=0) state.koyakuEvents.splice(idx,1);
 }
 save();render()
}
function incCond(id,k,d){const x=state.cond[id]||(state.cond[id]={a:0,b:0});x[k]=Math.max(0,(x[k]||0)+d);save();render()}
window.addGames=addGames;window.inc=inc;window.incCond=incCond;

function reelIconSvg(kind,label){
 const common='viewBox="0 0 64 48" aria-hidden="true" focusable="false"';
 if(kind==="cherry")return `<svg ${common} class="reel-icon-svg" role="img"><path d="M31 21c-2-9 3-14 10-17" fill="none" stroke="#15803d" stroke-width="3.5" stroke-linecap="round"/><path d="M38 7c6-5 12-4 17 1-5 5-11 7-17 1Z" fill="#22c55e" stroke="#166534" stroke-width="2"/><circle cx="23" cy="31" r="10" fill="#ef4444" stroke="#991b1b" stroke-width="2.5"/><circle cx="39" cy="32" r="10" fill="#dc2626" stroke="#991b1b" stroke-width="2.5"/><circle cx="19" cy="27" r="2.5" fill="#fecaca"/></svg>`;
 if(kind==="watermelon")return `<svg ${common} class="reel-icon-svg" role="img"><path d="M7 35C14 13 50 13 57 35Z" fill="#ef4444" stroke="#166534" stroke-width="5"/><path d="M10 35h44" stroke="#86efac" stroke-width="4"/><ellipse cx="24" cy="28" rx="1.5" ry="3" fill="#111827"/><ellipse cx="34" cy="25" rx="1.5" ry="3" fill="#111827"/><ellipse cx="43" cy="29" rx="1.5" ry="3" fill="#111827"/></svg>`;
 if(kind==="bell")return `<svg ${common} class="reel-icon-svg" role="img"><path d="M20 15c2-7 7-10 12-10s10 3 12 10l4 16H16l4-16Z" fill="#facc15" stroke="#a16207" stroke-width="2.5"/><rect x="13" y="30" width="38" height="7" rx="3.5" fill="#f59e0b" stroke="#92400e" stroke-width="2"/><circle cx="32" cy="40" r="4" fill="#fde047" stroke="#a16207" stroke-width="2"/><path d="M22 18c3-3 5-4 8-4" stroke="#fef08a" stroke-width="3" stroke-linecap="round"/></svg>`;
 if(kind==="replay")return `<svg ${common} class="reel-icon-svg" role="img"><path d="M16 28a16 16 0 0 1 26-12l5-6v15H32l6-5a10 10 0 1 0 1 14" fill="none" stroke="#2563eb" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><text x="32" y="44" text-anchor="middle" font-size="9" font-weight="900" fill="#1d4ed8">REPLAY</text></svg>`;
 if(kind==="bar")return `<svg ${common} class="reel-icon-svg" role="img"><rect x="6" y="10" width="52" height="28" rx="6" fill="#111827" stroke="#f8fafc" stroke-width="3"/><rect x="10" y="14" width="44" height="20" rx="3" fill="#1f2937" stroke="#f59e0b" stroke-width="2"/><text x="32" y="29" text-anchor="middle" font-size="16" font-weight="1000" fill="#f8fafc">BAR</text></svg>`;
 if(kind==="seven"||kind==="green7")return `<svg ${common} class="reel-icon-svg" role="img"><path d="M12 8h40L30 42H18L38 18H12Z" fill="${kind==='green7'?'#16a34a':'#dc2626'}" stroke="#f59e0b" stroke-width="3" stroke-linejoin="round"/><path d="M18 13h23" stroke="#fff7ed" stroke-width="4" stroke-linecap="round" opacity=".8"/></svg>`;
 if(kind==="bullet")return `<svg ${common} class="reel-icon-svg" role="img"><path d="M38 7 52 21 28 45 14 31Z" fill="#7c3aed" stroke="#4c1d95" stroke-width="3"/><path d="m19 33 19-19" stroke="#ede9fe" stroke-width="5" stroke-linecap="round"/><circle cx="41" cy="12" r="4" fill="#c4b5fd"/></svg>`;
 if(kind==="miss")return `<svg ${common} class="reel-icon-svg" role="img"><path d="M16 10 48 38M48 10 16 38" stroke="#ef4444" stroke-width="7" stroke-linecap="round"/></svg>`;
 if(kind==="blank")return `<svg ${common} class="reel-icon-svg reel-blank-svg" role="img"><circle cx="32" cy="24" r="3" fill="#cbd5e1"/></svg>`;
 return `<svg ${common} class="reel-icon-svg" role="img"><rect x="5" y="7" width="54" height="34" rx="7" fill="#e2e8f0"/><text x="32" y="29" text-anchor="middle" font-size="12" font-weight="900" fill="#0f172a">${esc(label)}</text></svg>`;
}
function reelSymbol(token){
 const raw=String(token||"");
 const map={
  "チェ":["cherry","チェリー"],"チェリー":["cherry","チェリー"],
  "スイカ":["watermelon","スイカ"],"ベル":["bell","ベル"],
  "リプ":["replay","リプレイ"],"リプレイ":["replay","リプレイ"],
  "BAR":["bar","BAR"],"7":["seven","7"],"緑7":["green7","緑7"],
  "弾":["bullet","バレット"],"バレット":["bullet","バレット"],
  "×":["miss","ハズレ"],"・":["blank","空白"],"":["blank","空白"]
 };
 const m=map[raw]||["other",raw];
 return `<span class="reel-symbol reel-${m[0]}" title="${esc(m[1])}" aria-label="${esc(m[1])}">${reelIconSvg(m[0],m[1])}</span>`;
}
function koyakuMiniGrid(variant){
 const cells=(variant?.cells||[]).slice(0,9);
 while(cells.length<9)cells.push("");
 return `<div class="reel-mini" aria-hidden="true">${cells.map(reelSymbol).join("")}</div>`;
}
function renderKoyakuGuideButton(id){
 const guide=(currentMachine?.koyakuGuides||{})[id];
 if(!guide)return "";
 const first=(guide.variants||[])[0]||null;
 return `<button type="button" class="koyaku-guide-btn" onclick="openKoyakuGuide('${id}')" aria-label="${esc(guide.title||id)}の停止形を見る">${first?koyakuMiniGrid(first):""}<span>停止形を見る</span></button>`;
}
function openKoyakuGuide(id){
 const guide=(currentMachine?.koyakuGuides||{})[id];
 if(!guide)return;
 const body=(guide.variants||[]).map(v=>`<div class="reel-guide-variant"><div class="reel-guide-head"><b>${esc(v.label||guide.title||id)}</b><span>${esc(v.note||"")}</span></div>${koyakuMiniGrid(v)}${v.tip?`<p>${esc(v.tip)}</p>`:""}</div>`).join("");
 const html=`<div class="section-head"><h2>${esc(guide.title||id)}</h2><button type="button" class="secondary" id="closeKoyakuGuide">×</button></div>${guide.summary?`<p class="note">${esc(guide.summary)}</p>`:""}<div class="reel-guide-list">${body}</div><p class="note">※停止形は代表例・簡略図です。実戦では押し位置や取りこぼしで見え方が変わることがあります。</p>`;
 const modal=$("#koyakuGuideModal");
 $("#koyakuGuideContent").innerHTML=html;
 modal.classList.remove("hidden");
 $("#closeKoyakuGuide").onclick=()=>modal.classList.add("hidden");
}
window.openKoyakuGuide=openKoyakuGuide;
function renderMain(){
 const defs=getMainDefs();
 const target=$("#mainCounters"); if(!target)return;
 target.innerHTML=defs.map(([id,name,sub])=>{const c=state.main[id]||0;const hasGuide=!!(currentMachine?.koyakuGuides||{})[id];return `<div class="counter ${hasGuide?"visual-counter":""}"><div class="counter-top"><div><div class="name">${esc(name)}</div><div class="sub">${esc(sub)}</div></div><div class="rate-chip">${rate(c)}</div></div>${renderKoyakuGuideButton(id)}<div class="countrow"><div class="count">${c}</div><div class="counter-actions"><button class="minus" onclick="inc('main','${id}',-1)">−</button><button class="plus-btn" onclick="inc('main','${id}',1)">＋1</button></div></div></div>`}).join("");
}

function hintDef(group,key){
 const defs=group==="hint"?(currentMachine?.hints||[]):group==="end"?(currentMachine?.endScreens||[]):group==="trophy"?(currentMachine?.trophies||[]):group==="miniEnding"?(currentMachine?.miniEnding||[]):group==="miniRosario"?(currentMachine?.miniRosario||[]):[];
 return defs.find(x=>x[0]===key)||null;
}
function logHint(group,key){
 const d=hintDef(group,key); if(!d)return;
 const name=d[1]||key, meaning=d[2]||"示唆を記録";
 const strength=group==="end"?(d[5]||0):(d[3]||0);
 const nav=(currentMachine?.hintNav||{})[key]||{};
 state.hintLog=state.hintLog||[];
 state.hintLog.unshift({id:Date.now()+Math.random(),group,key,name,meaning,strength,mode:nav.mode||"",setting:nav.setting||meaning,source:nav.source||"",realG:+state.meta.games||0,lcdG:+state.meta.lcdGames||0,at:new Date().toISOString()});
 state.hintLog=state.hintLog.slice(0,100);
}
function incSpecial(key,delta=1){
 state.special[key]=Math.max(0,(state.special[key]||0)+delta);save();render();
}
function incHint(key,delta=1){
 state.hints[key]=Math.max(0,(state.hints[key]||0)+delta);if(delta>0)logHint("hint",key);save();render();
}
window.incSpecial=incSpecial;window.incHint=incHint;

function renderMachineSpecific(){
 const cfg=currentMachine, card=$("#machineSpecificCard");
 if(!cfg?.special?.length && !cfg?.hints?.length){card.style.display="none";return}
 card.style.display="";
 $("#machineSpecificTitle").textContent=cfg.title||`${cfg.name} 専用カウンター`;
 $("#machineSpecificCounters").innerHTML=(cfg.special||[]).map(([id,name,sub])=>{
   const c=state.special[id]||0;return `<div class="counter"><div class="name">${esc(name)}</div><div class="sub">${esc(sub)}</div>
   <div class="countrow"><div><div class="count">${c}</div></div><div><button class="minus" onclick="incSpecial('${id}',-1)">−</button><button onclick="incSpecial('${id}',1)">＋</button></div></div></div>`;
 }).join("");
 $("#machineHints").innerHTML=(cfg.hints||[]).map(([id,name,hint,strength])=>{
   const c=state.hints[id]||0,cls=strength>=6?"confirmed":strength>=5?"strong":"";
   return `<div class="event ${cls}"><div class="event-head"><div class="event-name">${esc(name)}</div><div class="event-count">${c}</div></div>
   <div class="hint">${esc(hint)}</div><div class="event-bottom"><button class="minus" onclick="incHint('${id}',-1)">−</button><button onclick="incHint('${id}',1)">＋</button></div></div>`;
 }).join("");
}

function deleteHintLog(id){state.hintLog=(state.hintLog||[]).filter(x=>String(x.id)!==String(id));save();renderHintNavigator();renderUnifiedTimeline()}
window.deleteHintLog=deleteHintLog;
function renderHintNavigator(){
 const card=$("#hintNavigatorCard"); if(!card)return;
 const log=state.hintLog||[];
 card.style.display=(currentMachine?.hints?.length||currentMachine?.endScreens?.length||currentMachine?.trophies?.length||currentMachine?.miniEnding?.length)?"":"none";
 if(card.style.display==="none")return;
 const latest=log[0];
 const exact=log.find(x=>/設定6|6確|設定６/.test((x.setting||"")+(x.meaning||"")));
 const min5=log.find(x=>/設定5以上|設定５以上/.test((x.setting||"")+(x.meaning||"")));
 const min4=log.find(x=>/設定4以上|設定４以上/.test((x.setting||"")+(x.meaning||"")));
 const min3=log.find(x=>/設定3以上|設定３以上/.test((x.setting||"")+(x.meaning||"")));
 const min2=log.find(x=>/設定2以上|設定２以上|設定1否定/.test((x.setting||"")+(x.meaning||"")));
 const setting=exact?"設定6確定系あり":min5?"設定5以上系あり":min4?"設定4以上系あり":min3?"設定3以上系あり":min2?"設定2以上系あり":latest?.setting||"まだ記録なし";
 const mode=log.find(x=>x.mode)?.mode||"まだモード示唆なし";
 $("#hintCurrentSetting").textContent=setting;
 $("#hintCurrentMode").textContent=mode;
 $("#hintLatest").innerHTML=latest?`<b>${esc(latest.name)}</b><span>${esc(latest.meaning)}</span><small>実G ${latest.realG} / 液晶G ${latest.lcdG}</small>`:`<span class="muted">示唆ボタンを押すとここに表示されます。</span>`;
 $("#hintHistory").innerHTML=log.length?log.slice(0,12).map(x=>`<div class="hint-history-row"><div><b>${esc(x.name)}</b><span>${esc(x.meaning)}</span><small>実G ${x.realG} / 液晶G ${x.lcdG}</small></div><button class="tiny-btn" onclick="deleteHintLog('${x.id}')">削除</button></div>`).join(""):`<p class="muted">まだ示唆履歴はありません。</p>`;
}

function renderCond(){
 const sao=currentMachine?.profile==="sao2";
 $("#conditionalCard").style.display=sao?"":"none";
 if(!sao)return;
 $("#conditionalCounters").innerHTML=(currentMachine.cond||[]).map(d=>{const x=state.cond[d.id]||{a:0,b:0};return `<div class="condition-card"><div class="condition-title">${d.name}</div><div class="condition-note">${d.note}</div><div class="dual"><div class="dualbox"><span>${d.den}</span><b>${x.a||0}</b><div class="dual-actions"><button class="minus" onclick="incCond('${d.id}','a',-1)">−</button><button onclick="incCond('${d.id}','a',1)">＋</button></div></div><div class="dualbox"><span>${d.num}</span><b>${x.b||0}</b><div class="dual-actions"><button class="minus" onclick="incCond('${d.id}','b',-1)">−</button><button onclick="incCond('${d.id}','b',1)">＋</button></div></div></div><div class="rate">実測 ${d.id==="atStage"?`${x.a||0}:${x.b||0}`:pct(x.b||0,x.a||0)}</div></div>`}).join("");
}
function renderScreenCards(){
 const sec=$("#screenCard"), enabled=machineFeature("endScreens");
 sec.style.display=enabled?"":"none"; $("#trophyCard").style.display=machineFeature("trophies")?"":"none"; $("#miniCard").style.display=machineFeature("mini")?"":"none";
 if(!enabled)return;
 $("#endScreens").innerHTML=(currentMachine.endScreens||[]).map(([id,name,hint,symbol,cls])=>{const c=state.end[id]||0;return `<div class="screen-card ${cls}"><div class="screen-symbol">${symbol}</div><h3>${name}</h3><p>${hint}</p><div class="screen-actions"><span class="screen-count">${c}</span><span><button class="minus" onclick="inc('end','${id}',-1)">−</button> <button onclick="inc('end','${id}',1)">＋</button></span></div></div>`}).join("");
}
function renderEvents(el,defs,group){
 $(el).innerHTML=defs.map(([id,name,hint,strength])=>{const c=state[group][id]||0,cls=strength>=5?"confirmed":strength>=3?"strong":"";return `<div class="event ${cls}"><div class="event-head"><div class="event-name">${name}</div><div class="event-count">${c}</div></div><div class="hint">${hint}</div><div class="event-bottom"><button class="minus" onclick="inc('${group}','${id}',-1)">−</button><button onclick="inc('${group}','${id}',1)">＋</button></div></div>`}).join("");
}
function addCzEvent(){
 const game=+($("#czGame").value||state.meta.games||0), lcdGame=+($("#czLcdGame").value||state.meta.lcdGames||0), trigger=$("#czTrigger").value,result=$("#czResult").value;
 state.czEvents.unshift({id:Date.now(),game,lcdGame,trigger,result,at:Date.now()});
 state.main.cz=(state.main.cz||0)+1;if(result==="hit"||result==="end")state.main.at=(state.main.at||0)+1;if(result==="end")state.main.theEnd=(state.main.theEnd||0)+1;
 $("#czGame").value="";$("#czLcdGame").value="";save();render();
}
function renderCzHistory(){
 const sec=$("#czCard");sec.style.display=machineFeature("czHistory")?"":"none";if(!machineFeature("czHistory"))return;
 $("#czHistory").innerHTML=state.czEvents.length?state.czEvents.map(x=>`<div class="timeline-row"><b>実 ${x.game}G</b><div>${esc(x.trigger)}<div class="meta">液晶 ${x.lcdGame??"—"}G / ${x.result==="hit"?"AT当選":x.result==="end"?"THE END":"失敗"}</div></div><button class="tiny-btn" onclick="delEvent('cz',${x.id})">削除</button></div>`).join(""):`<div class="note">まだCZ履歴はありません。</div>`;
}
function addGgo(color){
 state.ggoEvents.unshift({id:Date.now(),game:+state.meta.games||0,lcdGame:+state.meta.lcdGames||0,item:selectedGgoItem,color,at:Date.now()});save();renderGgo();
}
function renderGgo(){
 const sec=$("#ggoCard");sec.style.display=machineFeature("ggo")?"":"none";if(!machineFeature("ggo"))return;
 $("#ggoHistory").innerHTML=state.ggoEvents.length?state.ggoEvents.map(x=>`<div class="timeline-row"><b>実 ${x.game}G</b><div>${esc(x.item)}・${x.color}<div class="meta">液晶 ${x.lcdGame??"—"}G / ${x.color==="赤"?"表示アイテム対応モード濃厚":x.color==="緑"?"滞在期待 約50%":"デフォルト示唆"}</div></div><button class="tiny-btn" onclick="delEvent('ggo',${x.id})">削除</button></div>`).join(""):`<div class="note">アイテム種類を選び、青・緑・赤をタップすると記録されます。</div>`;
}
function delEvent(type,id){if(type==="cz")state.czEvents=state.czEvents.filter(x=>x.id!==id);else state.ggoEvents=state.ggoEvents.filter(x=>x.id!==id);save();render()}
window.delEvent=delEvent;

function poissonLL(k,lambda){lambda=Math.max(lambda,1e-9);return k*Math.log(lambda)-lambda}
function binomLL(k,n,p){if(n<=0)return 0;p=Math.min(.999999,Math.max(.000001,p));return k*Math.log(p)+(n-k)*Math.log(1-p)}
function normalizeLL(ll){
 const max=Math.max(...ll), ex=ll.map(v=>v<-900?0:Math.exp(v-max)), sum=ex.reduce((a,b)=>a+b,0)||1;
 return ex.map(v=>100*v/sum);
}
function settingScores(){
 if(!currentMachine?.score)return [0,0,0,0,0,0];
 return currentMachine.score(state,{poissonLL,binomLL,normalizeLL});
}
function renderSettings(){
 const card=$("#settingBars").closest(".card"),supported=typeof currentMachine?.score==="function";
 card.style.display=supported?"":"none";if(!supported)return;
 const s=settingScores();$("#settingBars").innerHTML=s.map((v,i)=>`<div class="setting-row"><b>設定${i+1}</b><div class="bar"><i style="width:${v.toFixed(1)}%"></i></div><div class="score">${v.toFixed(1)}%</div></div>`).join("");
 const max=Math.max(...s),idx=s.indexOf(max)+1;
 $("#settingHeadline").textContent=(+state.meta.games||0)<500?"データ不足":`設定${idx}寄り`;
}
function renderSummary(){
 const p=(+state.meta.returnYen||0)-(+state.meta.invest||0);$("#profit").textContent=`${p>=0?"+":""}${p.toLocaleString()}円`;
 $("#czRate").textContent=rate(state.main.cz||state.main.otomeAttack||0);$("#atRate").textContent=rate(state.main.at||0);
 if(currentMachine?.profile==="generic")$("#settingHeadline").textContent="汎用計測";
}
function save(){
 if(!currentMachine)return;state.meta.playDate=$("#playDate").value||state.meta.playDate;state.meta.hall=$("#hall").value||"";state.meta.machineNo=$("#machineNo").value||"";state.meta.games=+($("#games").value||0);state.meta.syncGames=$("#syncGames")?$("#syncGames").checked:true;state.meta.invest=+($("#invest").value||0);state.meta.returnYen=+($("#returnYen").value||0);state.meta.memo=$("#memo").value||"";localStorage.setItem(APPKEY,JSON.stringify(state));$("#savedState").textContent="保存済み"
}
function hydrateInputs(){Object.entries(state.meta||{}).forEach(([k,v])=>{const e=$("#"+k);if(e)e.value=v??""});if($("#linkWindow"))$("#linkWindow").value=String(state.linkWindow||5);if($("#syncGames"))$("#syncGames").checked=state.meta.syncGames!==false;updateGameDisplays()}
function archiveSession(){
 save();const list=JSON.parse(localStorage.getItem(HISTORYKEY)||"[]");const snap=structuredClone(state);snap.archiveId=Date.now();snap.machineName=currentMachine.name;snap.tester=testerName();snap.archivedAt=Date.now();list.unshift(snap);localStorage.setItem(HISTORYKEY,JSON.stringify(list.slice(0,100)));renderSessionHistory()
}
function renderSessionHistory(){
 const list=JSON.parse(localStorage.getItem(HISTORYKEY)||"[]");
 $("#sessionHistory").innerHTML=list.length?list.map(x=>{const p=(+x.meta.returnYen||0)-(+x.meta.invest||0);return `<div class="session-row"><div><div class="session-title">${esc(x.machineName||x.machineId)}｜${esc(x.meta.playDate||"")}${x.meta.machineNo?`｜台${esc(x.meta.machineNo)}`:""}</div><div class="session-meta">${(+x.meta.games||0).toLocaleString()}G / CZ ${x.main?.cz||0} / AT ${x.main?.at||0} / 収支 ${p>=0?"+":""}${p.toLocaleString()}円</div></div><div class="session-actions"><button onclick="loadSession(${x.archiveId})">開く</button><button class="minus" onclick="deleteSession(${x.archiveId})">削除</button></div></div>`}).join(""):`<div class="note">保存した実戦はここに並びます。</div>`;
}
function loadSession(id){const list=JSON.parse(localStorage.getItem(HISTORYKEY)||"[]"),x=list.find(v=>v.archiveId===id);if(!x)return;currentMachine=getMachineDef(x.machineId)||builtinMachines()[0];state=structuredClone(x);delete state.archiveId;delete state.machineName;delete state.archivedAt;localStorage.setItem(APPKEY,JSON.stringify(state));openMachine(state.machineId)}
function deleteSession(id){const list=JSON.parse(localStorage.getItem(HISTORYKEY)||"[]").filter(x=>x.archiveId!==id);localStorage.setItem(HISTORYKEY,JSON.stringify(list));renderSessionHistory()}
window.loadSession=loadSession;window.deleteSession=deleteSession;


function renderKoyakuHistory(){
 state.koyakuEvents=state.koyakuEvents||[];
 $("#koyakuHistory").innerHTML=state.koyakuEvents.length?state.koyakuEvents.map(x=>`<div class="timeline-row"><b>実 ${x.game}G</b><div>${esc(x.name)}<div class="meta">液晶 ${x.lcdGame??"—"}G</div></div><button class="tiny-btn" onclick="deleteKoyaku(${x.id})">削除</button></div>`).join(""):`<div class="note">まだ小役履歴はありません。G数を入力して「＋」を押すと記録されます。</div>`;
}
function deleteKoyaku(id){
 state.koyakuEvents=state.koyakuEvents||[];
 const x=state.koyakuEvents.find(v=>v.id===id);
 if(x && (state.main[x.key]||0)>0) state.main[x.key]--;
 state.koyakuEvents=state.koyakuEvents.filter(v=>v.id!==id);
 save();render();
}
window.deleteKoyaku=deleteKoyaku;


function startSc(){
  state.scSession={startGame:+state.meta.games||0,startLcdGame:+state.meta.lcdGames||0,displayGame:+state.meta.lcdGames||0,lastAdd:0,startedAt:Date.now()};
  save(); renderSc();
}
function addScGame(n){
  if(!state.scSession) startSc();
  state.scSession.displayGame=Math.max(0,(+state.scSession.displayGame||0)+n);
  state.meta.lcdGames=Math.max(0,(+state.meta.lcdGames||0)+n);
  state.scSession.lastAdd=n; updateGameDisplays();
  $("#scDisplayInput").value=state.scSession.displayGame;
  save(); renderSc();
}
function saveScEvent(){
  if(!state.scSession) startSc();
  const direct=$("#scDisplayInput").value;
  if(direct!=="") state.scSession.displayGame=Math.max(0,+direct||0);
  const ev={
    id:Date.now()+Math.random(),
    game:+state.meta.games||0,
    startGame:+state.scSession.startGame||0,
    startLcdGame:+state.scSession.startLcdGame||0,
    lcdGame:+state.meta.lcdGames||0,
    displayGame:+state.scSession.displayGame||0,
    add:+state.scSession.lastAdd||0,
    trigger:$("#scTrigger").value,
    memo:$("#scMemo").value||"",
    at:Date.now()
  };
  state.scEvents.unshift(ev);
  $("#scMemo").value="";
  state.scSession.lastAdd=0;
  save(); renderSc(); renderAutoLinks();
}
function renderSc(){
  const sec=$("#scCard"); sec.style.display=machineFeature("sc")?"":"none";
  if(!machineFeature("sc")) return;
  if(!$("#scHistory")) return;
  const s=state.scSession;
  $("#scStartDisplay").textContent=s?`${s.startGame}G`:"—"; $("#scStartLcdDisplay").textContent=s?`${s.startLcdGame}G`:"—";
  $("#scDisplayGame").textContent=`${s?.displayGame||0}G`;
  $("#scAddDisplay").textContent=`+${s?.lastAdd||0}G`;
  $("#scHistory").innerHTML=state.scEvents.length?state.scEvents.map(x=>`
    <div class="timeline-row">
      <b>実 ${x.game}G</b>
      <div>${esc(x.trigger)} → 液晶 ${x.displayGame}G${x.add?`（+${x.add}G）`:""}
        <div class="meta">SC開始 実${x.startGame}G / 液晶${x.startLcdGame??"—"}G${x.memo?` / ${esc(x.memo)}`:""}</div>
      </div>
      <button class="tiny-btn" onclick="deleteSc(${x.id})">削除</button>
    </div>`).join(""):`<div class="note">SC開始 → 加算ボタン → SC記録、の順で片手入力できます。</div>`;
}
function deleteSc(id){
  state.scEvents=state.scEvents.filter(x=>x.id!==id);
  save(); renderSc(); renderAutoLinks();
}
window.deleteSc=deleteSc;

function distanceScore(d){
  if(d<0)return 0;
  if(d<=1)return 100;
  if(d<=3)return 85;
  if(d<=5)return 70;
  if(d<=8)return 50;
  if(d<=10)return 35;
  return 15;
}
function candidateForEvent(eventGame){
  const w=+(state.linkWindow||5);
  return (state.koyakuEvents||[])
    .map(k=>({...k,d:eventGame-k.game}))
    .filter(k=>k.d>=0 && k.d<=w)
    .sort((a,b)=>a.d-b.d)
    .map(k=>({...k,score:distanceScore(k.d)}));
}
function confidenceLabel(score){
  if(score>=90)return "最有力";
  if(score>=70)return "有力";
  if(score>=45)return "候補";
  return "参考";
}
function buildLinkRows(){
  const rows=[];
  (state.czEvents||[]).forEach(x=>{
    const c=candidateForEvent(x.game);
    rows.push({type:x.result==="hit"?"CZ→AT":x.result==="end"?"THE END":"CZ",game:x.game,lcdGame:x.lcdGame,cands:c});
  });
  (state.scEvents||[]).forEach(x=>{
    const c=candidateForEvent(x.startGame || x.game);
    rows.push({type:"SC",game:x.startGame||x.game,lcdGame:x.startLcdGame??x.lcdGame,cands:c});
  });
  // AT counters that are not represented in CZ events cannot be timestamped; user can use CZ result/AT history for timed linkage.
  return rows.sort((a,b)=>b.game-a.game);
}
function renderAutoLinks(){
  const card=$("#linkCard"); card.style.display=machineFeature("autoLinks")?"":"none";
  if(!machineFeature("autoLinks")) return;
  if(!$("#autoLinks")) return;
  const rows=buildLinkRows();
  $("#autoLinks").innerHTML=rows.length?rows.map(r=>{
    const top=r.cands[0];
    const badge=top?`<span class="link-badge">${confidenceLabel(top.score)} ${top.score}%</span>`:`<span class="link-badge weak">候補なし</span>`;
    const candText=top
      ? r.cands.slice(0,3).map(c=>`${esc(c.name)}（${c.d===0?"同G":c.d+"G前"}）`).join(" / ")
      : `直前${state.linkWindow}G以内に小役記録なし`;
    return `<div class="link-row"><div><b>実${r.game}G / 液晶${r.lcdGame??"—"}G ${r.type}</b>${badge}<div class="meta">${candText}</div></div></div>`;
  }).join(""):`<div class="note">小役とCZ・SCを記録すると、ここに当選契機候補が自動表示されます。</div>`;
}



function platformSessions(){try{return JSON.parse(localStorage.getItem(HISTORYKEY)||"[]")}catch(e){return []}}
function yen(v){return new Intl.NumberFormat("ja-JP").format(Math.round(v||0))}
function renderPlatformDashboard(){
 if(!$("#platformStats"))return;
 const rows=platformSessions();
 const currentProfit=(+state.meta.returnYen||0)-(+state.meta.invest||0);
 const totalG=rows.reduce((s,x)=>s+(+(x.meta?.games)||0),0);
 const totalProfit=rows.reduce((s,x)=>s+((+(x.meta?.returnYen)||0)- (+(x.meta?.invest)||0)),0);
 const wins=rows.filter(x=>((+(x.meta?.returnYen)||0)- (+(x.meta?.invest)||0))>0).length;
 const winRate=rows.length?Math.round(wins/rows.length*100):0;
 $("#platformStats").innerHTML=`
   <div class="statbox"><span>保存実戦</span><b>${rows.length}</b><small>sessions</small></div>
   <div class="statbox"><span>累計実G</span><b>${yen(totalG)}</b><small>G</small></div>
   <div class="statbox"><span>勝率</span><b>${winRate}%</b><small>${wins}勝</small></div>
   <div class="statbox"><span>累計収支</span><b>${totalProfit>=0?"+":""}${yen(totalProfit)}</b><small>円</small></div>`;
 const grouped={};
 rows.forEach(x=>{
   const id=x.machineId||"unknown";
   grouped[id]=grouped[id]||{count:0,g:0,profit:0,wins:0};
   const p=(+(x.meta?.returnYen)||0)-(+(x.meta?.invest)||0);
   grouped[id].count++; grouped[id].g+=(+(x.meta?.games)||0); grouped[id].profit+=p; if(p>0)grouped[id].wins++;
 });
 const machines=machineList();
 $("#machineStats").innerHTML=Object.entries(grouped).length?Object.entries(grouped).map(([id,v])=>{
   const mm=machines.find(x=>x.id===id); const name=mm?.name||id;
   return `<div class="machine-stat-row"><div><b>${esc(name)}</b><div class="meta">${v.count}実戦 / ${yen(v.g)}G / 勝率 ${Math.round(v.wins/v.count*100)}%</div></div><strong class="${v.profit>=0?"plus":"minus"}">${v.profit>=0?"+":""}${yen(v.profit)}円</strong></div>`;
 }).join(""):`<div class="note">実戦を「履歴保存」すると、ここに機種別成績が集約されます。</div>`;
}

let timelineFilter="all";
function unifiedEvents(){
 const out=[];
 (state.koyakuEvents||[]).forEach(x=>out.push({id:x.id,type:"koyaku",game:x.game,lcdGame:x.lcdGame,label:x.name,detail:"小役"}));
 (state.scEvents||[]).forEach(x=>out.push({id:x.id,type:"sc",game:x.game,lcdGame:x.lcdGame??x.displayGame,label:"SC",detail:`${x.trigger} / +${x.add||0}G / 液晶${x.displayGame}G`}));
 (state.czEvents||[]).forEach(x=>out.push({id:x.id,type:"cz",game:x.game,lcdGame:x.lcdGame,label:x.result==="hit"?"CZ→AT":x.result==="end"?"THE END":"CZ",detail:x.trigger}));
 (state.ggoEvents||[]).forEach(x=>out.push({id:x.id,type:"ggo",game:x.game,lcdGame:x.lcdGame,label:"GGO",detail:`${x.item}・${x.color}`}));
 (state.hintLog||[]).forEach(x=>out.push({id:x.id,type:"hint",game:x.realG,lcdGame:x.lcdG,label:`示唆: ${x.name}`,detail:x.meaning}));
 return out.sort((a,b)=>(b.game-a.game)||((b.id||0)-(a.id||0)));
}
function renderUnifiedTimeline(){
 if(!$("#unifiedTimeline"))return;
 let arr=unifiedEvents();
 if(timelineFilter!=="all")arr=arr.filter(x=>x.type===timelineFilter);
 $("#unifiedTimeline").innerHTML=arr.length?arr.map(x=>`<div class="unified-row type-${x.type}">
   <div class="dual-g"><b>実 ${x.game}G</b><span>液晶 ${x.lcdGame??"—"}G</span></div>
   <div><strong>${esc(x.label)}</strong><div class="meta">${esc(x.detail||"")}</div></div>
 </div>`).join(""):`<div class="note">記録すると、小役・SC・CZ/AT・GGOが同じ時系列に並びます。</div>`;
}


function runQuickAction(i){
 const a=(currentMachine?.quickActions||[])[i];if(!a)return;
 if(a.type==="main")inc("main",a.key,1);
 else if(a.type==="special")incSpecial(a.key,1);
 else if(a.type==="scroll")document.getElementById(a.target)?.scrollIntoView({behavior:"smooth",block:"start"});
 if(navigator.vibrate)navigator.vibrate(18);
}
window.runQuickAction=runQuickAction;
function renderQuickDock(){
 const dock=$("#thumbDock");if(!dock)return;
 const actions=(currentMachine?.quickActions||[]).slice(0,6);
 dock.innerHTML=actions.map((a,i)=>`<button onclick="runQuickAction(${i})"><span>${a.icon||"＋"}</span><b>${esc(a.label)}</b></button>`).join("");
 dock.style.display=actions.length?"grid":"none";
}
function render(){
 renderMachineNav();renderMain();renderKoyakuHistory();renderMachineSpecific();renderHintNavigator();renderSc();renderCond();renderScreenCards();renderCzHistory();renderGgo();renderAutoLinks();renderPlatformDashboard();renderUnifiedTimeline();renderQuickDock();updateGameDisplays();
 $("#trophyCard").style.display=machineFeature("trophies")?"":"none";
 $("#miniCard").style.display=machineFeature("mini")?"":"none";
 if(machineFeature("trophies"))renderEvents("#trophies",currentMachine.trophies||[],"trophy");
 if(machineFeature("mini")){renderEvents("#miniEnding",currentMachine.miniEnding||[],"miniEnding");renderEvents("#miniRosario",currentMachine.miniRosario||[],"miniRosario")}
 renderSettings();renderSummary();renderSessionHistory()
}
function newSession(){if(confirm("現在の実戦を新しいデータに切り替えますか？必要なら先に履歴保存してください。")){state=freshState(currentMachine.id);localStorage.setItem(APPKEY,JSON.stringify(state));hydrateInputs();render()}}
function resetAll(){if(confirm("現在の実戦データをすべてリセットしますか？")){state=freshState(currentMachine.id);localStorage.setItem(APPKEY,JSON.stringify(state));hydrateInputs();render()}}
function exportJson(){save();const payload={current:state,history:JSON.parse(localStorage.getItem(HISTORYKEY)||"[]"),machines:customMachines};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`chappiko_slot_backup_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)}
async function importJson(file){const obj=JSON.parse(await file.text());if(obj.current)localStorage.setItem(APPKEY,JSON.stringify(obj.current));if(obj.history)localStorage.setItem(HISTORYKEY,JSON.stringify(obj.history));if(obj.machines){customMachines=obj.machines;localStorage.setItem(MACHINESKEY,JSON.stringify(customMachines))}alert("読み込みました。機種選択に戻ります。");showPicker()}
function addCustomMachine(){const name=$("#newMachineName").value.trim();if(!name)return;const id="custom_"+Date.now();customMachines.push({id,name,subtitle:"カスタム機種",icon:"🎰",profile:"generic",search:[name]});localStorage.setItem(MACHINESKEY,JSON.stringify(customMachines));$("#newMachineName").value="";$("#modal").classList.add("hidden");renderMachinePicker()}
function hook(){
 $("#testerName").value=testerName();
 $("#testerName").onchange=()=>localStorage.setItem(TESTERKEY,$("#testerName").value);
 $("#feedbackFab").onclick=()=>{$("#feedbackModal").classList.remove("hidden");renderFeedback()};
 $("#closeFeedback").onclick=()=>$("#feedbackModal").classList.add("hidden");
 $("#saveFeedback").onclick=()=>{
   const text=$("#feedbackText").value.trim(); if(!text)return;
   const a=feedbacks();a.unshift({tester:testerName(),type:$("#feedbackType").value,text,at:new Date().toISOString(),machineId:currentMachine?.id||null,realG:state?.meta?.games||0,lcdG:state?.meta?.lcdGames||0});
   localStorage.setItem(FEEDBACKKEY,JSON.stringify(a.slice(0,100)));$("#feedbackText").value="";renderFeedback();
 };
 $("#machineSearch").oninput=renderMachinePicker;
 $$(".picker-filter").forEach(b=>b.onclick=()=>{$$(".picker-filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");pickerMode=b.dataset.mode;renderMachinePicker()});
 $("#changeMachineBtn").onclick=showPicker;$("#saveBtn").onclick=()=>{save();render()};$("#resetBtn").onclick=resetAll;$("#newSessionBtn").onclick=newSession;$("#archiveBtn").onclick=archiveSession;$("#exportBtn").onclick=exportJson;$("#importFile").onchange=e=>e.target.files[0]&&importJson(e.target.files[0]);$("#addCzBtn").onclick=addCzEvent;
 $("#startScBtn").onclick=startSc;
 $$("#scCard [data-scadd]").forEach(b=>b.onclick=()=>addScGame(+b.dataset.scadd));
 $("#customScBtn").onclick=()=>{const v=prompt("追加する液晶G数を入力");if(v!==null&&v!=="")addScGame(+v||0)};
 $("#saveScBtn").onclick=saveScEvent;
 $("#linkWindow").onchange=e=>{state.linkWindow=+e.target.value;save();renderAutoLinks()};
 $("#syncGames").onchange=e=>{state.meta.syncGames=e.target.checked;save()};
 $("#resetLcdBtn").onclick=()=>{if(confirm("液晶ゲーム数を0Gに戻しますか？")){state.meta.lcdGames=0;if(state.scSession)state.scSession.displayGame=0;updateGameDisplays();save()}};
 $$(".tl-filter").forEach(b=>b.onclick=()=>{$$(".tl-filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");timelineFilter=b.dataset.filter;renderUnifiedTimeline()});
 $("#useCurrentGameBtn").onclick=()=>{$("#koyakuGame").value=+state.meta.games||0;$("#koyakuLcdGame").value=+state.meta.lcdGames||0};
 $("#clearKoyakuHistory").onclick=()=>{if(confirm("小役の出現履歴をクリアしますか？（カウント数は残します）")){state.koyakuEvents=[];save();renderKoyakuHistory()}};
 $$(".ggo-type").forEach(b=>b.onclick=()=>{$$(".ggo-type").forEach(x=>x.classList.remove("active"));b.classList.add("active");selectedGgoItem=b.dataset.item});
 $$(".ggo-colors button").forEach(b=>b.onclick=()=>addGgo(b.dataset.color));
 $$(".tab").forEach(b=>b.onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#miniEnding").classList.toggle("hidden",b.dataset.tab!=="ending");$("#miniRosario").classList.toggle("hidden",b.dataset.tab!=="rosario")});
 $$(".quick-nav button").forEach(b=>b.onclick=()=>document.getElementById(b.dataset.jump)?.scrollIntoView({behavior:"smooth",block:"start"}));
 $("#addMachineBtn").onclick=()=>$("#modal").classList.remove("hidden");$("#closeModal").onclick=()=>$("#modal").classList.add("hidden");$("#confirmAddMachine").onclick=addCustomMachine;
 document.addEventListener("input",e=>{if(currentMachine&&["INPUT","TEXTAREA"].includes(e.target.tagName)){save();renderSummary();renderSettings()}});
}
renderMachinePicker();hook();setInterval(()=>{if(currentMachine)save()},15000);
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js");


// v11 formal UI navigation
(()=>{
 const bind=()=>{
  const vm=$("#v11ChangeMachine"); if(vm&&!vm.dataset.bound){vm.dataset.bound="1";vm.addEventListener("click",()=>$("#changeMachineBtn")?.click())}
  $$("[data-jump]").forEach(b=>{if(b.dataset.bound)return;b.dataset.bound="1";b.addEventListener("click",()=>document.getElementById(b.dataset.jump)?.scrollIntoView({behavior:"smooth",block:"start"}))});
 };
 bind();
})();
