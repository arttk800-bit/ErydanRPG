# Migration gates

## Completed
- Repository structure + Android shell.
- Reference monolith inventory and migration manifest.
- Battle lifecycle + turn manager.
- Hex grid + movement + authoritative movement telemetry.
- Body parts + physical/magic damage + wound shock + Resolve pipeline.
- Action validation layer: AP/mana/range checks and shared physical/spell execution.
- Initial skill adapters: aimed/heavy/spell/bandage.
- AI legal-action context separated from decision policy.

## Current gate
Migrate complete skill semantics from alpha14p, then AI decision policy. AI must call the same action API as manual control.

## Invariants
- No direct coordinate mutation outside movement.
- No death resolution outside lifecycle.
- Resolve loss is applied before lethal resolution.
- No combat rule depends on DOM.
- No rebalance until migration equivalence is established.

## Regression order
Node unit regressions -> fixed seed 2030699025 -> Mirror x100 -> x1000 -> x3000.
