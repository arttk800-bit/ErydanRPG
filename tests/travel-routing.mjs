import assert from 'node:assert/strict';
import {RoadSystem} from '../game/systems/roads.js';
import {TerrainSystem} from '../game/map/terrain.js';
import {TravelSystem} from '../game/systems/travel/travel.js';
import {freeTravelPath} from '../game/systems/travel/route-planner.js';
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
const blockedRoute=RoadSystem.route(roads,points,'from','to','horse',blocked);assert.ok(blockedRoute);assert.deepEqual(blockedRoute.roadNodeIds,['a','y','z','b']);
const spans=TerrainSystem.segmentSpans(blocked,{x:.1,y:.5},{x:.9,y:.5});assert.ok(spans.some(s=>!s.passable));assert.equal(TerrainSystem.pathPassable(blocked,[{x:.1,y:.5},{x:.9,y:.5}]),false);
const speedRoads={regionId:'speed',metrics:{widthMeters:1000,heightMeters:1000},nodes:[{id:'s',x:0,y:.5},{id:'e',x:1,y:.5}],edges:[['s','e',[],{roadType:'road'}]],access:{from:{node:'s'},to:{node:'e'}}};
const speedPoints=[{id:'from',x:0,y:.5},{id:'to',x:1,y:.5}],forestHalf=[{id:'forest-half',type:'forest',polygon:[{x:.5,y:0},{x:1,y:0},{x:1,y:1},{x:.5,y:1}]}];
const state={world:{},clock:{day:1,minute:0},pause:{}};const trip=TravelSystem.start(state,{roads:speedRoads,points:speedPoints,fromId:'from',toId:'to',method:'walk',terrainZones:forestHalf});assert.ok(trip);assert.equal(trip.legs.length,2);assert.equal(trip.legs[0].terrain,'plain');assert.equal(trip.legs[1].terrain,'forest');TravelSystem.tick(state,5,speedRoads,1);const firstMove=trip.distanceDone;assert.ok(firstMove>400&&firstMove<430);TravelSystem.tick(state,2,speedRoads,1);const secondMove=trip.distanceDone-firstMove;assert.ok(secondMove<168,'forest leg must be slower than plain base speed');
const freeRoads={regionId:'free',metrics:{widthMeters:1000,heightMeters:1000},nodes:[{id:'r1',x:.2,y:.2},{id:'r2',x:.8,y:.2}],edges:[['r1','r2',[],{roadType:'highway'}]],access:{}};
const direct=freeTravelPath(freeRoads,{x:.1,y:.8},{x:.9,y:.8},'walk',[]);assert.ok(direct);assert.equal(direct.segments.every(s=>s.kind==='free'),true,'near target should not detour to road');
const roadFav=freeTravelPath(freeRoads,{x:.1,y:.25},{x:.9,y:.25},'horse',[]);assert.ok(roadFav);assert.ok(roadFav.segments.some(s=>s.kind==='road'),'fast nearby highway should be used');
const wall=[{id:'wall2',type:'blocked',polygon:[{x:.45,y:.35},{x:.55,y:.35},{x:.55,y:.65},{x:.45,y:.65}]}];const around=freeTravelPath({regionId:'wall',metrics:{widthMeters:1000,heightMeters:1000},nodes:[],edges:[],access:{}},{x:.2,y:.5},{x:.8,y:.5},'walk',wall);assert.ok(around);assert.ok(around.polyline.length>2,'free route should go around blocked polygon');
console.log('travel routing regression: OK');
