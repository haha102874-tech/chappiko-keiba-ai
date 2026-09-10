(() => {
const R=window.ChappikoRegistry;
const pushHints=[
 ["pushWhite","PUSH 白","信じてるから… / 示唆内容は現在調査中",1],
 ["pushBlue","PUSH 青","一緒に頑張ろ…ね / 示唆内容は現在調査中",1],
 ["pushYellow","PUSH 黄","私とあたるまで勝ち上がって来なさいよ / 示唆内容は現在調査中",1],
 ["pushGreen","PUSH 緑","キリト…あなたの強さの理由を見させてもらうわ / 示唆内容は現在調査中",1],
 ["pushRed","PUSH 赤","ヘカートⅡ…お願い。弱い私に、力を貸して。 / 示唆内容は現在調査中",1],
 ["pushPurple","PUSH 紫","LUKガン上げなのあなた!? だからかぁ… / モードアップ濃厚",5]
];
const hintNav={
 pushWhite:{mode:"調査中"},pushBlue:{mode:"調査中"},pushYellow:{mode:"調査中"},pushGreen:{mode:"調査中"},pushRed:{mode:"調査中"},
 pushPurple:{mode:"モードアップ濃厚",setting:"設定示唆ではありません"}
};
const settingData={
  cz:[238.4,232.3,232.7,218.9,225.2,191.7],
  at:[386.2,364.3,368.1,326.8,340.6,269.6],
  scWatermelon:[.402,.445,.410,.484,.422,.551],
  strongCherryCZNormal:[.20,.21,.20,.25,.20,.33],
  strongCherryCZHigh:[.50,.51,.52,.55,.58,.60],
  directAT:[18091.8,14160.5,14390.8,8498.0,4723.3,3415.7],
  theEnd:[20177.5,17579.1,17586.3,13784.5,11459.0,7077.2],
  strongChanceTheEnd:[.004,.008,.008,.016,.023,.051],
  czFailItem:[.203,.211,.219,.227,.250,.301],
  atStageWild:[.60,.40,.60,.40,.60,.40]
};
const main=[
 ["weakCherry","弱チェリー","目安 1/79.9"],["watermelon","スイカ","目安 1/82.6"],
 ["weakChance","弱チャンス目","目安 1/163.8"],["strongCherry","強チェリー","目安 1/327.7"],
 ["strongChanceA","強チャンス目A","小役回数"],["strongChanceB","強チャンス目B","設定差あり"],
 ["ultima","ウルティマ・チェリー","目安 1/16384"],["cz","CZ初当たり","設定差あり"],
 ["at","AT初当たり","設定差あり"],["directAT","AT直撃","詩乃モード契機のみ"],
 ["theEnd","確定CZ THE END","突入時点からTHE END"],["wildernessDuel","曠野の決闘","CZ失敗後"]
];
const koyakuGuides={
 weakCherry:{title:"弱チェリー",summary:"順押しBAR狙い時の代表例。右リール中段リプレイが弱チェリーの目印です。",variants:[
  {label:"弱チェリー",note:"右中段リプレイ",cells:["・","・","・","チェ","・","リプ","・","・","・"],tip:"チェリー停止時、右リール中段がリプレイなら弱チェリー。"}
 ]},
 strongCherry:{title:"強チェリー",summary:"順押しBAR狙い時の代表例。チェリー停止時、右リール中段リプレイ以外なら強チェリーです。",variants:[
  {label:"強チェリー",note:"右中段リプレイ以外",cells:["・","・","・","チェ","・","BAR","・","・","・"],tip:"右中段リプレイ以外を強チェリーとして判別。図はBAR停止のイメージ例です。"}
 ]},
 watermelon:{title:"スイカ",summary:"左リール上段スイカ停止時は中リールにスイカを狙って判別します。",variants:[
  {label:"スイカ",note:"スイカ揃い",cells:["スイカ","スイカ","スイカ","・","・","・","・","・","・"],tip:"スイカが揃えばスイカ。ハズれた場合は強チャンス目を確認。"}
 ]},
 weakChance:{title:"弱チャンス目",summary:"中段のリプレイ・リプレイ・バレット図柄が代表的な停止形です。",variants:[
  {label:"弱チャンス目",note:"中段リリ弾",cells:["・","・","・","リプ","リプ","弾","・","・","・"],tip:"中段に『リプレイ・リプレイ・バレット』。"}
 ]},
 strongChanceA:{title:"強チャンス目A",summary:"スイカハズレの1枚役。押し位置で見え方が変わるため代表イメージです。",variants:[
  {label:"強チャンス目A",note:"スイカハズレ・1枚",cells:["スイカ","スイカ","×","・","・","・","・","・","・"],tip:"スイカを狙ってハズれ、1枚払い出しなら強チャンス目A。"}
 ]},
 strongChanceB:{title:"強チャンス目B",summary:"上段スイカテンパイハズレが代表例。3枚役です。",variants:[
  {label:"強チャンス目B",note:"上段スイカテンパイハズレ・3枚",cells:["スイカ","スイカ","×","・","・","・","・","・","・"],tip:"上段スイカテンパイからハズれ、3枚払い出しなら強チャンス目B。"}
 ]}
};
const cond=[
 {id:"scWatermelon",name:"通常スイカ→SC",den:"通常スイカ",num:"SC当選",note:"設定差あり"},
 {id:"strongCherryCZNormal",name:"通常 強チェリー→CZ",den:"通常強チェ",num:"CZ当選",note:"設定差あり"},
 {id:"strongCherryCZHigh",name:"高確 強チェリー→CZ",den:"高確強チェ",num:"CZ当選",note:"設定差あり"},
 {id:"strongChanceTheEnd",name:"強チャンス目→確定CZ",den:"強チャンス目",num:"THE END",note:"高設定ほど優遇"},
 {id:"czFailItem",name:"CZ失敗→アイテム獲得",den:"CZ失敗",num:"獲得",note:"設定差あり"},
 {id:"atStage",name:"AT初当たりステージ",den:"荒野",num:"バギー",note:"奇偶差"}
];
const endScreens=[
 ["default","キリト＆シノン","デフォルト","⚔️","s1",0],
 ["uniform","制服","設定1・3・5示唆","🎓","s2",1],["sofa","ソファー","設定2・4・6示唆","🛋️","s1",1],
 ["sunlight","木漏れ日","高設定示唆","🌿","s3",2],["festival","夏祭り","高設定示唆（強）","🎆","s4",3],
 ["childhood","幼少期","設定5以上示唆","🧸","s5",4],["shirt","ワイシャツ","設定2以上","👔","s1",5],
 ["bath","お風呂","設定3以上","♨️","s2",5],["swimsuit","水着","設定4以上","🌊","s3",5],["pajama","パジャマ","設定6","🌙","s5",5]
];
const trophies=[["bronze","銅","設定2以上",5],["silver","銀","設定3以上",5],["gold","金","設定4以上",5],["lightning","イナズマ","設定5以上",5],["rainbow","虹","設定6",5]];
const miniEnding=[
 ["sinon","シノン","偶数設定示唆",1],["kirito","キリト","奇数設定示唆",1],["silica","シリカ","偶数設定示唆（強）",2],
 ["liz","リズベット","奇数設定示唆（強）",2],["x","銃士X","高設定示唆",2],["asuna","アスナ","高設定示唆（強）",3],
 ["shino","詩乃","設定4以上",5],["duo","シノン＆キリト","設定6",5]
];
const miniRosario=[
 ["yuuki","ユウキ","偶数設定示唆",1],["kirito","キリト","奇数設定示唆",1],["silica","シリカ","偶数設定示唆（強）",2],
 ["liz","リズベット","奇数設定示唆（強）",2],["leafa","リーファ","高設定示唆",2],["asuna","アスナ","高設定示唆（強）",3],
 ["yui","ユイ","設定4以上",5],["duo","アスナ＆ユウキ","設定6",5]
];
function score(state,h){
 const g=+state.meta.games||0; let ll=[0,0,0,0,0,0];
 if(g>0){
   ["cz","at","directAT","theEnd"].forEach(id=>{
     const k=state.main[id]||0;if(!k&&g<1000)return;
     const arr=id==="cz"?settingData.cz:id==="at"?settingData.at:id==="directAT"?settingData.directAT:settingData.theEnd;
     arr.forEach((den,i)=>ll[i]+=h.poissonLL(k,g/den));
   });
 }
 ["scWatermelon","strongCherryCZNormal","strongCherryCZHigh","strongChanceTheEnd","czFailItem"].forEach(id=>{
   const x=state.cond[id]||{a:0,b:0};if((x.a||0)>0)settingData[id].forEach((pp,i)=>ll[i]+=h.binomLL(x.b||0,x.a||0,pp));
 });
 const st=state.cond.atStage||{a:0,b:0};
 if((st.a||0)+(st.b||0)>0)settingData.atStageWild.forEach((pp,i)=>ll[i]+=h.binomLL(st.a||0,(st.a||0)+(st.b||0),pp));
 const odd=(state.end.uniform||0)+(state.miniEnding.kirito||0)+(state.miniRosario.kirito||0);
 const even=(state.end.sofa||0)+(state.miniEnding.sinon||0)+(state.miniRosario.yuuki||0);
 ll.forEach((_,i)=>{if((i+1)%2)ll[i]+=odd*.22;else ll[i]+=even*.22;if(i+1>=4)ll[i]+=(state.end.sunlight||0)*.22+(state.end.festival||0)*.55});
 let min=1,exact=null;
 if((state.end.shirt||0)||(state.trophy.bronze||0))min=2;
 if((state.end.bath||0)||(state.trophy.silver||0))min=Math.max(min,3);
 if((state.end.swimsuit||0)||(state.trophy.gold||0)||(state.miniEnding.shino||0)||(state.miniRosario.yui||0))min=Math.max(min,4);
 if((state.end.childhood||0)||(state.trophy.lightning||0))min=Math.max(min,5);
 if((state.end.pajama||0)||(state.trophy.rainbow||0)||(state.miniEnding.duo||0)||(state.miniRosario.duo||0))exact=6;
 ll=ll.map((v,i)=>exact?(i===5?v:-999):((i+1)<min?-999:v));
 return h.normalizeLL(ll);
}
R.register({
 id:"sao2",name:"SAO2",subtitle:"スロット ソードアート・オンラインⅡ",icon:"⚔️",profile:"sao2",
 search:["sao","ソードアートオンライン","sao2"],
 axes:{realGame:true,lcdGame:true},
 features:{sc:true,ggo:true,czHistory:true,conditional:true,endScreens:true,trophies:true,mini:true,autoLinks:true},
 nav:[{target:"sessionCard",label:"実戦"},{target:"mainCard",label:"小役"},{target:"czCard",label:"CZ",feature:"czHistory"},{target:"scCard",label:"SC",feature:"sc"},{target:"ggoCard",label:"GGO",feature:"ggo"},{target:"hintNavigatorCard",label:"示唆"},{target:"screenCard",label:"終了画面",feature:"endScreens"},{target:"dashboardCard",label:"分析"},{target:"timelineCard",label:"時系列"},{target:"historyCard",label:"履歴"}],
 title:"SAO2 PUSH示唆",
 main,koyakuGuides,cond,hints:pushHints,hintNav,endScreens,trophies,miniEnding,miniRosario,settingData,score,
 quickActions:[
  {type:"main",key:"weakCherry",label:"弱チェ",icon:"🍒"},
  {type:"main",key:"watermelon",label:"スイカ",icon:"🍉"},
  {type:"main",key:"cz",label:"CZ",icon:"⚡"},
  {type:"main",key:"at",label:"AT",icon:"🔥"},
  {type:"scroll",target:"scCard",label:"SC",icon:"🎯"}
 ]
});
})();