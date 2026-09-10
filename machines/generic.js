(() => {
window.ChappikoRegistry.register({
 id:"platform_demo",name:"共通カウンター",subtitle:"新機種追加テンプレート",icon:"🎰",profile:"generic",
 search:["共通","汎用","テンプレート"],
 axes:{realGame:true,lcdGame:true},
 features:{sc:false,ggo:false,czHistory:false,conditional:false,endScreens:false,trophies:false,mini:false,autoLinks:false},
 main:[["bell","ベル","汎用"],["cherry","チェリー","汎用"],["watermelon","スイカ","汎用"],["chance","チャンス目","汎用"],["bonus","ボーナス","汎用"],["at","AT","汎用"]],
 quickActions:[
  {type:"main",key:"bell",label:"ベル",icon:"🔔"},{type:"main",key:"cherry",label:"チェ",icon:"🍒"},
  {type:"main",key:"watermelon",label:"スイカ",icon:"🍉"},{type:"main",key:"chance",label:"チャンス",icon:"✨"},
  {type:"main",key:"bonus",label:"BONUS",icon:"🎁"},{type:"main",key:"at",label:"AT",icon:"🔥"}
 ]
});
})();