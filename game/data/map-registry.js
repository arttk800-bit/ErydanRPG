// ============================================================================
// MAP REGISTRY
// Declares authored map-bearing domains and their canonical navigation data.
// Consumers discover maps here instead of importing individual locations.
// ============================================================================
import {CENTRAL_LANDS} from './regions/central-lands.js';
import {CENTRAL_LANDS_ROADS} from './regions/central-lands-roads.js';
import {VELIGRAD} from './locations/veligrad.js';
import {VELIGRAD_NAVIGATION} from './locations/veligrad-navigation.js';

export const MAP_REGISTRY=[
 {id:'region:forest',kind:'region',ownerId:'forest',content:CENTRAL_LANDS,navigation:CENTRAL_LANDS_ROADS},
 {id:'location:veligrad',kind:'location',ownerId:'veligrad',content:VELIGRAD,navigation:VELIGRAD_NAVIGATION}
];

export function registeredMaps(){return MAP_REGISTRY}
export function registeredMap(id){return MAP_REGISTRY.find(map=>map.id===id)||null}
