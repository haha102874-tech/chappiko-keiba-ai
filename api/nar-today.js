
import AdmZip from "adm-zip";
import iconv from "iconv-lite";
import { parse } from "csv-parse/sync";

const RACE_URL = "https://www.keiba.go.jp/KeibaWeb/DataDownload/RaceDataDownload?type=daily";
const ODDS_URL = "https://www.keiba.go.jp/KeibaWeb/DataDownload/OddsDataDownload?type=daily";

const norm = s => String(s ?? "").trim().replace(/\u3000/g, " ").replace(/\s+/g," ");
const n = v => {
  const s = String(v ?? "").trim();
  if (!s || s === "-" || s === "―") return null;
  const x = Number(s.replace(/[^\d.-]/g,""));
  return Number.isFinite(x) ? x : null;
};
const num0 = v => n(v) ?? 0;

function decodeCsv(buf) {
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
    columns: headers => headers.map(h => norm(h).replace(/^\uFEFF/,"")),
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
    trim: false
  });
}

function pick(obj, names, fallback="") {
  for (const k of names) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      const v = obj[k];
      if (v !== "" && v != null) return v;
    }
  }
  return fallback;
}

function ratioScore(s) {
  // W-2nd-3rd-other records -> 0..10 derived score.
  const m = String(s||"").match(/(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)/);
  if (!m) return null;
  const [w,p2,p3,o] = m.slice(1).map(Number);
  const total = w+p2+p3+o;
  if (!total) return null;
  const weighted = (w + p2*.62 + p3*.38) / total;
  return Math.max(1, Math.min(10, 2 + weighted*8));
}

function bodyScore(weight, delta) {
  if (!weight) return null;
  if (delta == null) return 6;
  const d = Math.abs(delta);
  if (d <= 6) return 8;
  if (d <= 12) return 6.5;
  return 5;
}

function oddsBetType(v) {
  return norm(v)
    .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0)-0xFEE0))
    .replace(/３/g,"3").replace(/２/g,"2").replace(/１/g,"1");
}
function isWinBetType(v) {
  const s = oddsBetType(v);
  return s === "単勝";
}

function buildWinOdds(rows, track, raceNo) {
  const map = {};
  for (const r of rows) {
    if (norm(pick(r, ["競馬場"])) !== track) continue;
    if (num0(pick(r, ["レース番号"])) !== raceNo) continue;
    if (!isWinBetType(pick(r, ["賭式"]))) continue;
    const no = num0(pick(r, ["番号1","馬番"]));
    if (!no) continue;
    const odds = n(pick(r, ["オッズ"]));
    const pop = n(pick(r, ["人気"]));
    // If duplicates exist during refresh, last row is treated as latest.
    map[no] = {odds, pop};
  }
  return map;
}

function buildHorse(row, winOddsMap) {
  const no = num0(pick(row, ["馬番","馬 番","horse_no"]));
  const allRec = pick(row, ["全成績","全 成績"]);
  const courseRec = pick(row, ["当競馬場成績","当競馬場 成績"]);
  const distRec = pick(row, ["うち当距離成績","当距離成績"]);
  const jRec = pick(row, ["騎手成績"]);
  const body = n(pick(row, ["馬体重"]));
  const delta = n(pick(row, ["馬体重増減"]));
  const finish = n(pick(row, ["着順"]));
  const horseListPop = n(pick(row, ["人気"]));
  const last3f = n(pick(row, ["上がり3F","上がり３Ｆ"]));
  const assignedWeight = n(pick(row, ["負担重量","斤量"]));

  const distScore = ratioScore(distRec);
  const courseScore = ratioScore(courseRec);
  const careerScore = ratioScore(allRec);
  const jockeyScore = ratioScore(jRec);
  const lastScore = last3f != null ? Math.max(3, Math.min(10, 11 - (last3f-35)*.4)) : null;

  // Current odds CSV has priority because it is refreshed through the day.
  const live = winOddsMap[no] || {};
  const pop = live.pop ?? horseListPop ?? null;
  const odds = live.odds ?? null;

  const hole = pop == null ? null :
    pop >= 10 ? 9.5 : pop >= 8 ? 9 : pop >= 6 ? 8 :
    pop >= 4 ? 6.5 : pop >= 2 ? 5 : 3.5;

  // Important: horselist "着順" can represent race-result-side data after completion;
  // do not pretend it is "previous race". Keep past-3 columns blank unless a true
  // historical provider supplies them.
  return {
    no,
    name: norm(pick(row, ["馬名","競走馬","horse_name"])),
    pop,
    odds,
    r1: null,
    r2: null,
    r3: null,

    // Derived AI ratings from official record fields.
    distance: distScore != null ? +distScore.toFixed(1) : null,
    course: courseScore != null ? +courseScore.toFixed(1) : null,
    going: null,
    front: null,
    last: lastScore != null ? +lastScore.toFixed(1) : null,
    jockey: jockeyScore != null ? +jockeyScore.toFixed(1) : null,
    stable: null,
    body: bodyScore(body, delta) != null ? +bodyScore(body, delta).toFixed(1) : null,
    weight: assignedWeight != null ? 7 : null,
    pace: null,
    hole: hole != null ? +hole.toFixed(1) : null,

    // Hidden/model metadata.
    formScore: careerScore != null ? +careerScore.toFixed(1) : null,
    rawFinish: finish,
    rawPopularity: horseListPop,
    jockeyName: norm(pick(row, ["騎手名","騎手"])),
    trainerName: norm(pick(row, ["調教師"])),
    assignedWeight,
    bodyWeight: body,
    bodyDelta: delta,
    sex: norm(pick(row, ["性"])),
    age: n(pick(row, ["齢"])),
    records: {
      all: norm(allRec),
      course: norm(courseRec),
      distance: norm(distRec),
      jockey: norm(jRec)
    },
    dataQuality: {
      liveOdds: odds != null,
      livePopularity: pop != null,
      bodyWeight: body != null,
      assignedWeight: assignedWeight != null,
      courseRecord: courseScore != null,
      distanceRecord: distScore != null,
      jockeyRecord: jockeyScore != null,
      historicalLast3: false
    },
    source: "NAR公式 当日データ"
  };
}

function buildRace(row) {
  return {
    track: norm(pick(row, ["競馬場"])),
    date: norm(pick(row, ["競走年月日"])),
    raceNo: num0(pick(row, ["レース番号"])),
    startTime: norm(pick(row, ["発走時刻"])),
    raceType: norm(pick(row, ["競走種類名称"])),
    raceName: norm(pick(row, ["レース名"])),
    surface: norm(pick(row, ["芝ダート区分"])),
    turn: norm(pick(row, ["回り"])),
    distance: num0(pick(row, ["距離"])),
    weather: norm(pick(row, ["天候"])),
    going: norm(pick(row, ["馬場"])),
    runners: num0(pick(row, ["頭数"])),
    condition: norm(pick(row, ["条件"]))
  };
}

async function getBuffer(url) {
  const r = await fetch(url, {
    headers: {
      "user-agent":"Mozilla/5.0 ChappikoKeibaAI/4.0",
      "accept":"application/zip,application/octet-stream,*/*"
    }
  });
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

    if (!racelistName || !horselistName) {
      throw new Error("NAR ZIP内の racelist/horselist CSVを認識できませんでした");
    }

    const races = parseCsv(raceFiles[racelistName]).map(buildRace).filter(x => x.track && x.raceNo);
    const horseRows = parseCsv(raceFiles[horselistName]);
    const oddsRows = oddsName ? parseCsv(oddsFiles[oddsName]) : [];

    const track = norm(req.query.track || "");
    const raceNo = num0(req.query.raceNo || 0);

    if (!track || !raceNo) {
      const tracks = [...new Set(races.map(r => r.track))];
      const grouped = Object.fromEntries(
        tracks.map(t => [t, races.filter(r=>r.track===t).sort((a,b)=>a.raceNo-b.raceNo)])
      );
      res.setHeader("Cache-Control","s-maxage=60, stale-while-revalidate=30");
      return res.status(200).json({
        version:"4.0",
        source:"NAR公式",
        tracks,
        races:grouped,
        files:{racelist:racelistName,horselist:horselistName,odds:oddsName||null},
        updatedAt:new Date().toISOString()
      });
    }

    const race = races.find(r => r.track===track && r.raceNo===raceNo);
    if (!race) return res.status(404).json({error:"指定レースが見つかりません"});

    const winOddsMap = buildWinOdds(oddsRows, track, raceNo);
    const horses = horseRows
      .filter(r => norm(pick(r, ["競馬場"]))===track && num0(pick(r, ["レース番号"]))===raceNo)
      .map(r => buildHorse(r, winOddsMap))
      .sort((a,b)=>a.no-b.no);

    const quality = {
      runners: horses.length,
      odds: horses.filter(h=>h.dataQuality.liveOdds).length,
      popularity: horses.filter(h=>h.dataQuality.livePopularity).length,
      bodyWeight: horses.filter(h=>h.dataQuality.bodyWeight).length,
      assignedWeight: horses.filter(h=>h.dataQuality.assignedWeight).length,
      distanceRecord: horses.filter(h=>h.dataQuality.distanceRecord).length,
      courseRecord: horses.filter(h=>h.dataQuality.courseRecord).length,
      historicalLast3: 0
    };

    res.setHeader("Cache-Control","s-maxage=45, stale-while-revalidate=30");
    return res.status(200).json({
      version:"4.0",
      source:"NAR公式",
      race,
      horses,
      quality,
      note:"前走・2走前・3走前は当日CSVだけでは真の過去3走として確定できないため空欄。モデルは全成績指数を補助値として使用。",
      updatedAt:new Date().toISOString()
    });
  } catch (e) {
    return res.status(502).json({
      error:"NARデータ取得に失敗しました",
      detail:String(e.message||e),
      version:"4.0"
    });
  }
}
