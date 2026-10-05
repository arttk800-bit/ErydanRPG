import {CENTRAL_LANDS} from '../data/regions/central-lands.js';
import {CENTRAL_LANDS_ROADS} from '../data/regions/central-lands-roads.js';
import {RoadSystem} from '../systems/travel/roads.js';
import {TravelSystem} from '../systems/travel/travel.js';
import {PauseSystem} from '../systems/pause.js';\nimport {accessPorts} from '../map/access-points.js';\nimport {mapMetrics} from '../data/map-metrics.js';
const NO_ROAD_REQUIRED=new Set(['lake-island']);
function state(){return{clock:{day:1,minute:480},world:{position:{regionId:'forest',pointId:'veligrad'}},history:[]}}
export function runTravelDiagnostics(){
 const points=CENTRAL_LANDS.points,ids=new Set(points.map(p=>p.id)),roadIds=new Set((CENTRAL_LANDS_ROADS.nodes||[]).map(n=>n.id)),checks=[],failures=[];
 const edgeDegree=new Map([...roadIds].map(id=>[id,0]));
 for(const e of CENTRAL_LANDS_ROADS.edges||[]){if(edgeDegree.has(e[0]))edgeDegree.set(e[0],edgeDegree.get(e[0])+1);if(edgeDegree.has(e[1]))edgeDegree.set(e[1],edgeDegree.get(e[1])+1)}
 const badEdges=(CENTRAL_LANDS_ROADS.edges||[]).filter(e=>!roadIds.has(e[0])||!roadIds.has(e[1]));
 const badAccess=Object.entries(CENTRAL_LANDS_ROADS.access||{}).filter(([poi])=>!ids.has(poi)||accessPorts(CENTRAL_LANDS_ROADS,poi).some(port=>!roadIds.has(port.node)));
 const missingAccess=points.filter(p=>!CENTRAL_LANDS_ROADS.access?.[p.id]&&!NO_ROAD_REQUIRED.has(p.id)).map(p=>p.id);
 const isolated=[...edgeDegree].filter(([,n])=>n===0).map(([id])=>id);
 const bridges=[...roadIds].filter(id=>id.startsWith('bridge-')),badBridges=bridges.filter(id=>(edgeDegree.get(id)||0)<2);
 let routeCount=0,routeFailures=0;const expected=points.filter(p=>CENTRAL_LANDS_ROADS.access?.[p.id]);
 for(const a of expected)for(const b of expected){if(a.id===b.id)continue;const r=RoadSystem.route(CENTRAL_LANDS_ROADS,points,a.id,b.id);if(!r){routeFailures++;failures.push('NO_ROUTE '+a.id+'→'+b.id);continue}routeCount++;if(!r.polyline?.length||r.nodeIds[0]!==a.id||r.nodeIds.at(-1)!==b.id){routeFailures++;failures.push('BAD_ROUTE '+a.id+'→'+b.id)}}
 checks.push(['Road edge endpoints valid',badEdges.length===0]);
 checks.push(['POI road access references valid',badAccess.length===0]);
 checks.push(['All required POI have road access',missingAccess.length===0]);
 checks.push(['No isolated road nodes',isolated.length===0]);
 checks.push(['Bridge nodes connected on both sides',badBridges.length===0]);
 checks.push(['All road-connected POI mutually reachable',routeFailures===0]);
 const diagnosticRoads={...CENTRAL_LANDS_ROADS,metrics:{...mapMetrics('region','forest')}};\n const s=state(),t=TravelSystem.start(s,{roads:diagnosticRoads,points,fromId:'veligrad',toId:'stone-guard',method:'walk'});
 checks.push(['Travel start',!!t&&t.status==='travelling']);
 if(t){
  const before=t.progress;TravelSystem.tick(s,1,diagnosticRoads,1);checks.push(['Travel advances',t.progress>before]);
  PauseSystem.set(s,'manual',true);const paused=t.progress;TravelSystem.tick(s,1,diagnosticRoads,.05);checks.push(['Pause freezes travel',t.progress===paused]);PauseSystem.set(s,'manual',false);
  TravelSystem.stop(s,{roads:diagnosticRoads,points});checks.push(['Stop action',t.status==='stopped']);TravelSystem.resume(s,{roads:diagnosticRoads,points});checks.push(['Resume action',t.status==='travelling']);
  TravelSystem.camp(s,{roads:diagnosticRoads,points});checks.push(['Camp action',t.status==='camp'&&!!s.world.camp]);TravelSystem.resume(s,{roads:diagnosticRoads,points});
  TravelSystem.tick(s,1,.05);const pos={...t.position};TravelSystem.cancel(s,{roads:diagnosticRoads,points});checks.push(['Cancel preserves exact position',!s.world.position.pointId&&Math.hypot(s.world.position.position.x-pos.x,s.world.position.position.y-pos.y)<1e-9]);
  const restarted=TravelSystem.start(s,{roads:diagnosticRoads,points,fromId:null,fromPosition:s.world.position.position,toId:'ozernoe',method:'walk'});
  checks.push(['Restart from exact road position',!!restarted&&Math.hypot(restarted.position.x-pos.x,restarted.position.y-pos.y)<1e-9]);
  checks.push(['Restart enters road before destination',!!restarted?.route?.roadEntry&&restarted.route.polyline.length>3]);
 }else{
  for(const n of ['Travel advances','Pause freezes travel','Stop action','Resume action','Camp action','Cancel preserves exact position','Restart from exact road position','Restart enters road before destination'])checks.push([n,false]);
 }
 return{ok:checks.every(([,ok])=>ok),checks,stats:{poi:points.length,roadRequired:expected.length,noRoadRequired:[...NO_ROAD_REQUIRED],roadNodes:roadIds.size,edges:CENTRAL_LANDS_ROADS.edges.length,bridges:bridges.length,reachableDirectedRoutes:routeCount,routeFailures},problems:{badEdges,badAccess,missingAccess,isolated,badBridges},failures:failures.slice(0,50)};
}
