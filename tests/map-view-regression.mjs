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

import {VELIGRAD} from '../game/data/locations/veligrad.js';
const gates=VELIGRAD.points.filter(p=>p.class==='gate');
assert.equal(gates.length,4);
assert.ok(VELIGRAD.spawnPointId);
assert.equal(VELIGRAD.points.some(p=>p.class==='transition'),false);

import {accessPorts} from '../game/map/access-points.js';
import {CENTRAL_LANDS_ROADS} from '../game/data/regions/central-lands-roads.js';
import {VELIGRAD_NAVIGATION} from '../game/data/locations/veligrad-navigation.js';
assert.deepEqual(accessPorts(CENTRAL_LANDS_ROADS,'veligrad').map(p=>p.id),['veligrad:west','veligrad:northwest','veligrad:east','veligrad:south']);
assert.equal(accessPorts(VELIGRAD_NAVIGATION,'veligrad').length,4);
assert.equal(accessPorts(VELIGRAD_NAVIGATION,'veligrad-district-center').length,4);
assert.ok(VELIGRAD_NAVIGATION.terrainZones.some(z=>z.type==='water'));
assert.ok(VELIGRAD_NAVIGATION.terrainZones.some(z=>z.type==='blocked'));
