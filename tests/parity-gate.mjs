import assert from 'node:assert/strict';
import {REFERENCE,compareMirror} from '../game/simulation/parity.js';

const ref=REFERENCE.mirror3000;
assert.equal(ref.battles,3000);
assert.equal(ref.ally+ref.enemy+ref.draw,3000);
assert.ok(ref.avgRounds>0);
assert.ok(ref.maxRounds>=ref.avgRounds);

const exact=compareMirror({...ref});
assert.equal(exact.pass,true);
assert.deepEqual(exact.reasons,[]);

const broken=compareMirror({...ref,draw:ref.draw+100});
assert.equal(broken.pass,false);
assert.ok(broken.reasons.length>0);

console.log('parity gate: OK');
