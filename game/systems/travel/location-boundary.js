// ============================================================================
// LOCATION BOUNDARY
// A mapped location exits through its single authored transition point.
// ============================================================================
function transition(points){return points.find(p=>p.class==='transition'||p.type==='transition')||null}
export const LocationBoundarySystem={
 transition(points){return transition(points)},
 canExit(state,points,locationId){const pos=state.world?.position,gate=transition(points);return Boolean(gate&&pos?.locationId===locationId&&pos.locationPointId===gate.id)}
};
