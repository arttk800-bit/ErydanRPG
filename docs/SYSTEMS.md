# Eirdan systems

This document is the index of system ownership. It describes responsibilities, not balance values.

| System | Primary location | Owns | Must not own |
| --- | --- | --- | --- |
| App shell | `game/app/` | navigation, lifecycle, screen composition | world/combat rules |
| Client | `game/client/` | PWA release detection, reload, revisioned asset cache/preload | gameplay state |
| Core | `game/core/` | shared state/session primitives, persistence foundations, commands/events | feature-specific UI |
| Combat | `game/combat/` | legal combat actions, damage/status/resolve/retreat rules | DOM/rendering |
| AI | `game/ai/` | choosing actions through legal gameplay APIs | direct HP/coordinate mutation |
| World | `game/systems/world/world.js` | current world hierarchy, discovery/visited state, world clock | map rendering |
| Roads | `game/systems/travel/roads.js` | road graph, metric distance, routing and nearest-road calculations | editor UI |
| Travel | `game/systems/travel/travel.js` | travel lifecycle, progress, free road position, stop/camp/resume/cancel | drawing party marker |
| Inventory | planned dedicated domain | inventory/equipment domain operations | inventory presentation |
| Simulation | `game/simulation/` | headless runs, mirror/parity, telemetry | browser UI |
| Diagnostics | `game/diagnostics/` | observation, traces, smoke checks, diagnostic export | alternative gameplay logic |
| UI | `game/ui/` | gameplay rendering and controls | authoritative gameplay rules or development-tool ownership |
| Audio | `game/audio/` | semantic music context, track selection and playback state | world/combat rules or UI state |
| Map Editor | `game/tools/map-editor/` | POI/road/terrain authoring UI, runtime and export tooling | world/travel gameplay rules |
| Module runtime | `game/modules/` + `game/core/modules/` | optional capability composition, enable/disable state and dependencies | domain implementation |
| Data | `game/data/` | static definitions and content | mutable session state |

## World/map boundary
Map coordinates are normalized to 0..1 in data/state. Rendering converts them into screen positions. Road routing operates on normalized coordinates plus physical map metrics. Travel owns the moving position; UI only displays it.

World hierarchy currently supports world -> region -> location -> district/place. Knowledge/discovery belongs to world state rather than DOM state.

## Client/update boundary
Release metadata is detected from version/build manifests. Applying an available version is intentionally a forced page reload rather than a simulated installer pipeline. Startup-critical maps are warmed and decoded before the loading screen disappears. Heavy assets use independent content revisions in a stable asset cache, so a game build does not invalidate unchanged maps/audio.

## Growth rule
When a file under `game/systems/` or another domain accumulates a second independent responsibility, extract a dedicated module/folder and expose a small public interface. Do not solve growth by moving domain logic into `app/` or `ui/`.


## WorldClock / Simulation
WorldClock owns game date/time. Simulation advances it only while the gameplay runtime is active and unpaused. Modes currently distinguish normal world time, accelerated travel, passive UI contexts and sleep. Temporal checks are emitted in game-time intervals so event probability does not depend on FPS.

## LocationEntry / Camp
LocationEntry validates physical entry and resolves stable external-port → internal-transition spawn mapping with incomplete-map fallbacks. Camp owns a temporary mapless location anchored to world coordinates and a list of facilities; facilities are extensible for future party professions.
