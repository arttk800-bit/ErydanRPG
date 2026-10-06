# ============================================================================
# MODULE RUNTIME
# Composition root for enabled Godot gameplay modules and their lifecycle.
# ============================================================================
extends Node

const ModuleRegistry = preload("res://modules/module_registry.gd")
var _registry := ModuleRegistry.new()
var _enabled: Dictionary = {}
var _instances: Dictionary = {}
var _started: Array[String] = []

func _ready() -> void:
	Diagnostics.register_provider(&"module_runtime", snapshot)

func register_module(definition: Dictionary) -> Dictionary:
	return _registry.register(definition)

func configure(enabled: Dictionary) -> Dictionary:
	var resolved := _registry.resolve(enabled)
	if not resolved.ok: return resolved
	_enabled = enabled.duplicate(true)
	return {"ok": true, "active": _ids(resolved.modules)}

func set_enabled(id: String, enabled: bool) -> Dictionary:
	var checked := _registry.can_set_enabled(_enabled, id, enabled)
	if not checked.ok: return checked
	_enabled[id] = enabled
	return {"ok": true, "active": _ids(checked.modules)}

func start(context: Dictionary = {}) -> Dictionary:
	var resolved := _registry.resolve(_enabled)
	if not resolved.ok: return resolved
	stop()
	for definition in resolved.modules:
		var factory: Callable = definition.factory
		if not factory.is_valid():
			stop()
			return {"ok": false, "errors": ["module %s has no valid factory" % definition.id]}
		var instance = factory.call()
		if instance == null:
			stop()
			return {"ok": false, "errors": ["module %s factory returned null" % definition.id]}
		_instances[definition.id] = instance
		if instance.has_method("start"):
			var module_context := context.duplicate()
		module_context["modules"] = self
			var result = instance.start(module_context)
			if result is Dictionary and not result.get("ok", true):
				stop()
				return {"ok": false, "errors": result.get("errors", ["module start failed: %s" % definition.id])}
		_started.append(definition.id)
	Diagnostics.info("modules.started", {"active": _started.duplicate()})
	return {"ok": true, "active": _started.duplicate()}

func stop() -> void:
	for index in range(_started.size() - 1, -1, -1):
		var id := _started[index]
		var instance = _instances.get(id)
		if instance != null and instance.has_method("stop"): instance.stop()
	_instances.clear()
	_started.clear()

func instance(id: String):
	return _instances.get(id)

func snapshot() -> Dictionary:
	return {"registered": _registry.list_definitions().size(), "active": _started.duplicate(), "configured": _enabled.duplicate(true)}

func _ids(definitions: Array[Dictionary]) -> Array[String]:
	var result: Array[String] = []
	for definition in definitions: result.append(str(definition.id))
	return result
