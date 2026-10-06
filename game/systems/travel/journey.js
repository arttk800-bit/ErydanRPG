// ============================================================================
// JOURNEY COORDINATOR
// Cross-scope travel uses one location transition and one regional access node.
// ============================================================================
import {LocationTravelSystem} from './location-travel.js';
import {accessNode} from '../../map/access-points.js';

function byId(items,id){return items.find(x=>x.id===id)||null}
function transition(points){return points.find(p=>p.class==='transition'||p.type==='transition')||null}

export const JourneySystem={
 planExit(state,{location,locationNavigation,locationPoints,regionalRoads,regionalPoints,targetId,method='walk'}){
  if(state.world?.position?.locationId!==location.id)return null;
  const gate=transition(locationPoints),external=accessNode(regionalRoads,location.id),target=byId(regionalPoints,targetId);
  if(!gate||!external||!target)return null;
  const probe=structuredClone(state);
  const local=LocationTravelSystem.start(probe,{locationId:location.id,navigation:locationNavigation,points:{items:locationPoints,location},targetId:gate.id,method});
  if(!local)return null;
  return{gatePointId:gate.id,targetId,method}
 },
 startExit(state,args){
  const plan=this.planExit(state,args);if(!plan)return null;
  state.world.journey={status:'to-gate',kind:'location-to-region',locationId:args.location.id,regionId:args.regionalRoads.regionId,targetId:plan.targetId,method:plan.method,gatePointId:plan.gatePointId};
  const travel=LocationTravelSystem.start(state,{locationId:args.location.id,navigation:args.locationNavigation,points:{items:args.locationPoints,location:args.location},targetId:plan.gatePointId,method:plan.method});
  return travel?state.world.journey:null
 },
 continueFromGate(state,{regionalRoads,regionalPoints}){
  const j=state.world?.journey;if(j?.status!=='to-gate'||state.world?.position?.locationPointId!==j.gatePointId)return null;
  const external=accessNode(regionalRoads,j.locationId),target=byId(regionalPoints,j.targetId);if(!external||!target)return null;
  state.world.position={regionId:j.regionId,pointId:null,position:{x:external.x,y:external.y}};
  state.world.current.locationId=null;state.world.current.districtId=null;state.world.current.placeId=null;j.status='region';
  return{fromPosition:{x:external.x,y:external.y},target}
 },
 finish(state){if(state.world?.journey)state.world.journey={status:'idle'};return state.world.journey}
};
