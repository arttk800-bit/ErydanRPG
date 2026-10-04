# Eirdan roadmap

This file tracks architectural/product direction, not a promise of release dates.

## Current foundation
- PWA shell, navigation, settings and persistent saves.
- Modular combat/AI/simulation baseline with automated regressions and mirror diagnostics.
- World -> region -> location map hierarchy in active development.
- World discovery/knowledge state.
- Regional road graph, road editor and route-based travel.
- Runtime/action diagnostics.
- Version/build/changelog metadata.
- Simplified update detection + forced reload.
- Build-scoped startup asset preload/cache with loading screen.

## Near-term
1. Stabilize regional road editing and verify graph connectivity diagnostics.
2. Continue world/travel integration: movement state, events, arrival and persistence.
3. Strengthen UI smoke tests around map editing and client startup/update behavior.
4. Continue separating remaining legacy/migration code from active runtime ownership.
5. Expand map/location content through data modules without embedding rules in UI.
6. Introduce additional character/inventory/world systems only behind explicit domain contracts.

## Continuous gates
- architecture placement and dependency review;
- full JS syntax gate;
- regression suite;
- relevant diagnostics/smoke tests;
- mirror/parity gates when combat behavior is touched;
- synchronized version, build ID, changelog and Service Worker for user-significant releases.

## Later
Character progression, deeper inventory/equipment, economy, NPC simulation, events, AI/world simulation and additional regions should be developed as independent systems rather than accumulated in shell/UI modules.
