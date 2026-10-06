# ============================================================================
# DATA REGISTRY
# Resolves official data plus ordered package/user overrides with provenance.
# ============================================================================
extends Node

var _base: Dictionary = {}
var _layers: Array[Dictionary] = []

func _ready() -> void:
	Diagnostics.register_provider(&"data_registry", snapshot)

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
	return {"layers": ids, "layer_count": _layers.size()}

func _read_path(root: Dictionary, path: String, fallback):
	var current = root
	for key in path.split("."):
		if current is not Dictionary or not current.has(key): return fallback
		current = current[key]
	return current
