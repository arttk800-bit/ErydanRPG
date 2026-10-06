# ============================================================================
# SAVE STORE
# Owns durable Godot save I/O, validation, migration and atomic replacement.
# ============================================================================
extends Node

const SaveSchema = preload("res://persistence/save_schema.gd")
const SaveMigrations = preload("res://persistence/save_migrations.gd")
const SAVE_DIR := "user://saves"

func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(SAVE_DIR))
	Diagnostics.register_provider(&"save_store", snapshot)

func save_state(state: Dictionary) -> Dictionary:
	var errors := SaveSchema.validate_state(state)
	if not errors.is_empty():
		Diagnostics.error("saves.write_rejected", {"errors": errors})
		return {"ok": false, "errors": errors}
	var copy: Dictionary = state.duplicate(true)
	var meta: Dictionary = copy.meta
	meta["updated_at"] = Time.get_datetime_string_from_system(true)
	copy["meta"] = meta
	var envelope := {
		"format": SaveSchema.FORMAT,
		"format_version": SaveSchema.FORMAT_VERSION,
		"state": copy
	}
	var world_id := str(meta.world_id)
	var final_path := _path_for(world_id)
	var temp_path := final_path + ".tmp"
	var file := FileAccess.open(temp_path, FileAccess.WRITE)
	if file == null:
		return _io_error("open", temp_path)
	file.store_string(JSON.stringify(envelope))
	file.flush()
	file = null
	var verified := _read_envelope(temp_path)
	if not verified.ok:
		DirAccess.remove_absolute(ProjectSettings.globalize_path(temp_path))
		Diagnostics.error("saves.write_verification_failed", {"world_id": world_id, "errors": verified.errors})
		return verified
	var absolute_final := ProjectSettings.globalize_path(final_path)
	var absolute_temp := ProjectSettings.globalize_path(temp_path)
	if FileAccess.file_exists(final_path):
		var remove_error := DirAccess.remove_absolute(absolute_final)
		if remove_error != OK:
			return {"ok": false, "errors": ["failed to replace existing save: %s" % remove_error]}
	var rename_error := DirAccess.rename_absolute(absolute_temp, absolute_final)
	if rename_error != OK:
		return {"ok": false, "errors": ["failed to activate verified save: %s" % rename_error]}
	Diagnostics.info("saves.written", {"world_id": world_id, "state_version": meta.state_version})
	return {"ok": true, "world_id": world_id, "state": copy}

func load_state(world_id: String) -> Dictionary:
	if world_id.is_empty():
		return {"ok": false, "errors": ["world_id is required"]}
	var loaded := _read_envelope(_path_for(world_id))
	if not loaded.ok:
		return loaded
	var migrated := SaveMigrations.migrate(loaded.state)
	if not migrated.ok:
		Diagnostics.error("saves.migration_failed", {"world_id": world_id, "errors": migrated.errors})
		return migrated
	if str(migrated.state.meta.world_id) != world_id:
		return {"ok": false, "errors": ["save world_id does not match requested id"]}
	Diagnostics.info("saves.loaded", {"world_id": world_id, "state_version": migrated.state.meta.state_version})
	return migrated

func delete_save(world_id: String) -> bool:
	if world_id.is_empty(): return false
	var path := _path_for(world_id)
	if not FileAccess.file_exists(path): return true
	var error := DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
	if error == OK: Diagnostics.info("saves.deleted", {"world_id": world_id})
	return error == OK

func list_saves() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var dir := DirAccess.open(SAVE_DIR)
	if dir == null: return result
	for name in dir.get_files():
		if not name.ends_with(".json"): continue
		var loaded := _read_envelope("%s/%s" % [SAVE_DIR, name])
		if loaded.ok: result.append(SaveSchema.metadata(loaded.state))
	result.sort_custom(func(a, b): return str(a.updated_at) > str(b.updated_at))
	return result

func snapshot() -> Dictionary:
	return {"save_count": list_saves().size(), "format_version": SaveSchema.FORMAT_VERSION, "state_version": SaveSchema.STATE_VERSION}

func _read_envelope(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null: return {"ok": false, "errors": ["save cannot be opened"]}
	var parsed = JSON.parse_string(file.get_as_text())
	if parsed is not Dictionary: return {"ok": false, "errors": ["save must be a JSON object"]}
	var errors := SaveSchema.validate_envelope(parsed)
	if not errors.is_empty(): return {"ok": false, "errors": errors}
	var state: Dictionary = parsed.state
	var state_errors := SaveSchema.validate_state(state)
	if not state_errors.is_empty(): return {"ok": false, "errors": state_errors}
	return {"ok": true, "state": state}

func _path_for(world_id: String) -> String:
	return "%s/%s.json" % [SAVE_DIR, world_id.validate_filename()]

func _io_error(operation: String, path: String) -> Dictionary:
	var errors := ["save I/O %s failed for %s: %s" % [operation, path, FileAccess.get_open_error()]]
	Diagnostics.error("saves.io_failed", {"operation": operation, "path": path, "errors": errors})
	return {"ok": false, "errors": errors}
