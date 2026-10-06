# ============================================================================
# TRAVEL STATE
# Owns regional journey lifecycle, progress and physical arrival state.
# Roads supplies routes; World remains owner of hierarchy entry.
# ============================================================================
extends RefCounted

const SPEED_MPS := {"walk": 1.4, "horse": 3.0}

static func ensure(state: Dictionary) -> Dictionary:
	if state.get("world") is not Dictionary: state["world"] = {}
	if state.world.get("travel") is not Dictionary: state.world["travel"] = {"status": "idle"}
	return state.world.travel

static func start(state: Dictionary, region_id: String, from_id: String, to_id: String, method: String, route: Dictionary) -> Dictionary:
	if route.is_empty() or route.get("polyline", []).is_empty(): return {}
	var speed := float(SPEED_MPS.get(method, SPEED_MPS["walk"]))
	var total := float(route.get("distance", 0.0))
	var travel := {
		"status": "travelling", "region_id": region_id, "from_id": from_id, "to_id": to_id,
		"method": method, "route": route.duplicate(true), "distance_done": 0.0,
		"distance_total": total, "eta_seconds": total / speed if speed > 0.0 else INF,
		"position": route.polyline[0].duplicate(true), "segment_index": 0, "segment_distance": 0.0
	}
	state.world["travel"] = travel
	return travel

static func tick(state: Dictionary, delta_seconds: float) -> Dictionary:
	var travel := ensure(state)
	if travel.get("status") != "travelling": return travel
	var speed := float(SPEED_MPS.get(str(travel.get("method", "walk")), SPEED_MPS["walk"]))
	var remaining_move := maxf(0.0, delta_seconds) * speed
	var polyline: Array = travel.route.get("polyline", [])
	while remaining_move > 0.0 and int(travel.segment_index) < polyline.size() - 1:
		var index := int(travel.segment_index)
		var a: Dictionary = polyline[index]
		var b: Dictionary = polyline[index + 1]
		var segment_length := _segment_metric(travel, a, b)
		var left := maxf(0.0, segment_length - float(travel.segment_distance))
		if remaining_move >= left:
			travel.distance_done = minf(float(travel.distance_total), float(travel.distance_done) + left)
			travel.segment_index = index + 1
			travel.segment_distance = 0.0
			travel.position = b.duplicate(true)
			remaining_move -= left
		else:
			travel.segment_distance = float(travel.segment_distance) + remaining_move
			travel.distance_done = minf(float(travel.distance_total), float(travel.distance_done) + remaining_move)
			var ratio := float(travel.segment_distance) / segment_length if segment_length > 0.0 else 1.0
			travel.position = {"x": lerpf(float(a.x), float(b.x), ratio), "y": lerpf(float(a.y), float(b.y), ratio)}
			remaining_move = 0.0
	travel["progress"] = float(travel.distance_done) / float(travel.distance_total) if float(travel.distance_total) > 0.0 else 1.0
	if int(travel.segment_index) >= polyline.size() - 1:
		travel["status"] = "arrived"
		travel["progress"] = 1.0
	return travel

static func stop(state: Dictionary) -> Dictionary:
	var travel := ensure(state)
	if travel.get("status") == "travelling": travel["status"] = "stopped"
	return travel

static func resume(state: Dictionary) -> Dictionary:
	var travel := ensure(state)
	if travel.get("status") == "stopped": travel["status"] = "travelling"
	return travel

static func cancel(state: Dictionary) -> Dictionary:
	var travel := ensure(state)
	if travel.get("position") is Dictionary:
		state.world["position"] = {"region_id": travel.get("region_id"), "point_id": null, "position": travel.position.duplicate(true)}
	state.world["travel"] = {"status": "idle"}
	return state.world.travel

static func commit_arrival(state: Dictionary) -> Dictionary:
	var travel := ensure(state)
	if travel.get("status") != "arrived": return {}
	var position := {"region_id": travel.get("region_id"), "point_id": travel.get("to_id")}
	state.world["position"] = position
	return position

static func progress(state: Dictionary) -> Dictionary:
	var travel := ensure(state)
	var total := float(travel.get("distance_total", 0.0))
	var done := float(travel.get("distance_done", 0.0))
	return {"done": done, "total": total, "left": maxf(0.0, total - done), "ratio": done / total if total > 0.0 else 0.0, "eta_seconds": travel.get("eta_seconds")}

static func _segment_metric(travel: Dictionary, a: Dictionary, b: Dictionary) -> float:
	var route: Dictionary = travel.route
	var total_poly := 0.0
	for i in range(1, route.polyline.size()):
		var p: Dictionary = route.polyline[i - 1]
		var q: Dictionary = route.polyline[i]
		total_poly += Vector2(float(p.x), float(p.y)).distance_to(Vector2(float(q.x), float(q.y)))
	var normalized := Vector2(float(a.x), float(a.y)).distance_to(Vector2(float(b.x), float(b.y)))
	return float(route.get("distance", 0.0)) * normalized / total_poly if total_poly > 0.0 else 0.0
