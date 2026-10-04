# Eirdan current progress

The old “0.15 migration 99/100” percentage is retired because the project has moved beyond a one-time combat migration into continuous modular development.

## Active runtime
- Product target: PWA.
- Current release line: 0.77 alpha.
- Shell/menu/settings/save flow is operational.
- Combat/AI/simulation modular baseline and regression infrastructure exist.
- World and regional map flow is operational and under active iteration.
- Road graph/editor and travel systems exist and are being stabilized.
- Runtime diagnostics and downloadable diagnostic archive exist.
- Client release detection is intentionally separated from update application.
- Startup-critical map assets have a dedicated preload/cache layer.

## Known architectural cleanup
- Legacy Android/APK workflows and migration/reference modules still exist in the repository.
- Some historical documentation and compatibility files refer to the earlier 0.14/0.15 migration.
- `game/systems/` currently contains several domains as individual modules; growing systems should move into dedicated domain folders rather than expanding a generic systems bucket indefinitely.

## Definition of progress
Progress is measured by working systems plus passing gates, not by file count or a single completion percentage. A feature is considered complete only after correct ownership, validation/regression checks and release metadata synchronization where applicable.
