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
	var manifest := PackageManifest.normalize(parsed, archive_path)
	var errors := PackageManifest.validate(manifest)
	if not errors.is_empty():
		reader.close()
		return {"ok": false, "stage": "manifest", "errors": errors}
	if manifest.payload not in files:
		reader.close()
		return {"ok": false, "stage": "payload", "error": "declared payload missing"}

	var stage_dir := STAGING.path_join(_safe_segment(manifest.id)).path_join(_safe_segment(manifest.version))
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(stage_dir))
	var payload_path := stage_dir.path_join(manifest.payload)
	var write_error := _write_staged_file(payload_path, reader.read_file(manifest.payload))
	if write_error != OK:
		reader.close()
		return {"ok": false, "stage": "staging", "error": "cannot write payload"}
	for declared in manifest.files:
		var relative := str(declared.path)
		if relative not in files:
			reader.close()
			return {"ok": false, "stage": "assets", "error": "declared file missing: %s" % relative}
		write_error = _write_staged_file(stage_dir.path_join(relative), reader.read_file(relative))
		if write_error != OK:
			reader.close()
			return {"ok": false, "stage": "staging", "error": "cannot write file: %s" % relative}
	reader.close()

	var integrity := verify_payload(manifest, payload_path)
	if not integrity.ok:
		return integrity.merged({"stage": "integrity"})
	for declared in manifest.files:
		var checked := verify_file(stage_dir.path_join(str(declared.path)), str(declared.sha256))
		if not checked.ok:
			return checked.merged({"stage": "integrity", "file": declared.path})
	return {"ok": true, "manifest": manifest, "payload_path": payload_path, "stage_dir": stage_dir}

static func verify_payload(manifest, payload_path: String) -> Dictionary:
	if not FileAccess.file_exists(payload_path):
		return {"ok": false, "error": "payload missing"}
	var actual := FileAccess.get_sha256(payload_path).to_lower()
	if actual.is_empty():
		return {"ok": false, "error": "sha256 unavailable"}
	if actual != manifest.sha256:
		return {"ok": false, "error": "sha256 mismatch", "expected": manifest.sha256, "actual": actual}
	return {"ok": true, "sha256": actual}

static func verify_file(path: String, expected_sha256: String) -> Dictionary:
	if not FileAccess.file_exists(path): return {"ok": false, "error": "file missing"}
	var actual := FileAccess.get_sha256(path).to_lower()
	if actual != expected_sha256.to_lower():
		return {"ok": false, "error": "sha256 mismatch", "expected": expected_sha256, "actual": actual}
	return {"ok": true, "sha256": actual}

static func installed_path(manifest) -> String:
	return INSTALLED.path_join(_safe_segment(manifest.id)).path_join(_safe_segment(manifest.version))

static func promote_tree(source_dir: String, destination_dir: String, manifest: Dictionary) -> Error:
	var paths: Array[String] = [str(manifest.payload)]
	for declared in manifest.files: paths.append(str(declared.path))
	for relative in paths:
		var error := promote_file(source_dir.path_join(relative), destination_dir.path_join(relative))
		if error != OK: return error
	return OK

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

static func _write_staged_file(path: String, bytes: PackedByteArray) -> Error:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(path.get_base_dir()))
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null: return FileAccess.get_open_error()
	file.store_buffer(bytes)
	file.flush()
	return OK

static func _safe_segment(value: String) -> String:
	var safe := value.validate_filename()
	return safe if not safe.is_empty() else "_invalid"

static func _remove_file(path: String) -> void:
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
