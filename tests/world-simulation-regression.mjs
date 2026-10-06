import assert from 'node:assert/strict';
import {createGameState} from '../game/core/state.js';
import {migrateGameState} from '../game/core/persistence.js';
import {SimulationSystem} from '../game/systems/simulation.js';
import {PauseSystem} from '../game/systems/pause.js';
import {LocationEntrySystem} from '../game/systems/travel/entry.js';
import {TravelSystem} from '../game/systems/travel/travel.js';

const legacy={meta:{stateVersion:3},clock:{day:1,minute:480},runtime:{pause:{reasons:{manual:true}}},world:{},simulation:{runtime:{mode:'world'}},session:{hostPlayerId:'p',players:{p:{}},party:{members:[]}},entities:{characters:{},items:{},containers:{}},rng:{world:{},combat:{},loot:{},simulation:{}}};
migrateGameState(legacy);
assert.equal(legacy.meta.stateVersion,4);
assert.equal(legacy.clock.second,28800);
assert.equal(PauseSystem.isPaused(legacy),false,'runtime pause must not survive save load');

const state=createGameState({seed:1}),before=state.clock.second;
SimulationSystem.tick(state,1,{active:true});
assert.ok(Math.abs(state.clock.second-before-1)<1e-9,'normal game time must advance 1:1 with real seconds');
PauseSystem.set(state,'manual',true);const paused=state.clock.second;SimulationSystem.tick(state,60,{active:true});assert.equal(state.clock.second,paused);
PauseSystem.set(state,'manual',false);
SimulationSystem.setMode(state,'travel');SimulationSystem.setFastForward(state,true);const fastBefore=state.clock.second;SimulationSystem.tick(state,1,{active:true});assert.equal(state.clock.second-fastBefore,16);
SimulationSystem.setMode(state,'world');assert.equal(SimulationSystem.ensure(state).fastForward,false,'leaving travel cancels fast-forward');
SimulationSystem.startSleep(state,{hours:1});SimulationSystem.setFastForward(state,true);const sleepBefore=state.clock.second;SimulationSystem.tick(state,1,{active:true});assert.equal(state.clock.second-sleepBefore,16);

const location={id:'town'},nav={nodes:[{id:'gate-node',x:.5,y:.5}],edges:[],access:{town:{node:'gate-node',pointId:'gate'}}},points=[{id:'gate',class:'transition',x:.5,y:.5}];
const entryState=createGameState({seed:2});entryState.world.current={regionId:'r',locationId:null,districtId:null,placeId:null};entryState.world.position={regionId:'r',pointId:'town'};
const spawn=LocationEntrySystem.enter(entryState,{location,navigation:nav,points});assert.equal(spawn.pointId,'gate');assert.equal(entryState.world.position.locationId,'town');

const roads={regionId:'r',metrics:{widthMeters:1000,heightMeters:1000},nodes:[{id:'a',x:0,y:.5},{id:'town-node',x:.8,y:.5},{id:'branch',x:.8,y:.8}],edges:[['a','town-node'],['town-node','branch']],access:{town:{node:'town-node'}}};
const travelState=createGameState({seed:3});const trip=TravelSystem.start(travelState,{roads,points:[{id:'start',x:0,y:.5},{id:'town',x:.9,y:.5}],fromId:'start',toId:'town'});assert.ok(trip);TravelSystem.tick(travelState,1000,roads,16);assert.equal(trip.status,'arrived');const arrived=TravelSystem.arrive(travelState);assert.equal(arrived.pointId,'town');assert.equal('entryPortId' in arrived,false);
console.log('world simulation regression: OK');
