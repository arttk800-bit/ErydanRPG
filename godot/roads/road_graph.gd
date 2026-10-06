# ============================================================================
# ROAD GRAPH
# Owns deterministic road topology, metric distance and shortest-path queries.
# Does not mutate World or Travel state.
# ============================================================================
extends RefCounted

static func metric_distance(road_data: Dictionary, a: Dictionary, b: Dictionary) -> float:
	var metrics = road_data.get("metrics", {})
	var width := float(metrics.get("width_meters", 1.0))
	var height := float(metrics.get("height_meters", 1.0))
	var dx := (float(b.x) - float(a.x)) * width
	var dy := (float(b.y) - float(a.y)) * height
	return sqrt(dx * dx + dy * dy)

static func access_node_id(road_data: Dictionary, owner_id: String) -> String:
	var access = road_data.get("access", {}).get(owner_id)
	if access is not Dictionary: return ""
	return str(access.get("node", ""))

static func shortest_route(road_data: Dictionary, from_owner_id: String, to_owner_id: String) -> Dictionary:
	var from_id := access_node_id(road_data, from_owner_id)
	var to_id := access_node_id(road_data, to_owner_id)
	if from_id.is_empty() or to_id.is_empty(): return {}
	var graph := _build_graph(road_data)
	if not graph.nodes.has(from_id) or not graph.nodes.has(to_id): return {}
	if from_id == to_id:
		return {"from_id": from_owner_id, "to_id": to_owner_id, "node_ids": [from_id], "polyline": [graph.nodes[from_id]], "distance": 0.0, "cost": 0.0}
	var best: Dictionary = {from_id: 0.0}
	var previous: Dictionary = {}
	var queue: Array[Dictionary] = [{"id": from_id, "cost": 0.0}]
	while not queue.is_empty():
		queue.sort_custom(func(a, b):
			if not is_equal_approx(float(a.cost), float(b.cost)): return float(a.cost) < float(b.cost)
			return str(a.id) < str(b.id)
		)
		var current: Dictionary = queue.pop_front()
		var id := str(current.id)
		if not is_equal_approx(float(current.cost), float(best.get(id, INF))): continue
		if id == to_id: break
		for edge in graph.adjacency.get(id, []):
			var next_id := str(edge.to)
			var next_cost := float(current.cost) + float(edge.cost)
			var old_cost := float(best.get(next_id, INF))
			if next_cost < old_cost and not is_equal_approx(next_cost, old_cost):
				best[next_id] = next_cost
				previous[next_id] = {"id": id, "edge": edge}
				queue.append({"id": next_id, "cost": next_cost})
	if not best.has(to_id): return {}
	var node_ids: Array[String] = [to_id]
	var segments: Array[Dictionary] = []
	var cursor := to_id
	var distance := 0.0
	while cursor != from_id:
		var step: Dictionary = previous[cursor]
		var edge: Dictionary = step.edge
		segments.push_front({"from": step.id, "to": cursor, "distance": edge.distance, "cost": edge.cost})
		distance += float(edge.distance)
		cursor = str(step.id)
		node_ids.push_front(cursor)
	var polyline: Array[Dictionary] = []
	for node_id in node_ids: polyline.append(graph.nodes[node_id].duplicate(true))
	return {"from_id": from_owner_id, "to_id": to_owner_id, "node_ids": node_ids, "segments": segments, "polyline": polyline, "distance": distance, "cost": float(best[to_id])}

static func validate(road_data: Dictionary) -> Array[String]:
	var errors: Array[String] = []
	var graph := _build_graph(road_data, errors)
	for owner_id in road_data.get("access", {}):
		var node_id := access_node_id(road_data, str(owner_id))
		if node_id.is_empty(): errors.append("access %s has no node" % owner_id)
		elif not graph.nodes.has(node_id): errors.append("access %s references unknown node %s" % [owner_id, node_id])
	return errors

static func _build_graph(road_data: Dictionary, errors: Array[String] = []) -> Dictionary:
	var nodes: Dictionary = {}
	for raw_node in road_data.get("nodes", []):
		if raw_node is not Dictionary: continue
		var id := str(raw_node.get("id", ""))
		if id.is_empty(): continue
		if nodes.has(id): errors.append("duplicate road node: %s" % id)
		nodes[id] = raw_node
	var adjacency: Dictionary = {}
	for raw_edge in road_data.get("edges", []):
		if raw_edge is not Array or raw_edge.size() < 2: continue
		var a := str(raw_edge[0])
		var b := str(raw_edge[1])
		if not nodes.has(a) or not nodes.has(b):
			errors.append("road edge references unknown node: %s -> %s" % [a, b])
			continue
		var distance := metric_distance(road_data, nodes[a], nodes[b])
		_add_edge(adjacency, a, b, distance)
		_add_edge(adjacency, b, a, distance)
	return {"nodes": nodes, "adjacency": adjacency}

static func _add_edge(adjacency: Dictionary, from_id: String, to_id: String, distance: float) -> void:
	if adjacency.get(from_id) is not Array: adjacency[from_id] = []
	adjacency[from_id].append({"to": to_id, "distance": distance, "cost": distance})
