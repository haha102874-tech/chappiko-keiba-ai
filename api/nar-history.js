
import * as cheerio from "cheerio";

const BASE = "https://www.keiba.go.jp";
const UA = "Mozilla/5.0 ChappikoKeibaAI/5.0";
const norm = s => String(s ?? "").replace(/\u3000/g," ").replace(/\s+/g," ").trim();

function parseDate(s) {
  const m = norm(s).match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
}
function yearFromBirthDate(s) {
  const m = String(s||"").match(/^(\d{4})/);
  return m ? m[1] : "";
}
function numeric(s) {
  const m = norm(s).match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}
function finishNumber(s) {
  const t = norm(s);
  if (!t || /取止|取消|除外|中止|失格/.test(t)) return null;
  const m = t.match(/^\d+/);
  return m ? Number(m[0]) : null;
}
async function getText(url) {
  const r = await fetch(url, {
    headers: {
      "user-agent": UA,
      "accept": "text/html,application/xhtml+xml"
    }
  });
  if (!r.ok) throw new Error(`NAR HTTP ${r.status}`);
  return await r.text();
}
function makeListUrl({name,birthDate}) {
  const p = new URLSearchParams({
    k_activeCode:"1",
    k_birthYear:yearFromBirthDate(birthDate) || "*",
    k_dataKind:"1",
    k_fatherHorse:"",
    k_fatherHorseCondition:"start",
    k_flag:"-1",
    k_horseName:name,
    k_horseNameCondition:"start",
    k_horsebelong:"*",
    k_motherHorse:"",
    k_motherHorseCondition:"start",
    k_pageNum:"1"
  });
  return `${BASE}/KeibaWeb/DataRoom/RaceHorseList?${p.toString()}`;
}
function extractLineageCandidates(html, identity) {
  const $ = cheerio.load(html);
  const rows = [];
  $("tr").each((_,tr)=>{
    const text = norm($(tr).text());
    const anchors = $(tr).find('a[href*="RaceHorseInfo"],a[href*="HorseMarkInfo"]');
    anchors.each((__,a)=>{
      const horseName = norm($(a).text());
      const href = $(a).attr("href") || "";
      const m = href.match(/k_lineageLoginCode=([0-9]+)/);
      if (!m || horseName !== identity.name) return;
      let score = 100;
      const birthYear = yearFromBirthDate(identity.birthDate);
      if (birthYear && text.includes(birthYear)) score += 20;
      if (identity.fatherName && text.includes(identity.fatherName)) score += 15;
      if (identity.motherName && text.includes(identity.motherName)) score += 15;
      if (identity.age && text.includes(String(identity.age))) score += 2;
      rows.push({code:m[1],score,text});
    });
  });
  // fallback: exact anchor name anywhere
  if (!rows.length) {
    $('a[href*="RaceHorseInfo"],a[href*="HorseMarkInfo"]').each((_,a)=>{
      const horseName=norm($(a).text()), href=$(a).attr("href")||"";
      const m=href.match(/k_lineageLoginCode=([0-9]+)/);
      if (m && horseName===identity.name) rows.push({code:m[1],score:50,text:horseName});
    });
  }
  rows.sort((a,b)=>b.score-a.score);
  return rows;
}
function parseHistory(html, beforeDate) {
  const $ = cheerio.load(html);
  let targetTable = null;
  $("table").each((_,t)=>{
    const tx = norm($(t).text());
    if (!targetTable && tx.includes("年月日") && tx.includes("着順") && tx.includes("競馬場")) targetTable=t;
  });
  const out=[];
  if (!targetTable) return out;

  $(targetTable).find("tr").each((_,tr)=>{
    const cells=$(tr).find("td").map((__,td)=>norm($(td).text())).get();
    if (cells.length < 15) return;
    const date=parseDate(cells[0]);
    if (!date) return;
    if (beforeDate && date >= beforeDate) return;

    // NAR history row has a merged header but weather/going are separate data cells.
    // Parse stable fields from both ends to tolerate an empty spacer column.
    const end=cells.length;
    const finish=finishNumber(cells[end-10]);
    const pop=numeric(cells[end-11]);
    const horseNo=numeric(cells[end-12]);
    const frame=numeric(cells[end-13]);
    const runners=numeric(cells[end-14]);

    const distanceText=cells[5] || "";
    const distance=numeric(distanceText);
    const surface=distanceText.includes("芝") || norm(cells[4]).includes("芝") ? "芝" : "ダート";
    const rec={
      date,
      track:cells[1] || "",
      raceNo:numeric(cells[2]),
      raceName:cells[3] || "",
      className:cells[4] || "",
      distance,
      surface,
      weather:cells[6] || "",
      going:cells[7] || "",
      runners,
      frame,
      horseNo,
      popularity:pop,
      finish,
      time:cells[end-9] || "",
      margin:cells[end-8] || "",
      last3f:numeric(cells[end-7]),
      bodyWeight:numeric(cells[end-6]),
      jockey:cells[end-5] || "",
      assignedWeight:numeric(cells[end-4]),
      trainer:cells[end-3] || "",
      prize:numeric(cells[end-2]),
      winnerOrSecond:cells[end-1] || ""
    };
    if (rec.finish != null) out.push(rec);
  });
  return out.slice(0,3);
}
function formScore(history) {
  if (!history.length) return null;
  const weights=[.5,.3,.2];
  let sum=0, wsum=0;
  history.forEach((r,i)=>{
    if (r.finish==null) return;
    const s=Math.max(0,10-(r.finish-1)*.7);
    sum += s*weights[i]; wsum += weights[i];
  });
  return wsum ? +(sum/wsum).toFixed(1) : null;
}
function distanceScore(history, targetDistance) {
  if (!history.length || !targetDistance) return null;
  let total=0,w=0;
  history.forEach((r,i)=>{
    if (!r.distance || r.finish==null) return;
    const similarity=Math.max(0,1-Math.abs(r.distance-targetDistance)/Math.max(400,targetDistance*.6));
    const finish=Math.max(1,10-(r.finish-1)*.75);
    const rw=[.5,.3,.2][i]||.1;
    total += finish*similarity*rw; w += similarity*rw;
  });
  return w ? +Math.max(1,Math.min(10,total/w)).toFixed(1) : null;
}
function goingScore(history, targetGoing) {
  if (!history.length || !targetGoing) return null;
  const canon=s=>norm(s).replace("やや重","稍重");
  const hits=history.filter(r=>canon(r.going)===canon(targetGoing) && r.finish!=null);
  if (!hits.length) return null;
  return +(hits.reduce((s,r)=>s+Math.max(1,10-(r.finish-1)*.75),0)/hits.length).toFixed(1);
}

export default async function handler(req,res) {
  try {
    const identity={
      name:norm(req.query.name),
      birthDate:norm(req.query.birthDate),
      fatherName:norm(req.query.fatherName),
      motherName:norm(req.query.motherName),
      age:numeric(req.query.age)
    };
    if (!identity.name) return res.status(400).json({error:"馬名が必要です"});

    const beforeDate=norm(req.query.beforeDate);
    const targetDistance=numeric(req.query.distance);
    const targetGoing=norm(req.query.going);

    const searchHtml=await getText(makeListUrl(identity));
    const candidates=extractLineageCandidates(searchHtml,identity);
    if (!candidates.length) {
      return res.status(404).json({error:`${identity.name} のNAR馬情報を特定できませんでした`,name:identity.name});
    }

    const code=candidates[0].code;
    const historyUrl=`${BASE}/KeibaWeb/DataRoom/HorseMarkInfo?k_lineageLoginCode=${encodeURIComponent(code)}`;
    const historyHtml=await getText(historyUrl);
    const history=parseHistory(historyHtml,beforeDate);

    res.setHeader("Cache-Control","s-maxage=21600, stale-while-revalidate=86400");
    return res.status(200).json({
      version:"5.0",
      source:"NAR公式 馬出走履歴",
      name:identity.name,
      lineageLoginCode:code,
      history,
      derived:{
        recent:formScore(history),
        distance:distanceScore(history,targetDistance),
        going:goingScore(history,targetGoing)
      },
      matchedCandidates:candidates.length
    });
  } catch(e) {
    return res.status(502).json({
      version:"5.0",
      error:"過去3走の取得に失敗しました",
      detail:String(e.message||e)
    });
  }
}
