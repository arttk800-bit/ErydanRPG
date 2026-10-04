import {WORLD_DATA} from '../data/world.js';

function normalizeClock(clock){
 while(clock.minute>=1440){clock.minute-=1440;clock.day+=1}
}

export const WorldSystem={
 ready:true,
 ensure(state){
  state.world=state.world||{};
  state.world.locations=state.world.locations||{};
  state.world.regions=state.world.regions||{};
  state.world.current=state.world.current||{regionId:null,placeId:null,cityId:null,cityPlaceId:null};
  return state.world.current;
 },
 current(state){return this.ensure(state)},
 enterRegion(state,regionId){if(!this.region(regionId))throw new Error('Unknown world region');const current=this.ensure(state);const previous=current.regionId;if(previous&&state.world.regions[previous]?.status==='current')state.world.regions[previous].status='visited';const known=state.world.regions[regionId]||{status:'discovered'};known.status='current';state.world.regions[regionId]=known;current.regionId=regionId;current.placeId=null;current.cityId=null;current.cityPlaceId=null;return current},
 regionStatus(state,regionId){this.ensure(state);if(state.world.current.regionId===regionId)return 'current';return state.world.regions[regionId]?.status||'discovered'},
 region(id){return WORLD_DATA.regions[id]||null},
 place(id){return WORLD_DATA.places[id]||null},
 city(id){return WORLD_DATA.cities[id]||null},
 advanceTime(state,minutes,reason='world'){
  const amount=Math.max(0,Math.trunc(minutes||0));
  state.clock.minute+=amount;
  normalizeClock(state.clock);
  state.history=state.history||[];
  state.history.push({type:'time',reason,minutes:amount,day:state.clock.day,minute:state.clock.minute});
  return state.clock;
 },
 enterPlace(state,placeId){
  const place=this.place(placeId);
  if(!place)throw new Error('Unknown world place');
  const current=this.ensure(state);
  current.regionId=place.region;
  current.placeId=placeId;
  current.cityId=place.type==='town'&&WORLD_DATA.cities[placeId]?placeId:null;
  current.cityPlaceId=null;
  return current;
 },
 enterCityPlace(state,placeId){
  const current=this.ensure(state);
  const place=this.city(current.cityId)?.places?.[placeId];
  if(!place)throw new Error('Unknown city place');
  current.cityPlaceId=placeId;
  this.advanceTime(state,place.minutes,'city-place');
  return place;
 },
 leaveCityPlace(state){this.ensure(state).cityPlaceId=null},
 clockLabel(state){
  const h=Math.floor(state.clock.minute/60),m=state.clock.minute%60;
  return 'День '+state.clock.day+' · '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
 }
};
