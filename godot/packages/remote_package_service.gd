# ============================================================================
# REMOTE PACKAGE SERVICE
# Coordinates catalog/download source adapters with the source-agnostic manager.
# ============================================================================
class_name EirdanRemotePackageService
extends Node

signal catalog_changed(entries: Array[Dictionary])
signal operation_finished(result: Dictionary)

const PackageCatalog = preload("res://packages/package_catalog.gd")
const DOWNLOAD_DIR := "user://packages/downloads"

var _catalog_request: HTTPRequest
var _package_request: HTTPRequest
var _entries: Array[Dictionary] = []
var _pending: Dictionary = {}
var _state := "idle"
var _error := ""

func _ready() -> void:
	_catalog_request = HTTPRequest.new()
	_package_request = HTTPRequest.new()
	add_child(_catalog_request)
	add_child(_package_request)
	_catalog_request.request_completed.connect(_on_catalog_completed)
	_package_request.request_completed.connect(_on_package_completed)
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(DOWNLOAD_DIR))
	Diagnostics.register_provider(&"package_remote", snapshot)

func _exit_tree() -> void:
	Diagnostics.unregister_provider(&"package_remote")

func refresh(url_override: String = "") -> Dictionary:
	if _state in ["catalog", "download"]: return {"ok": false, "error": "busy"}
	var url := url_override if not url_override.is_empty() else str(ProjectSettings.get_setting("eirdan/packages/catalog_url", ""))
	if not url.begins_with("https://"): return _fail("catalog_url_invalid")
	_state = "catalog"
	_error = ""
	Diagnostics.info("packages.catalog_started", {"url": url})
	var err := _catalog_request.request(url)
	if err != OK: return _fail("catalog_request_failed:%s" % err)
	return {"ok": true, "state": _state}

func install(package_id: String) -> Dictionary:
	if _state in ["catalog", "download"]: return {"ok": false, "error": "busy"}
	var entry := _entry(package_id)
	if entry.is_empty(): return _fail("package_not_in_catalog")
	var destination := DOWNLOAD_DIR.path_join("%s-%s.zip" % [package_id.validate_filename(), str(entry.version).validate_filename()])
	_pending = {"entry": entry.duplicate(true), "destination": destination}
	_state = "download"
	_error = ""
	_package_request.download_file = destination
	Diagnostics.info("packages.download_started", {"id": package_id, "version": entry.version, "url": entry.url})
	var err := _package_request.request(str(entry.url))
	if err != OK: return _fail("package_request_failed:%s" % err)
	return {"ok": true, "state": _state, "package": entry}

func entries() -> Array[Dictionary]:
	return _decorate_entries()

func snapshot() -> Dictionary:
	return {"state": _state, "error": _error, "catalog_count": _entries.size(), "entries": _decorate_entries(), "pending": _pending.duplicate(true)}

func _on_catalog_completed(result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
	if result != HTTPRequest.RESULT_SUCCESS or response_code < 200 or response_code >= 300:
		_fail("catalog_http_%s_result_%s" % [response_code, result], true)
		return
	var parsed := PackageCatalog.parse_bytes(body)
	if not parsed.ok:
		_fail("catalog_invalid:%s" % parsed.errors, true)
		return
	_entries.clear()
	for entry in parsed.packages:
		if entry is Dictionary: _entries.append(entry)
	_state = "ready"
	_error = ""
	var decorated := _decorate_entries()
	Diagnostics.info("packages.catalog_ready", {"count": decorated.size(), "updates": decorated.filter(func(item): return item.status == "update").size()})
	catalog_changed.emit(decorated)
	operation_finished.emit({"ok": true, "action": "catalog", "entries": decorated})

func _on_package_completed(result: int, response_code: int, _headers: PackedStringArray, _body: PackedByteArray) -> void:
	var pending := _pending.duplicate(true)
	_pending = {}
	if result != HTTPRequest.RESULT_SUCCESS or response_code < 200 or response_code >= 300:
		_fail("package_http_%s_result_%s" % [response_code, result], true)
		return
	var entry: Dictionary = pending.get("entry", {})
	var destination := str(pending.get("destination", ""))
	var actual := FileAccess.get_sha256(destination)
	if actual.to_lower() != str(entry.get("sha256", "")).to_lower():
		_fail("archive_sha256_mismatch", true)
		return
	var installed := Packages.install_archive(destination)
	if not installed.ok:
		_state = "error"
		_error = "install_rejected"
		var rejected := {"ok": false, "action": "install", "error": _error, "details": installed, "package": entry}
		Diagnostics.error("packages.remote_install_failed", rejected)
		operation_finished.emit(rejected)
		return
	var reloaded := DataRegistry.reload_active_packages(Packages.active_packages())
	if not reloaded.ok:
		Packages.rollback()
		DataRegistry.reload_active_packages(Packages.active_packages())
		_fail("data_reload_failed", true)
		return
	_state = "ready"
	_error = ""
	var completed := {"ok": true, "action": "install", "package": entry, "apply": entry.get("apply", "scene"), "installed": installed.package}
	Diagnostics.info("packages.remote_installed", completed)
	operation_finished.emit(completed)
	catalog_changed.emit(_decorate_entries())

func _decorate_entries() -> Array[Dictionary]:
	var installed_by_id: Dictionary = {}
	for record in Packages.active_packages(): installed_by_id[str(record.get("id", ""))] = record
	var result: Array[Dictionary] = []
	for source in _entries:
		var entry: Dictionary = source.duplicate(true)
		var installed: Dictionary = installed_by_id.get(str(entry.id), {})
		entry["installed_version"] = str(installed.get("version", ""))
		entry["status"] = "install" if installed.is_empty() else ("update" if PackageCatalog.compare_versions(str(installed.version), str(entry.version)) < 0 else "current")
		result.append(entry)
	return result

func _entry(package_id: String) -> Dictionary:
	for entry in _entries:
		if str(entry.get("id", "")) == package_id: return entry
	return {}

func _fail(error: String, emit_result: bool = false) -> Dictionary:
	_state = "error"
	_error = error
	var result := {"ok": false, "error": error}
	Diagnostics.error("packages.remote_failed", result)
	if emit_result: operation_finished.emit(result)
	return result
