# ============================================================================
# REGIONAL MAP PRESENTATION
# Native Godot view for authored regional data. Camera/input/rendering only;
# World, Roads and Travel remain authoritative for gameplay state.
# ============================================================================
extends Control

const MapAssetLoader = preload("res://map/map_asset_loader.gd")
const WORLD_SIZE := Vector2(1600.0, 1000.0)
const MIN_ZOOM := 0.65
const MAX_ZOOM := 2.5
const ZOOM_STEP := 1.15

var _region: Dictionary = {}
var _world
var _roads
var _travel
var _current_id := "veligrad"
var _message := "Выберите точку назначения"
var _test_fast_forward := true
var _dragging := false
var _drag_start := Vector2.ZERO
var _camera_start := Vector2.ZERO
var _touches: Dictionary = {}
var _pinch_distance := 0.0

@onready var camera: Camera2D = $Viewport/Camera2D
@onready var background: Sprite2D = $Viewport/Background
@onready var roads_layer: Node2D = $Viewport/Roads
@onready var route_layer: Node2D = $Viewport/Route
@onready var poi_layer: Node2D = $Viewport/POI
@onready var party: Node2D = $Viewport/Party
@onready var status: Label = $HUD/Status

func setup(region: Dictionary, world, roads, travel) -> void:
	_region = region
	_world = world
	_roads = roads
	_travel = travel
	_world.enter_region(str(region.region_id))
	var start := _point(_current_id)
	_world.enter_map_point(start)
	_world.visit(start)
	_build_static_layers()
	_apply_background()
	_center_camera()
	_refresh()
	Diagnostics.register_provider(&"map_presentation", diagnostic_snapshot)
	set_process(true)

func _exit_tree() -> void:
	Diagnostics.unregister_provider(&"map_presentation")

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
		_refresh()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP and event.pressed:
			_zoom_at(event.position, ZOOM_STEP)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN and event.pressed:
			_zoom_at(event.position, 1.0 / ZOOM_STEP)
		elif event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				_dragging = true
				_drag_start = event.position
				_camera_start = camera.position
			else:
				if _dragging and event.position.distance_to(_drag_start) < 16.0:
					_select_screen(event.position)
				_dragging = false
	elif event is InputEventMouseMotion and _dragging:
		camera.position = _clamp_camera(_camera_start - event.position + _drag_start)
	elif event is InputEventScreenTouch:
		if event.pressed:
			_touches[event.index] = event.position
		else:
			var start = _touches.get(event.index)
			if _touches.size() == 1 and start is Vector2 and event.position.distance_to(start) < 20.0:
				_select_screen(event.position)
			_touches.erase(event.index)
			_pinch_distance = 0.0
	elif event is InputEventScreenDrag:
		_touches[event.index] = event.position
		if _touches.size() == 1:
			camera.position = _clamp_camera(camera.position - event.relative / camera.zoom.x)
		elif _touches.size() == 2:
			var points := _touches.values()
			var distance: float = points[0].distance_to(points[1])
			if _pinch_distance > 0.0 and distance > 0.0:
				_set_zoom(camera.zoom.x * distance / _pinch_distance)
			_pinch_distance = distance

func _build_static_layers() -> void:
	for child in roads_layer.get_children(): child.queue_free()
	for child in poi_layer.get_children(): child.queue_free()
	var roads: Dictionary = _region.get("roads", {})
	var nodes := {}
	for node in roads.get("nodes", []):
		if node is Dictionary: nodes[str(node.id)] = node
	for edge in roads.get("edges", []):
		if edge is Array and edge.size() >= 2 and nodes.has(str(edge[0])) and nodes.has(str(edge[1])):
			var line := Line2D.new()
			line.width = 4.0
			line.default_color = Color(0.34, 0.29, 0.20, 0.88)
			line.antialiased = true
			line.points = PackedVector2Array([_world_point(nodes[str(edge[0])]), _world_point(nodes[str(edge[1])])])
			roads_layer.add_child(line)
	for point in _region.get("points", []):
		if point is not Dictionary: continue
		var marker := Polygon2D.new()
		marker.polygon = PackedVector2Array([Vector2(0,-7),Vector2(7,0),Vector2(0,7),Vector2(-7,0)])
		marker.color = Color(0.91,0.85,0.63)
		marker.position = _world_point(point)
		poi_layer.add_child(marker)
		var label := Label.new()
		label.text = str(point.name)
		label.position = _world_point(point) + Vector2(10,-11)
		label.add_theme_font_size_override("font_size", 16)
		poi_layer.add_child(label)

func _apply_background() -> void:
	var asset := MapAssetLoader.background(str(_region.region_id))
	background.texture = asset.texture
	background.visible = asset.texture != null
	if background.texture != null:
		var image_size := background.texture.get_size()
		background.position = WORLD_SIZE * 0.5
		background.scale = Vector2(WORLD_SIZE.x / image_size.x, WORLD_SIZE.y / image_size.y)

func _refresh() -> void:
	var travel: Dictionary = _travel.snapshot() if _travel != null else {}
	party.position = _party_position(travel)
	party.scale = Vector2.ONE / camera.zoom
	_draw_route(travel)
	status.text = _message
	if travel.get("status") == "travelling":
		var progress: Dictionary = _travel.progress()
		status.text += "   Путь: %.0f%% · осталось %.1f км · ТЕСТ ×1800" % [float(progress.ratio) * 100.0, float(progress.left) / 1000.0]

func _draw_route(travel: Dictionary) -> void:
	for child in route_layer.get_children(): child.queue_free()
	var route: Dictionary = travel.get("route", {})
	var polyline: Array = route.get("polyline", [])
	if polyline.size() < 2: return
	var line := Line2D.new()
	line.width = 7.0
	line.default_color = Color(0.88,0.68,0.18)
	line.antialiased = true
	var points := PackedVector2Array()
	for value in polyline:
		if value is Dictionary: points.append(_world_point(value))
	line.points = points
	route_layer.add_child(line)

func _select_screen(screen_position: Vector2) -> void:
	if _travel == null or _travel.snapshot().get("status") == "travelling": return
	var world_position := get_viewport().get_canvas_transform().affine_inverse() * screen_position
	var best_id := ""
	var best_distance := 32.0 / camera.zoom.x
	for point in _region.get("points", []):
		if point is not Dictionary: continue
		var distance := world_position.distance_to(_world_point(point))
		if distance < best_distance:
			best_distance = distance
			best_id = str(point.id)
	if best_id.is_empty() or best_id == _current_id: return
	var destination := _point(best_id)
	var trip: Dictionary = _travel.begin(str(_region.region_id), _current_id, best_id, "walk")
	if trip.is_empty():
		_message = "Маршрут до «%s» не найден" % destination.name
	else:
		_message = "В путь: %s → %s · %.1f км" % [_point(_current_id).name, destination.name, float(trip.distance_total) / 1000.0]
	_refresh()

func _zoom_at(_screen_position: Vector2, factor: float) -> void:
	_set_zoom(camera.zoom.x * factor)

func _set_zoom(value: float) -> void:
	var zoom := clampf(value, MIN_ZOOM, MAX_ZOOM)
	camera.zoom = Vector2(zoom, zoom)
	camera.position = _clamp_camera(camera.position)
	_refresh()

func _center_camera() -> void:
	camera.position = WORLD_SIZE * 0.5
	camera.zoom = Vector2.ONE
	camera.position = _clamp_camera(camera.position)

func _clamp_camera(value: Vector2) -> Vector2:
	var half := get_viewport_rect().size * 0.5 / camera.zoom.x
	return Vector2(clampf(value.x, half.x, maxf(half.x, WORLD_SIZE.x-half.x)), clampf(value.y, half.y, maxf(half.y, WORLD_SIZE.y-half.y)))

func _world_point(value: Dictionary) -> Vector2:
	return Vector2(float(value.get("x",0.0))*WORLD_SIZE.x, float(value.get("y",0.0))*WORLD_SIZE.y)

func _party_position(travel: Dictionary) -> Vector2:
	if travel.get("status") in ["travelling","stopped","arrived"] and travel.get("position") is Dictionary:
		return _world_point(travel.position)
	var current := _point(_current_id)
	return _world_point(current) if not current.is_empty() else WORLD_SIZE*0.5

func _point(id: String) -> Dictionary:
	for point in _region.get("points", []):
		if point is Dictionary and str(point.get("id","")) == id: return point
	return {}

func diagnostic_snapshot() -> Dictionary:
	return {"region_id": _region.get("region_id"), "camera_position": camera.position, "zoom": camera.zoom.x, "external_background": background.texture != null, "asset_directory": MapAssetLoader.asset_directory(str(_region.get("region_id","")))}
