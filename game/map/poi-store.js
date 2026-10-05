import {CENTRAL_LANDS} from '../data/regions/central-lands.js';
import {VELIGRAD} from '../data/locations/veligrad.js';

export const POI_STORAGE_KEY='eirdan.region-poi.v1';
const clonePoints=points=>points.map(point=>({...point}));

function readAll(storage=globalThis.localStorage){try{return JSON.parse(storage?.getItem(POI_STORAGE_KEY)||'{}')}catch{return{}}}
function writeAll(value,storage=globalThis.localStorage){try{storage?.setItem(POI_STORAGE_KEY,JSON.stringify(value));return true}catch{return false}}

export function loadPoi(regionId,storage=globalThis.localStorage){
 const all=readAll(storage),local=all[regionId];
 if(Array.isArray(local)){
  if(regionId!=='forest')return local;
  let changed=false;
  const migrated=local.map(point=>{
   const canonical=CENTRAL_LANDS.points.find(candidate=>candidate.id===point.id||(Math.abs(candidate.x-point.x)<0.0001&&Math.abs(candidate.y-point.y)<0.0001));
   if(canonical&&(/^(Город|Деревня|Крепость|Руины|Особая)$/.test(point.name)||String(point.id).startsWith('forest-'))){changed=true;return {...point,id:canonical.id,name:canonical.name,class:canonical.class,type:canonical.type}}
   if(canonical&&(!point.class||point.class!==canonical.class||point.type!==canonical.type||point.map!==canonical.map)){changed=true;return {...point,id:canonical.id,name:canonical.name,class:canonical.class,type:canonical.type,...(canonical.map?{map:canonical.map}:{})}}
   return point;
  });
  if(changed){all[regionId]=migrated;writeAll(all,storage)}
  return migrated;
 }
 if(regionId==='forest')return clonePoints(CENTRAL_LANDS.points);
 if(regionId==='location:veligrad')return clonePoints(VELIGRAD.points);
 return [];
}
export function savePoi(regionId,items,storage=globalThis.localStorage){const all=readAll(storage);all[regionId]=items;return writeAll(all,storage)}
export function readStoredPoi(storage=globalThis.localStorage){return readAll(storage)}
