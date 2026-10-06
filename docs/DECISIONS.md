# Eirdan architecture decisions

## ADR-001 — Domain-first modular architecture
**Status:** accepted.

Independent gameplay/technical responsibilities live in explicit domains. A working feature placed in an unrelated convenient file is architectural debt and is not considered complete.

## ADR-002 — UI is an adapter, not gameplay authority
**Status:** accepted.

UI reads state, renders it and forwards user intent. Gameplay state transitions and rules belong to domain systems. This keeps headless simulation/testing possible and prevents mobile UI changes from rewriting game rules.

## ADR-003 — Git repository is the implementation source of truth
**Status:** accepted.

Before modifying an existing system, inspect the current repository implementation. Project documentation explains contracts and decisions but does not override current code silently. When documentation and implementation disagree, resolve the discrepancy explicitly.

## ADR-004 — PWA was the active client target
**Status:** superseded by ADR-013.

The PWA remains preserved as a working reference implementation. New platform/runtime infrastructure targets Godot/Android.

## ADR-005 — PWA updates are detection + forced reload
**Status:** accepted for legacy PWA only.

Eirdan detects remote version/build metadata. It does not present a fake download/install pipeline. When a newer build is available, the client persists the session and reloads the page with cache-busting so normal browser/PWA mechanisms obtain current runtime files.

## ADR-006 — Startup-critical assets are preloaded and build-scoped
**Status:** accepted.

Critical maps/assets are fetched and decoded behind a startup loading screen. They are cached in Cache Storage with cache identity scoped to build ID. A new build therefore receives fresh assets even when filenames are unchanged.

## ADR-007 — Normalized map coordinates are canonical
**Status:** accepted.

World, POI, road and travel positions use normalized 0..1 coordinates. Screen pixels, transforms and future camera/zoom behavior are rendering concerns. Camera features must transform rendering consistently rather than mutate canonical positions.

## ADR-008 — Automated gates are release blockers
**Status:** accepted.

Every relevant change must pass architecture review, syntax/module validation, existing regressions and relevant smoke/diagnostic tests. If a new failure class escapes the gates, strengthen the checks where practical. Version/build/changelog/Service Worker metadata is synchronized only for a release candidate that is expected to pass those gates.

## ADR-009 — External engineering research is allowed and encouraged
**Status:** accepted.

For unfamiliar or established engineering problems, prefer primary documentation, specifications and original/open-source implementations. Reuse ideas and proven patterns after understanding their constraints and fit; do not copy code blindly, and respect licenses when code is reused directly.

## ADR-010 — Runtime modules have one composition boundary
**Status:** accepted.

The application shell does not directly import optional gameplay domains. `game/modules/runtime.js` resolves enabled modules and loads their adapters conditionally. Dependencies are validated by the module registry. Disabled modules must not be evaluated by the active runtime.

## ADR-011 — Automated gates follow enabled domain boundaries
**Status:** accepted.

Campaign, browser/PWA and combat gates are path- and source-scoped. A disabled optional domain does not block unrelated active development. Re-enabling a module requires its domain gate plus an integration/full gate before release.

## ADR-012 — Source files declare responsibility
**Status:** accepted.

Each source file carries a concise responsibility marker. Large cohesive sections may have additional markers. If meaningful section markers reveal unrelated responsibilities in one file, extract modules instead of allowing the comments to legitimize a god-file.


## 2026-10-05 — Maps, time and temporary locations
- Navigation maps stop at region and major mapped-location level. Districts are logical zones; final places never require route graphs or terrain zones.
- Final places may use decorative scene backgrounds without becoming maps.
- Map browsing and physical party position are separate. Preview never teleports or implicitly enters a location.
- Location entry uses stable bidirectional access-port IDs and explicit transition spawn mapping.
- Game time continuously advances only while gameplay is active. Pause, main menu, background/closed PWA stop all simulation with no offline catch-up.
- Sleep is accelerated simulation rather than an instant clock jump and may be interrupted by temporal/context events.
- Camp is a temporary mapless location anchored to party coordinates.
- Local multiplayer remains a future constraint only: world/party simulation must not be owned by one player controller; current guests are expected to join the host party if that design survives.

## 2026-10-05 — Feedback packages and privacy
- Bug reports and suggestions share one Feedback system and portable package format.
- Diagnostics may be attached to reports but does not own report composition or delivery.
- Screenshots are user-selected attachments; the client does not silently capture the screen.
- Device/browser diagnostics require explicit opt-in and exclude location, IP and account identifiers.
- Delivery is a replaceable transport. ZIP download is active now; server/email/GitHub integration must sit behind a future transport/backend rather than exposing repository credentials in the client.


## ADR-013 — Godot/Android is the active development target
**Status:** accepted.

New runtime/client work targets Godot/Android. The PWA is retained until migrated domains have verified replacements. Migration transfers behavior, contracts and data rather than reproducing browser-specific architecture.

## ADR-014 — APK runtime and game content have separate lifecycles
**Status:** accepted.

APK contains the stable runtime/platform layer. Authorable game data and content should use versioned packages where practical. APK rebuilds remain appropriate for Godot/runtime, Android/native integration and fundamental runtime-contract changes.

## ADR-015 — Package activation is transactional
**Status:** accepted.

Package sources are replaceable adapters. PackageManager owns manifest/compatibility validation, staging, integrity verification, activation and rollback. A failed candidate must not destroy the last working active set.

## ADR-016 — Authorable values are data
**Status:** accepted.

Names, balance values, content definitions and similar parameters belong in data when they are not algorithms. DataRegistry resolves base and override layers and exposes provenance. Gameplay systems own behavior and consume resolved data through public contracts.

## ADR-017 — Diagnostics are a completion criterion
**Status:** accepted.

A significant new system provides observable state/events and relevant validation without duplicating its rules. Android/runtime failures must be reproducible from runtime, package, schema and system diagnostic context where practical.
