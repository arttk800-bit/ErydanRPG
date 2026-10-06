# ============================================================================
# TRAVEL MODULE
# Coordinates regional movement through Roads and commits arrival through World.
# ============================================================================
extends RefCounted

const TravelState = preload("res://travel/travel_state.gd")
var _state: Dictionary = {}
var _roads
var _world

func start(context: Dictionary) -> Dictionary:
	var candidate = context.get("state")
	var modules = context.get("modules")
	if candidate is not Dictionary: return {"ok": false, "errors": ["travel module requires mutable state"]}
	if modules == null: return {"ok": false, "errors": ["travel module requires module runtime"]}
	_roads = modules.instance("roads")
	_world = modules.instance("world")
	if _roads == null or _world == null: return {"ok": false, "errors": ["travel module requires active world and roads modules"]}
	_state = candidate
	TravelState.ensure(_state)
	return {"ok": true}

func stop() -> void:
	_state = {}
	_roads = null
	_world = null

func begin(region_id: String, from_id: String, to_id: String, method: String = "walk") -> Dictionary:
	var route: Dictionary = _roads.route(region_id, from_id, to_id)
	return TravelState.start(_state, region_id, from_id, to_id, method, route)

func tick(delta_seconds: float) -> Dictionary:
	return TravelState.tick(_state, delta_seconds)

func pause() -> Dictionary:
	return TravelState.stop(_state)

func resume() -> Dictionary:
	return TravelState.resume(_state)

func cancel() -> Dictionary:
	return TravelState.cancel(_state)

func arrive(point: Dictionary) -> Dictionary:
	var position := TravelState.commit_arrival(_state)
	if position.is_empty(): return {}
	_world.enter_map_point(point)
	_state.world["travel"] = {"status": "idle"}
	return position

func progress() -> Dictionary:
	return TravelState.progress(_state)
