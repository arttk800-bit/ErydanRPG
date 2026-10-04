import {runtimeTrace} from '../../diagnostics/runtime-trace.js';
import {WORLD_DATA} from '../../data/world.js';
function normalizeClock(clock){while(clock.minute>=1440){clock.minute-=1440;clock.day+=1}}
export const WorldSystem={
 ready:true,
 ensure(state){state.world=state.world||{};state.world.locations=state.world.locations||{};state.world.regions=state.world.regions||{};state.world.knowledge=state.world.knowledge||{};state.world.current=state.world.current||{regionId:null,locationId:null,districtId:null,placeId:null};const c=state.world.current;if(c.locationId===undefined)c.locationId=c.cityId||null;if(c.districtId===undefined)c.districtId=null;return c},
 current(state){return this.ensure(state)},
 pointKnowledge(state,id){this.ensure(state);return state.world.knowledge[id]||(state.world.knowledge[id]={discovered:true,visited:false,favorite:false})},
 isDiscovered(state,point){if(!point)return false;const known=state.world.knowledge[point.id];return known?known.discovered!==false:point.hidden!==true},
 discoverPoint(state,point,source='unknown'){runtimeTrace.system('world.discover','invoke',{pointId:point?.id||null});if(!point)return false;this.ensure(state);const known=state.world.knowledge[point.id]||{discovered:point.hidden!==true,visited:false,favorite:false};const fresh=!known.discovered;known.discovered=true;known.discoveredBy=source;state.world.knowledge[point.id]=known;if(fresh){state.history=state.history||[];state.history.push({type:'discovery',pointId:point.id,name:point.name||null,source})}return fresh},
 toggleFavorite(state,point){runtimeTrace.system('world.favorite','invoke',{pointId:point?.id||null});if(!point)return false;const known=this.pointKnowledge(state,point.id);known.favorite=!known.favorite;return known.favorite},
 isFavorite(state,point){return !!(point&&this.pointKnowledge(state,point.id).favorite)},
 markVisited(state,point){runtimeTrace.system('world.visit','invoke',{pointId:point?.id||null});if(!point)return;const known=this.pointKnowledge(state,point.id);known.discovered=true;known.visited=true},
 enterRegion(state,regionId){runtimeTrace.system('world.enterRegion','invoke',{regionId});if(!this.region(regionId))throw new Error('Unknown world region');const c=this.ensure(state),previous=c.regionId;if(previous&&state.world.regions[previous]?.status==='current')state.world.regions[previous].status='visited';const known=state.world.regions[regionId]||{status:'discovered'};known.status='current';state.world.regions[regionId]=known;c.regionId=regionId;c.locationId=null;c.districtId=null;c.placeId=null;return c},
 enterMapPoint(state,point){runtimeTrace.system('world.enterMapPoint','invoke',{pointId:point?.id||null});const c=this.ensure(state);if(!point)return c;this.markVisited(state,point);if(point.class==='location'){c.locationId=point.id;c.districtId=null;c.placeId=null}else if(point.class==='district'){c.districtId=point.id;c.placeId=null}else if(point.class==='place'){c.placeId=point.id}else if(point.class==='transition'){c.placeId=point.id}return c},
 clearMapPoint(state){runtimeTrace.system('world.clearMapPoint','invoke',{});const c=this.ensure(state);c.placeId=null;c.districtId=null;return c},
 regionStatus(state,id){this.ensure(state);if(state.world.current.regionId===id)return'current';return state.world.regions[id]?.status||'locked'},
 isRegionAvailable(state,id){const s=this.regionStatus(state,id);return WORLD_DATA.regions[id]?.available===true||s==='current'||s==='visited'||s==='discovered'},
 region(id){return WORLD_DATA.regions[id]||null},place(id){return WORLD_DATA.places[id]||null},city(id){return WORLD_DATA.cities[id]||null},
 advanceTime(state,minutes,reason='world'){runtimeTrace.system('world.advanceTime','invoke',{minutes,reason});const amount=Math.max(0,Math.trunc(minutes||0));state.clock.minute+=amount;normalizeClock(state.clock);state.history=state.history||[];state.history.push({type:'time',reason,minutes:amount,day:state.clock.day,minute:state.clock.minute});return state.clock},
 clockLabel(state){const h=Math.floor(state.clock.minute/60),m=state.clock.minute%60;return'День '+state.clock.day+' · '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')}
};
