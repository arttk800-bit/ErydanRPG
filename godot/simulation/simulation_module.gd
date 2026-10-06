# ============================================================================
# SIMULATION MODULE
# Converts foreground runtime delta into one canonical simulation delta and
# advances GameTime. Domain systems consume the returned delta explicitly.
# ============================================================================
extends RefCounted

const GameTimeState = preload("res://simulation/game_time_state.gd")
var _state: Dictionary = {}
var _mode := "normal"

func start(context: Dictionary) -> Dictionary:
	var candidate = context.get("state")
	if candidate is not Dictionary: return {"ok": false, "errors": ["simulation module requires mutable state"]}
	_state = candidate
	GameTimeState.ensure(_state)
	Diagnostics.register_provider(&"simulation", snapshot)
	return {"ok": true}

func stop() -> void:
	Diagnostics.unregister_provider(&"simulation")
	_state = {}
	_mode = "normal"

func set_mode(mode: String) -> Dictionary:
	if mode not in ["normal", "travel_fast", "sleep_fast"]:
		return {"ok": false, "errors": ["unsupported simulation mode: %s" % mode]}
	if mode == _mode:
		return {"ok": true, "mode": mode}
	_mode = mode
	Diagnostics.info("simulation.mode_changed", {"mode": mode})
	return {"ok": true, "mode": mode}

func step(runtime_delta: float) -> float:
	var scale := 1800.0 if _mode in ["travel_fast", "sleep_fast"] else 1.0
	var simulation_delta := maxf(0.0, runtime_delta) * scale
	GameTimeState.advance(_state, simulation_delta)
	return simulation_delta

func time() -> Dictionary:
	return GameTimeState.snapshot(_state)

func advance_game_seconds(seconds: float) -> Dictionary:
	GameTimeState.advance(_state, maxf(0.0, seconds))
	return time()

func snapshot() -> Dictionary:
	if _state.is_empty(): return {"status": "inactive"}
	return {"status": "active", "mode": _mode, "time": time()}
