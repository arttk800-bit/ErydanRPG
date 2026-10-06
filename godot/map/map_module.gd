# ============================================================================
# MAP MODULE
# Public lifecycle adapter for non-physical map browsing state.
# ============================================================================
extends RefCounted

const MapViewState = preload("res://map/map_view_state.gd")
var _state: Dictionary = {}

func start(context: Dictionary) -> Dictionary:
	var candidate = context.get("state")
	if candidate is not Dictionary:
		return {"ok": false, "errors": ["map module requires mutable state"]}
	_state = candidate
	MapViewState.ensure(_state)
	return {"ok": true}

func stop() -> void:
	_state = {}

func snapshot() -> Dictionary:
	return MapViewState.snapshot(_state)

func show_world() -> Dictionary:
	return MapViewState.show_world(_state)

func show_region(region_id: String) -> Dictionary:
	return MapViewState.show_region(_state, region_id)

func show_location(region_id: String, location_id: String) -> Dictionary:
	return MapViewState.show_location(_state, region_id, location_id)
