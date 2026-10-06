# ============================================================================
# WORLD SCREEN
# Presentation owner for world/map context. Wraps the specialized RegionalMap
# view and exposes visibility/input lifecycle without owning World/Travel rules.
# ============================================================================
extends Control

var _map_view: Control

func bind_map_view(map_view: Control) -> void:
	_map_view = map_view
	_sync()

func set_active(active: bool) -> void:
	visible = active
	_sync()

func _sync() -> void:
	if _map_view == null: return
	_map_view.visible = visible
	_map_view.set_process_input(visible)

func snapshot() -> Dictionary:
	return {"visible": visible, "map_bound": _map_view != null}
