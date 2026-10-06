# ============================================================================
# SAVE SCHEMA
# Owns the persistent save envelope contract and canonical state validation.
# ============================================================================
extends RefCounted

const FORMAT := "eirdan-save"
const FORMAT_VERSION := 1
const STATE_VERSION := 1

static func validate_envelope(envelope: Dictionary) -> Array[String]:
	var errors: Array[String] = []
	if envelope.get("format") != FORMAT:
		errors.append("format must be %s" % FORMAT)
	if int(envelope.get("format_version", 0)) != FORMAT_VERSION:
		errors.append("unsupported save format_version")
	if envelope.get("state") is not Dictionary:
		errors.append("state must be an object")
	return errors

static func validate_state(state: Dictionary) -> Array[String]:
	var errors: Array[String] = []
	var meta = state.get("meta")
	if meta is not Dictionary:
		return ["meta must be an object"]
	if str(meta.get("world_id", "")).is_empty():
		errors.append("meta.world_id is required")
	if str(meta.get("world_name", "")).strip_edges().is_empty():
		errors.append("meta.world_name is required")
	var version := int(meta.get("state_version", 0))
	if version <= 0:
		errors.append("meta.state_version must be positive")
	elif version > STATE_VERSION:
		errors.append("state version is newer than runtime")
	var time = state.get("time")
	if time is not Dictionary:
		errors.append("time must be an object")
	else:
		var day: Variant = time.get("day")
		var second: Variant = time.get("second")
		if not (day is int or day is float) or float(day) != floor(float(day)) or int(day) < 1:
			errors.append("time.day must be a positive integer")
		if not (second is int or second is float) or not is_finite(float(second)) or float(second) < 0.0 or float(second) >= 86400.0:
			errors.append("time.second must be within 0..<86400")
	return errors

static func metadata(state: Dictionary) -> Dictionary:
	var meta = state.get("meta", {})
	if meta is not Dictionary:
		return {}
	return {
		"world_id": str(meta.get("world_id", "")),
		"world_name": str(meta.get("world_name", "")),
		"state_version": int(meta.get("state_version", 0)),
		"created_at": str(meta.get("created_at", "")),
		"updated_at": str(meta.get("updated_at", ""))
	}
