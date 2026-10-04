export const WORLD_DATA={
 map:{asset:'../assets/eirdan-world-map-v2.png',width:1458,height:1536},
 regions:{
  north:{name:'Северные земли',zone:{x:29,y:10,w:43,h:17}},
  west:{name:'Западные земли',zone:{x:16,y:25,w:31,h:20}},
  east:{name:'Восточные земли',zone:{x:58,y:24,w:28,h:19}},
  highlands:{name:'Центральные высокогорья',zone:{x:39,y:28,w:25,h:22}},
  forest:{name:'Лесные земли',zone:{x:30,y:45,w:27,h:18}},
  steppe:{name:'Восточные степи',zone:{x:57,y:43,w:30,h:19}},
  southwest:{name:'Юго-западные земли',zone:{x:18,y:57,w:29,h:18}},
  south:{name:'Южные земли',zone:{x:42,y:60,w:25,h:17}},
  southeast:{name:'Юго-восточные земли',zone:{x:63,y:58,w:24,h:18}},
  westernIsles:{name:'Западный архипелаг',zone:{x:4,y:35,w:16,h:28}},
  southwestIsles:{name:'Юго-западный архипелаг',zone:{x:7,y:67,w:22,h:20}},
  southIsles:{name:'Южный архипелаг',zone:{x:36,y:78,w:31,h:16}},
  eastIsles:{name:'Восточный архипелаг',zone:{x:80,y:42,w:16,h:33}}
 },
 places:{},cities:{},
 travel:{localEventChance:.25,roadEventChance:.42,legMinutes:240,campFatigue:12,campMinutes:480}
};
export const WorldData=WORLD_DATA;
