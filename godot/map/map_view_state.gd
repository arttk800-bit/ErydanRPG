# ============================================================================
# MAP VIEW STATE
# Owns browsing scope only; never mutates physical World position.
# ============================================================================
extends RefCounted

const WORLD := "world"
const REGION := "region"
const LOCATION := "location"

static func ensure(state: Dictionary) -> Dictionary:
	if state.get("ui") is not Dictionary: state["ui"] = {}
	var current = state.get("world", {}).get("current", {})
	if state.ui.get("map_view") is not Dictionary:
		state.ui["map_view"] = {
			"level": REGION if current.get("region_id") != null else WORLD,
			"region_id": current.get("region_id"),
			"location_id": current.get("location_id")
		}
	var view: Dictionary = state.ui.map_view
	if str(view.get("level", "")) not in [WORLD, REGION, LOCATION]: view["level"] = WORLD
	if not view.has("region_id"): view["region_id"] = null
	if not view.has("location_id"): view["location_id"] = null
	return view

static func show_world(state: Dictionary) -> Dictionary:
	var view := ensure(state)
	view["level"] = WORLD
	view["location_id"] = null
	return view

static func show_region(state: Dictionary, region_id: String) -> Dictionary:
	var view := ensure(state)
	view["level"] = REGION
	view["region_id"] = region_id
	view["location_id"] = null
	return view

static func show_location(state: Dictionary, region_id: String, location_id: String) -> Dictionary:
	var view := ensure(state)
	view["level"] = LOCATION
	view["region_id"] = region_id if not region_id.is_empty() else view.get("region_id")
	view["location_id"] = location_id
	return view

static func snapshot(state: Dictionary) -> Dictionary:
	return ensure(state).duplicate(true)
