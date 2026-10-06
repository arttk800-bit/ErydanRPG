// GODOT FOUNDATION REGRESSION
// Static contract checks run before a Godot binary is introduced into CI.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const project=await read('godot/project.godot');
for(const autoload of ['Diagnostics','Packages','DataRegistry'])assert.match(project,new RegExp('^'+autoload+'=', 'm'));

const manager=await read('godot/packages/package_manager.gd');
assert.match(manager,/ProjectSettings\.load_resource_pack/);
assert.match(manager,/user:\/\/packages/);
assert.match(manager,/Diagnostics\.register_provider/);

const registry=await read('godot/data/data_registry.gd');
assert.match(registry,/func resolve\(/);
assert.match(registry,/func provenance\(/);
assert.match(registry,/func set_layer\(/);

const diagnostics=await read('godot/diagnostics/diagnostics.gd');
assert.match(diagnostics,/MAX_EVENTS := 5000/);
assert.match(diagnostics,/func register_provider\(/);
assert.match(diagnostics,/func snapshot\(/);

const importer=await read('godot/packages/local_import.gd');
assert.match(importer,/DisplayServer\.file_dialog_show/);

const manifest=JSON.parse(await read('godot/packages/examples/package.json'));
assert.equal(manifest.format,'eirdan-package');
assert.equal(manifest.format_version,1);
assert.equal(manifest.sha256.length,64);

console.log('godot foundation regression: OK');
