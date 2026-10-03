import fs from 'node:fs';
import {runMirror} from '../game/simulation/mirror.js';
import {basic3v3} from '../game/simulation/scenarios.js';
import {REFERENCE,compareMirror} from '../game/simulation/parity.js';

const weapons=JSON.parse(fs.readFileSync(new URL('../game/data/weapons.json',import.meta.url)));
const run=runMirror({pairs:1500,seedBase:2030699025,factory:o=>basic3v3(o),weapons,hardCap:1000});
const rounds=run.results.flatMap(x=>[x.roundsA,x.roundsB]);
run.avgRounds=rounds.reduce((a,b)=>a+b,0)/rounds.length;
run.maxRounds=Math.max(...rounds);
const comparison=compareMirror(run,REFERENCE.mirror3000);
const report={reference:REFERENCE.version,run:{battles:run.battles,ally:run.ally,enemy:run.enemy,draw:run.draw,hardCaps:run.hardCaps,avgRounds:+run.avgRounds.toFixed(2),maxRounds:run.maxRounds,timing:run.timing},comparison};
fs.mkdirSync(new URL('../artifacts/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../artifacts/mirror3000-modular.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(!comparison.pass)process.exitCode=2;
