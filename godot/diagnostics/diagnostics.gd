# ============================================================================
# DIAGNOSTICS REGISTRY
# Owns structured runtime events and diagnostic providers; never gameplay rules.
# ============================================================================
extends Node

const MAX_EVENTS := 5000
var _events: Array[Dictionary] = []
var _providers: Dictionary = {}

func register_provider(id: StringName, snapshot: Callable) -> void:
	_providers[id] = snapshot
	info("diagnostics.provider_registered", {"provider": String(id)})

func unregister_provider(id: StringName) -> void:
	_providers.erase(id)

func trace(event: String, data: Dictionary = {}, level: String = "INFO", correlation_id: String = "") -> void:
	_events.append({
		"time_unix_ms": Time.get_unix_time_from_system() * 1000.0,
		"level": level,
		"event": event,
		"correlation_id": correlation_id,
		"data": data.duplicate(true)
	})
	if _events.size() > MAX_EVENTS:
		_events.pop_front()

func info(event: String, data: Dictionary = {}, correlation_id: String = "") -> void:
	trace(event, data, "INFO", correlation_id)

func warn(event: String, data: Dictionary = {}, correlation_id: String = "") -> void:
	trace(event, data, "WARN", correlation_id)

func error(event: String, data: Dictionary = {}, correlation_id: String = "") -> void:
	trace(event, data, "ERROR", correlation_id)

func snapshot() -> Dictionary:
	var systems := {}
	for id in _providers:
		var provider: Callable = _providers[id]
		systems[String(id)] = provider.call()
	return {
		"format": "eirdan-diagnostics",
		"version": 1,
		"runtime": {
			"godot": Engine.get_version_info(),
			"platform": OS.get_name(),
			"model": OS.get_model_name(),
			"locale": OS.get_locale(),
			"distribution": OS.get_distribution_name(),
			"cmdline": OS.get_cmdline_user_args()
		},
		"systems": systems,
		"events": _events.duplicate(true)
	}

func export_json() -> String:
	return JSON.stringify(snapshot(), "\t")
