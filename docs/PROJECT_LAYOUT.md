# Eirdan project layout

## Application and infrastructure
- `game/app/` — PWA shell, navigation, lifecycle and game-screen composition.
- `game/client/` — client/runtime infrastructure: release detection, forced reload updates and revisioned asset cache management.
- `game/core/` — shared state/session/persistence and reusable engine primitives.
- `game/diagnostics/` — runtime diagnostics, traces, smoke checks and export.
- `scripts/` — repository-level validation, parity and simulation scripts.
- `tests/` — automated regression tests.

## Gameplay domains
- `game/combat/` — combat rules, legal actions, damage, body parts, status, resolve and retreat semantics.
- `game/ai/` — targeting and class/role decision policies.
- `game/systems/world/` — world state and world-domain API.\n- `game/systems/travel/` — roads, route planning, travel conditions and travel simulation.\n- `game/systems/` root currently contains smaller domains such as inventory, pause and game speed; they move into dedicated folders as their responsibilities grow.\n- `game/tools/map-editor/` — development-only map/road/terrain authoring tools; not gameplay-rule ownership.
- `game/simulation/` — headless battle runners, mirror/parity analysis and telemetry.
- `game/data/` — static content, balance and world/map definitions.
- `game/ui/` — presentation and interaction adapters; no gameplay-rule ownership.

## Assets
- `game/assets/world/` — global world maps and masks.
- `game/assets/regions/` — regional maps.
- `game/assets/locations/` — city/location maps.
- `game/assets/ui/` — interface art/icons.
- `game/assets/audio/` — music/audio.
- `game/assets/fonts/` — bundled fonts.

Startup-critical visual assets are preloaded through `game/client/asset-loader.js` and owned by `game/client/asset-cache.js`. `asset-manifest.json` gives each managed asset an independent content revision. The stable asset cache survives game builds; only a changed asset revision is downloaded and the previous revision is removed after the replacement has been fetched and validated.

## Compatibility / migration
- `game/runtime/`, `game/alpha14p/` and remaining compatibility wrappers exist for migration/reference purposes.
- New systems must not be added to legacy areas merely because an older implementation already exists there.
- Legacy removal is allowed only after equivalent behavior is covered by current regression/parity gates.

## Current platform
The active product target is the browser-installed PWA. Android/APK remnants and workflows may remain in the repository for historical/build compatibility, but they are not the architectural target for new client features.
