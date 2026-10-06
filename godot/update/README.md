# Android runtime updater

Owner: `update/`. This updates the installed APK, not PackageManager content.

- `runtime_manifest.gd`: version/compatibility/HTTPS/size/SHA-256 contract.
- `android_updater.gd`: explicit check → offer → download → verify → ready → save callback → system installer. Offline failures never block gameplay or remove the installed application.
- `android_installer.gd`: AndroidRuntime/JavaClassWrapper adapter; checks actual APK package ID, versionCode and pinned development signing certificate. Uses Godot's existing FileProvider through OS.shell_open. Android owns final consent and signature enforcement.
- `update_dialog.gd`: UI commands and honest status. `installer_opened` is not installation success. After granting unknown-source permission or cancelling Android installation, press Install again.

APK files are staged under `user://runtime_updates/`; partial files are cleared on failure, cancellation and startup. Verified bytes are rechecked on every installation attempt. No package/save schema changes. A new APK is required for this runtime feature and REQUEST_INSTALL_PACKAGES permission.

## Release contract

`runtime-update.json` contains `format=eirdan-runtime-update`, `format_version=1`, `application_id=org.eirdan.runtime`, `abi=arm64-v8a`, positive integer `version_code`, `version_name`, `min_sdk`, `size_bytes`, lowercase SHA-256 `sha256`, HTTPS `apk_url`.

The feed URL is `eirdan/update/manifest_url` in project settings. It is independent of PackageManager and accepts a provider-neutral manifest. The initial source is the latest GitHub Release asset. Until the first release is published, check reports a recoverable HTTP error; Actions artifacts alone are not an update feed.

Android workflow assigns `versionCode=1000+GITHUB_RUN_NUMBER` before export and generates the exact APK hash/size manifest after signature verification. The workflow number must never be reset under the same package identity without revising this version policy. Re-runs cannot overwrite an existing release tag. Normal CI only uploads artifacts. A manually dispatched build with `publish_update=true` publishes the APK and manifest after validation/export succeed. No credentials are embedded in the client.

## Gates

`npm run test:godot-foundation`, headless boot, package/save/domain integration and `--updater-test`; Android export includes these gates. Updater tests use a fake native adapter, so they do **not** prove JNI/platform behavior.

Required physical Android acceptance: install initial signed updater APK; publish a higher-version APK; check/download; grant install permission; return and install; confirm world/save and packages survive; verify offline launch; cancel download/install; export diagnostics (`android_updater` snapshot + `updater.*` events). If previous APK used a different signing key Android will refuse in-place update; do not uninstall automatically or delete user data.

No automatic polling, silent installs, binary downgrade, or content-package activation.
