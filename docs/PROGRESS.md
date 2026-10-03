# Eirdan 0.15 migration progress
Current estimate: 81/100.

Added update manifest validation/version comparison, runtime cache/integrity helpers, connectivity detection and Android JS bridge. The APK remains offline-first; update infrastructure can check a remote manifest without making the game itself depend on network access.

Remaining: exact skill/AI parity, production assets/layout, exact fixed-seed and Mirror parity, Android build validation/release APK, updater installation path, and legacy cleanup.
