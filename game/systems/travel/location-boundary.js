// ============================================================================
// LOCATION BOUNDARY
// Validates physical entry/exit through declared location access ports.
// ============================================================================
import {accessPorts} from '../../map/access-points.js';
export const LocationBoundarySystem={
 gatePointIds(navigation,locationId){return new Set(accessPorts(navigation,locationId).map(p=>p.pointId).filter(Boolean))},
 canExit(state,navigation,locationId){const pos=state.world?.position;if(pos?.locationId!==locationId)return false;return this.gatePointIds(navigation,locationId).has(pos.locationPointId)},
 exitPort(state,navigation,locationId){if(!this.canExit(state,navigation,locationId))return null;const id=state.world.position.locationPointId;return accessPorts(navigation,locationId).find(p=>p.pointId===id)||null}
};
