# ============================================================================
# PACKAGE CATALOG CONTRACT
# Validates and normalizes a remote source index. It never downloads or installs.
# ============================================================================
extends RefCounted

const FORMAT := "eirdan-package-catalog"
const FORMAT_VERSION := 1
const CHANNELS := ["official", "mod"]
const APPLY_MODES := ["hot", "scene"]

static func parse_bytes(bytes: PackedByteArray) -> Dictionary:
	var parsed = JSON.parse_string(bytes.get_string_from_utf8())
	if parsed is not Dictionary: return {"ok": false, "errors": ["catalog must be a JSON object"]}
	return normalize(parsed)

static func normalize(value: Dictionary) -> Dictionary:
	var errors: Array[String] = []
	if value.get("format") != FORMAT: errors.append("unsupported catalog format")
	if int(value.get("format_version", 0)) != FORMAT_VERSION: errors.append("unsupported catalog format_version")
	var packages = value.get("packages")
	if packages is not Array: return {"ok": false, "errors": errors + ["packages must be an array"]}
	var result: Array[Dictionary] = []
	var ids: Dictionary = {}
	for index in packages.size():
		var entry = packages[index]
		var path := "packages[%d]" % index
		if entry is not Dictionary:
			errors.append("%s must be an object" % path)
			continue
		var id := str(entry.get("id", ""))
		if not _valid_id(id): errors.append("%s.id is invalid" % path)
		elif ids.has(id): errors.append("duplicate package id: %s" % id)
		ids[id] = true
		var version := str(entry.get("version", ""))
		if not _valid_version(version): errors.append("%s.version is invalid" % path)
		var channel := str(entry.get("channel", "official"))
		if channel not in CHANNELS: errors.append("%s.channel is unsupported" % path)
		var apply_mode := str(entry.get("apply", "scene"))
		if apply_mode not in APPLY_MODES: errors.append("%s.apply is unsupported" % path)
		var url := str(entry.get("url", ""))
		if not url.begins_with("https://"): errors.append("%s.url must use HTTPS" % path)
		var sha256 := str(entry.get("sha256", "")).to_lower()
		if sha256.length() != 64 or not sha256.is_valid_hex_number(false): errors.append("%s.sha256 is invalid" % path)
		var size_bytes = entry.get("size_bytes", 0)
		if size_bytes is not int and size_bytes is not float: errors.append("%s.size_bytes must be numeric" % path)
		elif int(size_bytes) < 0: errors.append("%s.size_bytes must be >= 0" % path)
		result.append({
			"id": id, "title": str(entry.get("title", id)), "version": version,
			"channel": channel, "category": str(entry.get("category", "other")),
			"apply": apply_mode, "runtime_min": str(entry.get("runtime_min", "0.1.0")),
			"size_bytes": int(size_bytes), "sha256": sha256, "url": url
		})
	return {"ok": errors.is_empty(), "errors": errors, "packages": result, "generated_at": str(value.get("generated_at", ""))}

static func compare_versions(left: String, right: String) -> int:
	var a := _version_tuple(left)
	var b := _version_tuple(right)
	for index in 3:
		if a[index] < b[index]: return -1
		if a[index] > b[index]: return 1
	return 0

static func _version_tuple(value: String) -> Array[int]:
	var result: Array[int] = [0, 0, 0]
	var core := value.split("-", false, 1)[0]
	var parts := core.split(".")
	for index in mini(parts.size(), 3): result[index] = int(parts[index])
	return result

static func _valid_version(value: String) -> bool:
	if value.is_empty(): return false
	var core := value.split("-", false, 1)[0]
	var parts := core.split(".")
	if parts.size() < 2 or parts.size() > 3: return false
	for part in parts:
		if not str(part).is_valid_int() or int(part) < 0: return false
	return true

static func _valid_id(value: String) -> bool:
	if value.is_empty() or value != value.to_lower(): return false
	for character in value:
		if not (character >= "a" and character <= "z") and not (character >= "0" and character <= "9") and character not in ["_", "-", "."]: return false
	return true
