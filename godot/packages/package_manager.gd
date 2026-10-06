# ============================================================================
# PACKAGE MANAGER
# Owns discovery, validation and activation of external Eirdan packages.
# ============================================================================
extends Node

const PACKAGE_DIR := "user://packages"
const ACTIVE_FILE := "user://packages/active.json"
var _active: Array[Dictionary] = []

func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(PACKAGE_DIR))
	_load_active_index()
	Diagnostics.register_provider(&"packages", snapshot)
	Diagnostics.info("packages.ready", {"active_count": _active.size()})

func active_packages() -> Array[Dictionary]:
	return _active.duplicate(true)

func activate_manifest(raw: Dictionary, source: String) -> Dictionary:
	var manifest := EirdanPackageManifest.from_dictionary(raw, source)
	var errors := manifest.validate()
	if not errors.is_empty():
		Diagnostics.error("packages.rejected", {"source": source, "errors": errors})
		return {"ok": false, "errors": errors}
	var record := {
		"id": manifest.id,
		"version": manifest.version,
		"kind": manifest.kind,
		"sha256": manifest.content_hash,
		"source": source
	}
	_active = _active.filter(func(item): return item.get("id") != manifest.id)
	_active.append(record)
	_save_active_index()
	Diagnostics.info("packages.activated", record)
	return {"ok": true, "package": record}

func load_resource_package(path: String) -> bool:
	var ok := ProjectSettings.load_resource_pack(path, true)
	Diagnostics.trace("packages.resource_pack_load", {"path": path, "ok": ok})
	return ok

func snapshot() -> Dictionary:
	return {"active": active_packages(), "directory": PACKAGE_DIR}

func _load_active_index() -> void:
	if not FileAccess.file_exists(ACTIVE_FILE): return
	var file := FileAccess.open(ACTIVE_FILE, FileAccess.READ)
	if file == null: return
	var parsed = JSON.parse_string(file.get_as_text())
	if parsed is Array: _active = parsed

func _save_active_index() -> void:
	var file := FileAccess.open(ACTIVE_FILE, FileAccess.WRITE)
	if file != null: file.store_string(JSON.stringify(_active, "\t"))
