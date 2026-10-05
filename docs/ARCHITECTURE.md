# Eirdan architecture

Eirdan is a long-term modular RPG project. A feature is complete only when it works and lives behind the correct system boundary.

## Dependency direction
Input / UI -> public system APIs -> domain state and rules -> events / diagnostics -> rendering.

UI renders state and translates user intent into system calls. It must not own gameplay rules.
Domain systems may use shared core primitives and data, but must not reach into another system's internals.
Diagnostics observe behavior and verify invariants; they do not become a second implementation of gameplay.
Static content and balance belong in data modules/files, not UI code.

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

## Module boundary (current campaign)
The active product is the campaign PWA. Runtime capabilities are registered explicitly through `game/core/modules/registry.js` and `game/modules/index.js`.

- `campaign` is enabled by default and owns world/map/travel/character/inventory/knowledge-facing integration.
- `combat` is preserved as a future gameplay module but is disabled in a fresh campaign until explicitly integrated through its public module boundary.
- `combat-lab` is a development tool depending on combat; it is not part of the campaign release gate.
- `game/simulation/`, mirror/parity tooling and historical combat entry points are retained for combat development and reference, not loaded by the campaign shell.
- The browser-installed PWA is the only maintained client target; retired Android and executable 0.14/0.15 migration runtimes are not kept in the active tree.

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
