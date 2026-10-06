# ============================================================================
# ROADS MODULE
# Public read-only navigation adapter. Travel consumes routes through this API.
# ============================================================================
extends RefCounted

const RoadGraph = preload("res://roads/road_graph.gd")
var _regions: Dictionary = {}

func start(context: Dictionary) -> Dictionary:
	var roads = context.get("roads", {})
	if roads is not Dictionary: return {"ok": false, "errors": ["roads context must be an object"]}
	_regions = roads
	for region_id in _regions:
		var errors := RoadGraph.validate(_regions[region_id])
		if not errors.is_empty():
			_regions = {}
			return {"ok": false, "errors": errors}
	return {"ok": true}

func stop() -> void:
	_regions = {}

func route(region_id: String, from_id: String, to_id: String) -> Dictionary:
	var data = _regions.get(region_id)
	if data is not Dictionary: return {}
	return RoadGraph.shortest_route(data, from_id, to_id)

func distance(region_id: String, a: Dictionary, b: Dictionary) -> float:
	var data = _regions.get(region_id)
	if data is not Dictionary: return INF
	return RoadGraph.metric_distance(data, a, b)
