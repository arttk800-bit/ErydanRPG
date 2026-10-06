# ============================================================================
# DATA SCHEMA
# Owns structural validation for authored base data and sparse override data.
# ============================================================================
extends RefCounted

const ROOT_DOMAINS := ["travel", "items", "travel_events"]

static func validate_base(data: Dictionary) -> Array[String]:
	var errors: Array[String] = []
	_validate_known_roots(data, errors)
	_validate_travel(data.get("travel"), "travel", true, errors)
	_validate_travel_events(data.get("travel_events"), "travel_events", true, errors)
	_validate_entities(data.get("items"), "items", true, errors)
	return errors

static func validate_override(data: Dictionary, base: Dictionary) -> Array[String]:
	var errors: Array[String] = []
	_validate_known_roots(data, errors)
	if data.has("travel"):
		_validate_travel(data.travel, "travel", false, errors)
	if data.has("items"):
		_validate_entities(data.items, "items", false, errors)
	if data.has("travel_events"):
		_validate_travel_events(data.travel_events, "travel_events", false, errors)
	_validate_override_targets(data, base, errors)
	return errors

static func validate_content(data: Dictionary) -> Array[String]:
	var errors: Array[String] = []
	_validate_known_roots(data, errors)
	if data.has("travel"): _validate_travel(data.travel, "travel", false, errors)
	if data.has("items"): _validate_entities(data.items, "items", false, errors)
	if data.has("travel_events"): _validate_travel_events(data.travel_events, "travel_events", true, errors)
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
		if str(key) not in ["walk_speed_kmh", "horse_speed_kmh", "event_interval_km", "event_chance"]:
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
	if value.has("event_interval_km"):
		var interval = value.event_interval_km
		if interval is not float and interval is not int: errors.append("%s.event_interval_km must be numeric" % path)
		elif float(interval) <= 0.0: errors.append("%s.event_interval_km must be > 0" % path)
	if value.has("event_chance"):
		var chance = value.event_chance
		if chance is not float and chance is not int: errors.append("%s.event_chance must be numeric" % path)
		elif float(chance) < 0.0 or float(chance) > 1.0: errors.append("%s.event_chance must be within 0..1" % path)

static func _validate_travel_events(value, path: String, required: bool, errors: Array[String]) -> void:
	if value == null:
		if required: errors.append("%s is required" % path)
		return
	if value is not Dictionary:
		errors.append("%s must be an object" % path)
		return
	if required and value.is_empty(): errors.append("%s must not be empty" % path)
	for event_id in value:
		var id := str(event_id)
		if not _valid_id(id): errors.append("%s contains invalid id: %s" % [path, id])
		var event = value[event_id]
		if event is not Dictionary:
			errors.append("%s.%s must be an object" % [path, id])
			continue
		var event_path := "%s.%s" % [path, id]
		for key in event:
			if str(key) not in ["title", "text", "weight", "min_distance_km", "choices"]: errors.append("%s.%s is not supported" % [event_path, key])
		if required and str(event.get("title", "")).strip_edges().is_empty(): errors.append("%s.title is required" % event_path)
		elif event.has("title") and str(event.title).strip_edges().is_empty(): errors.append("%s.title must not be empty" % event_path)
		if required and str(event.get("text", "")).strip_edges().is_empty(): errors.append("%s.text is required" % event_path)
		elif event.has("text") and str(event.text).strip_edges().is_empty(): errors.append("%s.text must not be empty" % event_path)
		var weight = event.get("weight", 1)
		if weight is not int and weight is not float: errors.append("%s.weight must be numeric" % event_path)
		elif float(weight) <= 0.0: errors.append("%s.weight must be > 0" % event_path)
		var minimum = event.get("min_distance_km", 0.0)
		if minimum is not int and minimum is not float: errors.append("%s.min_distance_km must be numeric" % event_path)
		elif float(minimum) < 0.0: errors.append("%s.min_distance_km must be >= 0" % event_path)
		var choices = event.get("choices")
		if choices == null and not required: continue
		if choices is not Array or choices.is_empty() or choices.size() > 3:
			errors.append("%s.choices must contain 1..3 choices" % event_path)
			continue
		var choice_ids: Dictionary = {}
		for index in choices.size():
			var choice = choices[index]
			var choice_path := "%s.choices[%d]" % [event_path, index]
			if choice is not Dictionary:
				errors.append("%s must be an object" % choice_path)
				continue
			for key in choice:
				if str(key) not in ["id", "label", "result", "time_seconds"]: errors.append("%s.%s is not supported" % [choice_path, key])
			var choice_id := str(choice.get("id", ""))
			if not _valid_id(choice_id): errors.append("%s.id is invalid" % choice_path)
			elif choice_ids.has(choice_id): errors.append("%s contains duplicate choice id: %s" % [event_path, choice_id])
			choice_ids[choice_id] = true
			if str(choice.get("label", "")).strip_edges().is_empty(): errors.append("%s.label is required" % choice_path)
			if str(choice.get("result", "")).strip_edges().is_empty(): errors.append("%s.result is required" % choice_path)
			var seconds = choice.get("time_seconds", 0)
			if seconds is not int and seconds is not float: errors.append("%s.time_seconds must be numeric" % choice_path)
			elif float(seconds) < 0.0: errors.append("%s.time_seconds must be >= 0" % choice_path)

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
	for domain in ["items", "travel_events"]:
		if not data.has(domain) or data[domain] is not Dictionary: continue
		var base_entities = base.get(domain, {})
		if base_entities is not Dictionary: base_entities = {}
		for entity_id in data[domain]:
			if not base_entities.has(entity_id): errors.append("%s.%s cannot override unknown id" % [domain, entity_id])

static func _valid_id(value: String) -> bool:
	if value.is_empty() or value != value.to_lower():
		return false
	for character in value:
		if not (character >= "a" and character <= "z") and not (character >= "0" and character <= "9") and character not in ["_", "-", "."]:
			return false
	return true
