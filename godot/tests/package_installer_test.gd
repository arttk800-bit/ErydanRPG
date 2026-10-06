# ============================================================================
# PACKAGE INSTALLER INTEGRATION TEST
# Exercises portable ZIP install, integrity rejection, compatibility and rollback.
# ============================================================================
extends Node

const PackageOrder = preload("res://packages/package_order.gd")
const DataSchema = preload("res://data/data_schema.gd")
const ModuleRegistry = preload("res://modules/module_registry.gd")
const GameModuleCatalog = preload("res://modules/game_module_catalog.gd")
const RoadGraph = preload("res://roads/road_graph.gd")

func _ready() -> void:
	_test_package_order()
	_test_data_schema()
	_test_save_store()
	_test_module_registry()
	_test_world_map_modules()
	_test_roads()
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







func _test_roads() -> void:
	var roads := {
		"metrics": {"width_meters": 1000.0, "height_meters": 1000.0},
		"nodes": [
			{"id": "a", "x": 0.0, "y": 0.0},
			{"id": "b", "x": 0.3, "y": 0.0},
			{"id": "c", "x": 0.3, "y": 0.4},
			{"id": "d", "x": 0.9, "y": 0.0}
		],
		"edges": [["a", "b"], ["b", "c"], ["a", "d"], ["d", "c"]],
		"access": {"start": {"node": "a"}, "finish": {"node": "c"}}
	}
	_assert(RoadGraph.validate(roads).is_empty(), "valid road topology accepted")
	_assert(is_equal_approx(RoadGraph.metric_distance(roads, roads.nodes[0], roads.nodes[1]), 300.0), "normalized road coordinates use physical map metrics")
	var route := RoadGraph.shortest_route(roads, "start", "finish")
	_assert(route.node_ids == ["a", "b", "c"], "shortest deterministic road route selected")
	_assert(is_equal_approx(route.distance, 700.0), "road route reports metric distance")
	var broken := roads.duplicate(true)
	broken.access["missing"] = {"node": "ghost"}
	_assert(not RoadGraph.validate(broken).is_empty(), "unknown road access node rejected")

func _test_world_map_modules() -> void:
	var state := {
		"meta": {"state_version": 1, "world_id": "world-module-test", "world_name": "World Module Test"},
		"world": {}
	}
	var registered := GameModuleCatalog.register_foundation(Modules)
	_assert(registered.ok, "world/map module catalog registers")
	var configured := Modules.configure({})
	_assert(configured.ok and configured.active == ["world", "map", "roads", "travel"], "world/map modules resolve in dependency order")
	var road_fixture := {
		"forest": {
			"metrics": {"width_meters": 1000.0, "height_meters": 1000.0},
			"nodes": [{"id": "a", "x": 0.0, "y": 0.0}, {"id": "b", "x": 1.0, "y": 0.0}],
			"edges": [["a", "b"]],
			"access": {"start": {"node": "a"}, "finish": {"node": "b"}}
		}
	}
	var started := Modules.start({"state": state, "roads": road_fixture})
	_assert(started.ok, "world/map modules start")
	var world = Modules.instance("world")
	var map = Modules.instance("map")
	world.enter_region("forest")
	map.show_world()
	_assert(world.current().region_id == "forest", "world owns physical region")
	_assert(map.snapshot().level == "world", "map view can browse world")
	map.show_region("north")
	_assert(map.snapshot().region_id == "north", "map view browses another region")
	_assert(world.current().region_id == "forest", "map browsing does not move physical world state")
	var hidden := {"id": "grey-ruins", "name": "Grey Ruins", "class": "place", "hidden": true}
	_assert(world.discover(hidden, "test"), "world discovery records new knowledge")
	world.visit(hidden)
	_assert(state.world.knowledge["grey-ruins"].visited, "world visit persists knowledge")
	var travel = Modules.instance("travel")
	var trip := travel.begin("forest", "start", "finish", "walk")
	_assert(trip.status == "travelling", "travel begins from Roads route")
	travel.tick(1000.0)
	_assert(state.world.travel.status == "arrived", "travel reaches destination")
	var destination := {"id": "finish", "name": "Finish", "class": "location"}
	travel.arrive(destination)
	_assert(state.world.position.point_id == "finish", "travel commits physical arrival")
	_assert(world.current().location_id == "finish", "arrival enters destination through World API")
	_assert(state.world.travel.status == "idle", "arrival closes active travel")
	Modules.stop()

func _test_module_registry() -> void:
	var registry := ModuleRegistry.new()
	_assert(registry.register({"id": "world", "enabled_by_default": true, "dependencies": []}).ok, "world module registers")
	_assert(registry.register({"id": "map", "enabled_by_default": true, "dependencies": ["world"]}).ok, "map module registers")
	_assert(registry.register({"id": "travel", "enabled_by_default": true, "dependencies": ["world", "map"]}).ok, "travel module registers")
	_assert(registry.register({"id": "combat", "enabled_by_default": false, "dependencies": ["world"]}).ok, "disabled combat module registers")
	var resolved := registry.resolve({})
	_assert(resolved.ok, "default module set resolves")
	var ids: Array[String] = []
	for definition in resolved.modules: ids.append(definition.id)
	_assert(ids == ["world", "map", "travel"], "dependencies resolve before dependents")
	_assert(not registry.can_set_enabled({}, "world", false).ok, "required module cannot be disabled")
	var combat := registry.can_set_enabled({}, "combat", true)
	_assert(combat.ok and combat.modules.size() == 4, "optional module enables with dependency")
	var missing := ModuleRegistry.new()
	_assert(missing.register({"id": "travel", "enabled_by_default": true, "dependencies": ["world"]}).ok, "missing-dependency fixture registers")
	_assert(not missing.resolve({}).ok, "unknown dependency rejects runtime composition")
	var cycle := ModuleRegistry.new()
	cycle.register({"id": "a", "enabled_by_default": true, "dependencies": ["b"]})
	cycle.register({"id": "b", "enabled_by_default": true, "dependencies": ["a"]})
	_assert(not cycle.resolve({}).ok, "module dependency cycle rejected")

func _test_save_store() -> void:
	var world_id := "test-world-persistence"
	SaveStore.delete_save(world_id)
	var state := {
		"meta": {
			"state_version": 1,
			"world_id": world_id,
			"world_name": "Persistence Test",
			"created_at": "2026-01-01T00:00:00Z",
			"updated_at": "2026-01-01T00:00:00Z"
		},
		"world": {}
	}
	var saved := SaveStore.save_state(state)
	_assert(saved.ok, "valid state saves")
	var loaded := SaveStore.load_state(world_id)
	_assert(loaded.ok and loaded.state.meta.world_id == world_id, "saved state loads")
	_assert(loaded.state.meta.state_version == 1, "state schema version preserved")
	var listed := SaveStore.list_saves().filter(func(item): return item.world_id == world_id)
	_assert(listed.size() == 1 and listed[0].world_name == "Persistence Test", "save metadata lists independently of UI")
	var invalid := state.duplicate(true)
	invalid.meta.world_id = ""
	_assert(not SaveStore.save_state(invalid).ok, "invalid state rejected before write")
	_assert(SaveStore.delete_save(world_id), "save deletion succeeds")
	_assert(not SaveStore.load_state(world_id).ok, "deleted save is unavailable")

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
