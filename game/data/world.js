export const WORLD_DATA={
 map:{asset:'../assets/world/eirdan-world-map-regions-final.png',mask:'../assets/world/eirdan-world-region-index-final.png',width:1536,height:1024},
 regions:{
  north:{geographicName:'Северные земли',politicalName:null,name:'Северные земли',index:1},
  northwest:{geographicName:'Северо-западные земли',politicalName:null,name:'Северо-западные земли',index:2},
  west:{geographicName:'Западные земли',politicalName:null,name:'Западные земли',index:3},
  forest:{geographicName:'Центральные земли',politicalName:null,name:'Центральные земли',index:4,available:true,map:{asset:'../assets/regions/region-central-lands.png'}},
  northeast:{geographicName:'Северо-восточные земли',politicalName:null,name:'Северо-восточные земли',index:5},
  east:{geographicName:'Восточные земли',politicalName:null,name:'Восточные земли',index:6},
  westCentral:{geographicName:'Западное пограничье',politicalName:null,name:'Западное пограничье',index:7},
  southwest:{geographicName:'Юго-западные земли',politicalName:null,name:'Юго-западные земли',index:8},
  south:{geographicName:'Южные земли',politicalName:null,name:'Южные земли',index:9},
  southeast:{geographicName:'Юго-восточные земли',politicalName:null,name:'Юго-восточные земли',index:10}
 },
 places:{},cities:{},
 travel:{localEventChance:.25,roadEventChance:.42,legMinutes:240,campFatigue:12,campMinutes:480}
};
export const WorldData=WORLD_DATA;
