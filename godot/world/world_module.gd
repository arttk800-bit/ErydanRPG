# ============================================================================
# WORLD MODULE
# Public lifecycle adapter for World state ownership in the Godot runtime.
# ============================================================================
extends RefCounted

const WorldState = preload("res://world/world_state.gd")
var _state: Dictionary = {}

func start(context: Dictionary) -> Dictionary:
	var candidate = context.get("state")
	if candidate is not Dictionary:
		return {"ok": false, "errors": ["world module requires mutable state"]}
	_state = candidate
	WorldState.ensure(_state)
	return {"ok": true}

func stop() -> void:
	_state = {}

func current() -> Dictionary:
	return WorldState.current(_state).duplicate(true)

func current_position() -> Dictionary:
	return WorldState.current_position(_state).duplicate(true)

func initialize_at(region_id: String, point: Dictionary) -> Dictionary:
	return WorldState.initialize_at(_state, region_id, point).duplicate(true)

func discover(point: Dictionary, source: String = "unknown") -> bool:
	return WorldState.discover_point(_state, point, source)

func visit(point: Dictionary) -> void:
	WorldState.mark_visited(_state, point)

func enter_region(region_id: String) -> Dictionary:
	return WorldState.enter_region(_state, region_id).duplicate(true)

func enter_map_point(point: Dictionary) -> Dictionary:
	return WorldState.enter_map_point(_state, point).duplicate(true)
