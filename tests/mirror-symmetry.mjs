import assert from 'node:assert/strict';
import {basic3v3} from '../game/simulation/scenarios.js';

const A=basic3v3('A'),B=basic3v3('B');
assert.equal(A[0].team,'ally');
assert.equal(B[0].team,'enemy');
for(const id of ['a0','a1','a2','e0','e1','e2']){
 const a=A.find(x=>x.id===id),b=B.find(x=>x.id===id);
 assert.equal(a.q+b.q,13);
}
console.log('mirror symmetry: OK');
