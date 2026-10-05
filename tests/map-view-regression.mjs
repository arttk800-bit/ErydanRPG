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
assert.equal(legacy.meta.stateVersion,2);
assert.equal(legacy.ui.mapView.level,'location');
assert.equal(legacy.ui.mapView.locationId,'veligrad');
assert.equal(legacy.world.position.pointId,'veligrad');
console.log('map view regression: OK');
