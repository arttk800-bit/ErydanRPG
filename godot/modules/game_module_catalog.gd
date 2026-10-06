# ============================================================================
# GAME MODULE CATALOG
# Registers concrete gameplay factories at the composition boundary.
# ============================================================================
extends RefCounted

const WorldModule = preload("res://world/world_module.gd")
const MapModule = preload("res://map/map_module.gd")
const RoadsModule = preload("res://roads/roads_module.gd")

static func register_foundation(runtime: Node) -> Dictionary:
	var world := runtime.register_module({
		"id": "world",
		"enabled_by_default": true,
		"dependencies": [],
		"owns": ["world_state", "knowledge"],
		"factory": func(): return WorldModule.new()
	})
	if not world.ok: return world
	var map := runtime.register_module({
		"id": "map",
		"enabled_by_default": true,
		"dependencies": ["world"],
		"owns": ["map_view"],
		"factory": func(): return MapModule.new()
	})
	if not map.ok: return map
	return runtime.register_module({
		"id": "roads",
		"enabled_by_default": true,
		"dependencies": ["map"],
		"owns": ["road_graph", "routing"],
		"factory": func(): return RoadsModule.new()
	})
