# Eirdan systems

This document is the index of system ownership. It describes responsibilities, not balance values.

| System | Primary location | Owns | Must not own |
| --- | --- | --- | --- |
| Android runtime | `godot/app/` | bootstrap, Android-facing composition and presentation | package validation or gameplay rules |
| Package Manager | `godot/packages/` | staging, integrity, validator orchestration, active/previous package set and rollback | domain validation rules, balance or transport policy |
| Package Validators | `godot/packages/package_validators.gd` | registry and aggregation of domain package validators | domain-specific validation rules |\n| Data Registry | `godot/data/` | base + override resolution, provenance and data-domain package validation | gameplay algorithms |
| Godot Diagnostics | `godot/diagnostics/` | runtime events and provider snapshots | domain rules |
| Legacy PWA app shell | `game/app/` | browser navigation, lifecycle, screen composition | world/combat rules |
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

## Active Android/package boundary
APK/runtime and content packages have separate lifecycles. Local SAF import, GitHub and HTTP are source adapters; Package Manager owns the install/activation transaction and delegates content checks to Package Validators. Domain owners register their own validators; Package Manager does not import domain rules. A failed candidate must leave the last active set usable offline.

DataRegistry resolves authorable values from base data and active overrides. Provenance is part of the diagnostic/editing contract.

## Legacy PWA client/update boundary
Release metadata is detected from version/build manifests. Applying an available version is intentionally a forced page reload rather than a simulated installer pipeline. Startup-critical maps are warmed and decoded before the loading screen disappears. Heavy assets use independent content revisions in a stable asset cache, so a game build does not invalidate unchanged maps/audio.

## Growth rule
When a file under `game/systems/` or another domain accumulates a second independent responsibility, extract a dedicated module/folder and expose a small public interface. Do not solve growth by moving domain logic into `app/` or `ui/`.


## WorldClock / Simulation
WorldClock owns game date/time. Simulation advances it only while the gameplay runtime is active and unpaused. Modes currently distinguish normal world time, accelerated travel, passive UI contexts and sleep. Temporal checks are emitted in game-time intervals so event probability does not depend on FPS.

## LocationEntry / Camp
LocationEntry validates physical entry and resolves stable external-port → internal-transition spawn mapping with incomplete-map fallbacks. Camp owns a temporary mapless location anchored to world coordinates and a list of facilities; facilities are extensible for future party professions.

## Feedback
`game/feedback/` owns player bug reports and suggestions. Reports accept text and image attachments, may attach Diagnostics, and may attach non-sensitive device/browser metadata only with explicit consent. Delivery is transport-based; only local ZIP download is active. Server transport is intentionally unavailable until a backend exists.


## Diagnostics
Active campaign diagnostics aggregate separate read-only reports for State/Saves, World/Simulation, PWA/asset cache, Audio, Map, Travel and UI. Domain owners retain all rules; diagnostic adapters expose health checks and snapshots only.

## Map registry
`game/data/map-registry.js` is the discovery point for canonical map-bearing content and navigation descriptors. `game/diagnostics/map-diagnostics.js` validates registered maps generically; it does not own route or terrain rules. New authored maps should register there rather than adding location-specific imports to diagnostics.

## Time / Pause / Travel — 0.90
- WorldClock: canonical seconds, normal 1 real second = 1 game second.
- Simulation: normal/travel/sleep mode and binary fast-forward; no global speed multiplier.
- Pause: independent runtime reasons (manual, game-menu, settings, event, feedback); never persistent.
- Travel: regional movement to one POI access node; arrival commits world.position.
- Location Entry/Boundary: one selected transition for crossing Region ↔ Location.
- Journey: composes local travel to the selected transition and regional travel from the single access node.

## Migration rule
The PWA remains the reference implementation for domains not yet migrated. Migration carries contracts, behavior and validated data into Godot; browser-specific DOM/cache ownership is not copied into the new runtime.
