// ============================================================================
// LOCATION ENTRY
// A mapped location uses one explicitly selected transition/spawn point.
// ============================================================================
function transition(navigation,locationId,points){
 const selected=navigation?.access?.[locationId]?.pointId;
 return (selected&&points.find(p=>p.id===selected&&(p.class==='transition'||p.type==='transition')))||points.find(p=>p.class==='transition'||p.type==='transition')||null
}
export const LocationEntrySystem={
 canEnter(state,locationId){const p=state.world?.position;return p?.pointId===locationId&&!p?.locationId},
 resolve({location,navigation,points}){const spawn=transition(navigation,location.id,points);if(spawn)return{pointId:spawn.id,position:{x:spawn.x,y:spawn.y},fallback:false};return{pointId:'runtime:'+location.id+':fallback-spawn',position:{x:.5,y:.5},fallback:true,temporary:true}},
 enter(state,{location,navigation,points}){if(!this.canEnter(state,location.id))return null;const spawn=this.resolve({location,navigation,points});state.world.position={regionId:state.world.current?.regionId||null,locationId:location.id,locationPointId:spawn.pointId,position:{...spawn.position}};state.world.current.locationId=location.id;state.world.current.districtId=null;state.world.current.placeId=null;return spawn}
};
