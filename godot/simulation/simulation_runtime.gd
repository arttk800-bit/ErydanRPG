# ============================================================================
# SIMULATION RUNTIME
# Application coordinator for foreground simulation. Owns the runtime loop that
# advances canonical game time and Travel; presentation only observes snapshots.
# ============================================================================
extends Node

var _simulation
var _travel
var _region: Dictionary = {}
var _fast_travel := true

func setup(simulation, travel, region: Dictionary, fast_travel: bool = true) -> void:
	_simulation = simulation
	_travel = travel
	_region = region
	_fast_travel = fast_travel
	Diagnostics.register_provider(&"simulation_runtime", snapshot)
	set_process(true)

func shutdown() -> void:
	set_process(false)
	Diagnostics.unregister_provider(&"simulation_runtime")
	_simulation = null
	_travel = null
	_region = {}

func _exit_tree() -> void:
	Diagnostics.unregister_provider(&"simulation_runtime")

func _process(delta: float) -> void:
	if _simulation == null or _travel == null: return
	var travel: Dictionary = _travel.snapshot()
	if travel.get("status") != "travelling":
		_simulation.set_mode("normal")
		return
	_simulation.set_mode("travel_fast" if _fast_travel else "normal")
	var simulation_delta := float(_simulation.step(delta))
	travel = _travel.tick(simulation_delta)
	if travel.get("status") == "arrived":
		var destination := _point(str(travel.get("to_id", "")))
		if destination.is_empty():
			Diagnostics.error("simulation_runtime.arrival_point_missing", {"to_id": travel.get("to_id", "")})
			return
		var arrived := _travel.arrive(destination)
		if not arrived.is_empty():
			_simulation.set_mode("normal")
			Diagnostics.info("simulation_runtime.travel_arrived", {"point_id": destination.get("id", ""), "time": _simulation.time()})

func snapshot() -> Dictionary:
	return {
		"status": "active" if _simulation != null and _travel != null else "inactive",
		"fast_travel": _fast_travel,
		"time_owner": "simulation",
		"travel_owner": "travel",
		"simulation": _simulation.snapshot() if _simulation != null else {},
		"travel": _travel.snapshot() if _travel != null else {}
	}

func _point(id: String) -> Dictionary:
	for point in _region.get("points", []):
		if point is Dictionary and str(point.get("id", "")) == id: return point
	return {}
