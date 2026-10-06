# Eirdan — implemented capabilities

This file is a concise inventory of functionality that exists in the repository now. It is not a changelog, implementation diary or roadmap.

## Application
- Browser-installed PWA client with main menu, game session and settings.
- World creation, loading and deletion with persistent saves.
- Version/build metadata, update detection and forced refresh.
- Startup loading of critical assets and revisioned asset caching.

## World
- Persistent world/session state with world, region, location, district and place hierarchy.
- Separate physical party position and map-browsing state.
- Discovery/visited knowledge state for world points.
- Continuous game clock, pause, travel/sleep fast-forward and temporary camps.

## Maps
- World, regional and mapped-location views.
- Normalized map coordinates with physical map metrics.
- Authored POIs, terrain and road graphs.
- Map Editor for POIs, roads, terrain and complete map export.
- Generic map registry and map validation diagnostics.

## Travel
- Route planning over regional and local road graphs.
- Physical travel distance and progressive movement.
- Named-destination and free-position travel.
- Stop, camp, resume and cancel flow.
- Region-to-location transition through one regional access node and one selected location transition.

## Combat development baseline
- Modular combat rules for actions, movement, damage, body parts, statuses, resolve and retreat.
- AI policies using legal gameplay actions.
- Headless battle simulation, deterministic seeds, mirror/parity analysis and telemetry.
- Combat is currently disabled in the active campaign runtime and retained as an independent development domain.

## Audio
- Music and ambience catalog with semantic environment contexts.
- UI sound effects and audio diagnostics.

## Diagnostics and feedback
- Runtime/action traces and domain diagnostics for state, world/simulation, maps, travel, PWA/cache and audio.
- Downloadable diagnostic archive.
- Bug/suggestion packages with optional screenshots and diagnostics.
- Automated campaign regression, syntax/module and browser smoke gates.

## Data and persistence
- Versioned persistent state with migrations.
- Stable internal world IDs separate from display names.
- Static game/world/balance definitions separated from mutable session state.
- Versioned release metadata and changelog.
