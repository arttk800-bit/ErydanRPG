import assert from 'node:assert/strict';
import {GameState} from '../game/core/game-state.js';
import {resolveBattleState} from '../game/core/battle-lifecycle.js';
import {nextTurn,markDead,markEscaped,addUnitToBattle} from '../game/core/turn-manager.js';

const u=(id,team)=>({id,team,cls:'test',alive:true,escaped:false,hp:90,q:0,r:0});
{
 const s=new GameState(1),a=u('a','ally'),e=u('e','enemy');s.units=[a,e];s.order=[a,e];
 assert.equal(resolveBattleState(s).over,false);
 assert.equal(nextTurn(s),e);
 assert.equal(nextTurn(s),a);assert.equal(s.round,2);
 markDead(s,e);assert.equal(s.over,true);assert.equal(s.result,'ally');
}
{
 const s=new GameState(2),a=u('a','ally'),e=u('e','enemy');s.units=[a,e];s.order=[a,e];
 markEscaped(s,a);assert.equal(s.result,'enemy');
}
{
 const s=new GameState(3),a=u('a','ally'),e=u('e','enemy'),w=u('w','enemy');s.units=[a,e];s.order=[a,e];
 addUnitToBattle(s,w);assert.equal(s.order.length,3);markDead(s,e);assert.equal(s.over,false);markDead(s,w);assert.equal(s.result,'ally');
}
console.log('core regression: OK');
