# 0.14.15 -> 0.15 runtime migration

The reference monolith has been mechanically split locally into one stylesheet, 28 ordered scripts and external Clash Defiant audio. Script order is recorded in migration-manifest.json. This stage intentionally preserves legacy wrappers. Subsystems are replaced only after fixed-seed and mirror regression checks.

The 12 MB MP3 is no longer embedded as a data URI. Binary assets are intentionally external files.
