// ============================================================================
// JOURNEY COORDINATOR
// Plans cross-scope journeys. It composes location and region travel without
// duplicating movement simulation owned by TravelSystem.
// ============================================================================
import {RoadSystem} from './roads.js';
import {LocationTravelSystem} from './location-travel.js';
import {LocationBoundarySystem} from './location-boundary.js';
import {accessPorts} from '../../map/access-points.js';

function byId(items,id){return items.find(x=>x.id===id)||null}
function regionalPort(regionalRoads,locationId,portId){return accessPorts(regionalRoads,locationId).find(p=>p.id===portId)||null}
function internalPort(locationNavigation,locationId,portId){return accessPorts(locationNavigation,locationId).find(p=>p.id===portId)||null}

export const JourneySystem={
 planExit(state,{location,locationNavigation,locationPoints,regionalRoads,regionalPoints,targetId,method='walk',terrainZones=[]}){
  const pos=state.world?.position;if(pos?.locationId!==location.id)return null;
  let best=null;
  for(const rp of accessPorts(regionalRoads,location.id)){
   const lp=internalPort(locationNavigation,location.id,rp.id);if(!lp?.pointId)continue;
   const target=byId(regionalPoints,targetId);if(!target)continue;
   const regionRoute=RoadSystem.route(regionalRoads,regionalPoints,location.id,targetId,method,terrainZones);
   if(!regionRoute||regionRoute.fromPortId!==rp.id)continue;
   const probe=structuredClone(state);
   const local=LocationTravelSystem.start(probe,{locationId:location.id,navigation:locationNavigation,points:{items:locationPoints,location},targetId:lp.pointId,method});
   if(!local)continue;
   const cost=(local.travelCost||0)+(regionRoute.cost||0);
   if(!best||cost<best.cost)best={cost,portId:rp.id,gatePointId:lp.pointId,localCost:local.travelCost||0,regionCost:regionRoute.cost||0,targetId,method}
  }
  return best
 },
 startExit(state,args){
  const plan=this.planExit(state,args);if(!plan)return null;
  state.world.journey={status:'to-gate',kind:'location-to-region',locationId:args.location.id,regionId:args.regionalRoads.regionId,targetId:plan.targetId,method:plan.method,portId:plan.portId,gatePointId:plan.gatePointId};
  const travel=LocationTravelSystem.start(state,{locationId:args.location.id,navigation:args.locationNavigation,points:{items:args.locationPoints,location:args.location},targetId:plan.gatePointId,method:plan.method});
  return travel?state.world.journey:null
 },
 continueFromGate(state,{locationNavigation,regionalRoads,regionalPoints,terrainZones=[]}){
  const j=state.world?.journey;if(j?.status!=='to-gate')return null;
  const port=LocationBoundarySystem.exitPort(state,locationNavigation,j.locationId);if(!port||port.id!==j.portId)return null;
  const external=regionalPort(regionalRoads,j.locationId,j.portId),target=byId(regionalPoints,j.targetId);if(!external||!target)return null;
  const node=(regionalRoads.nodes||[]).find(n=>n.id===external.node);if(!node)return null;
  state.world.position={regionId:j.regionId,pointId:null,position:{x:node.x,y:node.y}};
  state.world.current.locationId=null;state.world.current.districtId=null;state.world.current.placeId=null;
  const travel=import.meta; // marker keeps this module side-effect free until startRegion is called
  j.status='region';
  return {fromPosition:{x:node.x,y:node.y},target}
 },
 finish(state){if(state.world?.journey)state.world.journey={status:'idle'};return state.world.journey}
};
