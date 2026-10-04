export const ROAD_TYPES={
 trail:{label:'Тропа',walk:0.92,horse:0.72},
 road:{label:'Дорога',walk:1.00,horse:1.05},
 highway:{label:'Тракт',walk:1.06,horse:1.22},
 rough:{label:'Бездорожье',walk:0.78,horse:0.58}
};
export const TERRAIN_TYPES={
 normal:{label:'Равнина',walk:1.00,horse:1.00},
 forest:{label:'Лес',walk:0.86,horse:0.68},
 swamp:{label:'Болото',walk:0.55,horse:0.32},
 mountain:{label:'Горы',walk:0.66,horse:0.48},
 river:{label:'Брод/вода',walk:0.62,horse:0.50}
};
function profile(table,key){return table[key]||table.normal||table.road}
export const TravelConditions={
 segmentFactor(segment,method='walk'){
  const road=ROAD_TYPES[segment?.roadType]||ROAD_TYPES.road;
  const terrain=profile(TERRAIN_TYPES,segment?.terrain);
  return Math.max(.15,(road[method]||road.walk)*(terrain[method]||terrain.walk));
 },
 routeFactor(route,method='walk'){
  const seg=route?.segments||[];if(!seg.length)return 1;
  let weighted=0,total=0;
  for(const s of seg){const d=Math.max(0,s.distance||0);weighted+=d*this.segmentFactor(s,method);total+=d}
  return total?weighted/total:1;
 }
};
