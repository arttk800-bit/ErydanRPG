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
const TAP_SLOP := 22.0
const MAP_TOP_INSET := 56.0

var _region: Dictionary = {}
var _background_asset: Dictionary = {}
var _world
var _roads
var _travel
var _simulation
var _current_id := "veligrad"
var _message := "Выберите точку назначения"
var _test_fast_forward := true
var _mouse_dragging := false
var _mouse_start := Vector2.ZERO
var _camera_start := Vector2.ZERO
var _touches: Dictionary = {}
var _pinch_active := false
var _pinch_distance := 0.0
var _input_counts := {"touch_press":0,"touch_release":0,"drag":0,"tap":0,"pinch":0}

@onready var camera: Camera2D = $Viewport/Camera2D
@onready var background: Sprite2D = $Viewport/Background
@onready var roads_layer: Node2D = $Viewport/Roads
@onready var route_layer: Node2D = $Viewport/Route
@onready var poi_layer: Node2D = $Viewport/POI
@onready var party: Node2D = $Viewport/Party
@onready var status: Label = $HUD/Status

func setup(region: Dictionary, world, roads, travel, simulation, background_asset: Dictionary = {}) -> void:
	_region = region
	_background_asset = background_asset.duplicate(true)
	_world = world
	_roads = roads
	_travel = travel
	_simulation = simulation
	_restore_current_id()
	_build_static_layers()
	_apply_background()
	_center_camera()
	_refresh()
	Diagnostics.register_provider(&"map_presentation", diagnostic_snapshot)
	set_process(true)
	set_process_input(true)

func _exit_tree() -> void:
	Diagnostics.unregister_provider(&"map_presentation")

func _process(delta: float) -> void:
	if _travel == null: return
	var snapshot: Dictionary = _travel.snapshot()
	if snapshot.get("status") == "travelling":
		if _simulation != null: _simulation.set_mode("travel_fast" if _test_fast_forward else "normal")
		var simulation_delta := _simulation.step(delta) if _simulation != null else delta
		_travel.tick(simulation_delta)
		snapshot = _travel.snapshot()
		if snapshot.get("status") == "arrived":
			var destination := _point(str(snapshot.get("to_id", "")))
			if not destination.is_empty():
				_travel.arrive(destination)
				_current_id = str(destination.id)
				_message = "Прибытие: %s" % destination.name
		_refresh()
	elif _simulation != null:
		_simulation.set_mode("normal")

# Raw _input is intentional on Android: GUI Controls may mark touch events handled
# before _unhandled_input. The top screen inset is reserved for fixed HUD controls.
func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		_handle_touch(event)
	elif event is InputEventScreenDrag:
		_handle_drag(event)
	elif event is InputEventMouseButton:
		_handle_mouse_button(event)
	elif event is InputEventMouseMotion and _mouse_dragging:
		camera.position = _clamp_camera(_camera_start - (event.position - _mouse_start) / camera.zoom.x)

func _handle_touch(event: InputEventScreenTouch) -> void:
	if event.pressed:
		if event.position.y < MAP_TOP_INSET: return
		_input_counts.touch_press += 1
		_touches[event.index] = {"start":event.position,"position":event.position,"moved":false}
		if _touches.size() >= 2:
			_pinch_active = true
			_pinch_distance = _touch_distance()
	else:
		_input_counts.touch_release += 1
		var touch: Dictionary = _touches.get(event.index, {})
		var was_tap := not touch.is_empty() and not bool(touch.get("moved",false)) and not _pinch_active and _touches.size() == 1
		_touches.erase(event.index)
		if was_tap:
			_input_counts.tap += 1
			_select_screen(event.position)
		if _touches.size() < 2:
			_pinch_distance = 0.0
		if _touches.is_empty():
			_pinch_active = false

func _handle_drag(event: InputEventScreenDrag) -> void:
	if not _touches.has(event.index): return
	_input_counts.drag += 1
	var touch: Dictionary = _touches[event.index]
	touch.position = event.position
	if event.position.distance_to(touch.start) > TAP_SLOP:
		touch.moved = true
	_touches[event.index] = touch
	if _touches.size() == 1 and not _pinch_active:
		camera.position = _clamp_camera(camera.position - event.relative / camera.zoom.x)
	elif _touches.size() >= 2:
		_pinch_active = true
		var distance := _touch_distance()
		if _pinch_distance > 0.0 and distance > 0.0:
			_input_counts.pinch += 1
			_set_zoom(camera.zoom.x * distance / _pinch_distance)
		_pinch_distance = distance

func _touch_distance() -> float:
	if _touches.size() < 2: return 0.0
	var keys := _touches.keys()
	var a: Dictionary = _touches[keys[0]]
	var b: Dictionary = _touches[keys[1]]
	return Vector2(a.position).distance_to(Vector2(b.position))

func _handle_mouse_button(event: InputEventMouseButton) -> void:
	if event.position.y < MAP_TOP_INSET: return
	if event.button_index == MOUSE_BUTTON_WHEEL_UP and event.pressed:
		_set_zoom(camera.zoom.x * ZOOM_STEP)
	elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN and event.pressed:
		_set_zoom(camera.zoom.x / ZOOM_STEP)
	elif event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			_mouse_dragging = true
			_mouse_start = event.position
			_camera_start = camera.position
		else:
			if _mouse_dragging and event.position.distance_to(_mouse_start) < TAP_SLOP:
				_select_screen(event.position)
			_mouse_dragging = false

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
			line.default_color = Color(0.34,0.29,0.20,0.88)
			line.antialiased = true
			line.points = PackedVector2Array([_world_point(nodes[str(edge[0])]),_world_point(nodes[str(edge[1])])])
			roads_layer.add_child(line)
	for point in _region.get("points", []):
		if point is not Dictionary: continue
		var marker := Polygon2D.new()
		marker.polygon = PackedVector2Array([Vector2(0,-7),Vector2(7,0),Vector2(0,7),Vector2(-7,0)])
		marker.color = Color(0.91,0.85,0.63)
		marker.position = _world_point(point)
		poi_layer.add_child(marker)
		var label := Label.new()
		label.mouse_filter = Control.MOUSE_FILTER_IGNORE
		label.text = str(point.name)
		label.position = _world_point(point)+Vector2(10,-11)
		label.add_theme_font_size_override("font_size",16)
		poi_layer.add_child(label)

func _apply_background() -> void:
	var asset := MapAssetLoader.background(_background_asset)
	background.texture = asset.texture
	background.visible = asset.texture != null
	if background.texture != null:
		var image_size := background.texture.get_size()
		background.position = WORLD_SIZE*0.5
		background.scale = Vector2(WORLD_SIZE.x/image_size.x,WORLD_SIZE.y/image_size.y)

func _refresh() -> void:
	var travel: Dictionary = _travel.snapshot() if _travel != null else {}
	party.position = _party_position(travel)
	party.scale = Vector2.ONE/camera.zoom
	_draw_route(travel)
	status.text = _message
	if travel.get("status") == "travelling":
		var progress: Dictionary = _travel.progress()
		status.text += "   Путь: %.0f%% · осталось %.1f км · ТЕСТ ×1800" % [float(progress.ratio)*100.0,float(progress.left)/1000.0]
	if _simulation != null:
		var game_time: Dictionary = _simulation.time()
		status.text += " · День %d %02d:%02d" % [int(game_time.day), int(game_time.hour), int(game_time.minute)]

func _draw_route(travel: Dictionary) -> void:
	for child in route_layer.get_children(): child.queue_free()
	var route: Dictionary = travel.get("route",{})
	var polyline: Array = route.get("polyline",[])
	if polyline.size()<2: return
	var line := Line2D.new()
	line.width=7.0
	line.default_color=Color(0.88,0.68,0.18)
	line.antialiased=true
	var points:=PackedVector2Array()
	for value in polyline:
		if value is Dictionary: points.append(_world_point(value))
	line.points=points
	route_layer.add_child(line)

func _select_screen(screen_position: Vector2) -> void:
	if _travel==null or _travel.snapshot().get("status")=="travelling": return
	var world_position:=get_viewport().get_canvas_transform().affine_inverse()*screen_position
	var best_id:=""
	var best_distance:=32.0/camera.zoom.x
	for point in _region.get("points",[]):
		if point is not Dictionary: continue
		var distance:=world_position.distance_to(_world_point(point))
		if distance<best_distance:
			best_distance=distance
			best_id=str(point.id)
	if best_id.is_empty() or best_id==_current_id: return
	var destination:=_point(best_id)
	var trip: Dictionary=_travel.begin(str(_region.region_id),_current_id,best_id,"walk")
	if trip.is_empty():
		_message="Маршрут до «%s» не найден" % destination.name
	else:
		_message="В путь: %s → %s · %.1f км" % [_point(_current_id).name,destination.name,float(trip.distance_total)/1000.0]
	_refresh()

func _set_zoom(value: float) -> void:
	var zoom:=clampf(value,MIN_ZOOM,MAX_ZOOM)
	camera.zoom=Vector2(zoom,zoom)
	camera.position=_clamp_camera(camera.position)
	_refresh()

func _center_camera() -> void:
	camera.position=WORLD_SIZE*0.5
	camera.zoom=Vector2.ONE
	camera.position=_clamp_camera(camera.position)

func _clamp_camera(value: Vector2) -> Vector2:
	var half:=get_viewport_rect().size*0.5/camera.zoom.x
	return Vector2(clampf(value.x,half.x,maxf(half.x,WORLD_SIZE.x-half.x)),clampf(value.y,half.y,maxf(half.y,WORLD_SIZE.y-half.y)))

func _world_point(value: Dictionary)->Vector2:
	return Vector2(float(value.get("x",0.0))*WORLD_SIZE.x,float(value.get("y",0.0))*WORLD_SIZE.y)

func _party_position(travel: Dictionary)->Vector2:
	if travel.get("status") in ["travelling","stopped","arrived"] and travel.get("position") is Dictionary:
		return _world_point(travel.position)
	var current:=_point(_current_id)
	return _world_point(current) if not current.is_empty() else WORLD_SIZE*0.5

func _restore_current_id() -> void:
	var position: Dictionary = _world.current_position() if _world != null else {}
	var point_id := str(position.get("point_id", ""))
	if not point_id.is_empty() and not _point(point_id).is_empty():
		_current_id = point_id
		return
	var current: Dictionary = _world.current() if _world != null else {}
	var location_id := str(current.get("location_id", ""))
	if not location_id.is_empty() and not _point(location_id).is_empty(): _current_id = location_id

func _point(id: String)->Dictionary:
	for point in _region.get("points",[]):
		if point is Dictionary and str(point.get("id",""))==id: return point
	return {}

func diagnostic_snapshot()->Dictionary:
	return {"region_id":_region.get("region_id"),"camera_position":camera.position,"zoom":camera.zoom.x,"external_background":background.texture!=null,"touches_active":_touches.size(),"pinch_active":_pinch_active,"input_counts":_input_counts.duplicate(true),"background_asset":_background_asset.duplicate(true),"simulation":_simulation.snapshot() if _simulation != null else {}}
