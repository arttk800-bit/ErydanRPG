// ============================================================================
// MAP DIAGNOSTICS
// Validates registered authored map content through public map/travel contracts.
// Diagnostics observes canonical data; it does not own routing or terrain rules.
// ============================================================================
import {registeredMaps} from '../data/map-registry.js';
import {accessPorts} from '../map/access-points.js';
import {TerrainSystem} from '../map/terrain.js';
import {buildTravelGraph,fastestPath} from '../systems/travel/route-planner.js';

export function diagnoseMap(target){
 const {id,ownerId,content={},navigation={},expectations={}}=target,checks=[],problems=[];
 const nodes=new Map(),duplicates=[];
 for(const node of navigation.nodes||[]){if(nodes.has(node.id))duplicates.push(node.id);else nodes.set(node.id,node)}
 checks.push(['Unique navigation nodes',duplicates.length===0]);
 if(duplicates.length)problems.push({type:'DUPLICATE_NODE',mapId:id,nodeIds:duplicates});

 const badEdges=[],blockedEdges=[];
 for(const edge of navigation.edges||[]){
  const [a,b,via=[]]=edge,pa=nodes.get(a),pb=nodes.get(b);
  if(!pa||!pb){badEdges.push({type:'BAD_EDGE',mapId:id,from:a,to:b});continue}
  const path=[pa,...via.map(([x,y])=>({x,y})),pb];
  if(!TerrainSystem.pathPassable(navigation.terrainZones||[],path))blockedEdges.push({type:'BLOCKED_EDGE',mapId:id,from:a,to:b});
 }
 problems.push(...badEdges,...blockedEdges);
 checks.push(['Authored edges reference nodes',badEdges.length===0]);
 checks.push(['Authored edges pass terrain',blockedEdges.length===0]);

 const graph=buildTravelGraph(navigation,nodes,'walk',navigation.terrainZones||[]);
 const badPorts=[],unreachable=[];
 for(const [accessOwner] of Object.entries(navigation.access||{})){
  const ports=accessPorts(navigation,accessOwner);
  for(const port of ports)if(!nodes.has(port.node))badPorts.push({type:'BAD_PORT_NODE',mapId:id,ownerId:accessOwner,portId:port.id,node:port.node});
  for(const a of ports)for(const b of ports){
   if(a.id===b.id||!nodes.has(a.node)||!nodes.has(b.node))continue;
   if(!fastestPath(graph,a.node,b.node))unreachable.push({type:'NO_ROUTE',mapId:id,ownerId:accessOwner,fromPortId:a.id,toPortId:b.id,fromNode:a.node,toNode:b.node});
  }
 }
 problems.push(...badPorts,...unreachable);
 checks.push(['Access ports reference nodes',badPorts.length===0]);
 checks.push(['Multi-port owners mutually reachable',unreachable.length===0]);

 const ownerPorts=accessPorts(navigation,ownerId);
 if(Number.isInteger(expectations.ownerPorts)){
  const ok=ownerPorts.length===expectations.ownerPorts;
  checks.push(['Owner access port count',ok]);
  if(!ok)problems.push({type:'OWNER_PORT_COUNT',mapId:id,ownerId,expected:expectations.ownerPorts,actual:ownerPorts.length});
 }
 const districts=(content.points||[]).filter(point=>point.class==='district');
 if(Number.isInteger(expectations.districtPorts)){
  const weak=districts.filter(point=>accessPorts(navigation,point.id).length<expectations.districtPorts).map(point=>point.id);
  checks.push(['District access port count',weak.length===0]);
  if(weak.length)problems.push({type:'INSUFFICIENT_DISTRICT_ACCESS',mapId:id,districtIds:weak,minimum:expectations.districtPorts});
 }
 const transitions=(content.points||[]).filter(point=>point.class==='transition');
 if(transitions.length){
  const bound=new Set(ownerPorts.map(port=>port.pointId).filter(Boolean)),missing=transitions.filter(point=>!bound.has(point.id)).map(point=>point.id);
  checks.push(['Transitions bound to owner ports',missing.length===0]);
  if(missing.length)problems.push({type:'UNBOUND_TRANSITION',mapId:id,pointIds:missing});
 }
 return{ok:checks.every(([,ok])=>ok),checks,summary:{kind:target.kind||null,nodes:nodes.size,edges:navigation.edges?.length||0,ports:Object.values(navigation.access||{}).reduce((sum,_,i,all)=>sum+accessPorts(navigation,Object.keys(navigation.access)[i]).length,0),districts:districts.length},problems};
}

export function runMapDiagnostics(){
 const maps={},checks=[],problems=[];
 for(const target of registeredMaps()){
  const result=diagnoseMap(target);maps[target.id]=result.summary;
  for(const [label,ok] of result.checks)checks.push([target.id+' · '+label,ok]);
  problems.push(...result.problems);
 }
 return{ok:checks.every(([,ok])=>ok),checks,maps,problems};
}
