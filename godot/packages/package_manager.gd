# ============================================================================
# PACKAGE MANAGER
# Owns validated package activation, active/previous slots and rollback.
# ============================================================================
extends Node

const RUNTIME_VERSION := "0.1.0"
const PACKAGE_DIR := "user://packages"
const ACTIVE_FILE := PACKAGE_DIR + "/active.json"
const PREVIOUS_FILE := PACKAGE_DIR + "/previous.json"

var _active: Array[Dictionary] = []
var _previous: Array[Dictionary] = []

func _ready() -> void:
	EirdanPackageInstaller.prepare_directories()
	_active = _load_index(ACTIVE_FILE)
	_previous = _load_index(PREVIOUS_FILE)
	Diagnostics.register_provider(&"packages", snapshot)
	Diagnostics.info("packages.ready", {"active_count": _active.size(), "runtime": RUNTIME_VERSION})

func active_packages() -> Array[Dictionary]:
	return _active.duplicate(true)

func install(manifest_path: String, payload_path: String) -> Dictionary:
	var manifest_result := EirdanPackageInstaller.read_manifest(manifest_path)
	if not manifest_result.ok:
		return _reject("manifest", manifest_path, manifest_result.get("errors", []))
	var manifest: EirdanPackageManifest = manifest_result.manifest
	if not _runtime_compatible(manifest.runtime_min):
		return _reject("runtime", manifest.identity(), ["requires runtime >= %s" % manifest.runtime_min])
	var integrity := EirdanPackageInstaller.verify_payload(manifest, payload_path)
	if not integrity.ok:
		return _reject("integrity", manifest.identity(), [integrity.get("error", "integrity failure")])

	var install_dir := EirdanPackageInstaller.installed_path(manifest)
	var installed_payload := install_dir.path_join(manifest.payload.get_file())
	var copy_error := EirdanPackageInstaller.promote_file(payload_path, installed_payload)
	if copy_error != OK:
		return _reject("promotion", manifest.identity(), ["copy error %s" % copy_error])

	var record := {
		"id": manifest.id,
		"version": manifest.version,
		"kind": manifest.kind,
		"sha256": manifest.content_hash,
		"path": installed_payload
	}
	return activate(record)

func activate(record: Dictionary) -> Dictionary:
	_previous = _active.duplicate(true)
	var next := _active.filter(func(item): return item.get("id") != record.get("id"))
	next.append(record.duplicate(true))
	if not _save_index(PREVIOUS_FILE, _previous):
		return _reject("index", str(record.get("id")), ["cannot persist previous slot"])
	if not _save_index(ACTIVE_FILE, next):
		return _reject("index", str(record.get("id")), ["cannot persist active slot"])
	_active = next
	Diagnostics.info("packages.activated", record)
	return {"ok": true, "package": record}

func rollback() -> Dictionary:
	if _previous.is_empty():
		return {"ok": false, "error": "no previous package set"}
	var current := _active
	if not _save_index(ACTIVE_FILE, _previous):
		return {"ok": false, "error": "cannot persist rollback"}
	_active = _previous
	_previous = current
	_save_index(PREVIOUS_FILE, _previous)
	Diagnostics.warn("packages.rollback", {"active_count": _active.size()})
	return {"ok": true, "active": active_packages()}

func load_active_resource_packs() -> Dictionary:
	var failures: Array[Dictionary] = []
	for record in _active:
		var path := str(record.get("path", ""))
		if path.get_extension().to_lower() not in ["pck", "zip"]:
			continue
		var ok := ProjectSettings.load_resource_pack(path, true)
		Diagnostics.trace("packages.resource_pack_load", {"path": path, "ok": ok})
		if not ok: failures.append({"id": record.get("id"), "path": path})
	return {"ok": failures.is_empty(), "failures": failures}

func snapshot() -> Dictionary:
	return {
		"runtime_version": RUNTIME_VERSION,
		"active": active_packages(),
		"previous": _previous.duplicate(true),
		"directory": PACKAGE_DIR
	}

func _runtime_compatible(required: String) -> bool:
	if required.is_empty(): return true
	return _semver_tuple(RUNTIME_VERSION) >= _semver_tuple(required)

func _semver_tuple(value: String) -> Array[int]:
	var result: Array[int] = [0, 0, 0]
	var parts := value.split(".")
	for i in mini(parts.size(), 3):
		result[i] = int(parts[i])
	return result

func _reject(stage: String, source: String, errors) -> Dictionary:
	var result := {"ok": false, "stage": stage, "source": source, "errors": errors}
	Diagnostics.error("packages.rejected", result)
	return result

func _load_index(path: String) -> Array[Dictionary]:
	if not FileAccess.file_exists(path): return []
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null: return []
	var parsed = JSON.parse_string(file.get_as_text())
	if parsed is not Array: return []
	var result: Array[Dictionary] = []
	for item in parsed:
		if item is Dictionary: result.append(item)
	return result

func _save_index(path: String, records: Array[Dictionary]) -> bool:
	var temp := path + ".tmp"
	var file := FileAccess.open(temp, FileAccess.WRITE)
	if file == null: return false
	file.store_string(JSON.stringify(records, "\t"))
	file.flush()
	file = null
	var absolute_temp := ProjectSettings.globalize_path(temp)
	var absolute_path := ProjectSettings.globalize_path(path)
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(absolute_path)
	return DirAccess.rename_absolute(absolute_temp, absolute_path) == OK
