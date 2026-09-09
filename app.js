
const CENTRAL=["中山","東京","阪神","京都","中京","札幌","函館","福島","新潟","小倉"];
const LOCAL=["門別","盛岡","水沢","浦和","船橋","大井","川崎","金沢","笠松","名古屋","園田","姫路","高知","佐賀"];
const CHAOS={"中山":1.05,"東京":0.95,"阪神":1,"京都":1,"中京":1.05,"札幌":1.05,"函館":1.10,"福島":1.12,"新潟":1.05,"小倉":1.10,"門別":1.18,"盛岡":1.08,"水沢":1.03,"浦和":1.10,"船橋":1.10,"大井":1.12,"川崎":1.15,"金沢":1.12,"笠松":1.00,"名古屋":1.08,"園田":1.08,"姫路":1.06,"高知":1.10,"佐賀":1.08};
const DEFAULT_SETTINGS={weights:{recent:1.6,distance:1.3,course:1.1,going:1.2,front:1,last:1.1,jockey:1,stable:.8,body:.7,weight:.7,pace:1.1,hole:1.5},raceCap:2,pointCap:.5,skipThreshold:65};
const LABELS={recent:"近3走",distance:"距離",course:"競馬場",going:"馬場",front:"先行",last:"末脚",jockey:"騎手",stable:"厩舎",body:"馬体重",weight:"斤量",pace:"展開",hole:"穴評価"};
let settings=load("settings",DEFAULT_SETTINGS), lastPrediction=[], deferredPrompt=null;
const $=id=>document.getElementById(id);
function save(k,v){localStorage.setItem("chappiko_"+k,JSON.stringify(v))}
function load(k,d){try{const v=JSON.parse(localStorage.getItem("chappiko_"+k));return v??structuredClone(d)}catch{return structuredClone(d)}}
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1800)}
function yen(n){return "¥"+Math.round(Number(n)||0).toLocaleString()}
function today(){return new Date().toISOString().slice(0,10)}

let liveCatalog=null, liveLoading=false;
function liveStatus(text, type=""){const el=$("liveStatus");el.textContent=text;el.className="live-status "+type}
function yyyyMmDdToInput(v){const s=String(v||"");return /^\d{8}$/.test(s)?`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`:s}
async function fetchJson(url){const r=await fetch(url);const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||j.detail||`HTTP ${r.status}`);return j}
async function loadToday(){
  if(liveLoading)return;liveLoading=true;liveStatus("今日の開催データを取得中…");
  try{
    const isLocal=$("division").value==="地方";
    const endpoint=isLocal?"/api/nar-today":"/api/jra-today";
    const j=await fetchJson(endpoint);liveCatalog=j;
    const tracks=j.tracks||Object.keys(j.races||{});
    if(!tracks.length)throw new Error("今日の開催が見つかりません");
    $("track").innerHTML=tracks.map(t=>`<option>${t}</option>`).join("");
    rebuildRaceOptions();
    liveStatus(`${j.source||"データ"}から取得済み：${tracks.join(" / ")}`,"ok");
    await loadSelectedRace();
  }catch(e){liveStatus(e.message,"err");toast(e.message)}
  finally{liveLoading=false}
}
function rebuildRaceOptions(){
  if(!liveCatalog?.races)return;
  const arr=liveCatalog.races[$("track").value]||[];
  $("raceNo").innerHTML=arr.map(r=>`<option value="${r.raceNo}">${r.raceNo}R ${r.startTime?("("+String(r.startTime).padStart(4,"0").replace(/(\d{2})(\d{2})/,"$1:$2")+")"):""}</option>`).join("");
}
async function loadSelectedRace(){
  if(!liveCatalog)return;
  const isLocal=$("division").value==="地方";
  const endpoint=(isLocal?"/api/nar-today":"/api/jra-today")+`?track=${encodeURIComponent($("track").value)}&raceNo=${encodeURIComponent($("raceNo").value)}`;
  liveStatus(`${$("track").value}${$("raceNo").value}Rを読込中…`);
  try{
    const j=await fetchJson(endpoint);const r=j.race||{};
    $("raceDate").value=yyyyMmDdToInput(r.date)||$("raceDate").value;
    $("raceName").value=r.raceName||"";
    if(r.surface)$("surface").value=r.surface.includes("芝")?"芝":"ダート";
    if(r.distance)$("distance").value=r.distance;
    if(r.going && ["良","稍重","重","不良"].includes(r.going))$("going").value=r.going;
    clearHorseInputsOnly();
    importHorses(j.horses||[]);
    liveStatus(`${j.source||"データ"}：${$("track").value}${$("raceNo").value}R / ${(j.horses||[]).length}頭を自動入力`,"ok");
    predict();
  }catch(e){liveStatus(e.message,"err");toast(e.message)}
}
function clearHorseInputsOnly(){document.querySelectorAll("#horseTable tbody input").forEach(i=>i.value="")}

function init(){
  for(let i=1;i<=12;i++) $("raceNo").insertAdjacentHTML("beforeend",`<option value="${i}">${i}</option>`);
  $("raceNo").value=11;$("raceDate").value=today();$("resultDate").value=today();
  buildTracks();buildRows();renderSettings();restoreDraft();renderResults();renderDashboard();restoreApi();
}
function buildTracks(){
  const old=$("track").value, arr=$("division").value==="中央"?CENTRAL:LOCAL;$("track").innerHTML="";
  arr.forEach(x=>$("track").insertAdjacentHTML("beforeend",`<option>${x}</option>`));
  if(arr.includes(old))$("track").value=old;
}
function buildRows(){
  const b=document.querySelector("#horseTable tbody");b.innerHTML="";
  for(let i=1;i<=18;i++){
    const fields=["name","pop","odds","r1","r2","r3","distance","course","going","front","last","jockey","stable","body","weight","pace","hole"];
    const tds=fields.map((k,ix)=>`<td><input class="${k==="name"?"name-input":""}" data-k="${k}" ${k==="name"?'type="text"':`type="number" min="0" ${["pop","r1","r2","r3"].includes(k)?'max="18"':'max="99"'} step="${k==="odds"?'.1':'1'}"`}></td>`).join("");
    b.insertAdjacentHTML("beforeend",`<tr><td>${i}</td>${tds}</tr>`);
  }
}
function v(el){const n=parseFloat(el?.value);return Number.isFinite(n)?n:0}
function getHorses(){
  return [...document.querySelectorAll("#horseTable tbody tr")].map((tr,i)=>{
    const g=k=>tr.querySelector(`[data-k="${k}"]`);
    return {no:i+1,name:g("name").value.trim(),pop:v(g("pop")),odds:v(g("odds")),r1:v(g("r1")),r2:v(g("r2")),r3:v(g("r3")),
    distance:v(g("distance")),course:v(g("course")),going:v(g("going")),front:v(g("front")),last:v(g("last")),jockey:v(g("jockey")),stable:v(g("stable")),body:v(g("body")),weight:v(g("weight")),pace:v(g("pace")),hole:v(g("hole"))}
  }).filter(h=>h.name);
}
function recent(h){if(!h.r1&&!h.r2&&!h.r3)return 0;const a=h.r1||10,b=h.r2||10,c=h.r3||10;return Math.max(0,10-((a*.5+b*.3+c*.2)-1)*.7)}
function calc(h){
  const w=settings.weights,r=recent(h);const base=r*w.recent+h.distance*w.distance+h.course*w.course+h.going*w.going+h.front*w.front+h.last*w.last+h.jockey*w.jockey+h.stable*w.stable+h.body*w.body+h.weight*w.weight+h.pace*w.pace+h.hole*w.hole;
  const total=base*(CHAOS[$("track").value]||1);let comment="バランス型";if(h.hole>=8&&h.pop>=6)comment="穴妙味";else if(r>=8)comment="近走安定";else if(h.pace>=8)comment="展開向き";else if(total<settings.skipThreshold)comment="見送り候補";return {...h,recent:r,base,total,comment};
}
function conf(x){return x>=100?"S":x>=90?"A":x>=80?"B":x>=70?"C":"D"}
function predict(){
  const hs=getHorses();if(hs.length<2){toast("2頭以上入力してね");return}
  const arr=hs.map(calc).sort((a,b)=>b.total-a.total);const marks=["◎","○","▲","☆","☆"];arr.forEach((h,i)=>Object.assign(h,{rank:i+1,mark:marks[i]||"△",conf:conf(h.total)}));lastPrediction=arr;
  const spread=arr.length>=3?arr[0].total-arr[2].total:99,judge=arr[0].total<settings.skipThreshold?"見送り候補":spread<5?"混戦":"軸候補あり";
  const hole=[...arr].sort((a,b)=>(b.hole+(b.pop>=6?2:0))-(a.hole+(a.pop>=6?2:0)))[0],cap=($("bankroll").value||0)*(settings.raceCap/100);
  $("chaos").textContent=(CHAOS[$("track").value]||1).toFixed(2);$("topScore").textContent=arr[0].total.toFixed(1);$("raceJudge").textContent=judge;$("holeHorse").textContent=`${hole.no} ${hole.name}`;$("limitBet").textContent=yen(cap);
  $("rankCards").innerHTML=arr.slice(0,5).map(h=>`<div class="rank-card"><div class="mark">${h.mark}</div><div class="horse">${h.no}番 ${h.name}</div><small>${h.total.toFixed(1)} / ${h.conf}</small></div>`).join("");
  $("rankingBody").innerHTML=arr.map(h=>`<tr><td>${h.rank}</td><td><b>${h.mark}</b></td><td>${h.no}</td><td>${h.name}</td><td>${h.recent.toFixed(1)}</td><td>${h.total.toFixed(1)}</td><td>${h.conf}</td><td>${h.comment}</td></tr>`).join("");
  const top=arr.slice(0,5),tri=top.length>=3?top.slice(0,3).map(x=>x.no).join("-"):"-",axis=top.length>=5?`${top[0].no} → ${top.slice(1,5).map(x=>x.no).join(",")}`:"-",wide=`${hole.no} → ${top.slice(0,2).map(x=>x.no).join(",")}`,single=arr[0].odds>=2&&["S","A","B"].includes(arr[0].conf)?`${arr[0].no}番 ${arr[0].name}`:"見送り";
  $("bets").innerHTML=[["3連複 3頭BOX",tri],["3連複 1頭軸",axis],["穴ワイド",wide],["単勝",single]].map(x=>`<div class="bet"><strong>${x[0]}</strong>${x[1]}</div>`).join("");
  saveDraft();toast("予想を更新したよ");
}
function readRowValues(){
  return [...document.querySelectorAll("#horseTable tbody tr")].map(tr=>Object.fromEntries([...tr.querySelectorAll("input")].map(i=>[i.dataset.k,i.value])));
}
function saveDraft(){
  save("draft",{division:$("division").value,track:$("track").value,raceNo:$("raceNo").value,raceDate:$("raceDate").value,raceName:$("raceName").value,surface:$("surface").value,distance:$("distance").value,going:$("going").value,pace:$("pace").value,bankroll:$("bankroll").value,horses:readRowValues()});
}
function restoreDraft(){
  const d=load("draft",null);if(!d)return;["division","raceNo","raceDate","raceName","surface","distance","going","pace","bankroll"].forEach(k=>{if(d[k]!=null)$(k).value=d[k]});buildTracks();if(d.track)$("track").value=d.track;
  const rows=[...document.querySelectorAll("#horseTable tbody tr")];(d.horses||[]).forEach((h,i)=>{if(!rows[i])return;Object.entries(h).forEach(([k,val])=>{const e=rows[i].querySelector(`[data-k="${k}"]`);if(e)e.value=val})});
}
function clearAll(){document.querySelectorAll("#horseTable tbody input").forEach(i=>i.value="");["chaos","topScore","raceJudge","holeHorse","limitBet"].forEach(x=>$(x).textContent="-");$("rankCards").innerHTML=$("rankingBody").innerHTML=$("bets").innerHTML="";saveDraft()}
function loadSample(){
  clearAll();$("division").value="中央";buildTracks();$("track").value="中山";$("raceName").value="サンプル重賞";$("surface").value="芝";$("distance").value=2000;$("going").value="重";
  const data=[["マスターソアラ",6,9.4,1,4,2,9,8,9,7,8,7,8,8,8,8,8],["サムシングスイート",4,6.8,2,3,5,9,8,9,7,8,8,7,8,8,8,7],["ドリームコア",1,2.7,3,2,1,9,8,9,8,9,10,9,8,8,8,4],["サンプル穴馬",9,24.5,6,5,8,8,7,9,9,8,7,7,8,8,9,10],["サンプル先行馬",3,5.6,4,1,6,8,8,8,10,6,8,8,8,8,9,6]];
  const keys=["name","pop","odds","r1","r2","r3","distance","course","going","front","last","jockey","stable","body","weight","pace","hole"],rows=[...document.querySelectorAll("#horseTable tbody tr")];data.forEach((a,i)=>keys.forEach((k,j)=>rows[i].querySelector(`[data-k="${k}"]`).value=a[j]));predict()
}
function parseCSV(txt){
  const lines=txt.trim().split(/\r?\n/).filter(Boolean);if(!lines.length)return[];const parse=line=>{let out=[],cur="",q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c=='"'){if(q&&line[i+1]=='"'){cur+='"';i++}else q=!q}else if(c==','&&!q){out.push(cur);cur=""}else cur+=c}out.push(cur);return out};
  const rows=lines.map(parse),head=rows[0].map(s=>s.trim()),hasHead=head.some(x=>x.includes("馬名"));const body=hasHead?rows.slice(1):rows;
  const aliases={no:["馬番","no"],name:["馬名","name"],pop:["人気","pop"],odds:["単勝","単勝オッズ","odds"],r1:["前走","前走着順","r1"],r2:["2走前","r2"],r3:["3走前","r3"],distance:["距離","距離適性","distance"],course:["コース","競馬場","競馬場適性","course"],going:["馬場","馬場適性","going"],front:["先行","先行力","front"],last:["末脚","last"],jockey:["騎手","jockey"],stable:["厩舎","stable"],body:["馬体重","body"],weight:["斤量","weight"],pace:["展開","展開適性","pace"],hole:["穴","穴評価","hole"]};
  if(!hasHead){return body.map((r,i)=>Object.fromEntries(["no","name","pop","odds","r1","r2","r3","distance","course","going","front","last","jockey","stable","body","weight","pace","hole"].map((k,j)=>[k,r[j]??""])))}
  const idx={};Object.entries(aliases).forEach(([k,als])=>{idx[k]=head.findIndex(h=>als.includes(h))});
  return body.map(r=>Object.fromEntries(Object.keys(aliases).map(k=>[k,idx[k]>=0?r[idx[k]]:""])));
}
function importHorses(data){
  const rows=[...document.querySelectorAll("#horseTable tbody tr")];data.slice(0,18).forEach((h,i)=>Object.entries(h).forEach(([k,val])=>{const e=rows[i].querySelector(`[data-k="${k}"]`);if(e)e.value=val??""}));saveDraft();toast(`${Math.min(data.length,18)}頭を読み込んだよ`)
}
function download(name,text,type="text/plain"){
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}
function templateCSV(){download("ちゃぴこ競馬AI_入力ひな形.csv","\uFEFF馬番,馬名,人気,単勝,前走,2走前,3走前,距離,コース,馬場,先行,末脚,騎手,厩舎,馬体重,斤量,展開,穴\n1,,,,,,,,,,,,,,,,,\n","text/csv;charset=utf-8")}
async function apiFetch(){
  const url=$("apiUrl").value.trim();if(!url){toast("API URLを入れてね");return}try{const headers={};if($("apiKey").value)headers["Authorization"]="Bearer "+$("apiKey").value;const r=await fetch(url,{headers});if(!r.ok)throw new Error(r.status);const j=await r.json();if(!Array.isArray(j.horses))throw new Error("horses配列がありません");importHorses(j.horses)}catch(e){toast("API取得に失敗: "+e.message)}
}
function saveApi(){save("api",{url:$("apiUrl").value,key:$("apiKey").value});toast("API設定を保存")}
function restoreApi(){const a=load("api",{});$("apiUrl").value=a.url||"";$("apiKey").value=a.key||""}
function resultList(){return load("results",[])}
function saveResult(){
  const r={id:Date.now(),date:$("resultDate").value,track:$("resultTrack").value||$("track").value,raceNo:+$("resultRaceNo").value||+$("raceNo").value,raceName:$("resultRaceName").value||$("raceName").value,finish1:+$("finish1").value||0,finish2:+$("finish2").value||0,finish3:+$("finish3").value||0,stake:+$("stake").value||0,returnAmount:+$("returnAmount").value||0,memo:$("resultMemo").value};
  const arr=resultList();arr.unshift(r);save("results",arr);renderResults();renderDashboard();toast("結果を保存したよ")
}
function delResult(id){save("results",resultList().filter(x=>x.id!==id));renderResults();renderDashboard()}
function renderResults(){
  $("resultsBody").innerHTML=resultList().map(r=>`<tr><td>${r.date}</td><td>${r.track}</td><td>${r.raceNo}</td><td>${r.raceName||""}</td><td>${r.finish1}-${r.finish2}-${r.finish3}</td><td>${yen(r.stake)}</td><td>${yen(r.returnAmount)}</td><td class="${r.returnAmount-r.stake>=0?'good':'danger'}">${yen(r.returnAmount-r.stake)}</td><td><button class="btn ghost" onclick="delResult(${r.id})">削除</button></td></tr>`).join("")
}
function exportResults(){
  const rows=[["日付","競馬場","R","レース","1着","2着","3着","購入額","払戻額","収支","メモ"],...resultList().map(r=>[r.date,r.track,r.raceNo,r.raceName,r.finish1,r.finish2,r.finish3,r.stake,r.returnAmount,r.returnAmount-r.stake,r.memo])];
  const csv="\uFEFF"+rows.map(row=>row.map(x=>`"${String(x??"").replaceAll('"','""')}"`).join(",")).join("\n");download("ちゃぴこ競馬AI_結果.csv",csv,"text/csv;charset=utf-8")
}
function renderDashboard(){
  const rs=resultList(),stake=rs.reduce((s,r)=>s+r.stake,0),ret=rs.reduce((s,r)=>s+r.returnAmount,0),profit=ret-stake,roi=stake?ret/stake*100:0;
  $("dashRaces").textContent=rs.length;$("dashStake").textContent=yen(stake);$("dashReturn").textContent=yen(ret);$("dashProfit").textContent=yen(profit);$("dashProfit").className=profit>=0?"good":"danger";$("dashROI").textContent=roi.toFixed(1)+"%";
  const map={};rs.forEach(r=>{map[r.track]??={n:0,s:0,r:0};map[r.track].n++;map[r.track].s+=r.stake;map[r.track].r+=r.returnAmount});
  $("trackStats").innerHTML=Object.entries(map).sort((a,b)=>b[1].s-a[1].s).map(([t,x])=>`<div class="track-stat"><strong>${t}</strong><div>${x.n}R / 購入 ${yen(x.s)}</div><div>払戻 ${yen(x.r)} / ROI ${x.s?(x.r/x.s*100).toFixed(1):"0.0"}%</div></div>`).join("")
}
function renderSettings(){
  $("weightSettings").innerHTML=Object.entries(settings.weights).map(([k,v])=>`<label>${LABELS[k]}<input data-weight="${k}" type="number" step=".1" value="${v}"></label>`).join("");$("raceCap").value=settings.raceCap;$("pointCap").value=settings.pointCap;$("skipThreshold").value=settings.skipThreshold
}
function saveSettings(){
  document.querySelectorAll("[data-weight]").forEach(i=>settings.weights[i.dataset.weight]=+i.value);settings.raceCap=+$("raceCap").value;settings.pointCap=+$("pointCap").value;settings.skipThreshold=+$("skipThreshold").value;save("settings",settings);toast("モデル設定を保存")
}
function resetSettings(){settings=structuredClone(DEFAULT_SETTINGS);save("settings",settings);renderSettings();toast("初期値に戻したよ")}

document.addEventListener("click",e=>{const t=e.target.closest(".tab");if(!t)return;document.querySelectorAll(".tab,.tabpanel").forEach(x=>x.classList.remove("active"));t.classList.add("active");$(t.dataset.tab).classList.add("active")});
$("division").addEventListener("change",()=>{liveCatalog=null;buildTracks();saveDraft();liveStatus("開催区分を変更しました。今日の開催を取得してください")});
$("track").addEventListener("change",async()=>{saveDraft();if(liveCatalog){rebuildRaceOptions();await loadSelectedRace()}});
$("raceNo").addEventListener("change",async()=>{saveDraft();if(liveCatalog)await loadSelectedRace()});
$("loadTodayBtn").onclick=loadToday;document.querySelectorAll("#predict input,#predict select").forEach(e=>e.addEventListener("change",saveDraft));
$("predictBtn").onclick=predict;$("sampleBtn").onclick=loadSample;$("clearBtn").onclick=clearAll;
$("pasteImportBtn").onclick=()=>importHorses(parseCSV($("pasteArea").value));$("downloadTemplateBtn").onclick=templateCSV;
$("fileInput").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;const text=await f.text();try{if(f.name.toLowerCase().endsWith(".json")){const j=JSON.parse(text);importHorses(Array.isArray(j)?j:j.horses||[])}else importHorses(parseCSV(text))}catch(err){toast("ファイル形式を確認してね")}});
$("apiFetchBtn").onclick=apiFetch;$("apiSaveBtn").onclick=saveApi;$("saveResultBtn").onclick=saveResult;$("exportResultsBtn").onclick=exportResults;$("saveSettingsBtn").onclick=saveSettings;$("resetSettingsBtn").onclick=resetSettings;
$("themeBtn").onclick=()=>{document.body.classList.toggle("light");save("light",document.body.classList.contains("light"))};if(load("light",false))document.body.classList.add("light");
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").classList.remove("hidden")});$("installBtn").onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installBtn").classList.add("hidden")}};
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
init();
