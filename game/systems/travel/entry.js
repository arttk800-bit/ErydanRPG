// ============================================================================
// LOCATION ENTRY
// A mapped location has one static transition/spawn point.
// ============================================================================
function transition(points){return points.find(p=>p.class==='transition'||p.type==='transition')||null}
export const LocationEntrySystem={
 canEnter(state,locationId){const p=state.world?.position;return p?.pointId===locationId&&!p?.locationId},
 resolve({location,points}){const spawn=transition(points);if(spawn)return{pointId:spawn.id,position:{x:spawn.x,y:spawn.y},fallback:false};return{pointId:'runtime:'+location.id+':fallback-spawn',position:{x:.5,y:.5},fallback:true,temporary:true}},
 enter(state,{location,points}){if(!this.canEnter(state,location.id))return null;const spawn=this.resolve({location,points});state.world.position={regionId:state.world.current?.regionId||null,locationId:location.id,locationPointId:spawn.pointId,position:{...spawn.position}};state.world.current.locationId=location.id;state.world.current.districtId=null;state.world.current.placeId=null;return spawn}
};
