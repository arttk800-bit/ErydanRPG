// GODOT FOUNDATION REGRESSION
// Static contracts complement the real headless Godot parse/load gate.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const project=await read('godot/project.godot');
assert.match(project,/config\/version="0\.1\.1-updater"/);
for(const autoload of ['Diagnostics','PackageValidators','Packages','DataRegistry','SaveStore','Modules'])assert.match(project,new RegExp('^'+autoload+'=', 'm'));

const manager=await read('godot/packages/package_manager.gd');
for(const contract of [/ProjectSettings\.load_resource_pack/,/func install_archive\(/,/func rollback\(/,/PREVIOUS_FILE/,/PackageValidators\.validate/,/promote_tree/,/Diagnostics\.register_provider/]) assert.match(manager,contract);

const installer=await read('godot/packages/package_installer.gd');
assert.match(installer,/ZIPReader/);
assert.match(installer,/manifest\.json/);
assert.match(installer,/FileAccess\.get_sha256/);
assert.match(installer,/staging/);
assert.match(installer,/installed/);
assert.match(installer,/func promote_tree\(/);
assert.match(installer,/func verify_file\(/);

const http=await read('godot/packages/http_source.gd');
assert.match(http,/HTTPRequest/);
assert.match(http,/download_file/);

const validators=await read('godot/packages/package_validators.gd');
for(const contract of [/func register_validator\(/,/func unregister_validator\(/,/func validate\(/,/Diagnostics\.register_provider/]) assert.match(validators,contract);
assert.doesNotMatch(manager,/DataRegistry\.validate_package_candidate/);

const registry=await read('godot/data/data_registry.gd');
for(const contract of [/func resolve\(/,/func provenance\(/,/func entity\(/,/func entity_provenance\(/,/func set_layer\(/,/func validate_package_candidate\(/,/DataSchema\.validate_override/,/PackageValidators\.register_validator/] ) assert.match(registry,contract);
assert.doesNotMatch(registry,/walk_speed_kmh must be|damage must be numeric/);
for(const contract of [/func region\(/,/func region_provenance\(/,/func region_asset\(/,/_validate_content_payload\(/,/_apply_content_payload\(/,/RegionSchema\.validate/]) assert.match(registry,contract);
const regionSchema=await read('godot/data/region_schema.gd');
for(const contract of [/func validate\(/,/region_id is required/,/must be normalized 0\.\.1/,/roads\.nodes must be an array/,/RoadGraph\.validate/,/roads\.access references unknown point/]) assert.match(regionSchema,contract);
const dataSchema=await read('godot/data/data_schema.gd');
for(const contract of [/func validate_base\(/,/func validate_override\(/,/unknown root domain/,/cannot override unknown id/]) assert.match(dataSchema,contract);

const saveSchema=await read('godot/persistence/save_schema.gd');
for(const contract of [/FORMAT := "eirdan-save"/,/FORMAT_VERSION := 1/,/STATE_VERSION := 1/,/func validate_state\(/,/time\.day must be a positive integer/,/time\.second must be within 0\.\.<86400/]) assert.match(saveSchema,contract);
const migrations=await read('godot/persistence/save_migrations.gd');
assert.match(migrations,/func migrate\(/);
assert.match(migrations,/saves\.time_default_migrated/);
const saveStore=await read('godot/persistence/save_store.gd');
for(const contract of [/func save_state\(/,/func load_state\(/,/func list_saves\(/,/func delete_save\(/,/\.tmp/,/\.bak/,/_recover_backups\(/,/_valid_world_id\(/,/rename_absolute/,/SaveMigrations\.migrate/]) assert.match(saveStore,contract);
assert.doesNotMatch(saveStore,/validate_filename\(/);

const moduleRegistry=await read('godot/modules/module_registry.gd');
for(const contract of [/func register\(/,/func resolve\(/,/func can_set_enabled\(/,/module dependency cycle/]) assert.match(moduleRegistry,contract);
const moduleRuntime=await read('godot/modules/module_runtime.gd');
for(const contract of [/func register_module\(/,/func configure\(/,/func set_enabled\(/,/func start\(/,/func stop\(/,/factory\.call\(\)/]) assert.match(moduleRuntime,contract);
assert.doesNotMatch(moduleRuntime,/res:\/\/world|res:\/\/map|res:\/\/travel|res:\/\/combat/);

const worldState=await read('godot/world/world_state.gd');
for(const contract of [/func ensure\(/,/func current_position\(/,/func initialize_at\(/,/func discover_point\(/,/func mark_visited\(/,/func enter_region\(/,/func enter_map_point\(/]) assert.match(worldState,contract);
const mapView=await read('godot/map/map_view_state.gd');
for(const contract of [/never mutates physical World position/,/func show_world\(/,/func show_region\(/,/func show_location\(/]) assert.match(mapView,contract);
assert.doesNotMatch(mapView,/world\["current"\]|world\.current\s*=/);
const catalog=await read('godot/modules/game_module_catalog.gd');
assert.match(catalog,/"id": "world"/);
assert.match(catalog,/"id": "map"/);
assert.match(catalog,/"dependencies": \["world"\]/);
assert.match(catalog,/"id": "roads"/);
assert.match(catalog,/"id": "roads"[\s\S]*?"dependencies": \[\]/);
assert.match(catalog,/"id": "travel"/);
assert.match(catalog,/"dependencies": \["world", "roads"\]/);
const roadGraph=await read('godot/roads/road_graph.gd');
for(const contract of [/func metric_distance\(/,/func access_node_id\(/,/func shortest_route\(/,/func validate\(/]) assert.match(roadGraph,contract);
assert.doesNotMatch(roadGraph,/world_state|travel_state|res:\/\/world|res:\/\/travel/);
const travelState=await read('godot/travel/travel_state.gd');
for(const contract of [/func start\(/,/speed_mps/,/func tick\(/,/func stop\(/,/func resume\(/,/func cancel\(/,/func commit_arrival\(/,/func progress\(/]) assert.match(travelState,contract);
assert.doesNotMatch(travelState,/WALK_SPEED_MPS|HORSE_SPEED_MPS/);
assert.doesNotMatch(travelState,/RoadGraph|WorldState|MapViewState/);
const gameTime=await read('godot/simulation/game_time_state.gd');
for(const contract of [/SECONDS_PER_DAY/,/func advance\(/,/func snapshot\(/,/"day": 1/,/"second": 8\.0 \* 3600\.0/]) assert.match(gameTime,contract);
const simulation=await read('godot/simulation/simulation_module.gd');
for(const contract of [/func set_mode\(/,/travel_fast/,/sleep_fast/,/func step\(/,/GameTimeState\.advance/,/Diagnostics\.register_provider/] ) assert.match(simulation,contract);
const travelModule=await read('godot/travel/travel_module.gd');
for(const contract of [/func preview\(/,/_roads\.route\(/,/DataRegistry\.resolve\("travel\.%s_speed_kmh"/,/travel\.started/,/travel\.legacy_speed_migrated/,/_world\.enter_map_point\(/,/func arrive\(/,/func snapshot\(/,/Diagnostics\.register_provider/] ) assert.match(travelModule,contract);

const diagnostics=await read('godot/diagnostics/diagnostics.gd');
for(const contract of [/MAX_EVENTS := 5000/,/func register_provider\(/,/func snapshot\(/]) assert.match(diagnostics,contract);

const importer=await read('godot/packages/local_import.gd');
assert.match(importer,/DisplayServer\.file_dialog_show/);

const manifest=JSON.parse(await read('godot/packages/examples/package.json'));
assert.equal(manifest.format,'eirdan-package');
assert.equal(manifest.format_version,1);
assert.equal(manifest.runtime_min,'0.1.0');
assert.equal(manifest.payload,'user-balance.json');
assert.match(manifest.sha256,/^[0-9a-f]{64}$/);

console.log('godot foundation regression: OK');

const androidPreset=await read('godot/export_presets.cfg');
assert.match(androidPreset,/name="Android Debug"/);
assert.match(androidPreset,/architectures\/arm64-v8a=true/);
assert.match(androidPreset,/permissions\/internet=true/);
assert.match(androidPreset,/package\/unique_name="org\.eirdan\.runtime"/);
assert.match(androidPreset,/gradle_build\/use_gradle_build=false/);

const theme=await read('godot/ui/eirdan_theme.gd');
for(const contract of [/static func build\(\) -> Theme/,/static func panel_style\(\) -> StyleBoxFlat/]) assert.match(theme,contract);
const bootstrap=await read('godot/app/bootstrap.gd');
assert.match(bootstrap,/FILE_DIALOG_MODE_SAVE_FILE/);
assert.match(bootstrap,/diagnostics\.exported/);
for(const contract of [/SaveStore\.save_state\(_state\)/,/SaveStore\.load_state\(world_id\)/,/Modules\.stop\(\)[\s\S]*?_state = result\.state[\s\S]*?_start_gameplay\(\)/]) assert.match(bootstrap,contract);
const saveGameBody=bootstrap.match(/func _save_game\(\)[\s\S]*?(?=\nfunc _load_game\()/)?.[0] ?? "";
assert.doesNotMatch(saveGameBody,/_state = result\.state/);
assert.match(bootstrap,/saved_meta[\s\S]*?_state\["meta"\]/);

assert.match(registry,/reload_active_packages/);
assert.match(registry,/walk_speed_provenance/);
assert.match(bootstrap,/DataRegistry\.region\("forest"\)/);
assert.match(bootstrap,/GameModuleCatalog\.register_foundation\(Modules\)/);
assert.match(bootstrap,/regional_map\.setup/);
assert.match(bootstrap,/DataRegistry\.region_asset/);
assert.match(bootstrap,/Modules\.instance\("simulation"\)/);
assert.match(bootstrap,/SimulationRuntime\.new\(\)/);
const simulationRuntime=await read('godot/simulation/simulation_runtime.gd');
for(const contract of [/_simulation\.step\(/,/_travel\.tick\(/,/_travel\.arrive\(/,/Diagnostics\.register_provider\(&"simulation_runtime"/]) assert.match(simulationRuntime,contract);
const regionalMap=await read('godot/map/regional_map_view.gd');
for(const contract of [/_travel\.begin\(/,/Camera2D/,/func _input\(/,/InputEventScreenTouch/,/InputEventScreenDrag/,/_input_counts/,/MapAssetLoader\.background/,/Diagnostics\.register_provider/] ) assert.match(regionalMap,contract);
assert.doesNotMatch(regionalMap,/func _unhandled_input\(/);
assert.doesNotMatch(regionalMap,/func _process\(|_simulation\.step\(|_travel\.tick\(|_travel\.arrive\(/);
for(const contract of [/_travel\.preview\(/,/func _confirm_preview\(/,/travel_card\.visible/,/journey_progress\.value/]) assert.match(regionalMap,contract);
const mainMenu=await read('godot/ui/main_menu.gd');
for(const contract of [/signal action_requested/,/set_continue_available/,/Diagnostics\.register_provider\(&"main_menu"/]) assert.match(mainMenu,contract);
const gameShell=await read('godot/ui/game_shell.gd');
for(const contract of [/signal system_action/,/signal world_requested/,/set_world_active/,/func show_screen\(/,/ui\.screen_changed/,/Diagnostics\.register_provider\(&"game_shell"/]) assert.match(gameShell,contract);
const bootstrapScene=await read('godot/app/bootstrap.tscn');
for(const contract of [/name="MainMenu"/,/name="GameShell"/,/name="ContentHost"/,/name="BottomNav"/,/name="SystemMenu"/,/name="Character"/,/name="Inventory"/,/name="Journal"/,/name="NewWorldDialog"/]) assert.match(bootstrapScene,contract);
assert.doesNotMatch(bootstrapScene,/name="HUD" type="CanvasLayer" parent="\."/);
const screenFrame=await read('godot/ui/screen_frame.gd');
for(const contract of [/Reusable structural screen component/,/func set_empty_message\(/,/Diagnostics\.register_provider/]) assert.match(screenFrame,contract);
for(const contract of [/_show_main_menu\(\)/,/_continue_last_save\(\)/,/_create_named_world\(\)/,/world-%d/,/SaveStore\.list_saves\(\)/]) assert.match(bootstrap,contract);
const mapAssetLoader=await read('godot/map/map_asset_loader.gd');
for(const contract of [/resolved by DataRegistry/,/Image\.load_from_file/,/ImageTexture\.create_from_image/] ) assert.match(mapAssetLoader,contract);
assert.doesNotMatch(mapAssetLoader,/user:\/\/map_assets|user:\/\/packages/);
assert.doesNotMatch(regionalMap,/state\.world|world\["current"\]/);
assert.doesNotMatch(regionalMap,/_world\.enter_region|_world\.enter_map_point|_world\.visit/);
assert.match(regionalMap,/_world\.current_position\(\)/);
assert.match(bootstrap,/_initialize_new_world_if_needed/);

const installerTest=await read('godot/tests/package_installer_test.gd');
assert.match(installerTest,/invalid JSON rejected before activation/);
assert.match(installerTest,/invalid data preserves active package/);

const androidWorkflow=await read('.github/workflows/godot-android-debug.yml');
for(const contract of [/ANDROID_KEYSTORE_BASE64/,/GODOT_ANDROID_KEYSTORE_DEBUG_PATH/,/GODOT_ANDROID_KEYSTORE_DEBUG_USER/,/GODOT_ANDROID_KEYSTORE_DEBUG_PASSWORD/,/keytool -printcert/,/F3:2A:DE:FD:89:E7:1B:BB/]) assert.match(androidWorkflow,contract);
assert.match(androidWorkflow,/--export-debug "Android Debug"/);

// Runtime/platform ownership: updater cannot activate data packages or own saves.
const updater=await read('godot/update/android_updater.gd');
assert.doesNotMatch(updater,/Packages\.|SaveStore\.|DataRegistry\./);
assert.match(updater,/save_before_install\.call\(\)/);
assert.match(updater,/Manifest\.verify_file\(APK/);
assert.match(androidPreset,/android\.permission\.REQUEST_INSTALL_PACKAGES/);
assert.match(androidWorkflow,/node scripts\/runtime-release\.mjs manifest/);
