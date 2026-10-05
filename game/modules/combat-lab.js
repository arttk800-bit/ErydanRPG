// ============================================================================
// COMBAT LAB MODULE ADAPTER
// Development-only bridge to Combat Lab; depends on the combat module.
// ============================================================================
export async function load(){return import('../ui/combat.js')}
