import {TravelConditions} from './travel-conditions.js';
const key=(a,b)=>a<b?a+'|'+b:b+'|'+a;
export function buildTravelGraph(roads,nodes,method='walk'){
 const graph=new Map();
 for(const edge of roads.edges||[]){
  const [a,b,via=[],meta={}]=edge,pa=nodes.get(a),pb=nodes.get(b);if(!pa||!pb)continue;
  const path=[pa,...via.map(([x,y])=>({x,y})),pb],roadType=meta.roadType||'road',terrain=meta.terrain||pa.terrain||pb.terrain||'plain';
  let distance=0;for(let i=1;i<path.length;i++){const m=roads.metrics||{widthMeters:1,heightMeters:1};distance+=Math.hypot((path[i].x-path[i-1].x)*m.widthMeters,(path[i].y-path[i-1].y)*m.heightMeters)}
  const cost=TravelConditions.traversalSeconds(roads,path,{roadType,terrain},method,roads.terrainZones);if(!Number.isFinite(cost))continue;
  for(const [from,to,reverse] of [[a,b,false],[b,a,true]]){if(!graph.has(from))graph.set(from,[]);graph.get(from).push({to,distance,cost,path:reverse?[...path].reverse():path,roadType,terrain,key:key(a,b)})}
 }
 return graph;
}
export function fastestPath(graph,from,to,excluded=new Set()){
 if(from===to)return{nodeIds:[from],segments:[],polyline:[],distance:0,cost:0};
 const best=new Map([[from,0]]),prev=new Map(),queue=[[0,from]];
 while(queue.length){queue.sort((a,b)=>a[0]-b[0]);const [cost,id]=queue.shift();if(cost!==best.get(id))continue;if(id===to)break;
  for(const e of graph.get(id)||[]){if(excluded.has(e.key))continue;const next=cost+e.cost;if(next<(best.get(e.to)??Infinity)){best.set(e.to,next);prev.set(e.to,{id,e});queue.push([next,e.to])}}
 }
 if(!best.has(to))return null;const segments=[],nodeIds=[to];let cur=to,distance=0;
 while(cur!==from){const p=prev.get(cur);segments.unshift({from:p.id,to:cur,distance:p.e.distance,cost:p.e.cost,path:p.e.path,terrain:p.e.terrain,roadType:p.e.roadType,edgeKey:p.e.key});distance+=p.e.distance;cur=p.id;nodeIds.unshift(cur)}
 const polyline=[];for(const s of segments)for(const p of s.path){const z=polyline.at(-1);if(!z||z.x!==p.x||z.y!==p.y)polyline.push({x:p.x,y:p.y})}
 return{nodeIds,segments,polyline,distance,cost:best.get(to)};
}
export function alternativePaths(graph,from,to,limit=3){
 const first=fastestPath(graph,from,to);if(!first)return[];const paths=[first],seen=new Set([first.nodeIds.join('>')]);
 for(const s of first.segments){const alt=fastestPath(graph,from,to,new Set([s.edgeKey]));if(alt&&!seen.has(alt.nodeIds.join('>'))){seen.add(alt.nodeIds.join('>'));paths.push(alt)}}
 return paths.sort((a,b)=>a.cost-b.cost).slice(0,Math.max(1,limit));
}
