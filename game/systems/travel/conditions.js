import {TerrainSystem,TERRAIN_TYPES} from '../../map/terrain.js';
export const ROAD_TYPES={
 trail:{label:'Тропа',walk:.92,horse:.72},
 road:{label:'Дорога',walk:1,horse:1.05},
 highway:{label:'Тракт',walk:1.06,horse:1.22},
 rough:{label:'Бездорожье',walk:.78,horse:.58}
};
export {TERRAIN_TYPES};
export const TravelConditions={
 factor(roadType='road',terrain='plain',method='walk'){
  const road=ROAD_TYPES[roadType]||ROAD_TYPES.road,t=TerrainSystem.type(terrain);
  if(!t.passable)return 0;return Math.max(.01,(road[method]??road.walk)*(t[method]??t.walk));
 },
 segmentFactor(segment,method='walk'){return this.factor(segment?.roadType,segment?.terrain||'plain',method)},
 traversalSeconds(roads,path,{roadType='road',terrain='plain'}={},method='walk',zones=roads?.terrainZones||[]){
  let seconds=0;
  for(let i=1;i<(path?.length||0);i++){
   const d=roads?.metrics?Math.hypot((path[i].x-path[i-1].x)*roads.metrics.widthMeters,(path[i].y-path[i-1].y)*roads.metrics.heightMeters):Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);
   const spans=zones?.length?TerrainSystem.segmentSpans(zones,path[i-1],path[i]):[{terrain,fraction:1,passable:TerrainSystem.type(terrain).passable}];
   for(const s of spans){const factor=this.factor(roadType,s.terrain,method);if(!factor)return Infinity;seconds+=d*s.fraction/factor}
  }
  return seconds;
 },
 routeFactor(route,method='walk'){
  const seg=route?.segments||[];if(!seg.length)return 1;let distance=0,weighted=0;
  for(const s of seg){const d=Math.max(0,s.distance||0);distance+=d;if(Number.isFinite(s.cost))weighted+=s.cost;else{const f=this.segmentFactor(s,method);if(!f)return 0;weighted+=d/f}}
  return distance&&weighted?distance/weighted:1;
 }
};
