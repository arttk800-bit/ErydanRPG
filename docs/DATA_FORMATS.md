# Eirdan data contracts

These are architectural contracts. Concrete content may evolve; persistent schema changes require migration/version handling.

## Session / save
A session is the authoritative mutable game state created by `game/core/session.js` and persisted by `game/core/persistence.js`.

Current persistence:
- IndexedDB database: `eirdan`
- store: `saves`
- key: `meta.worldId`
- save schema constant: `SAVE_VERSION = 1`

Required identity metadata includes a stable internal `worldId`; the player-visible world name is separate (`meta.worldName`). Do not expose or repurpose the internal ID as the display name.

## World state
Relevant shape:
```text
state.world.current = {
  regionId,
  locationId,
  districtId,
  placeId
}

state.world.knowledge[pointId] = {
  discovered,
  visited,
  favorite,
  discoveredBy?
}
```

World coordinates are normalized:
```text
{x: 0..1, y: 0..1}
```
They are data coordinates, not pixels and not zoom-transformed UI coordinates.

## Region/map point data
Regional point definitions use:
```text
{
  id,
  name,
  class,   // location | district | place | transition
  type,
  x,
  y,
  map?     // optional nested map asset
}
```

Map assets live under `game/assets/world`, `regions`, and `locations`. Asset paths belong in data/content definitions or client preload manifests, not hard-coded into gameplay rules.

## Roads
Road data is a graph:
- `nodes[]` contain stable node IDs and normalized coordinates.
- `edges[]` connect node IDs and may contain intermediate geometry.
- `access[pointId]` binds map points to road nodes.
- `metrics` converts normalized geometry to physical map distance.

Routing returns node IDs, segments, a normalized polyline and physical distance. An absent connected route is represented as `null`, not by teleporting or silently inventing a connection.

## Travel
Travel state is stored under `state.world.travel`. Active travel records region, origin/destination, method, route, normalized current position, physical distance progress and optional temporary road anchor.

Cancelling/stopping away from a named point may leave `state.world.position.position` as a free normalized coordinate. This is a valid world position and must not be coerced to the nearest POI.

## Release metadata
`game/data/version.json`, `game/ui/build.json`, changelog release entries and `game/sw.js` build ID must describe the same released code. A user-significant release is not complete until these values are synchronized and validation gates pass.


## Map access ports and transitions (0.88)

Mapped locations may expose multiple regional access ports under `roads.access[locationId].ports`. Each port owns a stable `id` and regional road `node`. A location-level `transition` is the only boundary POI type and binds to the same port id with its local road `node`, `pointId`, and `externalNode`. Runtime entry stores `entryPortId` so entering a location resolves to the matching transition instead of a generic spawn point. Legacy single `{node}` access remains readable during migration; legacy `gate` / `entrance` / `exit` POIs are migrated to `transition`.

Map Editor user exports use the complete `eirdan-map-editor` bundle (`Экспорт всех карт`). Partial POI/road/terrain exports are no longer exposed in the editor UI.


## Simulation and location entry (schema 3)
`state.simulation.runtime` stores the active simulation mode, temporal-event accumulator and optional sleep state. `state.simulation.clock.fraction` preserves sub-minute clock progress. These fields are runtime/game-state data, not wall-clock timestamps; no offline catch-up is performed.

Mapped-location access uses the same stable port ID on both scopes. Regional `roads.access[locationId].ports[]` identifies the external road node. Location navigation `access[locationId].ports[]` maps that ID to a local transition `pointId` and local node. Arrival stores `entryPortId`; entry resolves the matching transition. Fallback order is transition → district → place → temporary center spawn.

Final places do not contain navigation `map` data. A decorative `sceneBackground` may reference a PNG or other presentation asset without enabling Map/Travel semantics.

## Feedback package v1
A feedback package contains `report.json` / `report.txt`, optional `screenshots/`, and optional `diagnostics/`. `report.json` uses format `eirdan-feedback`, version 1, type `bug` or `suggestion`, release metadata, attachment metadata and `technicalInfoConsent`. Technical device information is absent unless that consent value is true. Bug-only fields are steps, expected and actual; suggestions use the common title/text fields.

## State schema v4
- `clock.second`: canonical seconds elapsed in the current game day; `clock.minute` remains a derived compatibility/display value.
- `simulation.runtime.fastForward`: transient binary fast-forward flag; valid only for travel/sleep modes.
- Runtime pause reasons are not restored from saves.
- Regional road access for a mapped POI: `access[poiId] = { node: roadNodeId }`.
- Location navigation selects its single boundary transition with `access[locationId] = { node: navigationNodeId, pointId: transitionPointId }`.
- Legacy regional `ports[]` data is collapsed to one access node when editable regional roads are loaded; internal location multi-access data remains readable.


## Godot portable package v1
A downloadable/user package is one ZIP document so Android SAF needs access to only one selected file. The archive contains `manifest.json` and the declared payload.

The manifest identifies format/version, stable package ID, package version, kind, minimum runtime version, payload and payload SHA-256. Supported foundation kinds are `content`, `override` and `development`.

Install lifecycle: validation → staging → SHA-256 verification → installed storage → activation. PackageManager retains the previous active set for rollback. Mutable installed content lives under `user://packages`.

## Godot data layers
Base data is packaged read-only content. Active override packages may provide sparse nested values. DataRegistry resolves effective values without mutating base definitions and exposes provenance for queried paths.

Stable IDs are identity; player-visible names are data and may change without changing references. Save/session state and package/content definitions remain separate contracts.

## Version separation
Android runtime/APK version, package/content version, save schema, diagnostics format and asset revisions are independent version axes. Diagnostics should identify the combination needed to reproduce a failure.


## Godot package activation order
Package manifests may declare `dependencies[]`, `conflicts[]` and integer `priority`. Package IDs are the dependency/conflict identity. Package Manager validates the complete candidate active set before replacing the current one. Missing dependencies, cycles and conflicts reject activation. The resolved load order is deterministic: dependency constraints first; otherwise ascending `priority`, then package ID. DataRegistry consumes this resolved order and does not infer override precedence from activation history.
