# ============================================================================
# TRAVEL EVENT MODULE
# Owns deterministic road-event scheduling and choice resolution. Definitions
# come from DataRegistry; mutable pending state remains in the save world state.
# ============================================================================
extends RefCounted

var _state: Dictionary = {}
var _travel
var _simulation
var _last_result := ""

func start(context: Dictionary) -> Dictionary:
	var candidate = context.get("state")
	var modules = context.get("modules")
	if candidate is not Dictionary: return {"ok": false, "errors": ["travel events require mutable state"]}
	if modules == null: return {"ok": false, "errors": ["travel events require module runtime"]}
	_travel = modules.instance("travel")
	_simulation = modules.instance("simulation")
	if _travel == null or _simulation == null: return {"ok": false, "errors": ["travel events require travel and simulation modules"]}
	_state = candidate
	_ensure_state()
	Diagnostics.register_provider(&"travel_events", snapshot)
	return {"ok": true}

func stop() -> void:
	Diagnostics.unregister_provider(&"travel_events")
	_state = {}
	_travel = null
	_simulation = null
	_last_result = ""

func advance(travel: Dictionary) -> Dictionary:
	if str(travel.get("status", "idle")) != "travelling": return current()
	var event_state: Dictionary = _ensure_state()
	if event_state.get("status") == "pending":
		_travel.pause()
		return current()
	var journey_key := str(travel.get("journey_id", "%s:%s:%s" % [travel.get("region_id", ""), travel.get("from_id", ""), travel.get("to_id", "")]))
	var interval_m := maxf(100.0, float(DataRegistry.resolve("travel.event_interval_km", 18.0)) * 1000.0)
	if str(event_state.get("journey_key", "")) != journey_key:
		event_state = {"status": "scheduled", "journey_key": journey_key, "next_distance": interval_m, "checks": 0}
		_state.world["travel_event"] = event_state
	var done := float(travel.get("distance_done", 0.0))
	if done < float(event_state.get("next_distance", interval_m)): return {}
	event_state.checks = int(event_state.get("checks", 0)) + 1
	event_state.next_distance = float(event_state.get("next_distance", interval_m)) + interval_m
	var chance := clampf(float(DataRegistry.resolve("travel.event_chance", 0.45)), 0.0, 1.0)
	if _roll01("%s:check:%d" % [journey_key, int(event_state.checks)]) > chance:
		Diagnostics.trace("travel_event.check_clear", {"journey_key": journey_key, "distance": done, "check": event_state.checks})
		return {}
	var selected := _select_definition(journey_key, int(event_state.checks), float(travel.get("distance_total", 0.0)))
	if selected.is_empty(): return {}
	event_state["status"] = "pending"
	event_state["event_id"] = selected.id
	event_state["triggered_distance"] = done
	_travel.pause()
	Diagnostics.info("travel_event.triggered", {"event_id": selected.id, "journey_key": journey_key, "distance": done})
	return current()

func current() -> Dictionary:
	if _state.is_empty(): return {}
	var event_state: Dictionary = _ensure_state()
	if event_state.get("status") != "pending": return {}
	var event_id := str(event_state.get("event_id", ""))
	var definition = DataRegistry.entity("travel_events", event_id, {})
	if definition is not Dictionary or definition.is_empty():
		return {"id": event_id, "title": "Дорога зовёт", "text": "Событие больше недоступно в активном наборе данных.", "choices": [{"id": "continue", "label": "Продолжить путь", "result": "Отряд продолжает путь.", "time_seconds": 0}]}
	return definition

func resolve(choice_id: String) -> Dictionary:
	var definition := current()
	if definition.is_empty(): return {}
	var selected: Dictionary = {}
	for choice in definition.get("choices", []):
		if choice is Dictionary and str(choice.get("id", "")) == choice_id:
			selected = choice
			break
	if selected.is_empty(): return {}
	var seconds := maxf(0.0, float(selected.get("time_seconds", 0.0)))
	if seconds > 0.0: _simulation.advance_game_seconds(seconds)
	_last_result = str(selected.get("result", ""))
	var event_state: Dictionary = _ensure_state()
	var event_id := str(event_state.get("event_id", ""))
	event_state["status"] = "resolved"
	event_state.erase("event_id")
	event_state.erase("triggered_distance")
	_travel.resume()
	Diagnostics.info("travel_event.resolved", {"event_id": event_id, "choice_id": choice_id, "time_seconds": seconds, "result": _last_result})
	return {"ok": true, "event_id": event_id, "choice_id": choice_id, "result": _last_result, "time_seconds": seconds}

func last_result() -> String:
	return _last_result

func snapshot() -> Dictionary:
	return {"state": _ensure_state().duplicate(true) if not _state.is_empty() else {}, "current": current(), "last_result": _last_result, "definition_count": DataRegistry.entities("travel_events").size()}

func _ensure_state() -> Dictionary:
	if _state.get("world") is not Dictionary: _state["world"] = {}
	if _state.world.get("travel_event") is not Dictionary: _state.world["travel_event"] = {"status": "idle"}
	return _state.world.travel_event

func _select_definition(journey_key: String, check: int, total_distance: float) -> Dictionary:
	var catalog := DataRegistry.entities("travel_events")
	var ids: Array[String] = []
	for id in catalog: ids.append(str(id))
	ids.sort()
	var eligible: Array[Dictionary] = []
	var total_weight := 0
	for id in ids:
		var definition = catalog[id]
		if definition is not Dictionary: continue
		if total_distance / 1000.0 < float(definition.get("min_distance_km", 0.0)): continue
		var weight := maxi(1, int(round(float(definition.get("weight", 1)))))
		var entry: Dictionary = definition.duplicate(true)
		entry["id"] = id
		entry["resolved_weight"] = weight
		eligible.append(entry)
		total_weight += weight
	if eligible.is_empty() or total_weight <= 0: return {}
	var pick := absi(hash("%s:event:%d" % [journey_key, check])) % total_weight
	for entry in eligible:
		pick -= int(entry.resolved_weight)
		if pick < 0: return entry
	return eligible.back()

func _roll01(key: String) -> float:
	return float(absi(hash(key)) % 10000) / 9999.0
