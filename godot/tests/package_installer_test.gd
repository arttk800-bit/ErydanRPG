# ============================================================================
# PACKAGE INSTALLER INTEGRATION TEST
# Exercises portable ZIP install, integrity rejection, compatibility and rollback.
# ============================================================================
extends Node

const PackageOrder = preload("res://packages/package_order.gd")
const DataSchema = preload("res://data/data_schema.gd")

func _ready() -> void:
	_test_package_order()
	_test_data_schema()
	var payload := "{\"travel\":{\"walk_speed_kmh\":4.2}}".to_utf8_buffer()
	var hash := _sha256_for_bytes(payload)
	_assert(not hash.is_empty(), "payload hash")

	var v1 := _make_package("eirdan.test.balance", "1.0.0", "0.1.0", payload, hash)
	var install_v1 := Packages.install_archive(v1)
	_assert(install_v1.ok, "valid package installs")
	_assert(Packages.active_packages().back().version == "1.0.0", "v1 active")

	PackageValidators.register_validator(&"test_domain", _reject_test_domain)
	var domain_rejected := _make_package("eirdan.test.balance", "1.0.1", "0.1.0", payload, hash)
	var domain_result := Packages.install_archive(domain_rejected)
	_assert(not domain_result.ok and domain_result.stage == "content", "registered domain validator rejects package")
	_assert(Packages.active_packages().back().version == "1.0.0", "domain rejection preserves active package")
	PackageValidators.unregister_validator(&"test_domain")

	var invalid_json_payload := "{broken".to_utf8_buffer()
	var invalid_json := _make_package("eirdan.test.balance", "1.1.0", "0.1.0", invalid_json_payload, _sha256_for_bytes(invalid_json_payload))
	var invalid_json_result := Packages.install_archive(invalid_json)
	_assert(not invalid_json_result.ok and invalid_json_result.stage == "content", "invalid JSON rejected before activation")
	_assert(Packages.active_packages().back().version == "1.0.0", "invalid JSON preserves active package")

	var invalid_data_payload := "{\"travel\":{\"walk_speed_kmh\":-1}}".to_utf8_buffer()
	var invalid_data := _make_package("eirdan.test.balance", "1.2.0", "0.1.0", invalid_data_payload, _sha256_for_bytes(invalid_data_payload))
	var invalid_data_result := Packages.install_archive(invalid_data)
	_assert(not invalid_data_result.ok and invalid_data_result.stage == "content", "invalid data rejected before activation")
	_assert(Packages.active_packages().back().version == "1.0.0", "invalid data preserves active package")

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



func _test_data_schema() -> void:
	var base := {
		"travel": {"walk_speed_kmh": 5.0, "horse_speed_kmh": 12.0},
		"items": {"iron_sword": {"name": "Iron Sword", "damage": 12, "weight": 1.4}}
	}
	_assert(DataSchema.validate_base(base).is_empty(), "valid base data accepted")
	_assert(DataSchema.validate_override({"items": {"iron_sword": {"damage": 15}}}, base).is_empty(), "sparse known-id override accepted")
	_assert(not DataSchema.validate_override({"items": {"ghost_sword": {"damage": 15}}}, base).is_empty(), "unknown override id rejected")
	_assert(not DataSchema.validate_base({"travel": base.travel, "items": {"Bad ID": base.items.iron_sword}}).is_empty(), "invalid stable id rejected")
	_assert(not DataSchema.validate_override({"mystery": {}}, base).is_empty(), "unknown root domain rejected")
	_assert(DataRegistry.set_base(base, "test"), "registry accepts validated base")
	var item = DataRegistry.entity("items", "iron_sword")
	_assert(item is Dictionary and item.id == "iron_sword", "registry exposes stable entity id")

func _test_package_order() -> void:
	var unordered: Array[Dictionary] = [
		{"id": "mod.z", "priority": 10, "dependencies": [], "conflicts": []},
		{"id": "mod.a", "priority": 10, "dependencies": [], "conflicts": []},
		{"id": "mod.patch", "priority": -100, "dependencies": ["mod.z"], "conflicts": []}
	]
	var resolved := PackageOrder.resolve(unordered)
	_assert(resolved.ok, "package order resolves")
	var ids: Array[String] = []
	for record in resolved.records:
		ids.append(record.id)
	_assert(ids == ["mod.a", "mod.z", "mod.patch"], "priority/id order is deterministic and dependencies win")

	var missing := PackageOrder.resolve([{"id": "mod.child", "dependencies": ["mod.missing"]}])
	_assert(not missing.ok, "missing dependency rejected")

	var conflict := PackageOrder.resolve([
		{"id": "mod.a", "conflicts": ["mod.b"]},
		{"id": "mod.b"}
	])
	_assert(not conflict.ok, "active conflict rejected")

	var cycle := PackageOrder.resolve([
		{"id": "mod.a", "dependencies": ["mod.b"]},
		{"id": "mod.b", "dependencies": ["mod.a"]}
	])
	_assert(not cycle.ok, "dependency cycle rejected")

func _reject_test_domain(_manifest: Dictionary, _payload_path: String) -> Dictionary:
	return {"ok": false, "errors": ["test domain rejection"]}

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
