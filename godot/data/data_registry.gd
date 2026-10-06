# ============================================================================
# DATA REGISTRY
# Resolves official data plus ordered package/user overrides with provenance.
# ============================================================================
extends Node

const BASE_PATH := "res://data/examples/base.json"
var _base: Dictionary = {}
var _layers: Array[Dictionary] = []

func _ready() -> void:
	Diagnostics.register_provider(&"data_registry", snapshot)
	load_base_file(BASE_PATH)

func load_base_file(path: String) -> bool:
	var data = _read_json_file(path)
	if data is not Dictionary:
		Diagnostics.error("data.base_rejected", {"path": path})
		return false
	set_base(data, path)
	return true

func reload_active_packages(records: Array[Dictionary]) -> Dictionary:
	_layers.clear()
	var failures: Array[Dictionary] = []
	var priority := 100
	for record in records:
		if record.get("kind") != "override": continue
		var path := str(record.get("path", ""))
		var data = _read_json_file(path)
		if data is not Dictionary:
			failures.append({"id": record.get("id"), "path": path})
			continue
		set_layer(str(record.get("id")), priority, data)
		priority += 10
	Diagnostics.info("data.packages_reloaded", {"layers": _layers.size(), "failures": failures.size()})
	return {"ok": failures.is_empty(), "failures": failures}

func set_base(data: Dictionary, source: String = "base") -> void:
	_base = data.duplicate(true)
	Diagnostics.info("data.base_loaded", {"source": source})

func set_layer(id: String, priority: int, data: Dictionary) -> void:
	_layers = _layers.filter(func(layer): return layer.id != id)
	_layers.append({"id": id, "priority": priority, "data": data.duplicate(true)})
	_layers.sort_custom(func(a, b): return a.priority < b.priority)
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
