# Eirdan systems

This document is the index of system ownership. It describes responsibilities, not balance values.

| System | Primary location | Owns | Must not own |
| --- | --- | --- | --- |
| App shell | `game/app/` | navigation, lifecycle, screen composition | world/combat rules |
| Client | `game/client/` | PWA release detection, reload, startup cache/preload | gameplay state |
| Core | `game/core/` | shared state/session primitives, persistence foundations, commands/events | feature-specific UI |
| Combat | `game/combat/` | legal combat actions, damage/status/resolve/retreat rules | DOM/rendering |
| AI | `game/ai/` | choosing actions through legal gameplay APIs | direct HP/coordinate mutation |
| World | `game/systems/world.js` | current world hierarchy, discovery/visited state, world clock | map rendering |
| Roads | `game/systems/roads.js` | road graph, metric distance, routing and nearest-road calculations | editor UI |
| Travel | `game/systems/travel.js` | travel lifecycle, progress, free road position, stop/camp/resume/cancel | drawing party marker |
| Inventory | `game/systems/inventory.js` | inventory/equipment domain operations | inventory presentation |
| Simulation | `game/simulation/` | headless runs, mirror/parity, telemetry | browser UI |
| Diagnostics | `game/diagnostics/` | observation, traces, smoke checks, diagnostic export | alternative gameplay logic |
| UI | `game/ui/` | rendering, controls, map/road editor interaction adapters | authoritative gameplay rules |
| Data | `game/data/` | static definitions and content | mutable session state |

## World/map boundary
Map coordinates are normalized to 0..1 in data/state. Rendering converts them into screen positions. Road routing operates on normalized coordinates plus physical map metrics. Travel owns the moving position; UI only displays it.

World hierarchy currently supports world -> region -> location -> district/place. Knowledge/discovery belongs to world state rather than DOM state.

## Client/update boundary
Release metadata is detected from version/build manifests. Applying an available version is intentionally a forced page reload rather than a simulated installer pipeline. Startup-critical maps are warmed and decoded before the loading screen disappears; cache naming is build-scoped.

## Growth rule
When a file under `game/systems/` or another domain accumulates a second independent responsibility, extract a dedicated module/folder and expose a small public interface. Do not solve growth by moving domain logic into `app/` or `ui/`.
