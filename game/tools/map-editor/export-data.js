import {CENTRAL_LANDS} from '../../data/regions/central-lands.js';
import {VELIGRAD} from '../../data/locations/veligrad.js';
import {CENTRAL_LANDS_ROADS} from '../../data/regions/central-lands-roads.js';
import {loadEditableRoads} from './road-editor.js';
import {loadTerrainZones} from './terrain-store.js';
import {readStoredPoi} from '../../map/poi-store.js';

function readStored(key,storage=globalThis.localStorage){try{return JSON.parse(storage?.getItem(key)||'{}')}catch{return{}}}
function mapBundle(mapId,{kind,id,map,points,fallbackRoads={nodes:[],edges:[],access:{}},fallbackTerrain=[]}){const roads=loadEditableRoads(mapId,fallbackRoads),terrain=loadTerrainZones(kind==='region'?'region:'+mapId:mapId,fallbackTerrain);return{kind,id,map,points,roads,terrain}}

export function buildMapEditorExport(storage=globalThis.localStorage){
 const maps={...readStoredPoi(storage)};
 if(!Array.isArray(maps.forest))maps.forest=CENTRAL_LANDS.points.map(point=>({...point}));
 if(!Array.isArray(maps['location:veligrad']))maps['location:veligrad']=VELIGRAD.points.map(point=>({...point}));
 const terrainKeys=Object.keys(readStored('eirdan.map-terrain.v1',storage)).map(key=>key.startsWith('region:')?key.slice(7):key);
 const ids=new Set([...Object.keys(maps),...Object.keys(readStored('eirdan.region-roads.v1',storage)),...terrainKeys,'forest','location:veligrad']);
 return {format:'eirdan-map-editor',version:2,exportedAt:new Date().toISOString(),maps:Object.fromEntries([...ids].map(key=>{const isForest=key==='forest',isVeligrad=key==='location:veligrad',points=maps[key]||(isForest?CENTRAL_LANDS.points:isVeligrad?VELIGRAD.points:[]),kind=key.startsWith('location:')?'location':'region',id=key.replace(/^location:/,''),map=isForest?CENTRAL_LANDS.map.asset:isVeligrad?VELIGRAD.map:null,fallbackRoads=isForest?CENTRAL_LANDS_ROADS:{nodes:[],edges:[],access:{}};return[key,mapBundle(key,{kind,id,map,points,fallbackRoads})]}))};
}
