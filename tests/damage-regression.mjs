import assert from 'node:assert/strict';import {GameState} from '../game/core/game-state.js';import {createBody} from '../game/combat/body-parts.js';import {damageResolveLoss} from '../game/combat/resolve.js';import {physicalHit,magicHit} from '../game/combat/damage.js';
const u=(id,team)=>({id,team,alive:true,escaped:false,hp:90,maxHp:90,st:100,body:createBody(),shield:0,armorKind:'light',armorHead:18,maxArmorHead:18,armorBody:32,maxArmorBody:32,armCover:.3,legCover:.1,buffs:{stone:0,rage:0},resolve:100,q:0,r:0});
assert.equal(damageResolveLoss({maxHp:90},10,1),7);assert.equal(damageResolveLoss({maxHp:90},20,1),11);
{const s=new GameState(1),a=u('a','ally'),t=u('e','enemy');s.units=[a,t];s.order=[a,t];const x=physicalHit(s,a,t,'torso','sword',{min:10,max:10,type:'melee',pen:.1,ad:.5},{rng:()=>.99});assert.equal(x.raw,10);assert.equal(x.damage,1);assert.equal(t.hp,89);assert.ok(t.resolve<100);}
{const s=new GameState(2),a=u('a','ally'),t=u('e','enemy');s.units=[a,t];s.order=[a,t];const x=magicHit(s,a,t,20,{element:'fire',spellPower:1,rng:()=>.1});assert.equal(x.damage,16);assert.equal(t.hp,74);}
console.log('damage regression: OK');
