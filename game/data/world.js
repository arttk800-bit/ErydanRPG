export const WORLD_DATA={
 map:{asset:'../assets/eirdan-world-map-v2.png',mask:'../assets/world-region-index.png',width:1458,height:1536},
 regions:{
  north:{name:'Северные земли',index:1},
  west:{name:'Западные земли',index:2},
  east:{name:'Восточные земли',index:3},
  highlands:{name:'Центральные высокогорья',index:4},
  forest:{name:'Лесные земли',index:6},
  steppe:{name:'Восточные степи',index:5},
  southwest:{name:'Юго-западные земли',index:7},
  south:{name:'Южные земли',index:8},
  southeast:{name:'Юго-восточные земли',index:9},
  westernIsles:{name:'Западный архипелаг',index:12},
  southwestIsles:{name:'Юго-западный архипелаг',index:13},
  southIsles:{name:'Южный архипелаг',index:10},
  eastIsles:{name:'Восточный архипелаг',index:11}
 },
 places:{},cities:{},
 travel:{localEventChance:.25,roadEventChance:.42,legMinutes:240,campFatigue:12,campMinutes:480}
};
export const WorldData=WORLD_DATA;
