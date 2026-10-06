# Runtime APK update state machine. Never installs content packages or mutates saves.
extends Node

signal changed(snapshot: Dictionary)
const Manifest = preload("res://update/runtime_manifest.gd")
const AndroidInstaller = preload("res://update/android_installer.gd")
const PART := "user://runtime_updates/download.part"
const APK := "user://runtime_updates/verified.apk"

var installer = AndroidInstaller.new()
var _request: HTTPRequest
var _state := "idle"
var _error := ""
var _release: Dictionary = {}
var _current_code := 0
var _sdk := 0
var _redirects := 0
var _last_progress_bytes := -1

func _ready() -> void:
	_request = HTTPRequest.new()
	_request.timeout = 60.0
	# Follow only validated HTTPS redirects; never downgrade transport security.
	_request.max_redirects = 0
	add_child(_request)
	_request.request_completed.connect(_completed)
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(PART.get_base_dir()))
	_remove_partial()
	Diagnostics.register_provider(&"android_updater", snapshot)

func _process(_delta: float) -> void:
	if _state != "downloading" or _request == null: return
	var downloaded := _request.get_downloaded_bytes()
	if downloaded == _last_progress_bytes: return
	_last_progress_bytes = downloaded
	changed.emit(snapshot())

func _exit_tree() -> void:
	Diagnostics.unregister_provider(&"android_updater")

func snapshot() -> Dictionary:
	var downloaded := _request.get_downloaded_bytes() if _request != null and _state == "downloading" else 0
	var total := int(_release.get("size_bytes", 0))
	var progress := clampf(float(downloaded) / float(total), 0.0, 1.0) if total > 0 else 0.0
	return {"state": _state, "error": _error, "current_version_code": _current_code,
		"candidate_version_code": _release.get("version_code", 0), "version_name": _release.get("version_name", ""),
		"downloaded_bytes": downloaded, "size_bytes": total, "progress": progress}

func check() -> void:
	Diagnostics.info("updater.check_entered", {"state": _state})
	if _state in ["checking", "downloading"]: return
	_release = {}
	# Export CI embeds the immutable APK version code. Do not query PackageManager during update checks:
	# JNI is an installation adapter concern, and a JNI failure must never make the Check button inert.
	_current_code = int(ProjectSettings.get_setting("eirdan/runtime/version_code", 0))
	_sdk = 0
	if _current_code <= 0:
		# Source/headless builds have no exported identity; keep the adapter fallback for integration tests.
		var identity: Dictionary = installer.identity()
		if not identity.ok:
			_fail(str(identity.error))
			return
		_current_code = int(identity.version_code)
		_sdk = int(identity.sdk)
	Diagnostics.info("updater.runtime_identity", {"version_code": _current_code, "sdk": _sdk})
	var url: String = ProjectSettings.get_setting("eirdan/update/manifest_url", "")
	if not Manifest.secure_url(url):
		_fail("update_source_not_configured")
		return
	_request.download_file = ""
	_request.body_size_limit = 65536
	_request.timeout = 30.0
	_redirects = 0
	_set_state("checking")
	var err := _request.request(url)
	if err != OK: _fail("manifest_request_failed")

func download() -> void:
	if _state != "available": return
	_remove_partial()
	_request.download_file = PART
	_request.body_size_limit = int(_release.size_bytes)
	_request.timeout = 600.0
	_redirects = 0
	_last_progress_bytes = -1
	_set_state("downloading")
	var err := _request.request(str(_release.apk_url))
	if err != OK: _fail("apk_request_failed")

func cancel() -> void:
	_request.cancel_request()
	_remove_partial()
	_release = {}
	_set_state("idle")

func install(save_before_install: Callable) -> void:
	if not _state in ["ready", "permission_required", "installer_opened"]: return
	# Recheck on every attempt, including return from Android settings.
	var verified := Manifest.verify_file(APK, _release)
	if not verified.ok:
		_fail(str(verified.error))
		return
	var native: Dictionary = installer.verify_archive(APK, _release)
	if not native.ok:
		_fail(str(native.error))
		return
	var saved: Dictionary = save_before_install.call()
	if not saved.get("ok", false):
		_error = "save_before_install_failed"
		Diagnostics.error("updater.save_blocked")
		changed.emit(snapshot())
		return
	var result: Dictionary = installer.request_install(APK)
	if not result.ok:
		_fail(str(result.error))
		return
	_set_state("permission_required" if result.get("permission_required", false) else "installer_opened")

func _completed(result: int, code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	if not _state in ["checking", "downloading"]: return
	if code in [301, 302, 303, 307, 308]:
		var location := ""
		for header in headers:
			if header.to_lower().begins_with("location:"): location = header.substr(9).strip_edges()
		if _redirects >= 5 or not Manifest.secure_url(location):
			_fail("unsafe_or_excessive_redirect")
			return
		_redirects += 1
		if _request.request(location) != OK: _fail("redirect_request_failed")
		return
	if result != HTTPRequest.RESULT_SUCCESS or code != 200:
		_fail("http_%s_%s" % [result, code])
		return
	if _state == "checking":
		var validated := Manifest.validate(JSON.parse_string(body.get_string_from_utf8()), _current_code, _sdk)
		if not validated.ok:
			_fail(str(validated.error))
			return
		_release = validated.release
		_set_state("available" if validated.available else "up_to_date")
		return
	_set_state("verifying_hash")
	var verified := Manifest.verify_file(PART, _release)
	if not verified.ok:
		_fail(str(verified.error))
		return
	_set_state("verifying_apk")
	var native: Dictionary = installer.verify_archive(PART, _release)
	if not native.ok:
		_fail(str(native.error))
		return
	if DirAccess.rename_absolute(ProjectSettings.globalize_path(PART), ProjectSettings.globalize_path(APK)) != OK:
		_fail("apk_staging_failed")
		return
	_set_state("ready")

func _remove_partial() -> void:
	if FileAccess.file_exists(PART): DirAccess.remove_absolute(ProjectSettings.globalize_path(PART))

func _fail(reason: String) -> void:
	_remove_partial()
	_error = reason
	_state = "error"
	Diagnostics.error("updater.failed", {"reason": reason})
	changed.emit(snapshot())

func _set_state(value: String) -> void:
	_state = value
	_error = ""
	Diagnostics.info("updater." + value, {"version_code": _release.get("version_code", 0)})
	changed.emit(snapshot())
