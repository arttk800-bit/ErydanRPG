// Public combat-system boundary. Subsystems stay DOM-free where possible.
export {dirs,hd,distance,neighbors,isBlockedTerrain,movementCost} from './movement.js';
export {hitChance} from './attacks.js';
export {armorSlotForPart,armorCoverageForPart} from './armor.js';
export {createCombatState} from './state.js';
export const COMBAT_MODULE_VERSION='combat-migration-1';
