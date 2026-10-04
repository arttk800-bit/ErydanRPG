import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const required=[
'game/core/game-state.js','game/core/hex-grid.js','game/core/movement.js',
'game/combat/actions.js','game/combat/damage.js','game/combat/disengage.js',
'game/ai/ai-controller.js','game/simulation/runner.js','game/simulation/mirror.js',
'game/ui/index.html','game/ui/main.js','android/app/src/main/java/com/eirdan/client/MainActivity.kt'
];
const missing=required.filter(p=>!fs.existsSync(new URL('../'+p,import.meta.url)));
if(missing.length){console.error('Missing required modules:',missing);process.exit(1)}
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url)));
if(!pkg.scripts?.test)throw new Error('npm test missing');
function walk(dir,out=[]){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p,out);else if(e.isFile()&&p.endsWith('.js'))out.push(p)}return out}
const gameDir=path.resolve(new URL('../game/',import.meta.url).pathname);
const js=walk(gameDir);
const failures=[];
for(const file of js){try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}catch(e){failures.push({file:path.relative(path.resolve(new URL('../',import.meta.url).pathname),file),error:String(e.stderr||e.message)})}}
if(failures.length){console.error('JavaScript syntax validation failed');for(const f of failures)console.error('\n'+f.file+'\n'+f.error);process.exit(1)}
console.log('structure validation: OK');
console.log('javascript syntax: OK ('+js.length+' files)');
