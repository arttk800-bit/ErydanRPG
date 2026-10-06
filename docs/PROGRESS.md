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

## Generic map diagnostics
- Added a canonical registry for authored map-bearing domains (Central Lands region and Veligrad location initially).
- Removed direct Veligrad ownership from Map Diagnostics; registered maps now use one generic validation path.
- Added synthetic regression coverage for blocked authored edges, unreachable ports and insufficient district access.

## 0.89 regional travel arrival hotfix
- Fixed a repeated region-arrival crash captured by RuntimeTrace: `ReferenceError: nullstate is not defined`.
- Regional physical-position commit is now owned by `TravelSystem.arrive()`; World UI no longer writes arrival position directly.
- Arrival preserves the selected destination access-port ID so mapped locations can spawn through the physical side used by the route.
- Travel diagnostics now understands multi-port access records and uses canonical regional map metrics instead of normalized coordinates as meters.
- Added regression coverage for regional arrival and destination-port persistence.

## 0.90.0-alpha — Travel & Time Stabilization
- Normal world time is 1:1 with real seconds; global game-speed multipliers were removed.
- Travel/Sleep use an explicit binary fast-forward toggle; camp cancels travel fast-forward.
- Pause reasons are runtime-only and cleared on save load.
- Region↔location boundary is simplified to one regional access node and one selected location transition.
- Regional access nodes may connect to multiple road edges; internal district multi-access remains supported.
- Regional arrival now always commits canonical world.position; free-travel target remains visible.
- Settings blur only over an active game; diagnostics moved to the main menu.
- World selection artifact/current-region status and route-message stacking were corrected.
- State schema: v4. Runtime build: travel-contract-0.90.0-alpha.


## Godot/Android foundation
- Active client development moved to an isolated Godot/Android runtime while preserving the PWA as a reference implementation.
- Added portable package infrastructure with manifest/compatibility validation, SHA-256 verification, activation and rollback.
- Added DataRegistry foundation for base/override resolution and provenance.
- Added runtime diagnostics and Android system-file import/export.
- Added real Godot headless integration validation and automated arm64 debug APK export.
- Verified the foundation on a physical Android device: runtime startup, package picker and diagnostic save flow.


## Deterministic package order
- Godot package activation now resolves explicit `dependencies`, `conflicts` and integer `priority`.
- Dependencies are hard ordering constraints; missing dependencies, cycles and active conflicts reject the candidate set before persistence.
- Independent packages use stable `priority` + package-ID ordering, removing activation-history precedence from DataRegistry overrides.
- DataRegistry preserves Package Manager's resolved order and remains owner only of base/override data resolution and provenance.


## Godot authored data schema
- Extracted field/entity validation from DataRegistry into `godot/data/data_schema.gd`.
- Base data is validated before becoming canonical Registry data.
- Sparse override packages reject unknown roots, unsupported fields, invalid stable IDs and attempts to override unknown entity IDs.
- Entity IDs are canonical dictionary keys; DataRegistry now exposes `entity(domain, id)` and entity provenance without coupling identity to display names.
- Added schema/identity integration assertions and static ownership regression contracts.


## Godot persistence foundation
- Added dedicated `godot/persistence/` ownership: save schema, migrations and durable SaveStore.
- Separated save envelope format version from mutable state schema version.
- Kept stable internal `world_id` separate from player-visible `world_name`.
- Save writes use temporary write → reread/validation → activation; invalid state is rejected before storage.
- Loads validate and pass through the migration boundary before returning canonical state.
- Added save/load/list/delete integration coverage and static architecture contracts.


## Godot module runtime foundation
- Added `godot/modules/module_registry.gd` for explicit module metadata, defaults and dependency resolution.
- Added `godot/modules/module_runtime.gd` as the single Godot composition root.
- Disabled modules are not constructed; required dependencies cannot be disabled under active dependents.
- Startup is dependency ordered and shutdown is reverse ordered.
- Composition runtime has no direct imports of future World/Map/Travel/Combat implementations.
- Added dependency, optional-module, missing-dependency and cycle regression coverage.


## Gameplay migration: World / Map slice
- Started the actual PWA → Godot gameplay migration after foundation completion.
- Ported canonical physical hierarchy and knowledge behavior into `godot/world/world_state.gd`.
- Ported map browsing state into a separate `godot/map/map_view_state.gd`; browsing cannot mutate physical World state.
- Added World/Map lifecycle adapters and registered them through the Godot composition root.
- Added integration coverage proving Map can browse another region while World physical region remains unchanged.
- Roads and Travel remain next in this same vertical slice; PWA remains the parity/reference implementation until the slice is complete.


## Gameplay migration: Roads
- Ported normalized-coordinate road topology into `godot/roads/road_graph.gd`.
- Physical distances are derived from explicit map width/height metrics rather than screen pixels.
- Added deterministic shortest-route and access-node validation.
- Registered Roads as a separate runtime module after Map; it does not mutate World/Map/Travel state.
- Added integration checks for 3-4-5 geometry, shortest path selection and invalid access references.
- Terrain and travel-method modifiers remain for the upcoming Travel/conditions owner rather than contaminating road topology.


## Gameplay migration: Travel vertical slice
- Added `godot/travel/travel_state.gd` for deterministic regional travel lifecycle and progress.
- Travel obtains routes from Roads and commits completed destination entry through the World module API.
- Added start/tick/stop/resume/cancel/progress/arrival foundation behavior.
- Integration test now exercises the complete Godot `World → Map → Roads → Travel` slice through physical arrival.
- Android update identity is explicitly regression-checked: package ID remains `org.eirdan.runtime` and CI uses the stable development keystore secrets, allowing compatible debug APKs to install over previous builds without intentionally clearing `user://`.
- Terrain/event/camp/location-boundary parity remains a later Travel extension; it is not silently folded into Roads or World.
