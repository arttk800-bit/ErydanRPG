import fs from 'node:fs';
const required=[
'game/core/game-state.js','game/core/hex-grid.js','game/core/movement.js',
'game/combat/actions.js','game/combat/damage.js','game/combat/disengage.js',
'game/ai/ai-controller.js','game/simulation/runner.js','game/simulation/mirror.js',
'game/ui/index.html','game/ui/main.js','android/app/src/main/java/com/eirdan/client/MainActivity.kt'
];
const missing=required.filter(p=>!fs.existsSync(new URL('../'+p,import.meta.url)));
if(missing.length){console.error('Missing required modules:',missing);process.exit(1);}
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url)));
if(!pkg.scripts?.test)throw new Error('npm test missing');
console.log('structure validation: OK');
