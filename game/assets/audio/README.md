# Audio assets

Audio files belong to the PWA asset pipeline and must use independent revision/integrity metadata when added to the managed asset catalog. Playback policy and context selection belong to the `game/audio/` domain; UI only changes user-facing audio settings.

Do not add remote runtime dependencies or restore the retired APK-specific audio path.

## Runtime library
Tracks are grouped by semantic asset category (`battle`, `forest`, `town`, `overworld`, `castle`, `themes`). Runtime code addresses them through managed asset IDs in `game/audio/catalog.js`, not filenames. Music is lazy-cached and integrity-checked on first use; it is not part of startup preload.

See `LICENSES.md` for attribution and source integrity.
