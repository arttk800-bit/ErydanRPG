# ============================================================================
# PACKAGE ORDER
# Resolves active package dependencies, conflicts and deterministic load order.
# ============================================================================
extends RefCounted

static func resolve(records: Array[Dictionary]) -> Dictionary:
	var by_id: Dictionary = {}
	var errors: Array[String] = []
	for source in records:
		var record := source.duplicate(true)
		var id := str(record.get("id", ""))
		if id.is_empty():
			errors.append("active package has empty id")
			continue
		if by_id.has(id):
			errors.append("duplicate active package id: %s" % id)
			continue
		record["priority"] = int(record.get("priority", 0))
		record["dependencies"] = _string_list(record.get("dependencies", []))
		record["conflicts"] = _string_list(record.get("conflicts", []))
		by_id[id] = record

	for id in by_id:
		var record: Dictionary = by_id[id]
		for dependency in record.dependencies:
			if dependency == id:
				errors.append("%s depends on itself" % id)
			elif not by_id.has(dependency):
				errors.append("%s requires missing package %s" % [id, dependency])
		for conflict in record.conflicts:
			if conflict == id:
				errors.append("%s conflicts with itself" % id)
			elif by_id.has(conflict):
				errors.append("%s conflicts with active package %s" % [id, conflict])
	if not errors.is_empty():
		return {"ok": false, "errors": _unique_sorted(errors)}

	var indegree: Dictionary = {}
	var dependents: Dictionary = {}
	for id in by_id:
		indegree[id] = 0
		dependents[id] = []
	for id in by_id:
		for dependency in by_id[id].dependencies:
			indegree[id] = int(indegree[id]) + 1
			dependents[dependency].append(id)

	var ready: Array[String] = []
	for id in by_id:
		if int(indegree[id]) == 0:
			ready.append(id)
	var ordered: Array[Dictionary] = []
	while not ready.is_empty():
		ready.sort_custom(func(a, b): return _less(by_id[a], by_id[b]))
		var id: String = ready.pop_front()
		ordered.append(by_id[id].duplicate(true))
		for dependent in dependents[id]:
			indegree[dependent] = int(indegree[dependent]) - 1
			if int(indegree[dependent]) == 0:
				ready.append(dependent)

	if ordered.size() != by_id.size():
		var cyclic: Array[String] = []
		for id in by_id:
			if int(indegree[id]) > 0:
				cyclic.append(id)
		cyclic.sort()
		return {"ok": false, "errors": ["dependency cycle: %s" % ", ".join(cyclic)]}
	return {"ok": true, "records": ordered}

static func _less(a: Dictionary, b: Dictionary) -> bool:
	var priority_a := int(a.get("priority", 0))
	var priority_b := int(b.get("priority", 0))
	if priority_a != priority_b:
		return priority_a < priority_b
	return str(a.get("id", "")) < str(b.get("id", ""))

static func _string_list(value) -> Array[String]:
	var result: Array[String] = []
	if value is not Array:
		return result
	for item in value:
		result.append(str(item))
	return result

static func _unique_sorted(values: Array[String]) -> Array[String]:
	var seen: Dictionary = {}
	for value in values:
		seen[value] = true
	var result: Array[String] = []
	for value in seen:
		result.append(value)
	result.sort()
	return result
