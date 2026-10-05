import assert from 'node:assert/strict';
import {SimulationTimer} from '../game/simulation/timing.js';
import {shieldBash,sweep} from '../game/combat/melee-skills.js';

const timer=new SimulationTimer().start();
await new Promise(resolve=>setTimeout(resolve,2));
timer.stop();
assert.ok(timer.elapsedMs>=0);
assert.equal(typeof timer.summary().formatted,'string');

const weapons={sword:{damage:[8,8],ap:3,range:1,accuracy:1}};
const actor={id:'a',team:'ally',q:0,r:0,ap:10,st:100,resolve:50,alive:true,escaped:false,weapon:'sword'};
const enemy={id:'e',team:'enemy',q:1,r:0,ap:10,st:100,resolve:50,alive:true,escaped:false,weapon:'sword',hp:50,maxHp:50,armor:0,body:{torso:{hp:50,maxHp:50,armor:0}}};
const state={units:[actor,enemy]};
const bash=shieldBash(state,actor,enemy,weapons,()=>0);
assert.equal(bash.ok,true);
assert.equal(actor.ap,6);
assert.ok(enemy.st<=80);
actor.ap=10; enemy.hp=50; enemy.alive=true;
const area=sweep(state,actor,weapons,()=>0);
assert.equal(area.ok,true);
assert.equal(actor.ap,4);
assert.equal(area.hits.length,1);
console.log('active module regression: ok');
