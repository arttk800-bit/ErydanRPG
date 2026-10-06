# ============================================================================
# PACKAGE MANIFEST
# Normalizes and validates package identity, payload and compatibility metadata.
# ============================================================================
extends RefCounted

const FORMAT := "eirdan-package"
const FORMAT_VERSION := 2
const MIN_FORMAT_VERSION := 1

static func normalize(raw: Dictionary, source_path: String = "") -> Dictionary:
	return {
		"format": str(raw.get("format", "")),
		"format_version": int(raw.get("format_version", 0)),
		"id": str(raw.get("id", "")),
		"version": str(raw.get("version", "")),
		"kind": str(raw.get("kind", "")),
		"runtime_min": str(raw.get("runtime_min", "")),
		"sha256": str(raw.get("sha256", "")).to_lower(),
		"payload": str(raw.get("payload", "")),
		"priority": int(raw.get("priority", 0)),
		"dependencies": _normalize_id_list(raw.get("dependencies", [])),
		"conflicts": _normalize_id_list(raw.get("conflicts", [])),
		"files": _normalize_files(raw.get("files", [])),
		"source": source_path
	}

static func validate(manifest: Dictionary) -> PackedStringArray:
	var errors := PackedStringArray()
	if manifest.format != FORMAT: errors.append("unsupported package format")
	if manifest.format_version < MIN_FORMAT_VERSION or manifest.format_version > FORMAT_VERSION: errors.append("unsupported package format version")
	if manifest.id.is_empty(): errors.append("missing id")
	if manifest.version.is_empty(): errors.append("missing version")
	if manifest.kind not in ["content", "override", "development"]: errors.append("unsupported kind")
	if manifest.payload.is_empty(): errors.append("missing payload")
	if manifest.sha256.length() != 64 or not manifest.sha256.is_valid_hex_number(false):
		errors.append("sha256 must contain 64 hexadecimal characters")
	_validate_id_list(manifest.dependencies, "dependencies", manifest.id, errors)
	_validate_id_list(manifest.conflicts, "conflicts", manifest.id, errors)
	_validate_files(manifest.files, manifest.payload, errors)
	return errors

static func identity(manifest: Dictionary) -> String:
	return "%s@%s" % [manifest.id, manifest.version]

static func _normalize_id_list(value) -> Array[String]:
	var result: Array[String] = []
	if value is not Array:
		return result
	for item in value:
		result.append(str(item))
	return result

static func _validate_id_list(values: Array[String], field: String, package_id: String, errors: PackedStringArray) -> void:
	var seen: Dictionary = {}
	for value in values:
		if value.is_empty():
			errors.append("%s contains empty package id" % field)
		elif value == package_id:
			errors.append("%s cannot contain package itself" % field)
		elif seen.has(value):
			errors.append("%s contains duplicate package id: %s" % [field, value])
		seen[value] = true

static func _normalize_files(value) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	if value is not Array: return result
	for item in value:
		if item is Dictionary:
			result.append({"path": str(item.get("path", "")), "sha256": str(item.get("sha256", "")).to_lower()})
	return result

static func _validate_files(files: Array[Dictionary], payload: String, errors: PackedStringArray) -> void:
	var seen: Dictionary = {}
	for item in files:
		var path := str(item.get("path", ""))
		var sha256 := str(item.get("sha256", ""))
		if path.is_empty() or path.is_absolute_path() or ".." in path.split("/"):
			errors.append("files contains unsafe path: %s" % path)
		elif path == MANIFEST_PLACEHOLDER or path == payload:
			errors.append("files duplicates reserved path: %s" % path)
		elif seen.has(path):
			errors.append("files contains duplicate path: %s" % path)
		if sha256.length() != 64 or not sha256.is_valid_hex_number(false):
			errors.append("files sha256 must contain 64 hexadecimal characters: %s" % path)
		seen[path] = true

const MANIFEST_PLACEHOLDER := "manifest.json"
