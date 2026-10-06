# ============================================================================
# REGIONAL MAP TEST VIEW
# Native Godot presentation for the World -> Roads -> Travel vertical slice.
# Draws authored data and forwards selections to domain module APIs only.
# ============================================================================
extends Control

var _region: Dictionary = {}
var _world
var _roads
var _travel
var _current_id := "veligrad"
var _selected_id := ""
var _message := "Выберите точку назначения"
var _test_fast_forward := true

func setup(region: Dictionary, world, roads, travel) -> void:
	_region = region
	_world = world
	_roads = roads
	_travel = travel
	_world.enter_region(str(region.region_id))
	var start := _point(_current_id)
	_world.enter_map_point(start)
	_world.visit(start)
	set_process(true)
	queue_redraw()

func _process(delta: float) -> void:
	if _travel == null: return
	var snapshot: Dictionary = _travel.snapshot()
	if snapshot.get("status") == "travelling":
		_travel.tick(delta * (1800.0 if _test_fast_forward else 1.0))
		snapshot = _travel.snapshot()
		if snapshot.get("status") == "arrived":
			var destination := _point(str(snapshot.get("to_id", "")))
			if not destination.is_empty():
				_travel.arrive(destination)
				_current_id = str(destination.id)
				_world.visit(destination)
				_message = "Прибытие: %s" % destination.name
		queue_redraw()

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		_select_at(event.position)
	elif event is InputEventScreenTouch and event.pressed:
		_select_at(event.position)

func _select_at(position: Vector2) -> void:
	if _travel == null or _travel.snapshot().get("status") == "travelling": return
	var best_id := ""
	var best_distance := 30.0
	for point in _region.get("points", []):
		if point is not Dictionary: continue
		var distance := position.distance_to(_screen_point(point))
		if distance < best_distance:
			best_distance = distance
			best_id = str(point.id)
	if best_id.is_empty() or best_id == _current_id: return
	_selected_id = best_id
	var destination := _point(best_id)
	var trip: Dictionary = _travel.begin(str(_region.region_id), _current_id, best_id, "walk")
	if trip.is_empty():
		_message = "Маршрут до «%s» не найден" % destination.name
	else:
		_message = "В путь: %s → %s · %.1f км · ТЕСТ ×1800" % [_point(_current_id).name, destination.name, float(trip.distance_total) / 1000.0]
	queue_redraw()

func _draw() -> void:
	var area := _map_rect()
	draw_rect(area, Color(0.09, 0.12, 0.10), true)
	draw_rect(area, Color(0.28, 0.34, 0.29), false, 2.0)
	var roads: Dictionary = _region.get("roads", {})
	var nodes := {}
	for node in roads.get("nodes", []):
		if node is Dictionary: nodes[str(node.id)] = node
	for edge in roads.get("edges", []):
		if edge is Array and edge.size() >= 2 and nodes.has(str(edge[0])) and nodes.has(str(edge[1])):
			draw_line(_screen_point(nodes[str(edge[0])]), _screen_point(nodes[str(edge[1])]), Color(0.36, 0.32, 0.23), 3.0, true)
	var travel: Dictionary = _travel.snapshot() if _travel != null else {}
	var route: Dictionary = travel.get("route", {})
	var polyline: Array = route.get("polyline", [])
	for index in range(1, polyline.size()):
		draw_line(_screen_point(polyline[index - 1]), _screen_point(polyline[index]), Color(0.82, 0.72, 0.28), 6.0, true)
	for point in _region.get("points", []):
		if point is not Dictionary: continue
		var p := _screen_point(point)
		var radius := 9.0 if str(point.id) == _current_id else 6.0
		draw_circle(p, radius, Color(0.90, 0.86, 0.68))
		if str(point.id) == _current_id: draw_circle(p, radius + 5.0, Color(0.95, 0.78, 0.22), false, 2.0)
		draw_string(ThemeDB.fallback_font, p + Vector2(10, 5), str(point.name), HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color(0.92, 0.92, 0.88))
	var party := _party_position(travel)
	draw_circle(party, 8.0, Color(0.95, 0.30, 0.20))
	draw_circle(party, 12.0, Color(1, 1, 1, 0.75), false, 2.0)
	draw_string(ThemeDB.fallback_font, Vector2(area.position.x, area.end.y + 30), _message, HORIZONTAL_ALIGNMENT_LEFT, area.size.x, 18, Color.WHITE)
	if travel.get("status") == "travelling":
		var progress: Dictionary = _travel.progress()
		draw_string(ThemeDB.fallback_font, Vector2(area.position.x, area.end.y + 55), "Путь: %.0f%% · осталось %.1f км" % [float(progress.ratio) * 100.0, float(progress.left) / 1000.0], HORIZONTAL_ALIGNMENT_LEFT, area.size.x, 16, Color.WHITE)

func _map_rect() -> Rect2:
	var margin := 45.0
	return Rect2(margin, margin, maxf(100.0, size.x - margin * 2.0), maxf(100.0, size.y - 140.0))

func _screen_point(value: Dictionary) -> Vector2:
	var area := _map_rect()
	return area.position + Vector2(float(value.get("x", 0.0)) * area.size.x, float(value.get("y", 0.0)) * area.size.y)

func _party_position(travel: Dictionary) -> Vector2:
	if travel.get("status") in ["travelling", "stopped", "arrived"] and travel.get("position") is Dictionary:
		return _screen_point(travel.position)
	var current := _point(_current_id)
	return _screen_point(current) if not current.is_empty() else _map_rect().get_center()

func _point(id: String) -> Dictionary:
	for point in _region.get("points", []):
		if point is Dictionary and str(point.get("id", "")) == id: return point
	return {}
