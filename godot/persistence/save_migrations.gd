# ============================================================================
# SAVE MIGRATIONS
# Owns ordered transformations between persistent game-state schema versions.
# ============================================================================
extends RefCounted

const SaveSchema = preload("res://persistence/save_schema.gd")

static func migrate(state: Dictionary) -> Dictionary:
	var migrated: Dictionary = state.duplicate(true)
	var meta = migrated.get("meta")
	if meta is not Dictionary:
		return {"ok": false, "errors": ["meta must be an object"]}
	var from_version := int(meta.get("state_version", 0))
	if from_version <= 0:
		return {"ok": false, "errors": ["invalid source state version"]}
	if from_version > SaveSchema.STATE_VERSION:
		return {"ok": false, "errors": ["state version is newer than runtime"]}
	# Future migrations are applied one version at a time here.
	meta["state_version"] = SaveSchema.STATE_VERSION
	migrated["meta"] = meta
	var errors := SaveSchema.validate_state(migrated)
	return {"ok": errors.is_empty(), "state": migrated, "errors": errors}
