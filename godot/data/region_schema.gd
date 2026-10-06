# ============================================================================
# REGION DATA SCHEMA
# Validates complete authored/package region definitions independently of UI.
# ============================================================================
extends RefCounted

const RoadGraph = preload("res://roads/road_graph.gd")

static func validate(region: Dictionary, expected_id: String = "") -> Array[String]:
	var errors: Array[String] = []
	var region_id := str(region.get("region_id", ""))
	if region_id.is_empty():
		errors.append("region_id is required")
	elif not expected_id.is_empty() and region_id != expected_id:
		errors.append("region_id must match catalog id: %s" % expected_id)
	_validate_metrics(region.get("metrics"), "metrics", errors)
	var points = region.get("points")
	if points is not Array or points.is_empty():
		errors.append("points must be a non-empty array")
	else:
		var ids: Dictionary = {}
		for index in points.size():
			var point = points[index]
			if point is not Dictionary:
				errors.append("points[%s] must be an object" % index)
				continue
			var id := str(point.get("id", ""))
			if id.is_empty(): errors.append("points[%s].id is required" % index)
			elif ids.has(id): errors.append("duplicate point id: %s" % id)
			ids[id] = true
			for axis in ["x", "y"]:
				var value = point.get(axis)
				if value is not float and value is not int:
					errors.append("points[%s].%s must be numeric" % [index, axis])
				elif float(value) < 0.0 or float(value) > 1.0:
					errors.append("points[%s].%s must be normalized 0..1" % [index, axis])
	_validate_roads(region.get("roads"), errors)
	if region.get("roads") is Dictionary:
		for error in RoadGraph.validate(region.roads): errors.append("roads: %s" % error)
		_validate_access_owners(region, errors)
	return errors

static func _validate_metrics(value, path: String, errors: Array[String]) -> void:
	if value is not Dictionary:
		errors.append("%s must be an object" % path)
		return
	for key in ["width_meters", "height_meters"]:
		var amount = value.get(key)
		if amount is not float and amount is not int:
			errors.append("%s.%s must be numeric" % [path, key])
		elif float(amount) <= 0.0:
			errors.append("%s.%s must be > 0" % [path, key])

static func _validate_roads(value, errors: Array[String]) -> void:
	if value is not Dictionary:
		errors.append("roads must be an object")
		return
	_validate_metrics(value.get("metrics"), "roads.metrics", errors)
	if value.get("nodes") is not Array: errors.append("roads.nodes must be an array")
	if value.get("edges") is not Array: errors.append("roads.edges must be an array")
	if value.get("access") is not Dictionary: errors.append("roads.access must be an object")

static func _validate_access_owners(region: Dictionary, errors: Array[String]) -> void:
	var point_ids: Dictionary = {}
	for point in region.get("points", []):
		if point is Dictionary: point_ids[str(point.get("id", ""))] = true
	for owner_id in region.get("roads", {}).get("access", {}):
		if not point_ids.has(str(owner_id)):
			errors.append("roads.access references unknown point: %s" % owner_id)
