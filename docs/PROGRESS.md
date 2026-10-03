# Eirdan 0.15 migration progress
Current estimate: 92/100.

Opportunity attacks are now wired into shared combat movement rather than existing as an isolated helper. AI approach and retreat both use the same movement pipeline; movement telemetry remains centralized and records A1..N10 transitions.

Remaining: finish exact skill/AI parity, production UI/assets, run and reconcile fixed-seed + Mirror parity gates, validate Android release APK/updater, then remove legacy code.
