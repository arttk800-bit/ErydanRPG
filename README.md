# Eirdan

Modular browser-installed PWA RPG under active development.

Active runtime: `game/app/`. Gameplay responsibilities are split across `game/core/`, `game/systems/`, `game/combat/`, `game/ai/`, `game/simulation/`, `game/data/` and presentation adapters in `game/ui/`.

The former Android/APK client and 0.14/0.15 migration runtime are retired. Historical behavior that still matters is preserved by current regression/parity tests rather than executable legacy entrypoints.

See `docs/ARCHITECTURE.md`, `docs/SYSTEMS.md`, `docs/PROJECT_LAYOUT.md` and `docs/PROGRESS.md`.
