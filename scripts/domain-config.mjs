// ============================================================================
// VALIDATION DOMAIN MAP
// Source of truth for which source trees belong to each automated gate.
// Disabled domains stay outside unrelated syntax/regression validation.
// ============================================================================
export const DOMAIN_VALIDATION={
 campaign:{
  required:['game/app/bootstrap.js','game/core/state.js','game/core/modules/registry.js','game/modules/index.js','game/modules/runtime.js','game/modules/campaign.js','game/systems/world/world.js','game/systems/travel/travel.js','game/systems/travel/roads.js','game/systems/travel/route-planner.js','game/map/terrain.js','game/ui/world.js','game/tools/map-editor/road-editor.js'],
  roots:['game/app','game/client','game/core/modules','game/core/state.js','game/core/ids.js','game/core/rng.js','game/core/session.js','game/core/persistence.js','game/core/events.js','game/core/commands.js','game/map','game/modules/index.js','game/modules/runtime.js','game/modules/campaign.js','game/systems/world','game/systems/travel','game/systems/pause.js','game/systems/game-speed.js','game/systems/travel-conditions.js','game/tools/map-editor','game/diagnostics','game/data','game/ui/world.js','game/ui/map-ui.js','game/ui/map-points.js','game/ui/map-gestures.js']
 },
 combat:{
  required:['game/combat/actions.js','game/combat/damage.js','game/ai/ai-controller.js','game/simulation/runner.js','game/simulation/mirror.js'],
  roots:['game/combat','game/ai','game/simulation','game/systems/combat','game/core/action-registry.js','game/core/battle-lifecycle.js','game/core/game-state.js','game/core/hex-grid.js','game/core/movement.js','game/core/turn-manager.js','game/ui/combat.js']
 }
};
