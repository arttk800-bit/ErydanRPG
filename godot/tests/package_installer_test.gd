# ============================================================================
# PACKAGE INSTALLER INTEGRATION TEST
# Exercises portable ZIP install, integrity rejection, compatibility and rollback.
# ============================================================================
extends Node

func _ready() -> void:
	var payload := "{\"travel\":{\"walk_speed_kmh\":4.2}}".to_utf8_buffer()
	var hash := _sha256_for_bytes(payload)
	_assert(not hash.is_empty(), "payload hash")

	var v1 := _make_package("eirdan.test.balance", "1.0.0", "0.1.0", payload, hash)
	var install_v1 := Packages.install_archive(v1)
	_assert(install_v1.ok, "valid package installs")
	_assert(Packages.active_packages().back().version == "1.0.0", "v1 active")

	var bad := _make_package("eirdan.test.bad", "1.0.0", "0.1.0", payload, "0".repeat(64))
	var bad_result := Packages.install_archive(bad)
	_assert(not bad_result.ok and bad_result.stage == "integrity", "bad hash rejected")

	var incompatible := _make_package("eirdan.test.future", "1.0.0", "99.0.0", payload, hash)
	var incompatible_result := Packages.install_archive(incompatible)
	_assert(not incompatible_result.ok and incompatible_result.stage == "runtime", "future runtime rejected")

	var v2 := _make_package("eirdan.test.balance", "2.0.0", "0.1.0", payload, hash)
	var install_v2 := Packages.install_archive(v2)
	_assert(install_v2.ok, "v2 installs")
	_assert(Packages.active_packages().back().version == "2.0.0", "v2 active")
	var rollback := Packages.rollback()
	_assert(rollback.ok, "rollback succeeds")
	var restored := Packages.active_packages().filter(func(item): return item.id == "eirdan.test.balance")
	_assert(restored.size() == 1 and restored[0].version == "1.0.0", "rollback restores v1")

	print("godot package installer integration: OK")
	get_tree().quit(0)

func _make_package(id: String, version: String, runtime_min: String, payload: PackedByteArray, hash: String) -> String:
	var path := "user://%s-%s.zip" % [id.validate_filename(), version]
	var manifest := {
		"format": "eirdan-package",
		"format_version": 1,
		"id": id,
		"version": version,
		"kind": "override",
		"runtime_min": runtime_min,
		"payload": "data.json",
		"sha256": hash
	}
	var zip := ZIPPacker.new()
	_assert(zip.open(path) == OK, "zip open")
	_assert(zip.start_file("manifest.json") == OK, "manifest entry")
	_assert(zip.write_file(JSON.stringify(manifest).to_utf8_buffer()) == OK, "manifest write")
	_assert(zip.close_file() == OK, "manifest close")
	_assert(zip.start_file("data.json") == OK, "payload entry")
	_assert(zip.write_file(payload) == OK, "payload write")
	_assert(zip.close_file() == OK, "payload close")
	_assert(zip.close() == OK, "zip close")
	return path

func _sha256_for_bytes(bytes: PackedByteArray) -> String:
	var path := "user://hash-source.tmp"
	var file := FileAccess.open(path, FileAccess.WRITE)
	_assert(file != null, "hash temp open")
	file.store_buffer(bytes)
	file.flush()
	file = null
	return FileAccess.get_sha256(path)

func _assert(condition: bool, label: String) -> void:
	assert(condition, label)
