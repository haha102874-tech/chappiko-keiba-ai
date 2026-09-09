

export default async function handler(req, res) {
  const base = process.env.JRA_PROVIDER_URL;
  if (!base) {
    return res.status(501).json({
      error:"中央競馬の正規データ接続が未設定です",
      help:"Vercelの環境変数 JRA_PROVIDER_URL に、契約済みのJRAデータ提供エンドポイントを設定してください。"
    });
  }
  try {
    const qs = new URLSearchParams();
    if (req.query.track) qs.set("track", req.query.track);
    if (req.query.raceNo) qs.set("raceNo", req.query.raceNo);
    const url = base.replace(/\/$/,"") + "/today" + (qs.size ? "?"+qs.toString() : "");
    const headers = {"accept":"application/json"};
    if (process.env.JRA_PROVIDER_KEY) headers["authorization"] = "Bearer "+process.env.JRA_PROVIDER_KEY;
    const r = await fetch(url,{headers});
    const text = await r.text();
    res.status(r.status).setHeader("content-type","application/json; charset=utf-8").send(text);
  } catch(e) {
    res.status(502).json({error:"中央競馬データ接続に失敗しました",detail:String(e.message||e)});
  }
}
