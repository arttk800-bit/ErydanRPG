# Eirdan 0.15 migration progress
Current estimate: 77/100.

The Android shell now boots the modular game/ui/index.html directly instead of a placeholder page. Client bootstrap creates the authoritative registry/store/action controller. The UI is wired to real GameState and combat actions. APK workflow already syncs game/ into Android assets, so the app remains offline-first.

Remaining: exact skill/AI parity, production assets/layout, exact fixed-seed/mirror parity, update downloader/version verification, APK validation, and legacy removal.
