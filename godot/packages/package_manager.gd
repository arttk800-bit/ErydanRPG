# ============================================================================
# PACKAGE MANAGER
# Owns validated package activation, active/previous slots and rollback.
# ============================================================================
extends Node

const PackageInstaller = preload("res://packages/package_installer.gd")

const RUNTIME_VERSION := "0.1.0"
const PACKAGE_DIR := "user://packages"
const ACTIVE_FILE := PACKAGE_DIR + "/active.json"
const PREVIOUS_FILE := PACKAGE_DIR + "/previous.json"

var _active: Array[Dictionary] = []
var _previous: Array[Dictionary] = []

func _ready() -> void:
	PackageInstaller.prepare_directories()
	_active = _load_index(ACTIVE_FILE)
	_previous = _load_index(PREVIOUS_FILE)
	Diagnostics.register_provider(&"packages", snapshot)
	Diagnostics.info("packages.ready", {"active_count": _active.size(), "runtime": RUNTIME_VERSION})

func active_packages() -> Array[Dictionary]:
	return _active.duplicate(true)

func install_archive(archive_path: String) -> Dictionary:
	Diagnostics.info("packages.install_started", {"source": archive_path})
	var staged := PackageInstaller.stage_archive(archive_path)
	if not staged.ok:
		return _reject(str(staged.get("stage", "staging")), archive_path, [staged.get("error", staged.get("errors", "staging failure"))])
	var manifest = staged.manifest
	if not _runtime_compatible(manifest.runtime_min):
		return _reject("runtime", manifest.identity(), ["requires runtime >= %s" % manifest.runtime_min])

	var install_dir := PackageInstaller.installed_path(manifest)
	var installed_payload := install_dir.path_join(manifest.payload.get_file())
	var copy_error := PackageInstaller.promote_file(staged.payload_path, installed_payload)
	if copy_error != OK:
		return _reject("promotion", manifest.identity(), ["copy error %s" % copy_error])
	var final_integrity := PackageInstaller.verify_payload(manifest, installed_payload)
	if not final_integrity.ok:
		return _reject("promotion-integrity", manifest.identity(), [final_integrity.get("error", "final integrity failure")])

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
	var current := _semver_tuple(RUNTIME_VERSION)
	var minimum := _semver_tuple(required)
	for i in 3:
		if current[i] > minimum[i]: return true
		if current[i] < minimum[i]: return false
	return true

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
