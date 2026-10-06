# ============================================================================
# SAVE STORE
# Owns durable Godot save I/O, validation, migration and crash-safe replacement.
# ============================================================================
extends Node

const SaveSchema = preload("res://persistence/save_schema.gd")
const SaveMigrations = preload("res://persistence/save_migrations.gd")
const SAVE_DIR := "user://saves"

func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(SAVE_DIR))
	_recover_backups()
	Diagnostics.register_provider(&"save_store", snapshot)

func save_state(state: Dictionary) -> Dictionary:
	var errors := SaveSchema.validate_state(state)
	if not errors.is_empty():
		Diagnostics.error("saves.write_rejected", {"errors": errors})
		return {"ok": false, "errors": errors}
	var copy: Dictionary = state.duplicate(true)
	var meta: Dictionary = copy.meta
	meta["updated_at"] = Time.get_datetime_string_from_system(true)
	if str(meta.get("created_at", "")).is_empty(): meta["created_at"] = meta.updated_at
	copy["meta"] = meta
	var world_id := str(meta.world_id)
	if not _valid_world_id(world_id):
		return {"ok": false, "errors": ["meta.world_id contains unsupported characters"]}
	var envelope := {"format": SaveSchema.FORMAT, "format_version": SaveSchema.FORMAT_VERSION, "state": copy}
	var final_path := _path_for(world_id)
	var temp_path := final_path + ".tmp"
	var backup_path := final_path + ".bak"
	_remove_if_exists(temp_path)
	var file := FileAccess.open(temp_path, FileAccess.WRITE)
	if file == null: return _io_error("open", temp_path)
	file.store_string(JSON.stringify(envelope))
	file.flush()
	file = null
	var verified := _read_envelope(temp_path)
	if not verified.ok:
		_remove_if_exists(temp_path)
		Diagnostics.error("saves.write_verification_failed", {"world_id": world_id, "errors": verified.errors})
		return verified
	var had_final := FileAccess.file_exists(final_path)
	if had_final:
		_remove_if_exists(backup_path)
		var backup_error := _rename(final_path, backup_path)
		if backup_error != OK:
			_remove_if_exists(temp_path)
			return _activation_error(world_id, "backup", backup_error)
	var activate_error := _rename(temp_path, final_path)
	if activate_error != OK:
		if had_final and FileAccess.file_exists(backup_path):
			var rollback_error := _rename(backup_path, final_path)
			Diagnostics.error("saves.activation_rolled_back", {"world_id": world_id, "activate_error": activate_error, "rollback_error": rollback_error})
		else:
			Diagnostics.error("saves.activation_failed", {"world_id": world_id, "activate_error": activate_error})
		return {"ok": false, "errors": ["failed to activate verified save: %s" % activate_error]}
	var final_verified := _read_envelope(final_path)
	if not final_verified.ok:
		_remove_if_exists(final_path)
		if had_final and FileAccess.file_exists(backup_path): _rename(backup_path, final_path)
		Diagnostics.error("saves.final_verification_failed", {"world_id": world_id, "errors": final_verified.errors})
		return final_verified
	_remove_if_exists(backup_path)
	Diagnostics.info("saves.written", {"world_id": world_id, "state_version": meta.state_version})
	return {"ok": true, "world_id": world_id, "state": copy}

func load_state(world_id: String) -> Dictionary:
	if not _valid_world_id(world_id): return {"ok": false, "errors": ["valid world_id is required"]}
	_recover_world(world_id)
	var loaded := _read_envelope(_path_for(world_id))
	if not loaded.ok: return loaded
	var migrated := SaveMigrations.migrate(loaded.state)
	if not migrated.ok:
		Diagnostics.error("saves.migration_failed", {"world_id": world_id, "errors": migrated.errors})
		return migrated
	if str(migrated.state.meta.world_id) != world_id:
		return {"ok": false, "errors": ["save world_id does not match requested id"]}
	Diagnostics.info("saves.loaded", {"world_id": world_id, "state_version": migrated.state.meta.state_version})
	return migrated

func delete_save(world_id: String) -> bool:
	if not _valid_world_id(world_id): return false
	var ok := true
	for path in [_path_for(world_id), _path_for(world_id)+".tmp", _path_for(world_id)+".bak"]:
		if FileAccess.file_exists(path) and DirAccess.remove_absolute(ProjectSettings.globalize_path(path)) != OK: ok = false
	if ok: Diagnostics.info("saves.deleted", {"world_id": world_id})
	return ok

func list_saves() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var dir := DirAccess.open(SAVE_DIR)
	if dir == null: return result
	for name in dir.get_files():
		if not name.ends_with(".json"): continue
		var loaded := _read_envelope("%s/%s" % [SAVE_DIR, name])
		if loaded.ok: result.append(SaveSchema.metadata(loaded.state))
	result.sort_custom(func(a,b): return str(a.updated_at)>str(b.updated_at))
	return result

func snapshot() -> Dictionary:
	return {"save_count":list_saves().size(),"format_version":SaveSchema.FORMAT_VERSION,"state_version":SaveSchema.STATE_VERSION}

func _recover_backups() -> void:
	var dir := DirAccess.open(SAVE_DIR)
	if dir == null: return
	for name in dir.get_files():
		if not name.ends_with(".json.bak"): continue
		_recover_world(name.trim_suffix(".json.bak"))

func _recover_world(world_id: String) -> void:
	if not _valid_world_id(world_id): return
	var final_path:=_path_for(world_id)
	var backup_path:=final_path+".bak"
	if not FileAccess.file_exists(backup_path): return
	var final_ok: bool = FileAccess.file_exists(final_path) and bool(_read_envelope(final_path).get("ok", false))
	if final_ok:
		_remove_if_exists(backup_path)
		return
	_remove_if_exists(final_path)
	var error:=_rename(backup_path,final_path)
	if error==OK: Diagnostics.warn("saves.backup_recovered",{"world_id":world_id})
	else: Diagnostics.error("saves.backup_recovery_failed",{"world_id":world_id,"error":error})

func _read_envelope(path:String)->Dictionary:
	var file:=FileAccess.open(path,FileAccess.READ)
	if file==null:return {"ok":false,"errors":["save cannot be opened"]}
	var parsed=JSON.parse_string(file.get_as_text())
	if parsed is not Dictionary:return {"ok":false,"errors":["save must be a JSON object"]}
	var errors:=SaveSchema.validate_envelope(parsed)
	if not errors.is_empty():return {"ok":false,"errors":errors}
	var state:Dictionary=parsed.state
	var state_errors:=SaveSchema.validate_state(state)
	if not state_errors.is_empty():return {"ok":false,"errors":state_errors}
	return {"ok":true,"state":state}

func _valid_world_id(world_id:String)->bool:
	if world_id.is_empty() or world_id.length()>64:return false
	for character in world_id:
		if not (character>="a" and character<="z") and not (character>="A" and character<="Z") and not (character>="0" and character<="9") and character not in ["-","_"]: return false
	return true

func _path_for(world_id:String)->String:
	return "%s/%s.json" % [SAVE_DIR,world_id]

func _rename(from_path:String,to_path:String)->Error:
	return DirAccess.rename_absolute(ProjectSettings.globalize_path(from_path),ProjectSettings.globalize_path(to_path))

func _remove_if_exists(path:String)->void:
	if FileAccess.file_exists(path): DirAccess.remove_absolute(ProjectSettings.globalize_path(path))

func _activation_error(world_id:String,stage:String,error:Error)->Dictionary:
	Diagnostics.error("saves.activation_failed",{"world_id":world_id,"stage":stage,"error":error})
	return {"ok":false,"errors":["save activation %s failed: %s" % [stage,error]]}

func _io_error(operation:String,path:String)->Dictionary:
	var errors:=["save I/O %s failed for %s: %s" % [operation,path,FileAccess.get_open_error()]]
	Diagnostics.error("saves.io_failed",{"operation":operation,"path":path,"errors":errors})
	return {"ok":false,"errors":errors}
