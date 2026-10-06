// GODOT FOUNDATION REGRESSION
// Static contracts complement the real headless Godot parse/load gate.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const project=await read('godot/project.godot');
for(const autoload of ['Diagnostics','Packages','DataRegistry'])assert.match(project,new RegExp('^'+autoload+'=', 'm'));

const manager=await read('godot/packages/package_manager.gd');
for(const contract of [/ProjectSettings\.load_resource_pack/,/func install\(/,/func rollback\(/,/PREVIOUS_FILE/,/Diagnostics\.register_provider/]) assert.match(manager,contract);

const installer=await read('godot/packages/package_installer.gd');
assert.match(installer,/FileAccess\.get_sha256/);
assert.match(installer,/staging/);
assert.match(installer,/installed/);

const http=await read('godot/packages/http_source.gd');
assert.match(http,/HTTPRequest/);
assert.match(http,/download_file/);

const registry=await read('godot/data/data_registry.gd');
for(const contract of [/func resolve\(/,/func provenance\(/,/func set_layer\(/]) assert.match(registry,contract);

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
