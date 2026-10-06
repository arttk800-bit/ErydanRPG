// ============================================================================
// LOCATION BOUNDARY
// A mapped location exits through its one explicitly selected transition.
// ============================================================================
function transition(navigation,locationId,points){
 const selected=navigation?.access?.[locationId]?.pointId;
 return (selected&&points.find(p=>p.id===selected&&(p.class==='transition'||p.type==='transition')))||points.find(p=>p.class==='transition'||p.type==='transition')||null
}
export const LocationBoundarySystem={
 transition(navigation,locationId,points){return transition(navigation,locationId,points)},
 canExit(state,navigation,points,locationId){const pos=state.world?.position,gate=transition(navigation,locationId,points);return Boolean(gate&&pos?.locationId===locationId&&pos.locationPointId===gate.id)}
};
