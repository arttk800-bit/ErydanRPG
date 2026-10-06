# ============================================================================
# DATA SCHEMA
# Owns structural validation for authored base data and sparse override data.
# ============================================================================
extends RefCounted

const ROOT_DOMAINS := ["travel", "items"]

static func validate_base(data: Dictionary) -> Array[String]:
	var errors: Array[String] = []
	_validate_known_roots(data, errors)
	_validate_travel(data.get("travel"), "travel", true, errors)
	_validate_entities(data.get("items"), "items", true, errors)
	return errors

static func validate_override(data: Dictionary, base: Dictionary) -> Array[String]:
	var errors: Array[String] = []
	_validate_known_roots(data, errors)
	if data.has("travel"):
		_validate_travel(data.travel, "travel", false, errors)
	if data.has("items"):
		_validate_entities(data.items, "items", false, errors)
	_validate_override_targets(data, base, errors)
	return errors

static func _validate_known_roots(data: Dictionary, errors: Array[String]) -> void:
	for key in data:
		if str(key) not in ROOT_DOMAINS:
			errors.append("unknown root domain: %s" % key)

static func _validate_travel(value, path: String, required: bool, errors: Array[String]) -> void:
	if value == null:
		if required: errors.append("%s is required" % path)
		return
	if value is not Dictionary:
		errors.append("%s must be an object" % path)
		return
	for key in value:
		if str(key) not in ["walk_speed_kmh", "horse_speed_kmh"]:
			errors.append("%s.%s is not supported" % [path, key])
	for key in ["walk_speed_kmh", "horse_speed_kmh"]:
		if not value.has(key):
			if required: errors.append("%s.%s is required" % [path, key])
			continue
		var speed = value[key]
		if speed is not float and speed is not int:
			errors.append("%s.%s must be numeric" % [path, key])
		elif float(speed) <= 0.0:
			errors.append("%s.%s must be > 0" % [path, key])

static func _validate_entities(value, path: String, required: bool, errors: Array[String]) -> void:
	if value == null:
		if required: errors.append("%s is required" % path)
		return
	if value is not Dictionary:
		errors.append("%s must be an object" % path)
		return
	for entity_id in value:
		var id := str(entity_id)
		if not _valid_id(id):
			errors.append("%s contains invalid id: %s" % [path, id])
		var entity = value[entity_id]
		if entity is not Dictionary:
			errors.append("%s.%s must be an object" % [path, id])
			continue
		_validate_item(entity, "%s.%s" % [path, id], required, errors)

static func _validate_item(item: Dictionary, path: String, required: bool, errors: Array[String]) -> void:
	for key in item:
		if str(key) not in ["name", "damage", "weight"]:
			errors.append("%s.%s is not supported" % [path, key])
	if required and (not item.has("name") or str(item.get("name", "")).is_empty()):
		errors.append("%s.name is required" % path)
	if item.has("damage"):
		if item.damage is not float and item.damage is not int:
			errors.append("%s.damage must be numeric" % path)
		elif float(item.damage) < 0.0:
			errors.append("%s.damage must be >= 0" % path)
	elif required:
		errors.append("%s.damage is required" % path)
	if item.has("weight"):
		if item.weight is not float and item.weight is not int:
			errors.append("%s.weight must be numeric" % path)
		elif float(item.weight) < 0.0:
			errors.append("%s.weight must be >= 0" % path)
	elif required:
		errors.append("%s.weight is required" % path)

static func _validate_override_targets(data: Dictionary, base: Dictionary, errors: Array[String]) -> void:
	if not data.has("items") or data.items is not Dictionary:
		return
	var base_items = base.get("items", {})
	if base_items is not Dictionary:
		base_items = {}
	for entity_id in data.items:
		if not base_items.has(entity_id):
			errors.append("items.%s cannot override unknown id" % entity_id)

static func _valid_id(value: String) -> bool:
	if value.is_empty() or value != value.to_lower():
		return false
	for character in value:
		if not (character >= "a" and character <= "z") and not (character >= "0" and character <= "9") and character not in ["_", "-", "."]:
			return false
	return true
