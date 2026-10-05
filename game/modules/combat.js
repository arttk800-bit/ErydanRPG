// ============================================================================
// COMBAT MODULE ADAPTER
// Runtime boundary for the disabled combat domain. Combat implementation is
// intentionally loaded only after this module is explicitly enabled.
// ============================================================================
export async function load(){return import('../combat/actions.js')}
