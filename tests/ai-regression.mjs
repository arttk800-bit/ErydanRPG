import assert from 'node:assert/strict';import {GameState} from '../game/core/game-state.js';import {createBody} from '../game/combat/body-parts.js';import {chooseAiIntent,aiTurn} from '../game/ai/controller.js';
const u=(id,team,q,r)=>({id,team,cls:'test',alive:true,escaped:false,hp:90,maxHp:90,ap:9,st:100,body:createBody(),resolve:100,q,r});
{const s=new GameState(1),a=u('a','ally',1,1),e=u('e','enemy',2,1);s.units=[a,e];s.order=[a,e];assert.equal(chooseAiIntent(s,a).type,'attack');}
{const s=new GameState(2),a=u('a','ally',1,1),e=u('e','enemy',6,1);s.units=[a,e];s.order=[a,e];assert.equal(chooseAiIntent(s,a).type,'approach');const log=aiTurn(s,a,{attack(){return{ok:false}}},{maxActions:1});assert.equal(log.length,1);assert.ok(s.movement.events.length===1);}
console.log('ai regression: OK');
