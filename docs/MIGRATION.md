# Migration gates

## Completed
- 0.15 repository structure and Android shell.
- Reference monolith inventory: 28 ordered JS blocks, CSS separated, Clash Defiant identified as external binary asset.
- Pure 0.15 battle lifecycle and turn manager implemented with Node regression tests.

## Current gate
Replace alpha14n lifecycle wrappers with the pure core API while preserving 0.14.15 behavior:
- active = alive && !escaped
- resolve after death, escape, summon and turn transition
- summons participate in the same roster/order
- victory is determined only by active combatants

## Next
1. Hex/grid + movement state.
2. Damage/body parts/Resolve.
3. Actions and skills.
4. AI policies.
5. UI.
6. Headless Mirror regression x100 -> x1000 -> x3000.

No rebalance until migration equivalence is established.
