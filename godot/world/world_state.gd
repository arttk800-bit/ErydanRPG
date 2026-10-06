# ============================================================================
# WORLD STATE
# Owns canonical mutable world location and discovery/visit state.
# ============================================================================
extends RefCounted

static func ensure(state: Dictionary) -> Dictionary:
	if state.get("world") is not Dictionary: state["world"] = {}
	var world: Dictionary = state.world
	if world.get("regions") is not Dictionary: world["regions"] = {}
	if world.get("knowledge") is not Dictionary: world["knowledge"] = {}
	if world.get("current") is not Dictionary:
		world["current"] = {"region_id": null, "location_id": null, "district_id": null, "place_id": null}
	for key in ["region_id", "location_id", "district_id", "place_id"]:
		if not world.current.has(key): world.current[key] = null
	state["world"] = world
	return world

static func current(state: Dictionary) -> Dictionary:
	return ensure(state).current

static func point_knowledge(state: Dictionary, id: String, discovered_by_default: bool = true) -> Dictionary:
	var world := ensure(state)
	if not world.knowledge.has(id):
		world.knowledge[id] = {"discovered": discovered_by_default, "visited": false, "favorite": false}
	return world.knowledge[id]

static func is_discovered(state: Dictionary, point: Dictionary) -> bool:
	if point.is_empty(): return false
	var world := ensure(state)
	var id := str(point.get("id", ""))
	if world.knowledge.has(id): return world.knowledge[id].get("discovered", true) != false
	return point.get("hidden", false) != true

static func discover_point(state: Dictionary, point: Dictionary, source: String = "unknown") -> bool:
	if point.is_empty(): return false
	var id := str(point.get("id", ""))
	if id.is_empty(): return false
	var known := point_knowledge(state, id, point.get("hidden", false) != true)
	var fresh := known.get("discovered", false) != true
	known["discovered"] = true
	known["discovered_by"] = source
	ensure(state).knowledge[id] = known
	if fresh:
		if state.get("history") is not Array: state["history"] = []
		state.history.append({"type": "discovery", "point_id": id, "name": point.get("name"), "source": source})
	return fresh

static func mark_visited(state: Dictionary, point: Dictionary) -> void:
	if point.is_empty(): return
	var id := str(point.get("id", ""))
	if id.is_empty(): return
	var known := point_knowledge(state, id)
	known["discovered"] = true
	known["visited"] = true
	ensure(state).knowledge[id] = known

static func toggle_favorite(state: Dictionary, point_id: String) -> bool:
	var known := point_knowledge(state, point_id)
	known["favorite"] = not bool(known.get("favorite", false))
	ensure(state).knowledge[point_id] = known
	return known.favorite

static func enter_region(state: Dictionary, region_id: String) -> Dictionary:
	var world := ensure(state)
	var current_state: Dictionary = world.current
	var previous := str(current_state.get("region_id", ""))
	if not previous.is_empty() and world.regions.get(previous) is Dictionary and world.regions[previous].get("status") == "current":
		world.regions[previous]["status"] = "visited"
	var known = world.regions.get(region_id, {"status": "discovered"})
	known["status"] = "current"
	world.regions[region_id] = known
	current_state["region_id"] = region_id
	current_state["location_id"] = null
	current_state["district_id"] = null
	current_state["place_id"] = null
	return current_state

static func enter_map_point(state: Dictionary, point: Dictionary) -> Dictionary:
	var current_state := current(state)
	if point.is_empty(): return current_state
	mark_visited(state, point)
	match str(point.get("class", "")):
		"location":
			current_state["location_id"] = point.id
			current_state["district_id"] = null
			current_state["place_id"] = null
		"district":
			current_state["district_id"] = point.id
			current_state["place_id"] = null
		"place", "transition":
			current_state["place_id"] = point.id
	return current_state

static func leave_location_for_region(state: Dictionary) -> Dictionary:
	var current_state := current(state)
	current_state["location_id"] = null
	current_state["district_id"] = null
	current_state["place_id"] = null
	return current_state
