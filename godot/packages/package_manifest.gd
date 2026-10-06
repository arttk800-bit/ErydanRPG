# ============================================================================
# PACKAGE MANIFEST
# Normalizes and validates package identity, payload and compatibility metadata.
# ============================================================================
extends RefCounted

const FORMAT := "eirdan-package"
const FORMAT_VERSION := 1

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
		"source": source_path
	}

static func validate(manifest: Dictionary) -> PackedStringArray:
	var errors := PackedStringArray()
	if manifest.format != FORMAT: errors.append("unsupported package format")
	if manifest.format_version != FORMAT_VERSION: errors.append("unsupported package format version")
	if manifest.id.is_empty(): errors.append("missing id")
	if manifest.version.is_empty(): errors.append("missing version")
	if manifest.kind not in ["content", "override", "development"]: errors.append("unsupported kind")
	if manifest.payload.is_empty(): errors.append("missing payload")
	if manifest.sha256.length() != 64 or not manifest.sha256.is_valid_hex_number(false):
		errors.append("sha256 must contain 64 hexadecimal characters")
	return errors

static func identity(manifest: Dictionary) -> String:
	return "%s@%s" % [manifest.id, manifest.version]
