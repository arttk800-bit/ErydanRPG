# Migration gates

1. Mechanical split: HTML/CSS/JS/assets, preserving script order.
2. Boot in Android WebView with no network requirement.
3. Reproduce seed 2030699025 and compare reference result.
4. Run compact Mirror x100, then x1000/3000 against the reference distribution.
5. Replace legacy wrappers subsystem-by-subsystem: lifecycle -> movement -> damage/Resolve -> actions -> AI -> UI -> diagnostics.
6. Delete a legacy wrapper only after its replacement passes regression.

No rebalance during gates 1-5.
