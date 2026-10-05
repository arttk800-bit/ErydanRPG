# Diagnostics

Runtime diagnostics are development tools and do not own gameplay behavior.

The dedicated Debug screen runs checks manually and can export a diagnostic archive. Shell diagnostics cover runtime/API availability, Service Worker/update state, persistence availability, managed asset-cache health, travel invariants, UI smoke checks and RuntimeTrace self-test.

Managed asset diagnostics compare the current asset manifest with the stable asset cache and report missing or stale revisions. A changed asset is downloaded and validated before its previous cached revision is removed.

Simulation diagnostics remain separate from campaign runtime diagnostics. Simulation summaries include elapsed wall time; movement uses internal A1..N10 hex IDs; SkillAudit aggregates skill usage globally and by class. Full movement tails are reserved for anomaly traces to avoid oversized ordinary logs.
