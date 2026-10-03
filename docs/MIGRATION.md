# Migration gates

## Completed
- Repository structure + Android shell.
- Reference monolith inventory and migration manifest.
- Pure battle lifecycle + turn manager.
- Pure hex grid + movement service.
- Internal chess-like hex IDs (A1..N10) for telemetry; labels are not rendered on the battlefield.
- Movement history records one authoritative event per move and detects immediate A->B->A backtracks.

## Current gate
Migrate damage/body parts/Resolve without changing the alpha14p combat math.

## Movement invariants
- Only movement.js mutates q/r in the new runtime.
- Occupied/out-of-bounds destinations are rejected.
- AI asks movement for legal steps; it does not directly edit coordinates.
- Telemetry is emitted by movement itself, eliminating duplicate observer hooks.
- Immediate backtracking is measurable and can be avoided by path choice.

## Next
1. Damage/body parts/Resolve.
2. Actions and skills.
3. AI policies.
4. UI.
5. Headless Mirror x100 -> x1000 -> x3000.

No rebalance until migration equivalence is established.
