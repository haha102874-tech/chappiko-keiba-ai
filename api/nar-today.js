

import AdmZip from "adm-zip";
import iconv from "iconv-lite";
import { parse } from "csv-parse/sync";

const RACE_URL = "https://www.keiba.go.jp/KeibaWeb/DataDownload/RaceDataDownload?type=daily";
const ODDS_URL = "https://www.keiba.go.jp/KeibaWeb/DataDownload/OddsDataDownload?type=daily";

const norm = s => String(s ?? "").trim().replace(/\u3000/g, " ");
const n = v => {
  const x = Number(String(v ?? "").replace(/[^\d.-]/g,""));
  return Number.isFinite(x) ? x : 0;
};

function decodeCsv(buf) {
  // NAR CSV is handled defensively: try UTF-8 first, then CP932.
  const utf = buf.toString("utf8");
  const bad = (utf.match(/\uFFFD/g) || []).length;
  return bad > 3 ? iconv.decode(buf, "cp932") : utf;
}

function readZipEntries(buffer) {
  const zip = new AdmZip(buffer);
  const out = {};
  for (const e of zip.getEntries()) {
    if (e.isDirectory) continue;
    const name = e.entryName.split("/").pop();
    if (!name.toLowerCase().endsWith(".csv")) continue;
    out[name] = decodeCsv(e.getData());
  }
  return out;
}

function parseCsv(text) {
  if (!text?.trim()) return [];
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
    trim: false
  });
}

function pick(obj, names, fallback="") {
  for (const k of names) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== "") return obj[k];
  }
  return fallback;
}

function ratioScore(s) {
  // "10-1-3-16" => simple 0-10 form score with wins weighted most.
  const m = String(s||"").match(/(\d+)-(\d+)-(\d+)-(\d+)/);
  if (!m) return 5;
  const [w,p2,p3,o] = m.slice(1).map(Number);
  const total = w+p2+p3+o;
  if (!total) return 5;
  const weighted = (w*1 + p2*.65 + p3*.4) / total;
  return Math.max(1, Math.min(10, 2 + weighted*8));
}

function jockeyScore(s) {
  return ratioScore(s);
}

function bodyScore(weight, delta) {
  if (!weight) return 5;
  const d = Math.abs(delta || 0);
  if (d <= 6) return 8;
  if (d <= 12) return 6.5;
  return 5;
}

function buildHorse(row, winOddsMap) {
  const no = n(pick(row, ["馬番","馬 番","horse_no"]));
  const all = pick(row, ["全成績","全 成績"]);
  const courseRec = pick(row, ["当競馬場成績","当競馬場 成績"]);
  const distRec = pick(row, ["うち当距離成績","当距離成績"]);
  const jrec = pick(row, ["騎手成績"]);
  const body = n(pick(row, ["馬体重"]));
  const delta = n(pick(row, ["馬体重増減"]));
  const lastFinish = n(pick(row, ["着順"]));
  const pop = n(pick(row, ["人気"]));
  const last3f = n(pick(row, ["上がり3F","上がり３Ｆ"]));

  const distScore = ratioScore(distRec);
  const courseScore = ratioScore(courseRec);
  const recent = lastFinish ? Math.max(2, 10-(lastFinish-1)*.7) : ratioScore(all);
  const lastScore = last3f ? Math.max(4, Math.min(10, 11 - (last3f-35)*.4)) : ratioScore(all);
  const hole = pop >= 8 ? 9 : pop >= 6 ? 8 : pop >= 4 ? 6.5 : 4.5;

  return {
    no,
    name: norm(pick(row, ["馬名","競走馬","horse_name"])),
    pop: pop || (winOddsMap[no]?.pop || 0),
    odds: winOddsMap[no]?.odds || 0,
    r1: lastFinish || 0,
    r2: 0,
    r3: 0,
    distance: +distScore.toFixed(1),
    course: +courseScore.toFixed(1),
    going: 6.5,
    front: 6.0,
    last: +lastScore.toFixed(1),
    jockey: +jockeyScore(jrec).toFixed(1),
    stable: 6.0,
    body: +bodyScore(body, delta).toFixed(1),
    weight: 7.0,
    pace: 6.5,
    hole: +hole.toFixed(1),
    jockeyName: norm(pick(row, ["騎手名","騎手"])),
    trainerName: norm(pick(row, ["調教師"])),
    assignedWeight: n(pick(row, ["負担重量","斤量"])),
    bodyWeight: body,
    bodyDelta: delta,
    sex: norm(pick(row, ["性"])),
    age: n(pick(row, ["齢"])),
    source: "NAR公式 当日データ"
  };
}

function buildRace(row) {
  return {
    track: norm(pick(row, ["競馬場"])),
    date: norm(pick(row, ["競走年月日"])),
    raceNo: n(pick(row, ["レース番号"])),
    startTime: norm(pick(row, ["発走時刻"])),
    raceType: norm(pick(row, ["競走種類名称"])),
    raceName: norm(pick(row, ["レース名"])),
    surface: norm(pick(row, ["芝ダート区分"])),
    turn: norm(pick(row, ["回り"])),
    distance: n(pick(row, ["距離"])),
    weather: norm(pick(row, ["天候"])),
    going: norm(pick(row, ["馬場"])),
    runners: n(pick(row, ["頭数"])),
    condition: norm(pick(row, ["条件"]))
  };
}

function isWinBetType(v) {
  const s = norm(v);
  return s === "単勝" || s.includes("単勝");
}

function buildWinOdds(rows, track, raceNo) {
  const map = {};
  for (const r of rows) {
    if (norm(pick(r, ["競馬場"])) !== track) continue;
    if (n(pick(r, ["レース番号"])) !== raceNo) continue;
    if (!isWinBetType(pick(r, ["賭式"]))) continue;
    const no = n(pick(r, ["番号1","馬番"]));
    if (!no) continue;
    map[no] = {
      odds: n(pick(r, ["オッズ"])),
      pop: n(pick(r, ["人気"]))
    };
  }
  return map;
}

async function getBuffer(url) {
  const r = await fetch(url, { headers: {"user-agent":"Mozilla/5.0 ChappikoKeibaAI/3.0"} });
  if (!r.ok) throw new Error(`upstream ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

export default async function handler(req, res) {
  try {
    const [raceBuf, oddsBuf] = await Promise.all([getBuffer(RACE_URL), getBuffer(ODDS_URL)]);
    const raceFiles = readZipEntries(raceBuf);
    const oddsFiles = readZipEntries(oddsBuf);

    const racelistName = Object.keys(raceFiles).find(x => /racelist/i.test(x));
    const horselistName = Object.keys(raceFiles).find(x => /horselist/i.test(x));
    const oddsName = Object.keys(oddsFiles).find(x => /odds/i.test(x));

    if (!racelistName || !horselistName) throw new Error("NAR ZIP内のCSVを認識できませんでした");

    const races = parseCsv(raceFiles[racelistName]).map(buildRace).filter(x => x.track && x.raceNo);
    const horseRows = parseCsv(raceFiles[horselistName]);
    const oddsRows = oddsName ? parseCsv(oddsFiles[oddsName]) : [];

    const track = norm(req.query.track || "");
    const raceNo = n(req.query.raceNo || 0);

    if (!track || !raceNo) {
      const tracks = [...new Set(races.map(r => r.track))];
      const grouped = Object.fromEntries(tracks.map(t => [t, races.filter(r=>r.track===t).sort((a,b)=>a.raceNo-b.raceNo)]));
      res.setHeader("Cache-Control","s-maxage=90, stale-while-revalidate=60");
      return res.status(200).json({source:"NAR公式", tracks, races:grouped, updatedAt:new Date().toISOString()});
    }

    const race = races.find(r => r.track===track && r.raceNo===raceNo);
    if (!race) return res.status(404).json({error:"指定レースが見つかりません"});
    const winOddsMap = buildWinOdds(oddsRows, track, raceNo);
    const horses = horseRows
      .filter(r => norm(pick(r, ["競馬場"]))===track && n(pick(r, ["レース番号"]))===raceNo)
      .map(r => buildHorse(r, winOddsMap))
      .sort((a,b)=>a.no-b.no);

    res.setHeader("Cache-Control","s-maxage=60, stale-while-revalidate=60");
    return res.status(200).json({source:"NAR公式", race, horses, updatedAt:new Date().toISOString()});
  } catch (e) {
    return res.status(502).json({error:"NARデータ取得に失敗しました", detail:String(e.message||e)});
  }
}
