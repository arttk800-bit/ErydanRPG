// GODOT FOUNDATION REGRESSION
// Static contracts complement the real headless Godot parse/load gate.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const project=await read('godot/project.godot');
assert.match(project,/config\/version="0\.1\.0-foundation"/);
for(const autoload of ['Diagnostics','PackageValidators','Packages','DataRegistry','SaveStore','Modules'])assert.match(project,new RegExp('^'+autoload+'=', 'm'));

const manager=await read('godot/packages/package_manager.gd');
for(const contract of [/ProjectSettings\.load_resource_pack/,/func install_archive\(/,/func rollback\(/,/PREVIOUS_FILE/,/PackageValidators\.validate/,/Diagnostics\.register_provider/]) assert.match(manager,contract);

const installer=await read('godot/packages/package_installer.gd');
assert.match(installer,/ZIPReader/);
assert.match(installer,/manifest\.json/);
assert.match(installer,/FileAccess\.get_sha256/);
assert.match(installer,/staging/);
assert.match(installer,/installed/);

const http=await read('godot/packages/http_source.gd');
assert.match(http,/HTTPRequest/);
assert.match(http,/download_file/);

const validators=await read('godot/packages/package_validators.gd');
for(const contract of [/func register_validator\(/,/func unregister_validator\(/,/func validate\(/,/Diagnostics\.register_provider/]) assert.match(validators,contract);
assert.doesNotMatch(manager,/DataRegistry\.validate_package_candidate/);

const registry=await read('godot/data/data_registry.gd');
for(const contract of [/func resolve\(/,/func provenance\(/,/func entity\(/,/func entity_provenance\(/,/func set_layer\(/,/func validate_package_candidate\(/,/DataSchema\.validate_override/,/PackageValidators\.register_validator/] ) assert.match(registry,contract);
assert.doesNotMatch(registry,/walk_speed_kmh must be|damage must be numeric/);
const dataSchema=await read('godot/data/data_schema.gd');
for(const contract of [/func validate_base\(/,/func validate_override\(/,/unknown root domain/,/cannot override unknown id/]) assert.match(dataSchema,contract);

const saveSchema=await read('godot/persistence/save_schema.gd');
for(const contract of [/FORMAT := "eirdan-save"/,/FORMAT_VERSION := 1/,/STATE_VERSION := 1/,/func validate_state\(/]) assert.match(saveSchema,contract);
const migrations=await read('godot/persistence/save_migrations.gd');
assert.match(migrations,/func migrate\(/);
const saveStore=await read('godot/persistence/save_store.gd');
for(const contract of [/func save_state\(/,/func load_state\(/,/func list_saves\(/,/func delete_save\(/,/\.tmp/,/rename_absolute/,/SaveMigrations\.migrate/]) assert.match(saveStore,contract);

const moduleRegistry=await read('godot/modules/module_registry.gd');
for(const contract of [/func register\(/,/func resolve\(/,/func can_set_enabled\(/,/module dependency cycle/]) assert.match(moduleRegistry,contract);
const moduleRuntime=await read('godot/modules/module_runtime.gd');
for(const contract of [/func register_module\(/,/func configure\(/,/func set_enabled\(/,/func start\(/,/func stop\(/,/factory\.call\(\)/]) assert.match(moduleRuntime,contract);
assert.doesNotMatch(moduleRuntime,/res:\/\/world|res:\/\/map|res:\/\/travel|res:\/\/combat/);

const worldState=await read('godot/world/world_state.gd');
for(const contract of [/func ensure\(/,/func discover_point\(/,/func mark_visited\(/,/func enter_region\(/,/func enter_map_point\(/]) assert.match(worldState,contract);
const mapView=await read('godot/map/map_view_state.gd');
for(const contract of [/never mutates physical World position/,/func show_world\(/,/func show_region\(/,/func show_location\(/]) assert.match(mapView,contract);
assert.doesNotMatch(mapView,/world\["current"\]|world\.current\s*=/);
const catalog=await read('godot/modules/game_module_catalog.gd');
assert.match(catalog,/"id": "world"/);
assert.match(catalog,/"id": "map"/);
assert.match(catalog,/"dependencies": \["world"\]/);
assert.match(catalog,/"id": "roads"/);
assert.match(catalog,/"dependencies": \["map"\]/);
const roadGraph=await read('godot/roads/road_graph.gd');
for(const contract of [/func metric_distance\(/,/func access_node_id\(/,/func shortest_route\(/,/func validate\(/]) assert.match(roadGraph,contract);
assert.doesNotMatch(roadGraph,/world_state|travel_state|res:\/\/world|res:\/\/travel/);

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
assert.match(androidPreset,/gradle_build\/use_gradle_build=false/);

const bootstrap=await read('godot/app/bootstrap.gd');
assert.match(bootstrap,/FILE_DIALOG_MODE_SAVE_FILE/);
assert.match(bootstrap,/diagnostics\.exported/);

assert.match(registry,/reload_active_packages/);
assert.match(registry,/walk_speed_provenance/);
assert.match(bootstrap,/DataRegistry\.resolve\("travel\.walk_speed_kmh"/);

const installerTest=await read('godot/tests/package_installer_test.gd');
assert.match(installerTest,/invalid JSON rejected before activation/);
assert.match(installerTest,/invalid data preserves active package/);

const androidWorkflow=await read('.github/workflows/godot-android-debug.yml');
assert.doesNotMatch(androidWorkflow,/keytool -genkeypair/);
for(const secret of ['EIRDAN_DEV_KEYSTORE_B64','EIRDAN_DEV_KEYSTORE_PASSWORD','EIRDAN_DEV_KEY_ALIAS']) assert.match(androidWorkflow,new RegExp(secret));
