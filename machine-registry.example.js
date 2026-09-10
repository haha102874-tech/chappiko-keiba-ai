// ちゃぴこスロット v7 - machine registry
// 2026-09-09
export const machines = [
  { id:"sao2", name:"SAO2", profile:"sao2", axes:{realGame:true,lcdGame:true} },
  { id:"tokyo_ghoul", name:"東京喰種", profile:"tokyo", axes:{realGame:true,lcdGame:true} },
  { id:"otome5", name:"戦国乙女5", profile:"otome5", axes:{realGame:true,lcdGame:true} }
];
// v8目標: profileDefsをこのregistryへ完全移管してapp.jsから機種固有ロジックを分離。
