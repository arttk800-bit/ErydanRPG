# Runtime updater regression: hostile manifests, interrupted/corrupt downloads, consent gates.
extends Node

const Manifest = preload("res://update/runtime_manifest.gd")
const Updater = preload("res://update/android_updater.gd")
const UpdateDialog = preload("res://update/update_dialog.gd")
var failures := 0

class FakeInstaller extends RefCounted:
	var installs := 0
	var reject := false
	var permission := true
	func identity() -> Dictionary: return {"ok": true, "version_code": 1, "sdk": 35}
	func verify_archive(_path: String, _release: Dictionary) -> Dictionary:
		return {"ok": not reject, "error": "apk_signer_mismatch"}
	func request_install(_path: String) -> Dictionary:
		installs += 1
		return {"ok": true, "permission_required": permission}

func _ready() -> void:
	var bytes := "test apk payload".to_utf8_buffer()
	var hash := HashingContext.new()
	hash.start(HashingContext.HASH_SHA256)
	hash.update(bytes)
	var release := {"format": "eirdan-runtime-update", "format_version": 1, "application_id": "org.eirdan.runtime",
		"abi": "arm64-v8a", "version_code": 2, "version_name": "test", "min_sdk": 24,
		"size_bytes": bytes.size(), "sha256": hash.finish().hex_encode(), "apk_url": "https://example.com/runtime.apk"}
	_expect(Manifest.validate(release, 1, 35).available, "new version available")
	_expect(not Manifest.validate(release, 2, 35).available, "same version ignored")
	_expect(not Manifest.validate(release, 3, 35).available, "downgrade ignored")
	_expect(not Manifest.validate(release, 1, 23).ok, "old Android rejected")
	_expect(not Manifest.validate([], 1).ok, "non object rejected")
	for pair in [["version_code", 1.5], ["size_bytes", -1], ["size_bytes", Manifest.MAX_APK_BYTES + 1], ["sha256", "bad"], ["apk_url", "http://example.com/app.apk"], ["apk_url", "https://user:pass@example.com/app.apk"], ["abi", "x86"], ["application_id", "other.app"]]:
		var invalid := release.duplicate(true)
		invalid[pair[0]] = pair[1]
		_expect(not Manifest.validate(invalid, 1).ok, "invalid " + str(pair[0]))
	# Presentation regression: custom action must reach the updater command.
	var dialog_updater := Updater.new()
	dialog_updater.installer = FakeInstaller.new()
	add_child(dialog_updater)
	var dialog := UpdateDialog.new()
	dialog.updater = dialog_updater
	dialog.save_callback = func(): return {"ok": true}
	add_child(dialog)
	dialog._action(&"check")
	_expect(dialog_updater.snapshot().state == "checking", "update dialog check action reaches updater")
	dialog_updater.cancel()
	dialog.queue_free()
	dialog_updater.queue_free()
	var updater := Updater.new()
	var native := FakeInstaller.new()
	updater.installer = native
	add_child(updater)
	updater._current_code = 1
	updater._state = "checking"
	updater._completed(HTTPRequest.RESULT_SUCCESS, 200, [], JSON.stringify(release).to_utf8_buffer())
	_expect(updater.snapshot().state == "available", "manifest offered")
	_write(Updater.PART, bytes)
	updater._state = "downloading"
	updater._completed(HTTPRequest.RESULT_SUCCESS, 200, [], [])
	_expect(updater.snapshot().state == "ready", "verified candidate ready")
	var wrong_hash := release.duplicate(true)
	wrong_hash.sha256 = "0".repeat(64)
	_expect(Manifest.verify_file(Updater.APK, wrong_hash).error == "apk_hash_mismatch", "same-size corruption rejected by hash")
	updater.install(func(): return {"ok": false})
	_expect(native.installs == 0, "save failure blocks installation")
	updater.install(func(): return {"ok": true})
	_expect(updater.snapshot().state == "permission_required", "permission handoff")
	native.permission = false
	updater.install(func(): return {"ok": true})
	_expect(updater.snapshot().state == "installer_opened", "handoff never claims installed")
	_write(Updater.APK, "tampered".to_utf8_buffer())
	updater.install(func(): return {"ok": true})
	_expect(native.installs == 2 and updater.snapshot().state == "error", "recheck blocks modified APK")
	updater._release = release
	updater._state = "downloading"
	_write(Updater.PART, bytes)
	native.reject = true
	updater._completed(HTTPRequest.RESULT_SUCCESS, 200, [], [])
	_expect(updater.snapshot().error == "apk_signer_mismatch", "wrong signer rejected")
	_expect(not FileAccess.file_exists(Updater.PART), "rejected partial removed")
	updater._state = "downloading"
	_write(Updater.PART, bytes)
	updater._completed(HTTPRequest.RESULT_CANT_CONNECT, 0, [], [])
	_expect(updater.snapshot().state == "error" and not FileAccess.file_exists(Updater.PART), "offline failure cleans partial")
	updater.cancel()
	updater._completed(HTTPRequest.RESULT_SUCCESS, 200, [], [])
	_expect(updater.snapshot().state == "idle", "late callback ignored after cancellation")
	updater._state = "checking"
	updater._completed(HTTPRequest.RESULT_REDIRECT_LIMIT_REACHED, 302, ["Location: http://example.com/insecure"], [])
	_expect(updater.snapshot().error == "unsafe_or_excessive_redirect", "HTTP downgrade rejected")
	DirAccess.remove_absolute(ProjectSettings.globalize_path(Updater.APK))
	if failures == 0: print("godot updater integration: OK")
	get_tree().quit(0 if failures == 0 else 1)

func _write(path: String, bytes: PackedByteArray) -> void:
	var file := FileAccess.open(path, FileAccess.WRITE)
	file.store_buffer(bytes)
	file.close()

func _expect(condition: bool, label: String) -> void:
	if not condition:
		failures += 1
		push_error("ASSERT FAILED: " + label)
