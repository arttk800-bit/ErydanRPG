import {TravelConditions} from './conditions.js';
import {TerrainSystem} from '../../map/terrain.js';
const key=(a,b)=>a<b?a+'|'+b:b+'|'+a;
function distance(roads,a,b){const m=roads.metrics||{widthMeters:1,heightMeters:1};return Math.hypot((b.x-a.x)*m.widthMeters,(b.y-a.y)*m.heightMeters)}
function add(graph,from,to,e){if(!graph.has(from))graph.set(from,[]);graph.get(from).push({...e,to})}
export function buildTravelGraph(roads,nodes,method='walk',terrainZones=[]){
 const graph=new Map();
 for(const edge of roads.edges||[]){const [a,b,via=[],meta={}]=edge,pa=nodes.get(a),pb=nodes.get(b);if(!pa||!pb)continue;const path=[pa,...via.map(([x,y])=>({x,y})),pb],roadType=meta.roadType||'road',terrain=meta.terrain||'plain';let d=0;for(let i=1;i<path.length;i++)d+=distance(roads,path[i-1],path[i]);const cost=TravelConditions.traversalCost(roads,path,{roadType,terrain},method,terrainZones);if(!Number.isFinite(cost))continue;add(graph,a,b,{distance:d,cost,path,roadType,terrain,key:key(a,b),kind:'road'});add(graph,b,a,{distance:d,cost,path:[...path].reverse(),roadType,terrain,key:key(a,b),kind:'road'})}
 return graph
}
export function buildFreeTravelGraph(roads,start,end,method='walk',terrainZones=[]){
 const nodes=new Map((roads.nodes||[]).map(n=>[n.id,n]));nodes.set('@start',{...start,id:'@start'});nodes.set('@end',{...end,id:'@end'});
 for(const z of terrainZones||[])for(let i=0;i<(z.polygon?.length||0);i++){const p=z.polygon[i],id='@zone:'+z.id+':'+i;nodes.set(id,{...p,id})}
 const graph=buildTravelGraph(roads,nodes,method,terrainZones),entries=[...nodes.entries()];
 for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){const [aId,a]=entries[i],[bId,b]=entries[j];if(aId[0]!=='@'&&bId[0]!=='@')continue;if(!TerrainSystem.pathPassable(terrainZones,[a,b]))continue;const d=distance(roads,a,b),cost=TravelConditions.traversalCost(roads,[a,b],{roadType:'rough',terrain:'plain'},method,terrainZones);if(!Number.isFinite(cost))continue;const e={distance:d,cost,path:[a,b],roadType:'rough',terrain:'plain',key:'free:'+key(aId,bId),kind:'free'};add(graph,aId,bId,e);add(graph,bId,aId,{...e,path:[b,a]})}
 return{graph,nodes}
}
export function fastestPath(graph,from,to,excluded=new Set()){if(from===to)return{nodeIds:[from],segments:[],polyline:[],distance:0,cost:0};const best=new Map([[from,0]]),prev=new Map(),queue=[[0,from]];while(queue.length){queue.sort((a,b)=>a[0]-b[0]);const [cost,id]=queue.shift();if(cost!==best.get(id))continue;if(id===to)break;for(const e of graph.get(id)||[]){if(excluded.has(e.key))continue;const next=cost+e.cost;if(next<(best.get(e.to)??Infinity)){best.set(e.to,next);prev.set(e.to,{id,e});queue.push([next,e.to])}}}if(!best.has(to))return null;const segments=[],nodeIds=[to];let cur=to,d=0;while(cur!==from){const p=prev.get(cur);segments.unshift({from:p.id,to:cur,distance:p.e.distance,cost:p.e.cost,path:p.e.path,terrain:p.e.terrain,roadType:p.e.roadType,edgeKey:p.e.key,kind:p.e.kind});d+=p.e.distance;cur=p.id;nodeIds.unshift(cur)}const polyline=[];for(const s of segments)for(const p of s.path){const z=polyline.at(-1);if(!z||z.x!==p.x||z.y!==p.y)polyline.push({x:p.x,y:p.y})}return{nodeIds,segments,polyline,distance:d,cost:best.get(to)}}
export function freeTravelPath(roads,start,end,method='walk',terrainZones=[]){const {graph}=buildFreeTravelGraph(roads,start,end,method,terrainZones);return fastestPath(graph,'@start','@end')}
export function alternativePaths(graph,from,to,limit=3){const first=fastestPath(graph,from,to);if(!first)return[];const paths=[first],seen=new Set([first.nodeIds.join('>')]);for(const s of first.segments){const alt=fastestPath(graph,from,to,new Set([s.edgeKey]));if(alt&&!seen.has(alt.nodeIds.join('>'))){seen.add(alt.nodeIds.join('>'));paths.push(alt)}}return paths.sort((a,b)=>a.cost-b.cost).slice(0,Math.max(1,limit))}
