# Maps the platform safe rectangle into the logical viewport and keeps UI inside it.
extends Control

@export var base_left := 16.0
@export var base_top := 12.0
@export var base_right := 16.0
@export var base_bottom := 12.0

var _margins := {"left": 0.0, "top": 0.0, "right": 0.0, "bottom": 0.0}

func _ready() -> void:
	get_viewport().size_changed.connect(_apply)
	_apply.call_deferred()

func _apply() -> void:
	var window := Vector2(DisplayServer.window_get_size())
	var viewport := get_viewport().get_visible_rect().size
	var safe := DisplayServer.get_display_safe_area()
	var left := 0.0
	var top := 0.0
	var right := 0.0
	var bottom := 0.0
	if window.x > 0.0 and window.y > 0.0 and safe.size.x > 0 and safe.size.y > 0:
		var scale := Vector2(viewport.x / window.x, viewport.y / window.y)
		left = maxf(0.0, float(safe.position.x)) * scale.x
		top = maxf(0.0, float(safe.position.y)) * scale.y
		right = maxf(0.0, window.x - float(safe.end.x)) * scale.x
		bottom = maxf(0.0, window.y - float(safe.end.y)) * scale.y
	offset_left = base_left + left
	offset_top = base_top + top
	offset_right = -(base_right + right)
	offset_bottom = -(base_bottom + bottom)
	_margins = {"left": left, "top": top, "right": right, "bottom": bottom}

func snapshot() -> Dictionary:
	return _margins.duplicate(true)
