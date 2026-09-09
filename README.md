# ちゃぴこ競馬AI v3 — 今日の開催 自動読込版

## できること
### 地方競馬
Vercelにデプロイすると、アプリの「今日の開催を取得」を押すだけで:
1. NAR公式の当日レースZIP/CSVを取得
2. 今日の開催競馬場をプルダウン化
3. 競馬場を選ぶと、その日のRだけを表示
4. Rを選ぶとレース名・距離・馬場・出走馬データを自動入力
5. NAR公式オッズCSVに単勝情報があれば人気/単勝も反映
6. 自動評価を作り、そのまま予想を実行

公式取得元:
- https://www.keiba.go.jp/KeibaWeb/DataDownload/RaceDataDownload?type=daily
- https://www.keiba.go.jp/KeibaWeb/DataDownload/OddsDataDownload?type=daily

## 中央競馬
JRA-VAN Data Lab.はJV-Link以外からJRA-VAN Data Lab.サーバへアクセスできないため、このWebアプリがJRA-VANサーバを直接呼ぶ実装にはしていません。

中央はVercel環境変数で正規データ提供元を接続します:
- JRA_PROVIDER_URL
- JRA_PROVIDER_KEY (必要な場合のみ)

期待するAPI:
GET {JRA_PROVIDER_URL}/today
=> {"source":"...","tracks":["中山"],"races":{"中山":[{"raceNo":1,...}]}}

GET {JRA_PROVIDER_URL}/today?track=中山&raceNo=1
=> {"source":"...","race":{...},"horses":[...]}

horses項目はアプリ内の既存キー:
no,name,pop,odds,r1,r2,r3,distance,course,going,front,last,jockey,stable,body,weight,pace,hole

## Vercel公開手順
1. このZIPを展開
2. VercelでNew Project
3. フォルダをGitHubへ置くか、Vercel CLIでデプロイ
4. Framework PresetはOtherでOK
5. Build Commandなし / Output Directoryなし
6. 公開URLで「今日の開催を取得」

## データの扱い
NARデータは公式サイトが提供する一般ユーザー向けデータダウンロード機能を利用します。
アプリ側では再配布用のデータベースを作らず、ユーザー操作時に取得して表示する設計です。
利用規約・仕様変更に応じて接続処理の更新が必要になる場合があります。

## 注意
- APIエンドポイントの実通信はデプロイ先で行われます。
- ChatGPT内のプレビューHTMLでは /api が存在しないため、ライブ取得は動きません。
- 予想・利益は保証されません。
