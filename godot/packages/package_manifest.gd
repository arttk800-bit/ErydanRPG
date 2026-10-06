# ============================================================================
# PACKAGE MANIFEST
# Parses and validates package identity, payload and runtime compatibility.
# ============================================================================
class_name EirdanPackageManifest
extends RefCounted

const FORMAT := "eirdan-package"
const FORMAT_VERSION := 1

var id := ""
var version := ""
var kind := ""
var runtime_min := ""
var content_hash := ""
var payload := ""
var source := ""

static func from_dictionary(raw: Dictionary, source_path: String = "") -> EirdanPackageManifest:
	var manifest := EirdanPackageManifest.new()
	manifest.id = str(raw.get("id", ""))
	manifest.version = str(raw.get("version", ""))
	manifest.kind = str(raw.get("kind", ""))
	manifest.runtime_min = str(raw.get("runtime_min", ""))
	manifest.content_hash = str(raw.get("sha256", "")).to_lower()
	manifest.payload = str(raw.get("payload", ""))
	manifest.source = source_path
	return manifest

func validate() -> PackedStringArray:
	var errors := PackedStringArray()
	if id.is_empty(): errors.append("missing id")
	if version.is_empty(): errors.append("missing version")
	if kind not in ["content", "override", "development"]: errors.append("unsupported kind")
	if payload.is_empty(): errors.append("missing payload")
	if content_hash.length() != 64 or not content_hash.is_valid_hex_number(false):
		errors.append("sha256 must contain 64 hexadecimal characters")
	return errors

func identity() -> String:
	return "%s@%s" % [id, version]
