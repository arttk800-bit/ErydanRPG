// ============================================================================
// CAMP SYSTEM
// Owns temporary camp-location state anchored to the party's world position.
// Camp facilities are extensible data; no navigation map is created.
// ============================================================================
export const CampSystem={
 create(state,{regionId,position,facilities=[]}={}){if(!position)return null;state.world=state.world||{};state.world.camp={id:'camp:party',kind:'temporary-location',regionId:regionId||state.world.current?.regionId||null,position:{x:position.x,y:position.y},createdAt:{day:state.clock.day,minute:state.clock.minute},facilities:[{id:'camp:fire',type:'fire',name:'Костёр'},{id:'camp:sleep',type:'sleep',name:'Спальные места'},...facilities]};return state.world.camp},
 remove(state){if(state.world)state.world.camp=null},
 current(state){return state.world?.camp||null}
};