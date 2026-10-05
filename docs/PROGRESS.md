# Eirdan current progress

The old “0.15 migration 99/100” percentage is retired because the project has moved beyond a one-time combat migration into continuous modular development.

## Active runtime
- Product target: PWA.
- Current release metadata is defined by `game/data/version.json`; this document does not duplicate a potentially stale version number.
- Shell/menu/settings/save flow is operational.
- Combat/AI/simulation modular baseline and regression infrastructure exist.
- World and regional map flow is operational and under active iteration.
- Road graph/editor and travel systems exist and are being stabilized.
- Map Editor composition, road/terrain tooling and POI authoring have been extracted from World UI into `game/tools/map-editor/`.
- Runtime diagnostics and downloadable diagnostic archive exist.
- Client release detection is intentionally separated from update application.
- Startup-critical map assets have a dedicated preload/cache layer.

## Known architectural cleanup
- Android/APK client and executable 0.14/0.15 migration runtime have been retired after dependency audit.
- Historical behavior still required by combat development is preserved through current regression/parity baselines rather than executable legacy entrypoints.
- `game/systems/` currently contains several domains as individual modules; growing systems should move into dedicated domain folders rather than expanding a generic systems bucket indefinitely.

## Definition of progress
Progress is measured by working systems plus passing gates, not by file count or a single completion percentage. A feature is considered complete only after correct ownership, validation/regression checks and release metadata synchronization where applicable.


## 0.89 world simulation / spatial model
Implemented schema-3 simulation state, continuous foreground-only world clock, travel playback retuning, progressive sleep foundation, temporary camp locations, exact access-port travel targets, location entry fallbacks, preview-vs-entry separation, party-marker synchronization, visible POI IDs, actionable transition binding and contextual free-waypoint labels. Added world-simulation regression coverage to the campaign gate. Local test execution remains blocked in the current tool environment by GitHub DNS; syntax gate is run separately.

## Feedback reporting
Added player-facing bug/suggestion reports with text, optional screenshots, optional Diagnostics attachment, explicit opt-in device/browser metadata and a portable ZIP package. Download is the only active delivery transport; server delivery is a deliberate stub for future backend integration.


## Diagnostics 2.0
- Added read-only State/Saves, World/Simulation and PWA/cache diagnostic adapters.
- Audio uses the existing public snapshot adapter.
- Shell diagnostics is now an aggregator rather than owner of cross-domain checks.
- Diagnostic ZIP includes dedicated JSON reports for state, world/simulation, PWA/cache and audio.
- Added campaign regression coverage for diagnostic adapters.
