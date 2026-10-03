import fs from 'node:fs';
import {REFERENCE} from '../game/simulation/parity.js';
const ref=REFERENCE.mirror3000;
const report={
 reference:REFERENCE.version,
 battles:ref.battles,
 decisive:ref.decisive,
 ally:ref.ally,
 enemy:ref.enemy,
 draw:ref.draw,
 avgRounds:ref.avgRounds,
 maxRounds:ref.maxRounds,
 status:'REFERENCE_LOCKED'
};
fs.mkdirSync(new URL('../artifacts/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../artifacts/parity-reference.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
