(() => {
const R=window.ChappikoRegistry;
const main=[
 ["big","ビビッドBONUS","設定差あり"],["reg","REGULAR BONUS","設定差あり"],["art","ART初当たり","設定差あり"],
 ["common10Bell","共通10枚ベル","ART中を中心にカウント"],["weakCherry","弱チェリー","小役カウント"],["replayRedReg","通常リプレイ＋赤REG","高設定ほど出現しやすい"]
];
const special=[
 ["regDiagonalBell","REG中 斜めベル","大きな設定差"],["story34","ストーリー移行 34回","設定1否定系"],
 ["friendshipNone","ART初回 友情高確なし","設定6確定系"]
];
const hints=[
 ["endAkane","BONUS終了 あかね","奇数設定示唆",2],["endAoi","BONUS終了 あおい","偶数設定示唆",2],
 ["endWakabaHimawari","BONUS終了 わかば＆ひまわり","設定2以上",5],["endAkaneMayo","BONUS終了 あかね＆マヨネーズ","設定4以上",5],["endRei","BONUS終了 れい","設定6",6],
 ["friendshipNoneHint","ART初回 友情高確なし","設定6",6]
];
const hintNav={
 endAkane:{setting:"奇数設定示唆"},endAoi:{setting:"偶数設定示唆"},endWakabaHimawari:{setting:"設定2以上"},endAkaneMayo:{setting:"設定4以上"},endRei:{setting:"設定6"},friendshipNoneHint:{setting:"設定6"}
};
const setting={
 bonusDen:[168.47,165.91,163.43,161.02,158.68,156.41],
 artDen:[420,415,396,357,308,283],
 replayRedRegDen:[16384,9362.3,6553.6,5041.2,4096,3449.3]
};
function score(state,h){
 const g=+state.meta.games||0; let ll=[0,0,0,0,0,0];
 const bonus=(state.main.big||0)+(state.main.reg||0), art=state.main.art||0, rr=state.main.replayRedReg||0;
 if(g>0){setting.bonusDen.forEach((d,i)=>ll[i]+=h.poissonLL(bonus,g/d));setting.artDen.forEach((d,i)=>ll[i]+=h.poissonLL(art,g/d));setting.replayRedRegDen.forEach((d,i)=>ll[i]+=h.poissonLL(rr,g/d));}
 let min=1, exact=null;
 if(state.hints.endWakabaHimawari)min=2;if(state.hints.endAkaneMayo)min=4;if(state.hints.endRei||state.hints.friendshipNoneHint||state.special.friendshipNone)exact=6;
 ll=ll.map((v,i)=>exact?(i===5?v:-999):((i+1)<min?-999:v));
 return h.normalizeLL(ll);
}
R.register({
 id:"vividred_test",name:"ビビッドレッド・オペレーション",subtitle:"5号機 / TEST限定",icon:"🌈",profile:"vividred",testOnly:true,
 search:["ビビオペ","vividred","vivid red operation","ビビッドレッド"],axes:{realGame:true,lcdGame:false},
 features:{sc:false,ggo:false,czHistory:false,conditional:false,endScreens:false,trophies:false,mini:false,autoLinks:false},
 nav:[{target:"sessionCard",label:"実戦"},{target:"mainCard",label:"小役/BONUS"},{target:"machineSpecificCard",label:"ART・REG"},{target:"hintNavigatorCard",label:"BONUS終了示唆"},{target:"dashboardCard",label:"分析"},{target:"timelineCard",label:"時系列"},{target:"historyCard",label:"履歴"}],
 title:"ビビッドレッド・オペレーション 示唆ナビ",main,special,hints,hintNav,setting,score,
 quickActions:[
  {type:"main",key:"big",label:"BIG",icon:"🔴"},{type:"main",key:"reg",label:"REG",icon:"🔵"},{type:"main",key:"art",label:"ART",icon:"🔥"},
  {type:"main",key:"common10Bell",label:"10枚ベル",icon:"🔔"},{type:"special",key:"regDiagonalBell",label:"斜めベル",icon:"↗️"}
 ]
});
})();
