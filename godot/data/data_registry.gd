# ============================================================================
# DATA REGISTRY
# Resolves official data plus ordered package/user overrides with provenance.
# Owns gameplay-facing lookup of complete region definitions.
# ============================================================================
extends Node

const DataSchema = preload("res://data/data_schema.gd")
const RegionSchema = preload("res://data/region_schema.gd")
const BASE_PATH := "res://data/examples/base.json"
const BUILTIN_REGION_PATHS := {"forest": "res://data/world/central_lands.json"}

var _base: Dictionary = {}
var _layers: Array[Dictionary] = []
var _regions: Dictionary = {}
var _region_sources: Dictionary = {}
var _region_assets: Dictionary = {}

func _ready() -> void:
	Diagnostics.register_provider(&"data_registry", snapshot)
	PackageValidators.register_validator(&"data_registry", validate_package_candidate)
	load_base_file(BASE_PATH)
	_load_builtin_regions()

func load_base_file(path: String) -> bool:
	var data = _read_json_file(path)
	if data is not Dictionary:
		Diagnostics.error("data.base_rejected", {"path": path})
		return false
	var errors := DataSchema.validate_base(data)
	if not errors.is_empty():
		Diagnostics.error("data.base_rejected", {"path": path, "errors": errors})
		return false
	return set_base(data, path)

func validate_package_candidate(manifest: Dictionary, payload_path: String) -> Dictionary:
	if manifest.get("kind") == "override":
		if payload_path.get_extension().to_lower() != "json":
			return {"ok": false, "errors": ["override payload must be JSON"]}
		var data = _read_json_file(payload_path)
		if data is not Dictionary:
			return {"ok": false, "errors": ["override payload must be a JSON object"]}
		var errors := DataSchema.validate_override(data, _base)
		return {"ok": errors.is_empty(), "errors": errors}
	if manifest.get("kind") == "content" and payload_path.get_extension().to_lower() == "json":
		return _validate_content_payload(payload_path)
	return {"ok": true}

func reload_active_packages(records: Array[Dictionary]) -> Dictionary:
	_layers.clear()
	_load_builtin_regions()
	var failures: Array[Dictionary] = []
	var order := 0
	for record in records:
		var kind := str(record.get("kind", ""))
		var path := str(record.get("path", ""))
		if kind == "override":
			var data = _read_json_file(path)
			if data is not Dictionary:
				failures.append({"id": record.get("id"), "path": path})
				continue
			set_layer(str(record.get("id")), int(record.get("priority", 0)), data, order)
			order += 1
		elif kind == "content" and path.get_extension().to_lower() == "json":
			var loaded := _apply_content_payload(str(record.get("id")), path, str(record.get("root", path.get_base_dir())))
			if not loaded.ok:
				failures.append({"id": record.get("id"), "path": path, "errors": loaded.errors})
	Diagnostics.info("data.packages_reloaded", {"layers": _layers.size(), "regions": _regions.size(), "failures": failures.size()})
	return {"ok": failures.is_empty(), "failures": failures}

func set_base(data: Dictionary, source: String = "base") -> bool:
	var errors := DataSchema.validate_base(data)
	if not errors.is_empty():
		Diagnostics.error("data.base_rejected", {"source": source, "errors": errors})
		return false
	_base = data.duplicate(true)
	Diagnostics.info("data.base_loaded", {"source": source})
	return true

func set_layer(id: String, priority: int, data: Dictionary, order: int = -1) -> void:
	_layers = _layers.filter(func(layer): return layer.id != id)
	var resolved_order := order if order >= 0 else _layers.size()
	_layers.append({"id": id, "priority": priority, "order": resolved_order, "data": data.duplicate(true)})
	_layers.sort_custom(func(a, b): return a.order < b.order)
	Diagnostics.info("data.layer_changed", {"id": id, "priority": priority})

func remove_layer(id: String) -> void:
	_layers = _layers.filter(func(layer): return layer.id != id)
	Diagnostics.info("data.layer_removed", {"id": id})

func entity(domain: String, id: String, fallback = null):
	var value = resolve("%s.%s" % [domain, id], fallback)
	if value is not Dictionary:
		return value
	var result: Dictionary = value.duplicate(true)
	result["id"] = id
	return result

func region(id: String) -> Dictionary:
	var value = _regions.get(id)
	return value.duplicate(true) if value is Dictionary else {}

func region_provenance(id: String) -> Dictionary:
	return _region_sources.get(id, {}).duplicate(true)

func region_asset(id: String, role: String) -> Dictionary:
	var key := "%s:%s" % [id, role]
	return _region_assets.get(key, {}).duplicate(true)

func entity_provenance(domain: String, id: String) -> Array[Dictionary]:
	return provenance("%s.%s" % [domain, id])

func resolve(path: String, fallback = null):
	var value = _read_path(_base, path, fallback)
	for layer in _layers:
		value = _read_path(layer.data, path, value)
	return value

func provenance(path: String) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var marker = _read_path(_base, path, null)
	if marker != null: result.append({"source": "base", "value": marker})
	for layer in _layers:
		var value = _read_path(layer.data, path, null)
		if value != null: result.append({"source": layer.id, "value": value})
	return result

func snapshot() -> Dictionary:
	var ids: Array[String] = []
	for layer in _layers: ids.append(str(layer.id))
	var region_ids: Array[String] = []
	for id in _regions: region_ids.append(str(id))
	region_ids.sort()
	return {
		"layers": ids,
		"layer_count": _layers.size(),
		"regions": region_ids,
		"region_sources": _region_sources.duplicate(true),
		"region_assets": _region_assets.duplicate(true),
		"walk_speed_kmh": resolve("travel.walk_speed_kmh"),
		"iron_sword_damage": resolve("items.iron_sword.damage"),
		"walk_speed_provenance": provenance("travel.walk_speed_kmh"),
		"iron_sword_damage_provenance": provenance("items.iron_sword.damage")
	}

func _load_builtin_regions() -> void:
	_regions.clear()
	_region_sources.clear()
	_region_assets.clear()
	for id in BUILTIN_REGION_PATHS:
		var path := str(BUILTIN_REGION_PATHS[id])
		var data = _read_json_file(path)
		if data is not Dictionary:
			Diagnostics.error("data.region_rejected", {"id": id, "path": path})
			continue
		var errors := RegionSchema.validate(data, str(id))
		if not errors.is_empty():
			Diagnostics.error("data.region_rejected", {"id": id, "path": path, "errors": errors})
			continue
		_regions[id] = data.duplicate(true)
		_region_sources[id] = {"source": "builtin", "path": path}
	Diagnostics.info("data.regions_loaded", {"count": _regions.size()})

func _validate_content_payload(path: String) -> Dictionary:
	var payload = _read_json_file(path)
	if payload is not Dictionary:
		return {"ok": false, "errors": ["content payload must be a JSON object"]}
	var errors: Array[String] = []
	for key in payload:
		if str(key) not in ["regions", "assets"]: errors.append("unsupported content root: %s" % key)
	var regions = payload.get("regions")
	if regions is not Dictionary or regions.is_empty():
		errors.append("content.regions must be a non-empty object")
	else:
		for id in regions:
			if regions[id] is not Dictionary:
				errors.append("regions.%s must be an object" % id)
				continue
			for error in RegionSchema.validate(regions[id], str(id)):
				errors.append("regions.%s: %s" % [id, error])
	var assets = payload.get("assets", {})
	if assets is not Dictionary:
		errors.append("content.assets must be an object")
	elif assets.has("regions"):
		if assets.regions is not Dictionary:
			errors.append("content.assets.regions must be an object")
		else:
			for id in assets.regions:
				var roles = assets.regions[id]
				if roles is not Dictionary:
					errors.append("content.assets.regions.%s must be an object" % id)
					continue
				for role in roles:
					var relative := str(roles[role])
					if role != "background": errors.append("unsupported region asset role: %s" % role)
					if relative.is_empty() or relative.is_absolute_path() or ".." in relative.split("/"):
						errors.append("unsafe region asset path: %s" % relative)
	return {"ok": errors.is_empty(), "errors": errors}

func _apply_content_payload(package_id: String, path: String, root: String = "") -> Dictionary:
	var checked := _validate_content_payload(path)
	if not checked.ok: return checked
	var payload: Dictionary = _read_json_file(path)
	for id in payload.regions:
		_regions[id] = payload.regions[id].duplicate(true)
		_region_sources[id] = {"source": package_id, "path": path}
		Diagnostics.info("data.region_changed", {"id": id, "source": package_id})
	var assets: Dictionary = payload.get("assets", {})
	var region_assets: Dictionary = assets.get("regions", {})
	for id in region_assets:
		for role in region_assets[id]:
			var relative := str(region_assets[id][role])
			_region_assets["%s:%s" % [id, role]] = {"source": package_id, "path": root.path_join(relative)}
	return {"ok": true}

func _read_json_file(path: String):
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null: return null
	return JSON.parse_string(file.get_as_text())

func _read_path(root: Dictionary, path: String, fallback):
	var current = root
	for key in path.split("."):
		if current is not Dictionary or not current.has(key): return fallback
		current = current[key]
	return current
