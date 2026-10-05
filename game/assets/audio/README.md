# Audio assets

Audio files belong to the PWA asset pipeline and must use independent revision/integrity metadata when added to the managed asset catalog. Playback policy and context selection belong to the `game/audio/` domain; UI only changes user-facing audio settings.

Do not add remote runtime dependencies or restore the retired APK-specific audio path.
