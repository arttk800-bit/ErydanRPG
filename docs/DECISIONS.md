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

## ADR-004 — PWA is the active client target
**Status:** accepted.

New client infrastructure targets the PWA. Existing Android/APK code/workflows are compatibility/history unless explicitly reactivated as a product target.

## ADR-005 — Updates are detection + forced reload
**Status:** accepted.

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
