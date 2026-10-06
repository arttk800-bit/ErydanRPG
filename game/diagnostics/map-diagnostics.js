// ============================================================================
// MAP DIAGNOSTICS
// Validates registered maps against the single-access navigation contract.
// ============================================================================
import {registeredMaps} from '../data/map-registry.js';
import {accessNodeId} from '../map/access-points.js';
import {TerrainSystem} from '../map/terrain.js';

export function diagnoseMap(target){
 const {id,content={},navigation={}}=target,checks=[],problems=[],nodes=new Map(),duplicates=[];
 for(const node of navigation.nodes||[]){if(nodes.has(node.id))duplicates.push(node.id);else nodes.set(node.id,node)}
 checks.push(['Unique navigation nodes',duplicates.length===0]);if(duplicates.length)problems.push({type:'DUPLICATE_NODE',mapId:id,nodeIds:duplicates});
 const badEdges=[],blockedEdges=[];for(const edge of navigation.edges||[]){const [a,b,via=[]]=edge,pa=nodes.get(a),pb=nodes.get(b);if(!pa||!pb){badEdges.push({type:'BAD_EDGE',mapId:id,from:a,to:b});continue}const path=[pa,...via.map(([x,y])=>({x,y})),pb];if(!TerrainSystem.pathPassable(navigation.terrainZones||[],path))blockedEdges.push({type:'BLOCKED_EDGE',mapId:id,from:a,to:b})}
 problems.push(...badEdges,...blockedEdges);checks.push(['Authored edges reference nodes',badEdges.length===0]);checks.push(['Authored edges pass terrain',blockedEdges.length===0]);
 const badAccess=[];for(const ownerId of Object.keys(navigation.access||{})){const node=accessNodeId(navigation,ownerId);if(!node||!nodes.has(node))badAccess.push({type:'BAD_ACCESS_NODE',mapId:id,ownerId,node})}
 problems.push(...badAccess);checks.push(['Access points reference one valid node',badAccess.length===0]);
 const transitions=(content.points||[]).filter(p=>p.class==='transition'||p.type==='transition'),selected=navigation.access?.[target.ownerId]?.pointId||null;
 if(target.kind==='location'){const ok=transitions.length>=1;checks.push(['Location has transition',ok]);if(!ok)problems.push({type:'MISSING_TRANSITION',mapId:id});if(selected){const valid=transitions.some(p=>p.id===selected);checks.push(['Selected transition exists',valid]);if(!valid)problems.push({type:'BAD_TRANSITION',mapId:id,pointId:selected})}}
 return{ok:checks.every(([,ok])=>ok),checks,summary:{kind:target.kind||null,nodes:nodes.size,edges:navigation.edges?.length||0,access:Object.keys(navigation.access||{}).length,transitions:transitions.length},problems}
}
export function runMapDiagnostics(){const maps={},checks=[],problems=[];for(const target of registeredMaps()){const result=diagnoseMap(target);maps[target.id]=result.summary;for(const [label,ok] of result.checks)checks.push([target.id+' · '+label,ok]);problems.push(...result.problems)}return{ok:checks.every(([,ok])=>ok),checks,maps,problems}}
