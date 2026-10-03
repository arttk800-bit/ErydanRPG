# Eirdan 0.15 migration progress
Current estimate: 95/100.

Added shared melee skill primitives and regression coverage for Shield Bash and Sweep. Opportunity attacks remain wired into centralized combat movement. Added GitHub Actions validation workflow so every main update can run the modular regression suite automatically.

Validation note: no workflow run is visible yet for the workflow-creation commit, so CI is not counted as passed.

Remaining: get regression CI green; exact alpha14p parity reconciliation; fixed-seed and Mirror parity runs; production UI/assets; release APK validation/updater; legacy cleanup.
