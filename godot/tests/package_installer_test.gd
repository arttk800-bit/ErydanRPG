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
const PackageCatalog = preload("res://packages/package_catalog.gd")

func _ready() -> void:
	_test_package_order()
	_test_package_catalog()
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
	var content_payload := JSON.stringify({
		"definitions": {"travel_events": {
			"mist_on_road": {
				"title": "Mist", "text": "Mist covers the road.", "weight": 1, "min_distance_km": 2,
				"choices": [{"id": "continue", "label": "Continue", "result": "The mist thins.", "time_seconds": 0}]
			}
		}}
	}).to_utf8_buffer()
	var content_package := _make_package("eirdan.test.events", "1.0.0", "0.1.0", content_payload, _sha256_for_bytes(content_payload), "content")
	var content_result := Packages.install_archive(content_package)
	_assert(content_result.ok, "definition content package installs")
	_assert(DataRegistry.reload_active_packages(Packages.active_packages()).ok, "active packaged definitions reload")
	_assert(DataRegistry.entity("travel_events", "mist_on_road").title == "Mist", "packaged travel event resolves through DataRegistry")

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
	_assert(configured.ok, "foundation modules resolve")
	for required_id in ["simulation", "world", "map", "roads", "travel", "travel_events"]:
		_assert(required_id in configured.active, "foundation module active: %s" % required_id)
	_assert(configured.active.find("world") < configured.active.find("map"), "world resolves before map")
	_assert(configured.active.find("world") < configured.active.find("travel"), "world resolves before travel")
	_assert(configured.active.find("roads") < configured.active.find("travel"), "roads resolves before travel")
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
	var simulation = Modules.instance("simulation")
	_assert(simulation != null, "simulation module instance available")
	var before_time: Dictionary = simulation.time()
	var simulation_delta: float = simulation.step(60.0)
	var after_time: Dictionary = simulation.time()
	_assert(is_equal_approx(simulation_delta, 60.0), "normal simulation mode preserves seconds")
	_assert(int(after_time.minute) == int(before_time.minute) + 1, "simulation advances canonical game time")
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
	var travel_events = Modules.instance("travel_events")
	world.initialize_at("forest", {"id": "start", "name": "Start", "class": "location"})
	var trip: Dictionary = travel.begin("forest", "start", "finish", "walk")
	_assert(trip.status == "travelling", "travel begins from Roads route")
	_assert(is_equal_approx(float(trip.speed_mps), 5.0 / 3.6), "travel resolves walk speed from DataRegistry")
	_assert(is_equal_approx(float(trip.duration_seconds), 1000.0 / (5.0 / 3.6)), "travel ETA uses resolved data speed")
	DataRegistry.set_layer("test.travel-events", 100, {"travel": {"event_interval_km": 0.1, "event_chance": 1.0}})
	travel.tick(100.0)
	var triggered: Dictionary = travel_events.advance(travel.snapshot())
	_assert(not triggered.is_empty() and state.world.travel.status == "stopped", "package-defined road event interrupts travel")
	var event_choice: Dictionary = triggered.choices[0]
	var event_result: Dictionary = travel_events.resolve(str(event_choice.id))
	_assert(event_result.ok and state.world.travel.status == "travelling", "road event choice resolves and resumes travel")
	DataRegistry.remove_layer("test.travel-events")
	_assert(travel.pause().status == "stopped", "travel can stop between points")
	var camp: Dictionary = travel.make_camp()
	_assert(not camp.is_empty() and state.world.travel.status == "camped", "camp persists at the physical travel position")
	_assert(travel.break_camp(true).status == "travelling" and not state.world.has("camp"), "breaking camp can resume the journey")
	travel.tick(1000.0)
	_assert(state.world.travel.status == "arrived", "travel reaches destination")
	var destination := {"id": "finish", "name": "Finish", "class": "location"}
	travel.arrive(destination)
	_assert(state.world.position.point_id == "finish", "travel commits physical arrival")
	_assert(world.current().location_id == "finish", "arrival enters destination through World API")
	_assert(state.world.travel.status == "idle", "arrival closes active travel")
	_assert(travel.begin("forest", "start", "finish", "walk").is_empty(), "stale presentation origin is rejected after arrival")
	var return_preview: Dictionary = travel.preview_to("forest", "start", "walk")
	_assert(return_preview.from_id == "finish" and return_preview.to_id == "start", "next route derives origin from authoritative World position")
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
		"time": {"day": 1, "second": 28800.0},
		"world": {}
	}
	var saved := SaveStore.save_state(state)
	_assert(saved.ok, "valid state saves")
	var loaded := SaveStore.load_state(world_id)
	_assert(loaded.ok and loaded.state.meta.world_id == world_id, "saved state loads")
	_assert(loaded.state.meta.state_version == 1, "state schema version preserved")
	_assert(loaded.state.time.day == 1 and loaded.state.time.second == 28800.0, "canonical game time persists")
	var listed := SaveStore.list_saves().filter(func(item): return item.world_id == world_id)
	_assert(listed.size() == 1 and listed[0].world_name == "Persistence Test", "save metadata lists independently of UI")
	var invalid := state.duplicate(true)
	invalid.meta.world_id = ""
	_assert(not SaveStore.save_state(invalid).ok, "invalid state rejected before write")
	_assert(SaveStore.delete_save(world_id), "save deletion succeeds")
	_assert(not SaveStore.load_state(world_id).ok, "deleted save is unavailable")

func _test_data_schema() -> void:
	var base := {
		"travel": {"walk_speed_kmh": 5.0, "horse_speed_kmh": 12.0, "event_interval_km": 18.0, "event_chance": 0.45},
		"travel_events": {"quiet_road": {"title": "Quiet road", "text": "Nothing moves.", "weight": 1, "min_distance_km": 1.0, "choices": [{"id": "continue", "label": "Continue", "result": "Onward.", "time_seconds": 0}]}},
		"items": {"iron_sword": {"name": "Iron Sword", "damage": 12, "weight": 1.4}}
	}
	_assert(DataSchema.validate_base(base).is_empty(), "valid base data accepted")
	_assert(DataSchema.validate_override({"items": {"iron_sword": {"damage": 15}}}, base).is_empty(), "sparse known-id override accepted")
	_assert(not DataSchema.validate_override({"items": {"ghost_sword": {"damage": 15}}}, base).is_empty(), "unknown override id rejected")
	_assert(DataSchema.validate_override({"travel_events": {"quiet_road": {"weight": 2}}}, base).is_empty(), "travel event balance can be overridden sparsely")
	_assert(not DataSchema.validate_content({"travel_events": {"broken": {"title": "Broken"}}}).is_empty(), "incomplete packaged travel event rejected")
	_assert(not DataSchema.validate_base({"travel": base.travel, "items": {"Bad ID": base.items.iron_sword}}).is_empty(), "invalid stable id rejected")
	_assert(not DataSchema.validate_override({"mystery": {}}, base).is_empty(), "unknown root domain rejected")
	_assert(DataRegistry.set_base(base, "test"), "registry accepts validated base")
	DataRegistry.set_layer("test.override", 0, {"items": {"iron_sword": {"damage": 15}}})
	var item = DataRegistry.entity("items", "iron_sword")
	_assert(item is Dictionary and item.id == "iron_sword" and item.name == "Iron Sword" and item.damage == 15, "registry merges sparse entity overrides and preserves stable id")
	DataRegistry.remove_layer("test.override")

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

func _test_package_catalog() -> void:
	var value := {
		"format": "eirdan-package-catalog", "format_version": 1,
		"packages": [{
			"id": "eirdan.world.events", "title": "World Events", "version": "1.2.0",
			"channel": "official", "category": "world", "apply": "hot", "runtime_min": "0.1.0",
			"size_bytes": 2048, "sha256": "a".repeat(64), "url": "https://example.invalid/world-events.zip"
		}]
	}
	var parsed := PackageCatalog.parse_bytes(JSON.stringify(value).to_utf8_buffer())
	_assert(parsed.ok and parsed.packages.size() == 1, "valid remote package catalog accepted")
	_assert(PackageCatalog.compare_versions("1.1.9", "1.2.0") < 0, "catalog versions compare semantically")
	var unsafe := value.duplicate(true)
	unsafe.packages[0].url = "http://example.invalid/package.zip"
	_assert(not PackageCatalog.normalize(unsafe).ok, "catalog rejects non-HTTPS package URL")

func _reject_test_domain(_manifest: Dictionary, _payload_path: String) -> Dictionary:
	return {"ok": false, "errors": ["test domain rejection"]}

func _make_package(id: String, version: String, runtime_min: String, payload: PackedByteArray, hash: String, kind: String = "override") -> String:
	var path := "user://%s-%s.zip" % [id.validate_filename(), version]
	var manifest := {
		"format": "eirdan-package",
		"format_version": 1,
		"id": id,
		"version": version,
		"kind": kind,
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
