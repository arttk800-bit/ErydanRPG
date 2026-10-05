// ============================================================================
// LOCATION ENTRY
// Resolves a physical spawn inside a mapped location from a stable access port.
// Fallback order keeps incomplete maps playable without inventing map routes.
// ============================================================================
import {accessPorts} from '../../map/access-points.js';
function point(items,id){return items.find(p=>p.id===id)||null}
export const LocationEntrySystem={
 canEnter(state,locationId){const p=state.world?.position;return p?.pointId===locationId&&!p?.locationId},
 resolve({location,navigation,points,entryPortId=null}){const ports=accessPorts(navigation,location.id),requested=entryPortId?ports.find(p=>p.id===entryPortId):null,port=requested||ports.find(p=>p.pointId&&point(points,p.pointId))||null;let spawn=port?.pointId?point(points,port.pointId):null;if(!spawn)spawn=points.find(p=>p.class==='transition')||points.find(p=>p.class==='district')||points.find(p=>p.class==='place')||null;if(spawn)return{pointId:spawn.id,position:{x:spawn.x,y:spawn.y},portId:port?.id||null,fallback:!requested};return{pointId:'runtime:'+location.id+':fallback-spawn',position:{x:.5,y:.5},portId:null,fallback:true,temporary:true}},
 enter(state,{location,navigation,points,entryPortId=null}){if(!this.canEnter(state,location.id))return null;const spawn=this.resolve({location,navigation,points,entryPortId});state.world.position={regionId:state.world.current?.regionId||null,locationId:location.id,locationPointId:spawn.pointId,position:{...spawn.position},entryPortId:spawn.portId||null};state.world.current.locationId=location.id;state.world.current.districtId=null;state.world.current.placeId=null;return spawn}
};