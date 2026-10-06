# ============================================================================
# GAME TIME STATE
# Owns canonical in-world elapsed time. No wall-clock or UI dependencies.
# ============================================================================
extends RefCounted

const SECONDS_PER_DAY := 86400.0

static func ensure(state: Dictionary) -> Dictionary:
	if state.get("time") is not Dictionary:
		state["time"] = {"day": 1, "second": 8.0 * 3600.0}
	var time: Dictionary = state.time
	time["day"] = maxi(1, int(time.get("day", 1)))
	time["second"] = clampf(float(time.get("second", 0.0)), 0.0, SECONDS_PER_DAY - 0.001)
	return time

static func advance(state: Dictionary, seconds: float) -> Dictionary:
	var time := ensure(state)
	var total := float(time.second) + maxf(0.0, seconds)
	var days := int(floor(total / SECONDS_PER_DAY))
	time.day = int(time.day) + days
	time.second = fmod(total, SECONDS_PER_DAY)
	return time

static func snapshot(state: Dictionary) -> Dictionary:
	var time := ensure(state)
	var whole := int(floor(float(time.second)))
	return {"day": int(time.day), "second": float(time.second), "hour": whole / 3600, "minute": (whole % 3600) / 60}
