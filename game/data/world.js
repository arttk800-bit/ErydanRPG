export const WORLD_DATA={
 map:{asset:'../assets/eirdan-world-map-regions-final.png',mask:'../assets/eirdan-world-region-index-final.png',width:1536,height:1024},
 regions:{
  north:{name:'Северные земли',index:1},
  northwest:{name:'Северо-западные земли',index:2},
  west:{name:'Западные земли',index:3},
  forest:{name:'Центральные земли',index:4,map:{asset:'../assets/region-central-lands.png'}},
  northeast:{name:'Северо-восточные земли',index:5},
  east:{name:'Восточные земли',index:6},
  westCentral:{name:'Западное пограничье',index:7},
  southwest:{name:'Юго-западные земли',index:8},
  south:{name:'Южные земли',index:9},
  southeast:{name:'Юго-восточные земли',index:10}
 },
 places:{},cities:{},
 travel:{localEventChance:.25,roadEventChance:.42,legMinutes:240,campFatigue:12,campMinutes:480}
};
export const WorldData=WORLD_DATA;
