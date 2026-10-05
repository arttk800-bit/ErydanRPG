import assert from 'node:assert/strict';
import {createGameState} from '../game/core/state.js';
import {migrateGameState} from '../game/core/persistence.js';
import {SimulationSystem} from '../game/systems/simulation.js';
import {PauseSystem} from '../game/systems/pause.js';
import {LocationEntrySystem} from '../game/systems/travel/entry.js';
import {TravelSystem} from '../game/systems/travel/travel.js';

const legacy={meta:{stateVersion:2},clock:{day:1,minute:480},world:{},session:{hostPlayerId:'p',players:{p:{}},party:{members:[]}},entities:{characters:{},items:{},containers:{}},rng:{world:{},combat:{},loot:{},simulation:{}}};
migrateGameState(legacy);
assert.equal(legacy.meta.stateVersion,3);
assert.equal(legacy.simulation.runtime.mode,'world');

const state=createGameState({seed:1});
const before=state.clock.minute;
SimulationSystem.tick(state,1,{active:true});
assert.ok(state.clock.minute>=before);
PauseSystem.set(state,'manual',true);
const paused=state.clock.minute;
SimulationSystem.tick(state,60,{active:true});
assert.equal(state.clock.minute,paused,'paused simulation must not advance');
PauseSystem.set(state,'manual',false);
SimulationSystem.startSleep(state,{hours:1});
const sleepBefore=state.clock.minute;
SimulationSystem.tick(state,1,{active:true});
assert.ok(state.clock.minute>sleepBefore,'sleep must advance progressively');
assert.ok(SimulationSystem.ensure(state).sleep,'sleep must not finish instantly');
SimulationSystem.tick(state,10,{active:true});
assert.equal(SimulationSystem.ensure(state).sleep,null,'sleep stops after simulated duration');

const location={id:'town'};
const nav={nodes:[{id:'west',x:.1,y:.5},{id:'east',x:.9,y:.5}],edges:[['west','east']],access:{town:{ports:[{id:'town:west',node:'west',pointId:'gate-west'},{id:'town:east',node:'east',pointId:'gate-east'}]}}};
const points=[{id:'gate-west',class:'transition',x:.1,y:.5},{id:'gate-east',class:'transition',x:.9,y:.5}];
const entryState=createGameState({seed:2});entryState.world.current={regionId:'r',locationId:null,districtId:null,placeId:null};entryState.world.position={regionId:'r',pointId:'town',entryPortId:'town:east'};
const spawn=LocationEntrySystem.enter(entryState,{location,navigation:nav,points,entryPortId:'town:east'});
assert.equal(spawn.pointId,'gate-east');
assert.equal(entryState.world.position.locationId,'town');

const fallback=LocationEntrySystem.resolve({location:{id:'empty'},navigation:{nodes:[],edges:[],access:{}},points:[]});
assert.equal(fallback.temporary,true);
assert.deepEqual(fallback.position,{x:.5,y:.5});

const roads={regionId:'r',metrics:{widthMeters:1000,heightMeters:1000},nodes:[{id:'a',x:0,y:.5},{id:'w',x:.8,y:.5},{id:'e',x:1,y:.5}],edges:[['a','w'],['w','e']],access:{town:{ports:[{id:'town:west',node:'w'},{id:'town:east',node:'e'}]}}};
const travelState=createGameState({seed:3});
const trip=TravelSystem.start(travelState,{roads,points:[{id:'start',x:0,y:.5},{id:'town',x:.9,y:.5}],fromId:'start',toId:'town'});
assert.ok(trip);
assert.equal(trip.toPortId,'town:west','travel must preserve chosen physical destination port');
console.log('world simulation regression: OK');
