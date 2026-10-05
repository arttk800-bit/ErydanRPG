// ============================================================================
// LOCATION TRAVEL
// Adapts canonical location navigation data to TravelSystem and owns arrival
// semantics inside a location. TravelSystem remains the movement simulator.
// ============================================================================
import {TravelSystem} from './travel.js';
import {accessPorts} from '../../map/access-points.js';

function nodeMap(nav){return new Map((nav.nodes||[]).map(n=>[n.id,n]))}
function nearestNode(nav,position){let best=null,score=Infinity;for(const n of nav.nodes||[]){const d=(n.x-position.x)**2+(n.y-position.y)**2;if(d<score){score=d;best=n}}return best}
function pointPosition(points,id){const p=points.find(x=>x.id===id);return p?{x:p.x,y:p.y}:null}
function destination(nav,points,targetId){
 const ports=accessPorts(nav,targetId),nodes=nodeMap(nav);
 if(ports.length)return ports.map(p=>({port:p,node:nodes.get(p.node)})).filter(x=>x.node);
 const p=pointPosition(points,targetId);return p?[{port:null,node:p}]:[]
}
export const LocationTravelSystem={
 start(state,{locationId,navigation,points,targetId,method='walk'}){
  const physical=state.world?.position||{},currentPos=physical.locationId===locationId&&physical.position?physical.position:null;
  const spawnId=points.location?.spawnPointId||null,spawn=pointPosition(points.items,physical.locationPointId||spawnId);
  const start=currentPos||spawn;if(!start)return null;
  const candidates=destination(navigation,points.items,targetId);let best=null;
  for(const c of candidates){const trial=TravelSystem.start(structuredClone(state),{roads:navigation,points:points.items,fromPosition:start,toPosition:c.node,method,terrainZones:navigation.terrainZones||[]});if(trial&&(!best||trial.travelCost<best.travelCost))best={...trial,targetPortId:c.port?.id||null}}
  if(!best)return null;
  state.world.travel=best;best.scope='location';best.locationId=locationId;best.toId=targetId;best.targetPortId=best.targetPortId||null;return best
 },
 tick(state,deltaSeconds,navigation,gameSpeed=1){return TravelSystem.tick(state,deltaSeconds,navigation,gameSpeed)},
 arrive(state,points){
  const t=TravelSystem.ensure(state);if(t.status!=='arrived'||t.scope!=='location')return null;
  state.world.position={regionId:state.world?.current?.regionId||null,locationId:t.locationId,locationPointId:t.toId||null,position:t.position?{...t.position}:null};
  const point=points.find(p=>p.id===t.toId)||null;return point
 },
 nearestNode
};
