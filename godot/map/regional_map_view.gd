# ============================================================================
# REGIONAL MAP PRESENTATION
# Native Godot view for authored regional data. Camera/input/rendering only;
# World, Roads and Travel remain authoritative for gameplay state.
# ============================================================================
extends Control

const MapAssetLoader = preload("res://map/map_asset_loader.gd")
const EirdanTheme = preload("res://ui/eirdan_theme.gd")
const WORLD_SIZE := Vector2(1600.0, 1000.0)
const MIN_ZOOM := 0.65
const MAX_ZOOM := 2.5
const ZOOM_STEP := 1.15
const TAP_SLOP := 22.0
const MAP_TOP_INSET := 56.0
const PARTY_LERP_SPEED := 10.0
const CAMERA_FOLLOW_SPEED := 4.5

var _region: Dictionary = {}
var _background_asset: Dictionary = {}
var _world
var _roads
var _travel
var _simulation
var _message := "Центральные земли"
var _preview: Dictionary = {}
var _mouse_dragging := false
var _mouse_start := Vector2.ZERO
var _camera_start := Vector2.ZERO
var _touches: Dictionary = {}
var _pinch_active := false
var _pinch_distance := 0.0
var _input_counts := {"touch_press":0,"touch_release":0,"drag":0,"tap":0,"pinch":0}
var _presented_party_position := Vector2.ZERO
var _target_party_position := Vector2.ZERO
var _party_initialized := false
var _follow_party := true
var _last_travel_status := "idle"
var _route_signature := ""
var _route_base: Line2D
var _route_progress: Line2D

@onready var camera: Camera2D = $Viewport/Camera2D
@onready var background: Sprite2D = $Viewport/Background
@onready var roads_layer: Node2D = $Viewport/Roads
@onready var route_layer: Node2D = $Viewport/Route
@onready var poi_layer: Node2D = $Viewport/POI
@onready var party: Node2D = $Viewport/Party
@onready var party_ring: Line2D = $Viewport/Party/Ring
@onready var status: Label = $HUD/Status
@onready var travel_card: PanelContainer = $HUD/TravelCard
@onready var travel_title: Label = $HUD/TravelCard/Margin/Content/Title
@onready var travel_meta: Label = $HUD/TravelCard/Margin/Content/Meta
@onready var travel_method: Label = $HUD/TravelCard/Margin/Content/Method
@onready var travel_go: Button = $HUD/TravelCard/Margin/Content/Actions/Go
@onready var travel_cancel: Button = $HUD/TravelCard/Margin/Content/Actions/Cancel
@onready var journey: PanelContainer = $HUD/Journey
@onready var journey_title: Label = $HUD/Journey/Margin/Content/Title
@onready var journey_progress: ProgressBar = $HUD/Journey/Margin/Content/Progress
@onready var journey_meta: Label = $HUD/Journey/Margin/Content/Meta
@onready var journey_detail: Label = $HUD/Journey/Margin/Content/Detail
@onready var journey_follow: Button = $HUD/Journey/Margin/Content/Actions/Follow

func setup(region: Dictionary, world, roads, travel, simulation, background_asset: Dictionary = {}) -> void:
	_region = region
	_background_asset = background_asset.duplicate(true)
	_world = world
	_roads = roads
	_travel = travel
	_simulation = simulation
	_build_static_layers()
	_apply_background()
	_center_camera()
	travel_card.add_theme_stylebox_override("panel", EirdanTheme.panel_style())
	journey.add_theme_stylebox_override("panel", EirdanTheme.panel_style())
	travel_go.pressed.connect(_confirm_preview)
	travel_cancel.pressed.connect(_clear_preview)
	journey_follow.pressed.connect(_enable_follow)
	var initial_travel: Dictionary = _travel.snapshot() if _travel != null else {}
	_target_party_position = _party_position(initial_travel)
	_presented_party_position = _target_party_position
	_party_initialized = true
	party.position = _presented_party_position
	_refresh()
	Diagnostics.register_provider(&"map_presentation", diagnostic_snapshot)
	set_process(true)
	set_input_active(true)
	camera.make_current()

func set_input_active(active: bool) -> void:
	set_process_input(active)
	if active: return
	_reset_gesture_state()

func _reset_gesture_state() -> void:
	_touches.clear()
	_pinch_active = false
	_pinch_distance = 0.0
	_mouse_dragging = false

func _exit_tree() -> void:
	Diagnostics.unregister_provider(&"map_presentation")

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		_reset_gesture_state()

func _process(delta: float) -> void:
	if _travel == null: return
	var travel: Dictionary = _travel.snapshot()
	_update_party(delta, travel)
	_update_camera_follow(delta, travel)
	_refresh(travel)

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
		_follow_party = false
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
		_follow_party = false
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

func _refresh(travel: Dictionary = {}) -> void:
	if travel.is_empty() and _travel != null: travel = _travel.snapshot()
	party.scale = Vector2.ONE/camera.zoom
	_draw_route(travel if travel.get("status") in ["travelling", "stopped", "arrived"] else _preview)
	var game_time: Dictionary = _simulation.time() if _simulation != null else {}
	status.text = "%s · День %d · %02d:%02d" % [_message, int(game_time.get("day", 1)), int(game_time.get("hour", 8)), int(game_time.get("minute", 0))]
	travel_card.visible = not _preview.is_empty() and travel.get("status") != "travelling"
	if travel_card.visible:
		var destination := _point(str(_preview.get("to_id", "")))
		travel_title.text = str(destination.get("name", "Пункт назначения"))
		travel_meta.text = "%.1f км · %s" % [float(_preview.get("distance_total", 0.0)) / 1000.0, _format_duration(float(_preview.get("duration_seconds", 0.0)))]
		travel_method.text = "Пешком · %.1f км/ч" % float(_preview.get("speed_kmh", 0.0))
	journey.visible = travel.get("status") == "travelling"
	if journey.visible:
		var progress: Dictionary = _travel.progress()
		var destination := _point(str(travel.get("to_id", "")))
		var ratio := clampf(float(progress.get("ratio", 0.0)), 0.0, 1.0)
		journey_title.text = "В пути · %s" % str(destination.get("name", ""))
		journey_progress.value = clampf(float(progress.get("ratio", 0.0)) * 100.0, 0.0, 100.0)
		journey_meta.text = "%d%% · %.1f / %.1f км" % [int(round(ratio * 100.0)), float(progress.get("done", 0.0)) / 1000.0, float(progress.get("total", 0.0)) / 1000.0]
		journey_detail.text = "Осталось %.1f км · %s · Пешком %.1f км/ч" % [float(progress.get("left", 0.0)) / 1000.0, _format_duration(float(progress.get("eta_seconds", 0.0))), float(travel.get("speed_mps", 0.0)) * 3.6]
		journey_follow.text = "Следим" if _follow_party else "Следить"
	_last_travel_status = str(travel.get("status", "idle"))

func _draw_route(travel: Dictionary) -> void:
	var route: Dictionary = travel.get("route",{})
	var polyline: Array = route.get("polyline",[])
	var signature := "%s:%s:%d" % [str(travel.get("from_id", "")), str(travel.get("to_id", "")), polyline.size()]
	if polyline.size()<2:
		_clear_route()
		return
	var points:=PackedVector2Array()
	for value in polyline:
		if value is Dictionary: points.append(_world_point(value))
	if signature != _route_signature:
		_clear_route()
		_route_signature = signature
		_route_base = Line2D.new()
		_route_base.width = 7.0
		_route_base.default_color = Color(0.30, 0.27, 0.20, 0.92)
		_route_base.antialiased = true
		_route_base.points = points
		route_layer.add_child(_route_base)
		_route_progress = Line2D.new()
		_route_progress.width = 7.0
		_route_progress.default_color = Color(0.78, 0.61, 0.24, 1.0)
		_route_progress.antialiased = true
		route_layer.add_child(_route_progress)
	if _route_progress == null: return
	if travel.get("status") != "travelling":
		_route_progress.points = PackedVector2Array()
		return
	var completed := PackedVector2Array()
	var segment_index := clampi(int(travel.get("segment_index", 0)), 0, points.size() - 1)
	for index in range(segment_index + 1): completed.append(points[index])
	var live_position = travel.get("position")
	if live_position is Dictionary:
		var live_point := _world_point(live_position)
		if completed.is_empty() or completed[completed.size() - 1].distance_to(live_point) > 0.1:
			completed.append(live_point)
	_route_progress.points = completed

func _clear_route() -> void:
	for child in route_layer.get_children(): child.queue_free()
	_route_base = null
	_route_progress = null
	_route_signature = ""

func _update_party(delta: float, travel: Dictionary) -> void:
	_target_party_position = _party_position(travel)
	if not _party_initialized:
		_presented_party_position = _target_party_position
		_party_initialized = true
	else:
		var weight := 1.0 - exp(-PARTY_LERP_SPEED * maxf(delta, 0.0))
		_presented_party_position = _presented_party_position.lerp(_target_party_position, weight)
		if _presented_party_position.distance_to(_target_party_position) < 0.25:
			_presented_party_position = _target_party_position
	party.position = _presented_party_position
	var moving: bool = str(travel.get("status", "idle")) == "travelling"
	var pulse := 1.0 + sin(Time.get_ticks_msec() * 0.008) * 0.10 if moving else 1.0
	party_ring.scale = Vector2.ONE * pulse
	party_ring.modulate.a = 0.92 if moving else 0.72

func _update_camera_follow(delta: float, travel: Dictionary) -> void:
	if travel.get("status") == "travelling" and _last_travel_status != "travelling":
		_follow_party = true
	if not _follow_party: return
	var weight := 1.0 - exp(-CAMERA_FOLLOW_SPEED * maxf(delta, 0.0))
	camera.position = _clamp_camera(camera.position.lerp(_presented_party_position, weight))

func _enable_follow() -> void:
	_follow_party = true
	Diagnostics.info("map.follow_enabled", {"party_position": _presented_party_position})

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
	var current_id := _current_point_id()
	if best_id.is_empty() or best_id == current_id: return
	var destination := _point(best_id)
	_preview = _travel.preview_to(str(_region.region_id), best_id, "walk")
	if _preview.is_empty():
		_message = "Маршрут до «%s» не найден" % destination.name
	else:
		_message = "Выбран пункт: %s" % destination.name
	_refresh()

func _confirm_preview() -> void:
	if _preview.is_empty() or _travel == null: return
	var destination := _point(str(_preview.get("to_id", "")))
	var trip: Dictionary = _travel.begin_to(str(_preview.region_id), str(_preview.to_id), str(_preview.method))
	if trip.is_empty():
		_message = "Не удалось начать путь до «%s»" % destination.get("name", "")
	else:
		_message = "Центральные земли"
		_preview = {}
	_refresh()

func _clear_preview() -> void:
	_preview = {}
	_message = "Центральные земли"
	_refresh()

func _format_duration(seconds: float) -> String:
	if not is_finite(seconds) or seconds < 0.0: return "—"
	var total_minutes := int(round(seconds / 60.0))
	var hours := total_minutes / 60
	var minutes := total_minutes % 60
	if hours > 0: return "%d ч %02d мин" % [hours, minutes]
	return "%d мин" % minutes

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
	var current:=_point(_current_point_id())
	return _world_point(current) if not current.is_empty() else WORLD_SIZE*0.5

func _current_point_id() -> String:
	var position: Dictionary = _world.current_position() if _world != null else {}
	var point_id := str(position.get("point_id", ""))
	if not point_id.is_empty() and not _point(point_id).is_empty(): return point_id
	var current: Dictionary = _world.current() if _world != null else {}
	var location_id := str(current.get("location_id", ""))
	if not location_id.is_empty() and not _point(location_id).is_empty(): return location_id
	return ""

func _point(id: String)->Dictionary:
	for point in _region.get("points",[]):
		if point is Dictionary and str(point.get("id",""))==id: return point
	return {}

func diagnostic_snapshot()->Dictionary:
	return {"region_id":_region.get("region_id"),"current_point_id":_current_point_id(),"world_position":_world.current_position() if _world != null else {},"travel_preview":_preview.duplicate(true),"camera_position":camera.position,"zoom":camera.zoom.x,"follow_party":_follow_party,"presented_party_position":_presented_party_position,"target_party_position":_target_party_position,"travel_status":_last_travel_status,"external_background":background.texture!=null,"touches_active":_touches.size(),"pinch_active":_pinch_active,"input_counts":_input_counts.duplicate(true),"background_asset":_background_asset.duplicate(true),"simulation":_simulation.snapshot() if _simulation != null else {}}
