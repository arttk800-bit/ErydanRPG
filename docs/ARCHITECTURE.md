# Eirdan architecture

Eirdan is a long-term modular RPG project. A feature is complete only when it works and lives behind the correct system boundary.

## Dependency direction
Input / UI -> public system APIs -> domain state and rules -> events / diagnostics -> rendering.

UI renders state and translates user intent into system calls. It must not own gameplay rules.
Domain systems may use shared core primitives and data, but must not reach into another system's internals.
Diagnostics observe behavior and verify invariants; they do not become a second implementation of gameplay.
Static content and balance belong in data modules/files, not UI code.

## Active platform architecture
The active development target is Godot/Android. The existing browser PWA remains intact as a legacy/reference implementation until individual domains are migrated and parity-checked. New Android work must not depend on DOM, Service Worker or browser storage contracts.

The Godot foundation currently separates runtime bootstrap, package installation/activation, resolved data and diagnostics. APK/runtime changes and game/content package changes have separate lifecycles.

## Runtime domains
- `game/app/` — application shell, navigation, lifecycle, screen composition.
- `game/client/` — PWA/runtime infrastructure: release metadata, update detection and content-revisioned asset caching.
- `game/core/` — shared state/session primitives, commands/events, persistence foundations and battle lifecycle primitives.
- `game/combat/` — combat rules and action semantics.
- `game/ai/` — AI decision policies consuming legal gameplay APIs.
- `game/systems/` — world-facing domain systems such as world state, roads, travel, pause/game speed and inventory.
- `game/simulation/` — headless simulations, parity and telemetry.
- `game/diagnostics/` — runtime traces, smoke/regression diagnostics and diagnostic export.
- `game/ui/` — rendering and user interaction only.
- `game/data/` — static game/world/content data.
- `game/assets/` — binary and visual/audio resources.

## Core invariants
1. Inspect the current implementation before changing a system; never infer file contents or interfaces.
2. New independent responsibility gets an appropriate module/domain immediately.
3. UI must not become a store of gameplay logic.
4. Cross-domain behavior uses explicit APIs and state contracts.
5. No direct combat coordinate mutation outside movement ownership.
6. No death resolution outside battle lifecycle ownership.
7. AI and manual control use the same legal action model.
8. Simulations remain headless and deterministic when supplied a fixed seed.
9. Persistent state changes require an explicit save/data compatibility decision.
10. A release is blocked by syntax/module-load failures or failing required regression/diagnostic gates.

## Change workflow
Requirement -> inspect current architecture -> identify owning systems -> research established solutions when non-trivial -> implement -> architecture review -> full JS syntax gate -> regression tests -> relevant smoke/diagnostic tests -> fix failures -> synchronize version/build/changelog/Service Worker -> release.

Do not perform unrelated global refactors, but when touched legacy code clearly belongs to the system being changed, migrate it toward the current boundary as part of that work.

## Legacy PWA module boundary
The preserved browser implementation is the campaign PWA. Runtime capabilities are registered explicitly through `game/core/modules/registry.js` and `game/modules/index.js`.

- `campaign` is enabled by default and owns world/map/travel/character/inventory/knowledge-facing integration.
- `combat` is preserved as a future gameplay module but is disabled in a fresh campaign until explicitly integrated through its public module boundary.
- `combat-lab` is a development tool depending on combat; it is not part of the campaign release gate.
- `game/simulation/`, mirror/parity tooling and historical combat entry points are retained for combat development and reference, not loaded by the campaign shell.
- The PWA is preserved as a reference client while the active client architecture is rebuilt under `godot/`. It is not the owner of new Android runtime/package contracts.

Validation is domain-scoped: campaign changes run campaign syntax/regression gates; disabled combat/AI/simulation code is not imported by the campaign runtime and does not trigger campaign/browser/PWA gates. Combat validation is explicit/manual or triggered by combat-domain paths. Before enabling a previously disabled module, run its own gate and the full integration gate. Mirror 3000 is combat diagnostics, never a map/travel release criterion.

## Composition root and module isolation
`game/modules/runtime.js` is the runtime composition boundary. The app shell asks it to mount an enabled capability; it conditionally loads the module adapter with dynamic `import()`. Module metadata and dependency rules live in `game/core/modules/registry.js`; domain implementations remain in their own folders. Disabling a module therefore means both runtime isolation and CI isolation, not merely hiding its UI.

## Source navigation rule
Every non-trivial source file must identify its responsibility at the top. Large files additionally use short section markers for major cohesive blocks. Comments explain ownership/boundaries, not obvious syntax. If a file needs several unrelated responsibility sections, split it instead of documenting a god-file.


## World time and spatial ownership (0.89)
- `WorldClockSystem` is the only owner of continuous game-clock advancement.
- `SimulationSystem` converts active foreground real time into game time. Pause, main menu, hidden/background PWA and closed application advance nothing and perform no catch-up simulation.
- Travel, sleep, camp and future inventory/dialogue screens select simulation modes; UI must not mutate `state.clock` directly.
- `MapViewSystem` is browsing state only. Opening another region/location map never moves the party.
- Physical location entry is owned by `LocationEntrySystem`; mapped locations use stable access-port IDs. Region port A resolves location transition A. Missing bindings fall back to any transition, then district, place, then a temporary center spawn.
- Districts are logical zones inside a location map, never separate navigation maps. Final places have no navigation maps; they may use `sceneBackground` for presentation.
- Camps are temporary locations without navigation maps and can expose dynamic facilities.

## Feedback and diagnostics boundary
Player feedback is owned by `game/feedback/`, not by UI or Diagnostics. `FeedbackSystem` validates bug reports and suggestions, `buildFeedbackPackage` creates one portable package, and transports decide delivery. The current transport downloads ZIP; server/email/GitHub-backed delivery is a future transport. Diagnostics remains observational and can be attached to feedback without owning feedback state. Device/browser information is collected only after explicit consent.


## Diagnostics domain adapters
Diagnostics observes active systems through read-only adapters. State/save validation, World/Simulation, PWA/cache and Audio snapshots remain separate from their owning systems; `shell-diagnostics.js` only aggregates reports. Diagnostics must not mutate canonical state or duplicate gameplay/client rules.

## Authored map registry and diagnostics
Authored map-bearing domains are declared in `game/data/map-registry.js`. Map diagnostics consumes registry descriptors and public Map/Travel contracts instead of importing a specific city. Content connectivity or terrain conflicts remain diagnostic findings; deterministic routing/terrain behavior belongs to synthetic campaign regression tests.

## Travel boundary contract (0.90)
`TravelSystem` owns regional movement and arrival. A mapped regional POI has one physical access node; that node may have any number of road edges. `LocationEntrySystem` resolves one explicitly selected transition inside the mapped location. Arrival direction is intentionally not preserved across the boundary. Internal location navigation (for example district approaches) may still expose multiple access nodes and is not part of this simplification.

`SimulationSystem` owns the real-time→game-time conversion. Normal simulation is 1:1. Fast-forward is a binary runtime mode available only to Travel and Sleep; there is no global game-speed system. `PauseSystem` owns independent runtime pause reasons and pause state is never persistent.

## Godot/Android foundation
- `godot/app/` is the Android runtime/bootstrap presentation boundary.
- `godot/packages/` owns package manifest validation, staging, SHA-256 integrity, compatibility, activation and rollback.
- `godot/data/` owns resolved game data. Gameplay systems consume DataRegistry rather than package files directly.
- `godot/diagnostics/` owns observational runtime diagnostics and provider aggregation.
- Android SAF/file dialogs are adapters for import/export; they do not own package or diagnostic rules.
- Mutable installed content belongs under `user://`; packaged `res://` content is not treated as writable state.

## Data resolution contract
Authorable values are data unless they are algorithms. Resolution is layered and deterministic. Base definitions remain intact; package/user overrides replace supported values through DataRegistry, which exposes provenance for diagnosis and editing. Domain systems own behavior; data supplies parameters.


## Godot persistence boundary
`godot/persistence/SaveStore` is the durable-storage owner for mutable game state. Save format version and game-state schema version are separate axes. `save_schema.gd` validates the persistent contract; `save_migrations.gd` owns ordered state transformations; domain systems remain owners of the meaning and mutation of their state.

Persistence does not import World, Travel, Character, Combat or UI rules. Those domains will expose canonical serializable state through the future Godot composition/session boundary. Static DataRegistry definitions remain referenced by stable IDs rather than becoming save-owned definitions.


## Godot composition root
`godot/modules/module_runtime.gd` is the only runtime composition boundary for optional Godot gameplay domains. `module_registry.gd` owns metadata, default enabled state and dependency validation; ModuleRuntime owns construction and start/stop lifecycle.

Domain implementations register factories through the composition root. ModuleRuntime must not import concrete World, Map, Travel, Character, Combat or AI implementations. Disabled modules are not constructed and therefore cannot perform runtime side effects. Dependencies start before dependents and stop in reverse order. Module enabled state may later be persisted in session state, but the registry remains the authority for whether a configuration is legal.


## Godot World / Map migration boundary
The first gameplay migration slice is split by ownership. `godot/world/world_state.gd` owns physical hierarchy state and point knowledge; `godot/map/map_view_state.gd` owns browsing scope only. Browsing another region/location is therefore incapable of changing physical location through the Map API.

Concrete World and Map adapters are registered in `godot/modules/game_module_catalog.gd`. Map declares a World dependency but receives shared canonical state through ModuleRuntime context instead of importing World internals. Roads and Travel will extend this vertical slice behind their own owners.


## Godot Roads migration boundary
`godot/roads/road_graph.gd` owns road topology, access-node resolution, physical metric distance and deterministic shortest-path queries. Coordinates remain normalized map-space values; map metrics convert them to meters.

Roads is read-only navigation computation. It does not mutate World location, Map browsing state or Travel progress. Terrain/method speed modifiers are intentionally not embedded in the topology owner; Travel conditions will consume Road routes and calculate traversal behavior separately.


## Godot Travel migration boundary
`godot/travel/travel_state.gd` owns regional travel lifecycle and progress. It does not build road graphs or directly mutate World hierarchy. `travel_module.gd` is the coordinator: it requests a route through the Roads public API and commits a completed destination through the World public API.

The initial vertical slice deliberately covers deterministic regional start/tick/stop/resume/cancel/arrival. Terrain traversal modifiers, events, camp and cross-scope location journeys remain later Travel extensions and must stay behind the same boundary.

## Android debug signing
Current CI Android builds use Godot's standard debug signing path. No project keystore or signing secrets are required at this development stage. The package ID remains `org.eirdan.runtime`, but in-place installation over an older CI APK is not a guaranteed contract until stable signing is intentionally introduced. Mutable saves remain Persistence ownership under Godot `user://`.

## CI domain isolation
Active automatic CI targets Godot/Android only. The preserved PWA campaign, browser smoke, combat regression, diagnostic mirror and Pages deployment are legacy/reference workflows and are manual-only. Promoting a Godot change to `ci/gate` must not execute legacy PWA validation. Legacy gates may be run explicitly when parity/reference work requires them.


## Godot map presentation boundary
Regional map presentation is isolated from gameplay ownership. Camera2D owns pan/zoom only; layered background, roads, route highlight, POIs, labels and party marker render public domain state. Roads has no dependency on Map browsing state. External regional backgrounds may be loaded at runtime from `user://map_assets/<region>/background.{webp,png,jpg,jpeg}`; absence or failure falls back to the native schematic presentation and never blocks World/Roads/Travel. Party marker screen size is compensated against camera zoom. Runtime-loaded visual assets are presentation content, not authoritative map geometry or travel distance.


### Persistence boundary
`SaveStore` owns durable serialization, schema/migration validation, crash-safe activation and backup recovery. Domain systems own their portions of the shared mutable state; UI only requests save/load. Loading replaces state only after modules are stopped, then the composition root restarts modules against the restored state.
