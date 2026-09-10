(() => {
const R=window.ChappikoRegistry;
const main=[
 ["replayLow","下段リプレイ","設定差あり"],["weakCherry","弱チェリー","1/70.3目安"],["watermelon","スイカ","1/100.5目安"],
 ["chanceA","チャンス目A","1/585.1目安"],["chanceB","チャンス目B","1/585.1目安"],["strongCherry","強チェリー","1/356.2目安"],
 ["cz","CZ初当たり","設定判別"],["at","AT初当たり","設定判別"]
];
const koyakuGuides={
 weakCherry:{title:"弱チェリー",summary:"左リールにチェリー停止後、右リール中段の黒BARで弱/強を判別します。",variants:[
  {label:"弱チェリー",note:"右中段BAR非停止",cells:["・","・","・","チェ","・","リプ","・","・","・"],tip:"右リール中段に黒BARが止まらなければ弱チェリー。"}
 ]},
 strongCherry:{title:"強チェリー",summary:"左リールにチェリー停止後、右リール中段に黒BAR停止で強チェリー。",variants:[
  {label:"強チェリー",note:"右中段BAR",cells:["・","・","・","チェ","・","BAR","・","・","・"],tip:"右リール中段に黒BAR停止なら強チェリー。"}
 ]},
 watermelon:{title:"スイカ",summary:"スイカが滑ってきたら中リールにスイカを狙って判別します。",variants:[
  {label:"スイカ",note:"右下がり揃い代表例",cells:["スイカ","・","・","・","スイカ","・","・","・","スイカ"],tip:"スイカが揃えばスイカ。スイカハズレはチャンス目。"}
 ]},
 chanceA:{title:"チャンス目（スイカハズレ型）",summary:"東京喰種のチャンス目は停止形が複数ありますが、メーカー案内では抽せん上の強弱・種類差はありません。",variants:[
  {label:"チャンス目",note:"スイカハズレ型",cells:["スイカ","スイカ","×","・","・","・","・","・","・"],tip:"スイカ停止からスイカが揃わなければ代表的なチャンス目。"}
 ]},
 chanceB:{title:"チャンス目（フラッシュ型）",summary:"通常出目からフラッシュでチャンス目を判別するパターンがあります。抽せん上の種類差はありません。",variants:[
  {label:"チャンス目",note:"フラッシュ確認",cells:["・","・","・","リプ","ベル","リプ","BAR","・","・"],tip:"停止形だけでなくリールフラッシュも確認。図は判別UI用の代表イメージです。"}
 ]}
};
const special=[
 ["episodeBonus","エピソードBONUS","設定差大"],["directAT","AT直撃","設定差大"],["atReturnTry","AT終了","引き戻し分母"],
 ["atReturnHit","AT引き戻し","設定差あり"],["czUnder100Try","CZ当選","100G以内判別の分母"],["czUnder100Hit","100G以内CZ","高設定ほど優遇"]
];
const hints=[
 ["czDefault1","CZ失敗 金木研①","デフォルト",1],["czDefault2","CZ失敗 金木研②","デフォルト",1],
 ["czTouka","CZ失敗 霧嶋董香","通常B以上示唆",2],["czHinami","CZ失敗 笛口雛実","通常B以上示唆",2],
 ["czAmon","CZ失敗 亜門鋼太朗","通常B以上濃厚",4],["czMado","CZ失敗 真戸呉緒","通常C以上濃厚",4],
 ["czKanekiGhoul","CZ失敗 金木研（喰種）","チャンス以上濃厚",4],["czToukaGhoul","CZ失敗 霧嶋董香（喰種）","チャンス以上濃厚",4],
 ["czTsukiyama","CZ失敗 月山習","天国準備以上濃厚",5],["czRize","CZ失敗 神代利世","天国濃厚",5],
 ["czEven","CZ失敗 鈴屋什造","設定2・4・6",5],["cz4","CZ失敗 梟","設定4以上",5],["cz6","CZ失敗 有馬貴将","設定6",6],
 ["atOdd","AT終了 亜門＆真戸暁","奇数設定示唆",2],["atEven","AT終了 鈴屋＆篠原","偶数設定示唆",2],
 ["atNot1","AT終了 神代利世","設定1否定",3],["atHighWeak","AT終了 雛実＆リョーコ","高設定示唆（弱）",2],
 ["atHighStrong","AT終了 四方＆イトリ＆ウタ","高設定示唆（強）",3],["at4","AT終了 金木＆董香","設定4以上",5],["at6","AT終了 あんていく集合","設定6",6]
];

const hintNav={
 czTouka:{mode:"通常B以上示唆"},czHinami:{mode:"通常B以上示唆"},czAmon:{mode:"通常B以上濃厚"},czMado:{mode:"通常C以上濃厚"},
 czKanekiGhoul:{mode:"チャンス以上濃厚"},czToukaGhoul:{mode:"チャンス以上濃厚"},czTsukiyama:{mode:"天国準備以上濃厚"},czRize:{mode:"天国濃厚"},
 czEven:{setting:"設定2・4・6"},cz4:{setting:"設定4以上"},cz6:{setting:"設定6"},atOdd:{setting:"奇数設定示唆"},atEven:{setting:"偶数設定示唆"},
 atNot1:{setting:"設定1否定"},atHighWeak:{setting:"高設定示唆（弱）"},atHighStrong:{setting:"高設定示唆（強）"},at4:{setting:"設定4以上"},at6:{setting:"設定6"}
};
const setting={
 atDen:[394.4,380.5,357.0,325.9,291.2,261.3],
 directDen:[28460.6,24453.5,18093.0,12019.5,8615.4,7036.8],
 episodeDen:[6620.2,5879.7,5114.5,4062.5,3166.7,2639.5],
 returnPct:[.0781,.0781,.0938,.1094,.1250,.1523],
 lowReplayDen:[1260.3,1213.6,1170.3,1129.9,1092.3,1024.0],
 cz100Pct:[.1958,.2104,.2315,.2637,.3196,.3601]
};
function score(state,h){
 const g=+state.meta.games||0;let ll=[0,0,0,0,0,0];
 if(g>0){const k=state.main.at||0;setting.atDen.forEach((d,i)=>ll[i]+=h.poissonLL(k,g/d))}
 const dl=state.special.directAT||0,eb=state.special.episodeBonus||0,lr=state.main.replayLow||0;
 setting.directDen.forEach((d,i)=>ll[i]+=h.poissonLL(dl,g/d));
 setting.episodeDen.forEach((d,i)=>ll[i]+=h.poissonLL(eb,g/d));
 setting.lowReplayDen.forEach((d,i)=>ll[i]+=h.poissonLL(lr,g/d));
 const rt=state.special.atReturnTry||0,rh=state.special.atReturnHit||0;if(rt>0)setting.returnPct.forEach((p,i)=>ll[i]+=h.binomLL(rh,rt,p));
 const ct=state.special.czUnder100Try||0,ch=state.special.czUnder100Hit||0;if(ct>0)setting.cz100Pct.forEach((p,i)=>ll[i]+=h.binomLL(ch,ct,p));
 let min=1,exact=null;if(state.hints.cz4||state.hints.at4)min=4;if(state.hints.cz6||state.hints.at6)exact=6;if(state.hints.atNot1)min=Math.max(min,2);
 ll=ll.map((v,i)=>exact?(i===5?v:-999):((i+1)<min?-999:v));
 return h.normalizeLL(ll);
}
R.register({
 id:"tokyo_ghoul",name:"東京喰種",subtitle:"L 東京喰種",icon:"🩸",profile:"tokyo",
 search:["東京グール","とうきょうぐーる","tokyo ghoul","喰種"],
 axes:{realGame:true,lcdGame:true},
 features:{sc:false,ggo:false,czHistory:false,conditional:false,endScreens:false,trophies:false,mini:false,autoLinks:false},
 nav:[{target:"sessionCard",label:"実戦"},{target:"mainCard",label:"小役"},{target:"machineSpecificCard",label:"CZ・AT"},{target:"hintNavigatorCard",label:"CZ/AT示唆"},{target:"dashboardCard",label:"分析"},{target:"timelineCard",label:"時系列"},{target:"historyCard",label:"履歴"}],
 title:"東京喰種 示唆ナビ",main,koyakuGuides,special,hints,hintNav,setting,score,
 quickActions:[
  {type:"main",key:"weakCherry",label:"弱チェ",icon:"🍒"},
  {type:"main",key:"watermelon",label:"スイカ",icon:"🍉"},
  {type:"main",key:"cz",label:"CZ",icon:"⚡"},
  {type:"main",key:"at",label:"AT",icon:"🔥"},
  {type:"special",key:"directAT",label:"直撃",icon:"🎯"},
  {type:"special",key:"episodeBonus",label:"エピボ",icon:"🩸"}
 ]
});
})();