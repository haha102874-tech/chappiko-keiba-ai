(() => {
const R=window.ChappikoRegistry;
const main=[
 ["weakCherry","弱チェリー","小役"],["strongCherry","強チェリー","停止形ナビあり"],["watermelon","スイカ","小役"],["chance","チャンス目","A/B停止形ナビあり"],
 ["mikoZero","巫女pt 0到達","乙女アタック分母"],["otomeAttack","乙女アタック","設定差あり"],["at","AT初当たり","設定判別"]
];
const koyakuGuides={
 weakCherry:{title:"弱チェリー",summary:"順押し・ハサミ打ち時の代表停止形。複数パターンがあります。",variants:[
  {label:"弱チェリー①",note:"左下段＋中右中段チェリー",cells:["・","・","・","・","チェ","チェ","チェ","・","・"],tip:"左下段チェリーから中・右中段チェリーの代表例。"},
  {label:"弱チェリー②",note:"左中下段＋右上段",cells:["・","・","チェ","・","・","・","チェ","チェ","・"],tip:"弱チェリーには別停止形もあります。"}
 ]},
 strongCherry:{title:"強チェリー",summary:"斜めチェリー揃いなどが代表的な強チェリー停止形です。",variants:[
  {label:"強チェリー",note:"斜めチェリー揃い",cells:["チェ","・","・","・","チェ","・","・","・","チェ"],tip:"チェリーが斜めに揃う形が代表例。"}
 ]},
 watermelon:{title:"スイカ",summary:"左リール上段スイカ停止時は中リールにスイカを狙います。",variants:[
  {label:"スイカ",note:"斜めスイカ",cells:["スイカ","・","・","・","スイカ","・","・","・","スイカ"],tip:"斜めスイカ揃いが代表例。"}
 ]},
 chance:{title:"チャンス目 A / B",summary:"チャンス目AとBの代表停止形を見比べられます。カウンターは現在A/B合算です。",variants:[
  {label:"チャンス目A①",note:"ベル小V",cells:["ベル","・","ベル","・","・","・","・","ベル","・"],tip:"ベル小Vはチャンス目Aの代表例。"},
  {label:"チャンス目A②",note:"中段リリベ",cells:["・","・","・","リプ","リプ","ベル","・","・","・"],tip:"中段『リプレイ・リプレイ・ベル』もチャンス目A。"},
  {label:"チャンス目B",note:"スイカテンパイハズレ",cells:["スイカ","スイカ","×","・","・","・","・","・","・"],tip:"スイカテンパイハズレがチャンス目B。"}
 ]}
};
const special=[
 ["otomeBonus","戦国乙女BONUS","設定差特大"],["cycle1","1周期目AT","周期記録"],["cycle2","2周期目AT","周期記録"],["cycle3p","3周期目以降AT","周期記録"],
 ["strapNobunaga","ストラップ ノブナガ","設定差あり"],["strapGoemon","ストラップ ゴエモン","設定差あり"],["strapHideyoshi","ストラップ ヒデヨシ","設定差あり"]
];
const hints=[
 ["stamp2","可スタンプ","設定2以上",5],["stamp3","吉スタンプ","設定3以上",5],["stamp4","良スタンプ","設定4以上",5],["stamp5","優スタンプ","設定5以上",5],["stamp6","極スタンプ","設定6",6],
 ["endDefault","AT終了 ノブナガ","デフォルト",1],["endBHint","AT終了 マサムネ・ヒデヨシ","周期テーブル通常B以上示唆",2],
 ["endB100","AT終了 モトナリ・ドウセツ・ソウリン","通常B以上示唆＋1周期目100G以内示唆",3],
 ["endYoshiteru","AT終了 敵キャラ集合","乙女ストラップモード『ヨシテル』濃厚",5],
 ["endBConfirm","AT終了 イエヤス・シンゲン・カンスケ・ヨシモト","通常B以上濃厚／通常Aなら設定4以上",4],
 ["endRed","AT終了 乙女集合（赤）","天国濃厚／天国否定で設定4以上",5],["endGold","AT終了 乙女集合（金）","天国濃厚＋設定2以上",5]
];

const hintNav={
 stamp2:{setting:"設定2以上"},stamp3:{setting:"設定3以上"},stamp4:{setting:"設定4以上"},stamp5:{setting:"設定5以上"},stamp6:{setting:"設定6"},
 endBHint:{mode:"周期テーブル 通常B以上示唆"},endB100:{mode:"通常B以上示唆＋1周期目100G以内示唆"},endYoshiteru:{mode:"乙女ストラップ『ヨシテル』濃厚"},
 endBConfirm:{mode:"周期テーブル 通常B以上濃厚",setting:"通常Aだった場合は設定4以上"},endRed:{mode:"天国濃厚",setting:"天国否定なら設定4以上"},endGold:{mode:"天国濃厚",setting:"設定2以上"}
};
const setting={atDen:[359.5,350.8,332.5,302.8,281.0,262.9],attackPct:[.203,.214,.232,.247,.252,.257],bonusDen:[21206.7,15648.9,13143.5,8143.4,6427.6,5502.7]};
function score(state,h){
 const g=+state.meta.games||0;let ll=[0,0,0,0,0,0];
 if(g>0){const k=state.main.at||0;setting.atDen.forEach((d,i)=>ll[i]+=h.poissonLL(k,g/d))}
 const b=state.special.otomeBonus||0;setting.bonusDen.forEach((d,i)=>ll[i]+=h.poissonLL(b,g/d));
 const den=state.main.mikoZero||0,num=state.main.otomeAttack||0;if(den>0)setting.attackPct.forEach((p,i)=>ll[i]+=h.binomLL(num,den,p));
 let min=1,exact=null;if(state.hints.stamp2||state.hints.endGold)min=2;if(state.hints.stamp3)min=3;if(state.hints.stamp4)min=4;if(state.hints.stamp5)min=5;if(state.hints.stamp6)exact=6;
 ll=ll.map((v,i)=>exact?(i===5?v:-999):((i+1)<min?-999:v));
 return h.normalizeLL(ll);
}
R.register({
 id:"otome5",name:"戦国乙女5",subtitle:"L戦国乙女5 業火を穿つ宿焔の双刃",icon:"🌸",profile:"otome5",
 search:["戦国乙女","乙女5","せんごくおとめ","sengoku otome"],
 axes:{realGame:true,lcdGame:true},
 features:{sc:false,ggo:false,czHistory:false,conditional:false,endScreens:false,trophies:false,mini:false,autoLinks:false},
 nav:[{target:"sessionCard",label:"実戦"},{target:"mainCard",label:"小役"},{target:"machineSpecificCard",label:"乙女アタック"},{target:"hintNavigatorCard",label:"AT終了示唆"},{target:"dashboardCard",label:"分析"},{target:"timelineCard",label:"時系列"},{target:"historyCard",label:"履歴"}],
 title:"戦国乙女5 示唆ナビ",main,koyakuGuides,special,hints,hintNav,setting,score,
 quickActions:[
  {type:"main",key:"weakCherry",label:"弱チェ",icon:"🍒"},
  {type:"main",key:"watermelon",label:"スイカ",icon:"🍉"},
  {type:"main",key:"otomeAttack",label:"乙女A",icon:"⚔️"},
  {type:"main",key:"at",label:"AT",icon:"🔥"},
  {type:"special",key:"otomeBonus",label:"乙女B",icon:"🌸"},
  {type:"special",key:"cycle1",label:"1周期",icon:"①"}
 ]
});
})();