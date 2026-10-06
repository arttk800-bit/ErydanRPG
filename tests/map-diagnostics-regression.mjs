// ============================================================================
// MAP DIAGNOSTICS REGRESSION
// Synthetic fixtures verify the single-access map contract.
// ============================================================================
import assert from 'node:assert/strict';
import {diagnoseMap,runMapDiagnostics} from '../game/diagnostics/map-diagnostics.js';

const content={points:[{id:'gate',class:'transition'},{id:'district-a',class:'district'}]};
const navigation={metrics:{widthMeters:100,heightMeters:100},nodes:[{id:'a',x:.1,y:.5},{id:'m',x:.5,y:.5},{id:'b',x:.9,y:.5}],edges:[['a','m'],['m','b']],access:{town:{node:'a',pointId:'gate'},'district-a':{node:'m'}},terrainZones:[]};
const valid=diagnoseMap({id:'fixture:valid',kind:'location',ownerId:'town',content,navigation});assert.equal(valid.ok,true);assert.equal(valid.problems.length,0);
const blocked={...navigation,terrainZones:[{id:'wall',type:'blocked',polygon:[{x:.45,y:.4},{x:.55,y:.4},{x:.55,y:.6},{x:.45,y:.6}]}]};
const invalid=diagnoseMap({id:'fixture:blocked',kind:'location',ownerId:'town',content,navigation:blocked});assert.equal(invalid.ok,false);assert.ok(invalid.problems.some(problem=>problem.type==='BLOCKED_EDGE'));
const badAccess=diagnoseMap({id:'fixture:bad-access',kind:'location',ownerId:'town',content,navigation:{...navigation,access:{town:{node:'missing',pointId:'gate'}}}});assert.equal(badAccess.ok,false);assert.ok(badAccess.problems.some(problem=>problem.type==='BAD_ACCESS_NODE'));
const registered=runMapDiagnostics();assert.ok(registered.maps['region:forest']);assert.ok(registered.maps['location:veligrad']);
console.log('map diagnostics regression: OK');
