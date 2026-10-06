# ============================================================================
# TRAVEL MODULE
# Coordinates regional movement through Roads and commits arrival through World.
# World is authoritative for the journey origin; presentation never owns it.
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
	var travel := TravelState.ensure(_state)
	if travel.get("status") in ["travelling", "stopped", "arrived"] and float(travel.get("speed_mps", 0.0)) <= 0.0:
		var legacy_speed := _speed_kmh(str(travel.get("method", "walk"))) / 3.6
		if legacy_speed <= 0.0: return {"ok": false, "errors": ["travel state has no valid movement speed"]}
		travel["speed_mps"] = legacy_speed
		var total := float(travel.get("distance_total", 0.0))
		travel["duration_seconds"] = total / legacy_speed if legacy_speed > 0.0 else INF
		Diagnostics.info("travel.legacy_speed_migrated", {"method": travel.get("method", "walk"), "speed_mps": legacy_speed})
	Diagnostics.register_provider(&"travel", snapshot)
	return {"ok": true}

func stop() -> void:
	Diagnostics.unregister_provider(&"travel")
	_state = {}
	_roads = null
	_world = null

func preview_to(region_id: String, to_id: String, method: String = "walk") -> Dictionary:
	var origin := _origin(region_id)
	if origin.is_empty(): return {}
	return preview(region_id, origin, to_id, method)

func begin_to(region_id: String, to_id: String, method: String = "walk") -> Dictionary:
	var origin := _origin(region_id)
	if origin.is_empty(): return {}
	return begin(region_id, origin, to_id, method)

func preview(region_id: String, from_id: String, to_id: String, method: String = "walk") -> Dictionary:
	if not _origin_matches(region_id, from_id): return {}
	var route: Dictionary = _roads.route(region_id, from_id, to_id)
	var speed_kmh := _speed_kmh(method)
	if route.is_empty() or route.get("polyline", []).is_empty() or speed_kmh <= 0.0: return {}
	var distance := float(route.get("distance", 0.0))
	return {
		"region_id": region_id, "from_id": from_id, "to_id": to_id, "method": method,
		"distance_total": distance, "speed_kmh": speed_kmh,
		"duration_seconds": distance / (speed_kmh / 3.6),
		"route": route.duplicate(true)
	}

func begin(region_id: String, from_id: String, to_id: String, method: String = "walk") -> Dictionary:
	if not _origin_matches(region_id, from_id): return {}
	var route: Dictionary = _roads.route(region_id, from_id, to_id)
	var speed_kmh := _speed_kmh(method)
	if speed_kmh <= 0.0:
		Diagnostics.error("travel.invalid_speed", {"method": method, "speed_kmh": speed_kmh})
		return {}
	var trip := TravelState.start(_state, region_id, from_id, to_id, method, route, speed_kmh / 3.6)
	if not trip.is_empty():
		Diagnostics.info("travel.started", {"region_id": region_id, "from_id": from_id, "to_id": to_id, "method": method, "speed_kmh": speed_kmh, "distance_m": trip.get("distance_total", 0.0), "duration_seconds": trip.get("duration_seconds", 0.0)})
	return trip

func tick(delta_seconds: float) -> Dictionary:
	return TravelState.tick(_state, delta_seconds)

func pause() -> Dictionary:
	return TravelState.stop(_state)

func resume() -> Dictionary:
	return TravelState.resume(_state)

func cancel() -> Dictionary:
	return TravelState.cancel(_state)

func arrive(point: Dictionary) -> Dictionary:
	var active := TravelState.ensure(_state)
	if str(point.get("id", "")) != str(active.get("to_id", "")):
		Diagnostics.warn("travel.arrival_target_mismatch", {"expected": active.get("to_id"), "actual": point.get("id")})
		return {}
	var position := TravelState.commit_arrival(_state)
	if position.is_empty(): return {}
	_world.enter_map_point(point)
	_state.world["travel"] = {"status": "idle"}
	Diagnostics.info("travel.arrival_committed", {"region_id": position.get("region_id", ""), "point_id": position.get("point_id", "")})
	return position

func progress() -> Dictionary:
	return TravelState.progress(_state)

func snapshot() -> Dictionary:
	if _state.is_empty(): return {"status": "inactive"}
	var result := TravelState.ensure(_state).duplicate(true)
	var method := str(result.get("method", "walk"))
	result["configured_speed_kmh"] = _speed_kmh(method)
	result["speed_provenance"] = DataRegistry.provenance("travel.%s_speed_kmh" % method)
	result["progress_snapshot"] = TravelState.progress(_state)
	result["world_position"] = _world.current_position() if _world != null else {}
	return result

func _origin(region_id: String) -> String:
	if _world == null: return ""
	var position: Dictionary = _world.current_position()
	var point_id := str(position.get("point_id", ""))
	if str(position.get("region_id", "")) != region_id or point_id.is_empty():
		Diagnostics.warn("travel.origin_unavailable", {"requested_region_id": region_id, "world_position": position})
		return ""
	return point_id

func _origin_matches(region_id: String, from_id: String) -> bool:
	var authoritative := _origin(region_id)
	if authoritative == from_id: return true
	Diagnostics.warn("travel.origin_mismatch", {"requested_from_id": from_id, "authoritative_from_id": authoritative, "region_id": region_id})
	return false

func _speed_kmh(method: String) -> float:
	if method not in ["walk", "horse"]: return 0.0
	return float(DataRegistry.resolve("travel.%s_speed_kmh" % method, 0.0))
