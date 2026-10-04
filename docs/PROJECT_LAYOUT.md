# Eirdan project layout

## Runtime
- `game/app/` — shell, navigation, lifecycle and screen composition.
- `game/core/` — session and persistence primitives.
- `game/systems/` — gameplay/domain logic without rendering.
- `game/ui/` — rendering and interaction layers.
- `game/data/` — static game data.
- `game/data/regions/` — one data module per world region.
- `game/client/` — release/update client.
- `game/diagnostics/` — runtime diagnostics and delivery.

## Assets target layout
- `game/assets/world/` — global world maps, masks and world-only overlays.
- `game/assets/regions/` — regional maps.
- `game/assets/locations/` — maps of cities, forests, dungeons and other nested locations.
- `game/assets/ui/` — future interface art/icons.
- `game/assets/fonts/` — future bundled fonts.

Current map migration target:
- `eirdan-world-map-regions-final.png` → `assets/world/eirdan-world-map-regions-final.png`
- `eirdan-world-region-index-final.png` → `assets/world/eirdan-world-region-index-final.png`
- `region-central-lands.png` → `assets/regions/region-central-lands.png`
- `city-01-central-lands.png` → `assets/locations/city-01-central-lands.png`

Binary files remain at their existing paths until they can be moved without re-encoding or losing source bytes. Runtime references must be switched in the same release as the physical move.
