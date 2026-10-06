# ============================================================================
# PACKAGE INSTALLER
# Owns staging, integrity verification and safe filesystem promotion.
# ============================================================================
class_name EirdanPackageInstaller
extends RefCounted

const ROOT := "user://packages"
const STAGING := ROOT + "/staging"
const INSTALLED := ROOT + "/installed"

static func prepare_directories() -> void:
	for path in [ROOT, STAGING, INSTALLED]:
		DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(path))

static func read_manifest(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {"ok": false, "errors": PackedStringArray(["manifest unreadable"])}
	var parsed = JSON.parse_string(file.get_as_text())
	if parsed is not Dictionary:
		return {"ok": false, "errors": PackedStringArray(["manifest is not a JSON object"])}
	var manifest := EirdanPackageManifest.from_dictionary(parsed, path)
	var errors := manifest.validate()
	return {"ok": errors.is_empty(), "manifest": manifest, "errors": errors}

static func verify_payload(manifest: EirdanPackageManifest, payload_path: String) -> Dictionary:
	if not FileAccess.file_exists(payload_path):
		return {"ok": false, "error": "payload missing"}
	var actual := FileAccess.get_sha256(payload_path).to_lower()
	if actual.is_empty():
		return {"ok": false, "error": "sha256 unavailable"}
	if actual != manifest.content_hash:
		return {"ok": false, "error": "sha256 mismatch", "expected": manifest.content_hash, "actual": actual}
	return {"ok": true, "sha256": actual}

static func installed_path(manifest: EirdanPackageManifest) -> String:
	return INSTALLED.path_join(manifest.id).path_join(manifest.version)

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
