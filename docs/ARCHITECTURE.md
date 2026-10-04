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
- `game/client/` — PWA/runtime infrastructure: release metadata, update detection, startup asset loading and client cache behavior.
- `game/core/` — shared state/session primitives, commands/events, persistence foundations and battle lifecycle primitives.
- `game/combat/` — combat rules and action semantics.
- `game/ai/` — AI decision policies consuming legal gameplay APIs.
- `game/systems/` — world-facing domain systems such as world state, roads, travel, pause/game speed and inventory.
- `game/simulation/` — headless simulations, parity and telemetry.
- `game/diagnostics/` — runtime traces, smoke/regression diagnostics and diagnostic export.
- `game/ui/` — rendering and user interaction only.
- `game/data/` — static game/world/content data.
- `game/assets/` — binary and visual/audio resources.
- `game/runtime/` and legacy migration modules — compatibility/migration only; they are not targets for new independent responsibilities.

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
Requirement -> inspect current architecture -> identify owning systems -> implement -> architecture review -> full JS syntax gate -> regression tests -> relevant smoke/diagnostic tests -> fix failures -> synchronize version/build/changelog/Service Worker -> release.

Do not perform unrelated global refactors, but when touched legacy code clearly belongs to the system being changed, migrate it toward the current boundary as part of that work.
