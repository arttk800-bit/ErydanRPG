# Eirdan Godot Runtime

This directory is an isolated Android/runtime prototype. The existing PWA under `game/` remains intact and is the reference implementation until the Godot foundation is proven on a real device.

Target engine: **Godot 4.7.2 stable**.

## Foundation responsibilities
- `app/` — bootstrap UI and composition only.
- `packages/` — package manifests, sources/import and activation.
- `data/` — base data, ordered overrides and value provenance.
- `diagnostics/` — structured event log and registered system snapshots.

## Non-goals of this phase
World, Map, Travel, Combat, saves and existing gameplay are not being ported yet. No old runtime is deleted.

## Package activation contract
Future package installation follows:

download/import → manifest validation → SHA-256 verification → staging → load/validation → atomic activation → retain previous known-good version → cleanup later.

A failed package must never destroy the active package.

## Data contract
Gameplay systems consume resolved values from DataRegistry. Editors and user packages create override layers instead of modifying official base data. DataRegistry retains provenance so diagnostics can explain which package supplied the final value.

## Diagnostics contract
Every substantial runtime/domain system registers a read-only diagnostic provider when initialized and emits structured events for meaningful state transitions/errors. Diagnostics observes public state; it does not reimplement domain rules.

## Next foundation block
1. package file reader + manifest schema;
2. SHA-256 verification;
3. staging/active/rollback slots;
4. HTTP package source independent from GitHub;
5. Android SAF import into staging;
6. ZIP diagnostic export;
7. headless Godot validation in CI;
8. first Android APK proof.
