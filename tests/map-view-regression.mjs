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

import {TerrainSystem} from '../game/map/terrain.js';
import {buildTravelGraph,fastestPath} from '../game/systems/travel/route-planner.js';
const vgNodes=new Map(VELIGRAD_NAVIGATION.nodes.map(n=>[n.id,n]));
const vgGraph=buildTravelGraph(VELIGRAD_NAVIGATION,vgNodes,'walk',VELIGRAD_NAVIGATION.terrainZones);
for(const from of ['vg-gate-w','vg-gate-nw','vg-gate-e','vg-gate-s'])for(const to of ['vg-gate-w','vg-gate-nw','vg-gate-e','vg-gate-s'])assert.ok(fastestPath(vgGraph,from,to),from+' must reach '+to);
for(const [a,b] of VELIGRAD_NAVIGATION.edges){const pa=vgNodes.get(a),pb=vgNodes.get(b);assert.ok(pa&&pb);assert.equal(TerrainSystem.pathPassable(VELIGRAD_NAVIGATION.terrainZones,[pa,pb]),true,'street crosses blocked terrain: '+a+' -> '+b)}
for(const id of ['veligrad-district-west','veligrad-district-northwest','veligrad-district-north','veligrad-district-northeast','veligrad-district-center','veligrad-district-east','veligrad-district-southwest','veligrad-district-southeast'])assert.ok(accessPorts(VELIGRAD_NAVIGATION,id).length>=3,id+' needs multiple access ports');

import {LocationTravelSystem} from '../game/systems/travel/location-travel.js';
import {LocationBoundarySystem} from '../game/systems/travel/location-boundary.js';
const cityState={clock:{day:1,minute:480},world:{current:{regionId:'forest',locationId:'veligrad'},position:{regionId:'forest',locationId:'veligrad',locationPointId:null,position:{x:.5,y:.459}},travel:{status:'idle'}}};
const localTrip=LocationTravelSystem.start(cityState,{locationId:'veligrad',navigation:VELIGRAD_NAVIGATION,points:{items:VELIGRAD.points,location:VELIGRAD},targetId:'veligrad-district-east',method:'walk'});
assert.ok(localTrip);
assert.equal(localTrip.scope,'location');
assert.ok(localTrip.targetPortId?.startsWith('east:'));
assert.equal(LocationBoundarySystem.canExit(cityState,VELIGRAD_NAVIGATION,'veligrad'),false);
cityState.world.position={regionId:'forest',locationId:'veligrad',locationPointId:'veligrad-gate-west',position:{x:.0413,y:.6691}};
assert.equal(LocationBoundarySystem.canExit(cityState,VELIGRAD_NAVIGATION,'veligrad'),true);
assert.equal(LocationBoundarySystem.exitPort(cityState,VELIGRAD_NAVIGATION,'veligrad').id,'veligrad:west');
