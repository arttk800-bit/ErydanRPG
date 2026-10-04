import assert from 'node:assert/strict';
import {RoadSystem} from '../game/systems/roads.js';
import {TerrainSystem} from '../game/map/terrain.js';
const roads={regionId:'test',metrics:{widthMeters:10000,heightMeters:10000},nodes:[
 {id:'a',x:.1,y:.5},{id:'x',x:.5,y:.5},{id:'b',x:.9,y:.5},{id:'y',x:.3,y:.2},{id:'z',x:.7,y:.2}
],edges:[
 ['a','x',[],{roadType:'rough',terrain:'swamp'}],['x','b',[],{roadType:'rough',terrain:'swamp'}],
 ['a','y',[],{roadType:'highway',terrain:'plain'}],['y','z',[],{roadType:'highway',terrain:'plain'}],['z','b',[],{roadType:'highway',terrain:'plain'}]
],access:{from:{node:'a'},to:{node:'b'}}};
const points=[{id:'from',x:.1,y:.5},{id:'to',x:.9,y:.5}];
const horse=RoadSystem.route(roads,points,'from','to','horse');assert.ok(horse);assert.deepEqual(horse.roadNodeIds,['a','y','z','b']);assert.ok(horse.distance>8000);
const alternatives=RoadSystem.routes(roads,points,'from','to','horse',3);assert.ok(alternatives.length>=2);assert.ok(alternatives[0].cost<=alternatives[1].cost);
const blocked=[{id:'wall',type:'blocked',polygon:[{x:.45,y:.4},{x:.55,y:.4},{x:.55,y:.6},{x:.45,y:.6}]}];
const spans=TerrainSystem.segmentSpans(blocked,{x:.1,y:.5},{x:.9,y:.5});assert.ok(spans.some(s=>!s.passable));assert.equal(TerrainSystem.pathPassable(blocked,[{x:.1,y:.5},{x:.9,y:.5}]),false);
console.log('travel routing regression: OK');
