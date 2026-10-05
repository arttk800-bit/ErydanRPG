// ============================================================================
// MAP DIAGNOSTICS
// Validates authored map content. Map data problems are reported to diagnostics;
// routing algorithms themselves are covered by CI regression tests.
// ============================================================================
import {VELIGRAD} from '../data/locations/veligrad.js';
import {VELIGRAD_NAVIGATION} from '../data/locations/veligrad-navigation.js';
import {accessPorts} from '../map/access-points.js';
import {TerrainSystem} from '../map/terrain.js';
import {buildTravelGraph,fastestPath} from '../systems/travel/route-planner.js';

export function runMapDiagnostics(){
 const checks=[],problems=[],nodes=new Map(VELIGRAD_NAVIGATION.nodes.map(n=>[n.id,n]));
 const graph=buildTravelGraph(VELIGRAD_NAVIGATION,nodes,'walk',VELIGRAD_NAVIGATION.terrainZones);
 const transitions=VELIGRAD.points.filter(p=>p.class==='transition');
 checks.push(['Veligrad transition count',transitions.length===4]);
 checks.push(['Veligrad spawn point',!!VELIGRAD.spawnPointId]);
 const ports=accessPorts(VELIGRAD_NAVIGATION,'veligrad');
 checks.push(['Veligrad access ports',ports.length===4]);
 for(const a of ports)for(const b of ports){
  if(a.id===b.id)continue;
  if(!fastestPath(graph,a.node,b.node))problems.push({type:'NO_ROUTE',mapId:'veligrad',fromPortId:a.id,toPortId:b.id,fromNode:a.node,toNode:b.node});
 }
 checks.push(['Veligrad access ports mutually reachable',!problems.some(p=>p.type==='NO_ROUTE')]);
 const blockedEdges=[];
 for(const [a,b] of VELIGRAD_NAVIGATION.edges||[]){
  const pa=nodes.get(a),pb=nodes.get(b);
  if(!pa||!pb){blockedEdges.push({type:'BAD_EDGE',mapId:'veligrad',from:a,to:b});continue}
  if(!TerrainSystem.pathPassable(VELIGRAD_NAVIGATION.terrainZones,[pa,pb]))blockedEdges.push({type:'BLOCKED_EDGE',mapId:'veligrad',from:a,to:b});
 }
 problems.push(...blockedEdges);
 checks.push(['Veligrad authored streets pass terrain',blockedEdges.length===0]);
 const districts=VELIGRAD.points.filter(p=>p.class==='district');
 const weakDistricts=districts.filter(p=>accessPorts(VELIGRAD_NAVIGATION,p.id).length<3).map(p=>p.id);
 if(weakDistricts.length)problems.push({type:'INSUFFICIENT_DISTRICT_ACCESS',mapId:'veligrad',districtIds:weakDistricts});
 checks.push(['Veligrad districts have multiple access ports',weakDistricts.length===0]);
 return{ok:checks.every(([,ok])=>ok),checks,maps:{veligrad:{nodes:nodes.size,edges:VELIGRAD_NAVIGATION.edges?.length||0,ports:ports.length,districts:districts.length}},problems};
}
