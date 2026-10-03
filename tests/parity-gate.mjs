import assert from 'node:assert/strict';
import {REFERENCE,compareMirror} from '../game/simulation/parity.js';

const ref=REFERENCE.mirror3000;
assert.equal(ref.battles,3000);
assert.equal(ref.ally+ref.enemy+ref.draw,3000);

const exact=compareMirror({...ref,hardCaps:0});
assert.equal(exact.pass,true);
assert.deepEqual(exact.reasons,[]);

const tooFast=compareMirror({...ref,avgRounds:8.23,maxRounds:28,hardCaps:0});
assert.equal(tooFast.pass,false);
assert.ok(tooFast.reasons.includes('avg-rounds'));
assert.ok(tooFast.reasons.includes('max-rounds'));

console.log('parity gate: OK');
