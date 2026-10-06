# ============================================================================
# DATA REGISTRY
# Resolves official data plus ordered package/user overrides with provenance.
# ============================================================================
extends Node

const DataSchema = preload("res://data/data_schema.gd")
const BASE_PATH := "res://data/examples/base.json"
var _base: Dictionary = {}
var _layers: Array[Dictionary] = []

func _ready() -> void:
	Diagnostics.register_provider(&"data_registry", snapshot)
	PackageValidators.register_validator(&"data_registry", validate_package_candidate)
	load_base_file(BASE_PATH)

func load_base_file(path: String) -> bool:
	var data = _read_json_file(path)
	if data is not Dictionary:
		Diagnostics.error("data.base_rejected", {"path": path})
		return false
	var errors := DataSchema.validate_base(data)
	if not errors.is_empty():
		Diagnostics.error("data.base_rejected", {"path": path, "errors": errors})
		return false
	set_base(data, path)
	return true

func validate_package_candidate(manifest: Dictionary, payload_path: String) -> Dictionary:
	if manifest.get("kind") != "override":
		return {"ok": true}
	if payload_path.get_extension().to_lower() != "json":
		return {"ok": false, "errors": ["override payload must be JSON"]}
	var data = _read_json_file(payload_path)
	if data is not Dictionary:
		return {"ok": false, "errors": ["override payload must be a JSON object"]}
	var errors := DataSchema.validate_override(data, _base)
	return {"ok": errors.is_empty(), "errors": errors}

func reload_active_packages(records: Array[Dictionary]) -> Dictionary:
	_layers.clear()
	var failures: Array[Dictionary] = []
	var order := 0
	for record in records:
		if record.get("kind") != "override": continue
		var path := str(record.get("path", ""))
		var data = _read_json_file(path)
		if data is not Dictionary:
			failures.append({"id": record.get("id"), "path": path})
			continue
		set_layer(str(record.get("id")), int(record.get("priority", 0)), data, order)
		order += 1
	Diagnostics.info("data.packages_reloaded", {"layers": _layers.size(), "failures": failures.size()})
	return {"ok": failures.is_empty(), "failures": failures}

func set_base(data: Dictionary, source: String = "base") -> void:
	_base = data.duplicate(true)
	Diagnostics.info("data.base_loaded", {"source": source})

func set_layer(id: String, priority: int, data: Dictionary, order: int = -1) -> void:
	_layers = _layers.filter(func(layer): return layer.id != id)
	var resolved_order := order if order >= 0 else _layers.size()
	_layers.append({"id": id, "priority": priority, "order": resolved_order, "data": data.duplicate(true)})
	_layers.sort_custom(func(a, b): return a.order < b.order)
	Diagnostics.info("data.layer_changed", {"id": id, "priority": priority})

func remove_layer(id: String) -> void:
	_layers = _layers.filter(func(layer): return layer.id != id)
	Diagnostics.info("data.layer_removed", {"id": id})

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
	return {
		"layers": ids,
		"layer_count": _layers.size(),
		"walk_speed_kmh": resolve("travel.walk_speed_kmh"),
		"iron_sword_damage": resolve("items.iron_sword.damage"),
		"walk_speed_provenance": provenance("travel.walk_speed_kmh"),
		"iron_sword_damage_provenance": provenance("items.iron_sword.damage")
	}

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

