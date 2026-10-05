// ============================================================================
// MAP DIAGNOSTICS REGRESSION
// Synthetic fixtures verify generic authored-map diagnostics independently.
// ============================================================================
import assert from 'node:assert/strict';
import {diagnoseMap,runMapDiagnostics} from '../game/diagnostics/map-diagnostics.js';

const content={points:[
 {id:'gate-a',class:'transition'},{id:'gate-b',class:'transition'},
 {id:'district-a',class:'district'}
]};
const navigation={metrics:{widthMeters:100,heightMeters:100},nodes:[
 {id:'a',x:.1,y:.5},{id:'m',x:.5,y:.5},{id:'b',x:.9,y:.5}
],edges:[['a','m'],['m','b']],access:{
 town:{ports:[{id:'town:a',node:'a',pointId:'gate-a'},{id:'town:b',node:'b',pointId:'gate-b'}]},
 'district-a':{ports:[{id:'d:a',node:'a'},{id:'d:m',node:'m'}]}
},terrainZones:[]};

const valid=diagnoseMap({id:'fixture:valid',kind:'location',ownerId:'town',content,navigation,expectations:{ownerPorts:2,districtPorts:2}});
assert.equal(valid.ok,true);
assert.equal(valid.problems.length,0);

const blocked={...navigation,terrainZones:[{id:'wall',type:'blocked',polygon:[{x:.45,y:.4},{x:.55,y:.4},{x:.55,y:.6},{x:.45,y:.6}]}]};
const invalid=diagnoseMap({id:'fixture:blocked',kind:'location',ownerId:'town',content,navigation:blocked,expectations:{ownerPorts:2,districtPorts:3}});
assert.equal(invalid.ok,false);
assert.ok(invalid.problems.some(problem=>problem.type==='BLOCKED_EDGE'));
assert.ok(invalid.problems.some(problem=>problem.type==='NO_ROUTE'));
assert.ok(invalid.problems.some(problem=>problem.type==='INSUFFICIENT_DISTRICT_ACCESS'));

const registered=runMapDiagnostics();
assert.ok(registered.maps['region:forest']);
assert.ok(registered.maps['location:veligrad']);
console.log('map diagnostics regression: OK');
