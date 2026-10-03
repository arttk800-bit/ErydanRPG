# Eirdan 0.15 migration progress
Current estimate: 97/100.

The modular regression suite now includes an explicit Mirror parity acceptance gate. It validates the locked 3000-battle reference and verifies that material deviations are rejected rather than silently accepted.

CI status: the GitHub connector currently reports no workflow run for the latest main commit, so CI is not claimed as green.

Remaining: execute the new engine's real Mirror x3000 and reconcile it against the locked alpha14 reference; validate production UI/assets; build and validate the Android release APK/updater; remove legacy remnants only after parity.
