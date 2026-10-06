# ============================================================================
# MODULE REGISTRY
# Owns Godot module metadata and deterministic dependency resolution.
# ============================================================================
extends RefCounted

var _definitions: Dictionary = {}

func register(definition: Dictionary) -> Dictionary:
	var normalized := _normalize(definition)
	var id := str(normalized.get("id", ""))
	if id.is_empty():
		return {"ok": false, "errors": ["module id is required"]}
	if _definitions.has(id):
		return {"ok": false, "errors": ["duplicate module: %s" % id]}
	for dependency in normalized.dependencies:
		if dependency == id:
			return {"ok": false, "errors": ["module cannot depend on itself: %s" % id]}
	_definitions[id] = normalized
	return {"ok": true, "module": normalized}

func get_definition(id: String) -> Dictionary:
	return _definitions.get(id, {}).duplicate(true)

func list_definitions() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for definition in _definitions.values():
		result.append(definition.duplicate(true))
	result.sort_custom(func(a, b): return str(a.id) < str(b.id))
	return result

func resolve(enabled: Dictionary) -> Dictionary:
	var active: Array[Dictionary] = []
	var visiting: Dictionary = {}
	var done: Dictionary = {}
	var ids: Array[String] = []
	for id in _definitions:
		if _is_enabled(str(id), enabled): ids.append(str(id))
	ids.sort()
	for id in ids:
		var result := _visit(id, enabled, visiting, done, active)
		if not result.ok: return result
	return {"ok": true, "modules": active}

func can_set_enabled(enabled: Dictionary, id: String, value: bool) -> Dictionary:
	if not _definitions.has(id):
		return {"ok": false, "errors": ["unknown module: %s" % id]}
	var candidate := enabled.duplicate(true)
	candidate[id] = value
	if not value:
		for definition in _definitions.values():
			if _is_enabled(str(definition.id), candidate) and id in definition.dependencies:
				return {"ok": false, "errors": ["cannot disable %s while %s is enabled" % [id, definition.id]]}
	return resolve(candidate)

func _visit(id: String, enabled: Dictionary, visiting: Dictionary, done: Dictionary, active: Array[Dictionary]) -> Dictionary:
	if done.has(id): return {"ok": true}
	if visiting.has(id): return {"ok": false, "errors": ["module dependency cycle at %s" % id]}
	var definition: Dictionary = _definitions.get(id, {})
	if definition.is_empty(): return {"ok": false, "errors": ["unknown module dependency: %s" % id]}
	visiting[id] = true
	for dependency in definition.dependencies:
		if not _definitions.has(dependency):
			return {"ok": false, "errors": ["module %s requires unknown dependency %s" % [id, dependency]]}
		if not _is_enabled(dependency, enabled):
			return {"ok": false, "errors": ["module %s requires enabled dependency %s" % [id, dependency]]}
		var result := _visit(dependency, enabled, visiting, done, active)
		if not result.ok: return result
	visiting.erase(id)
	done[id] = true
	active.append(definition.duplicate(true))
	return {"ok": true}

func _is_enabled(id: String, enabled: Dictionary) -> bool:
	if enabled.has(id): return enabled[id] != false
	return bool(_definitions.get(id, {}).get("enabled_by_default", false))

func _normalize(definition: Dictionary) -> Dictionary:
	var dependencies: Array[String] = []
	for dependency in definition.get("dependencies", []):
		var id := str(dependency)
		if not id.is_empty() and id not in dependencies: dependencies.append(id)
	dependencies.sort()
	return {
		"id": str(definition.get("id", "")),
		"enabled_by_default": bool(definition.get("enabled_by_default", false)),
		"dependencies": dependencies,
		"factory": definition.get("factory", Callable()),
		"owns": definition.get("owns", [])
	}
