import assert from 'node:assert/strict';
import {MapViewSystem} from '../game/map/view-state.js';
import {migrateGameState} from '../game/core/persistence.js';

const state={meta:{stateVersion:2},world:{current:{regionId:'forest',locationId:'veligrad',districtId:null,placeId:'veligrad-market'},position:{regionId:'forest',pointId:'veligrad'}}};
const before=structuredClone(state.world);
MapViewSystem.world(state);
MapViewSystem.region(state,'south');
assert.deepEqual(state.world,before,'map browsing must never mutate physical world state');
assert.equal(state.ui.mapView.level,'region');
assert.equal(state.ui.mapView.regionId,'south');
MapViewSystem.location(state,'forest','veligrad');
assert.equal(state.ui.mapView.locationId,'veligrad');
assert.deepEqual(state.world,before);

const legacy={meta:{stateVersion:1},world:{current:{regionId:'forest',locationId:'veligrad'},position:{regionId:'forest',pointId:'veligrad'}}};
migrateGameState(legacy);
assert.equal(legacy.meta.stateVersion,4);
assert.equal(legacy.ui.mapView.level,'location');
assert.equal(legacy.ui.mapView.locationId,'veligrad');
assert.equal(legacy.world.position.pointId,'veligrad');
console.log('map view regression: OK');

import {VELIGRAD} from '../game/data/locations/veligrad.js';
const transitions=VELIGRAD.points.filter(p=>p.class==='transition');
assert.equal(transitions.length,1);

import {accessPorts} from '../game/map/access-points.js';
import {CENTRAL_LANDS_ROADS} from '../game/data/regions/central-lands-roads.js';
import {VELIGRAD_NAVIGATION} from '../game/data/locations/veligrad-navigation.js';
assert.equal(accessPorts(CENTRAL_LANDS_ROADS,'veligrad').length,1);
assert.equal(accessPorts(VELIGRAD_NAVIGATION,'veligrad').length,1);
assert.equal(accessPorts(VELIGRAD_NAVIGATION,'veligrad-district-center').length,4,'districts may retain multiple internal approaches');

import {LocationTravelSystem} from '../game/systems/travel/location-travel.js';
import {LocationBoundarySystem} from '../game/systems/travel/location-boundary.js';
const cityState={clock:{day:1,minute:480},world:{current:{regionId:'forest',locationId:'veligrad'},position:{regionId:'forest',locationId:'veligrad',locationPointId:null,position:{x:.5,y:.459}},travel:{status:'idle'}}};
const localTrip=LocationTravelSystem.start(cityState,{locationId:'veligrad',navigation:VELIGRAD_NAVIGATION,points:{items:VELIGRAD.points,location:VELIGRAD},targetId:'veligrad-district-east',method:'walk'});
assert.ok(localTrip);assert.equal(localTrip.scope,'location');
assert.equal(LocationBoundarySystem.canExit(cityState,VELIGRAD_NAVIGATION,VELIGRAD.points,'veligrad'),false);
cityState.world.position={regionId:'forest',locationId:'veligrad',locationPointId:'veligrad-gate-west',position:{x:.0413,y:.6691}};
assert.equal(LocationBoundarySystem.canExit(cityState,VELIGRAD_NAVIGATION,VELIGRAD.points,'veligrad'),true);

import {JourneySystem} from '../game/systems/travel/journey.js';
const journeyState={clock:{day:1,minute:480},world:{current:{regionId:'forest',locationId:'veligrad',districtId:'veligrad-district-center',placeId:null},position:{regionId:'forest',locationId:'veligrad',locationPointId:'veligrad-district-center',position:{x:.5,y:.459}},travel:{status:'idle'}}};
const regionalPoints=(await import('../game/data/regions/central-lands.js')).CENTRAL_LANDS.points;
const journey=JourneySystem.startExit(journeyState,{location:VELIGRAD,locationNavigation:VELIGRAD_NAVIGATION,locationPoints:VELIGRAD.points,regionalRoads:CENTRAL_LANDS_ROADS,regionalPoints,targetId:'zarechye',method:'walk',terrainZones:[]});
assert.ok(journey);assert.equal(journey.status,'to-gate');assert.equal(journey.gatePointId,'veligrad-gate-west');
journeyState.world.position={regionId:'forest',locationId:'veligrad',locationPointId:journey.gatePointId,position:{x:.0413,y:.6691}};
const continuation=JourneySystem.continueFromGate(journeyState,{regionalRoads:CENTRAL_LANDS_ROADS,regionalPoints});
assert.ok(continuation);assert.equal(journeyState.world.current.locationId,null);assert.equal(journeyState.world.journey.status,'region');assert.deepEqual(journeyState.world.position.position,continuation.fromPosition);
