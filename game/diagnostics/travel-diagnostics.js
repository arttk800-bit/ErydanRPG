import {CENTRAL_LANDS} from '../data/regions/central-lands.js';
import {CENTRAL_LANDS_ROADS} from '../data/regions/central-lands-roads.js';
import {RoadSystem} from '../systems/roads.js';
import {TravelSystem} from '../systems/travel.js';
import {PauseSystem} from '../systems/pause.js';
function state(){return{clock:{day:1,minute:480},world:{position:{regionId:'forest',pointId:'veligrad'}},history:[]}}
export function runTravelDiagnostics(){
 const points=CENTRAL_LANDS.points,ids=new Set(points.map(p=>p.id)),checks=[],routes=[];let routeCount=0,failures=0;
 for(const a of points)for(const b of points){if(a.id===b.id)continue;const r=RoadSystem.route(CENTRAL_LANDS_ROADS,points,a.id,b.id);if(r){routeCount++;if(!r.polyline.length||r.nodeIds[0]!==a.id||r.nodeIds.at(-1)!==b.id){failures++;routes.push(a.id+'→'+b.id)}}}
 const roadIds=new Set((CENTRAL_LANDS_ROADS.nodes||[]).map(n=>n.id));checks.push(['Road endpoints exist',CENTRAL_LANDS_ROADS.edges.every(e=>roadIds.has(e[0])&&roadIds.has(e[1]))]);checks.push(['POI road access valid',Object.entries(CENTRAL_LANDS_ROADS.access||{}).every(([poi,a])=>ids.has(poi)&&roadIds.has(a.node))]);
 checks.push(['Route sweep has connected pairs',routeCount>0]);
 checks.push(['Route sweep integrity',failures===0]);
 const s=state(),t=TravelSystem.start(s,{roads:CENTRAL_LANDS_ROADS,points,fromId:'veligrad',toId:'stone-guard',method:'walk'});
 checks.push(['Travel start',!!t&&t.status==='travelling']);
 const before=t?.progress||0;TravelSystem.tick(s,1,.05);checks.push(['Travel advances',t.progress>before]);
 PauseSystem.set(s,'manual',true);const paused=t.progress;TravelSystem.tick(s,1,.05);checks.push(['Pause freezes travel',t.progress===paused]);PauseSystem.set(s,'manual',false);
 TravelSystem.stop(s);checks.push(['Stop button state',t.status==='stopped']);TravelSystem.resume(s);checks.push(['Resume button state',t.status==='travelling']);TravelSystem.camp(s);checks.push(['Camp button state',t.status==='camp'&&!!s.world.camp]);TravelSystem.resume(s);
 TravelSystem.tick(s,1,.05);const pos={...t.position};TravelSystem.cancel(s);checks.push(['Cancel preserves position',!s.world.position.pointId&&Math.hypot(s.world.position.position.x-pos.x,s.world.position.position.y-pos.y)<1e-9]);
 const restarted=TravelSystem.start(s,{roads:CENTRAL_LANDS_ROADS,points,fromId:null,fromPosition:s.world.position.position,toId:'ozernoe',method:'walk'});checks.push(['Restart from road position',!!restarted&&Math.hypot(restarted.position.x-pos.x,restarted.position.y-pos.y)<1e-9]);checks.push(['Restart enters road before destination',!!restarted?.route?.roadEntry&&restarted.route.polyline.length>3]);
 return{ok:checks.every(([,ok])=>ok),checks,stats:{poi:points.length,roadNodes:CENTRAL_LANDS_ROADS.nodes?.length||0,edges:CENTRAL_LANDS_ROADS.edges.length,reachableDirectedRoutes:routeCount,routeIntegrityFailures:failures},failures:routes.slice(0,20)};
}
