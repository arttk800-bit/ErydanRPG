// ============================================================================
// ENVIRONMENT AUDIO
// Maps canonical world state to ambience layers. It never reads UI view state.
// ============================================================================
export function environmentForState(state){
 const current=state?.world?.current||{};
 const point=state?.world?.position?.pointId||current.placeId||current.districtId||current.locationId||null;
 if(current.locationId==='veligrad'||String(point||'').startsWith('veligrad'))return{location:'town',weather:null};
 if(current.regionId==='forest')return{location:'forest',weather:null};
 return{location:null,weather:null};
}
