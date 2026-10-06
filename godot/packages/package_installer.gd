# ============================================================================
# PACKAGE INSTALLER
# Owns archive extraction, staging, integrity verification and promotion.
# ============================================================================
class_name EirdanPackageInstaller
extends RefCounted

const PackageManifest = preload("res://packages/package_manifest.gd")

const ROOT := "user://packages"
const STAGING := ROOT + "/staging"
const INSTALLED := ROOT + "/installed"
const MANIFEST_NAME := "manifest.json"

static func prepare_directories() -> void:
	for path in [ROOT, STAGING, INSTALLED]:
		DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(path))

static func stage_archive(archive_path: String) -> Dictionary:
	var reader := ZIPReader.new()
	var open_error := reader.open(archive_path)
	if open_error != OK:
		return {"ok": false, "stage": "archive", "error": "cannot open zip: %s" % open_error}
	var files := reader.get_files()
	if MANIFEST_NAME not in files:
		reader.close()
		return {"ok": false, "stage": "manifest", "error": "manifest.json missing"}

	var manifest_bytes := reader.read_file(MANIFEST_NAME)
	var parsed = JSON.parse_string(manifest_bytes.get_string_from_utf8())
	if parsed is not Dictionary:
		reader.close()
		return {"ok": false, "stage": "manifest", "error": "manifest is not a JSON object"}
	var manifest := PackageManifest.from_dictionary(parsed, archive_path)
	var errors := manifest.validate()
	if not errors.is_empty():
		reader.close()
		return {"ok": false, "stage": "manifest", "errors": errors}
	if manifest.payload not in files:
		reader.close()
		return {"ok": false, "stage": "payload", "error": "declared payload missing"}

	var stage_dir := STAGING.path_join(_safe_segment(manifest.id)).path_join(_safe_segment(manifest.version))
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(stage_dir))
	var payload_path := stage_dir.path_join(manifest.payload.get_file())
	var payload_bytes := reader.read_file(manifest.payload)
	reader.close()

	var file := FileAccess.open(payload_path, FileAccess.WRITE)
	if file == null:
		return {"ok": false, "stage": "staging", "error": "cannot write payload"}
	file.store_buffer(payload_bytes)
	file.flush()
	file = null

	var integrity := verify_payload(manifest, payload_path)
	if not integrity.ok:
		_remove_file(payload_path)
		return integrity.merged({"stage": "integrity"})
	return {"ok": true, "manifest": manifest, "payload_path": payload_path}

static func verify_payload(manifest, payload_path: String) -> Dictionary:
	if not FileAccess.file_exists(payload_path):
		return {"ok": false, "error": "payload missing"}
	var actual := FileAccess.get_sha256(payload_path).to_lower()
	if actual.is_empty():
		return {"ok": false, "error": "sha256 unavailable"}
	if actual != manifest.content_hash:
		return {"ok": false, "error": "sha256 mismatch", "expected": manifest.content_hash, "actual": actual}
	return {"ok": true, "sha256": actual}

static func installed_path(manifest) -> String:
	return INSTALLED.path_join(_safe_segment(manifest.id)).path_join(_safe_segment(manifest.version))

static func promote_file(source: String, destination: String) -> Error:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(destination.get_base_dir()))
	var bytes := FileAccess.get_file_as_bytes(source)
	if bytes.is_empty() and FileAccess.get_size(source) > 0:
		return ERR_FILE_CANT_READ
	var file := FileAccess.open(destination, FileAccess.WRITE)
	if file == null:
		return FileAccess.get_open_error()
	file.store_buffer(bytes)
	file.flush()
	return OK

static func _safe_segment(value: String) -> String:
	var safe := value.validate_filename()
	return safe if not safe.is_empty() else "_invalid"

static func _remove_file(path: String) -> void:
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
