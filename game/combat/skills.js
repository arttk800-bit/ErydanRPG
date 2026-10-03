import {hexDistance} from '../core/hex-grid.js';import {castMagic,weaponAttack} from './actions.js';import {changeResolve} from './resolve.js';
export function smoke(u){if(u.ap<4)return{ok:false};u.ap-=4;u.smoke=2;return{ok:true};}
export function prepare(u){if(u.ap<4)return{ok:false};u.ap-=4;u.buffs??={};u.buffs.prepared=2;return{ok:true};}
export function stoneSkin(u){if(u.ap<4||u.mana<16)return{ok:false};u.ap-=4;u.mana-=16;u.buffs??={};u.buffs.stone=3;return{ok:true};}
export function rage(u){if(u.ap<4)return{ok:false};u.ap-=4;u.buffs??={};u.buffs.rage=3;changeResolve(u,10);return{ok:true};}
export function heal(caster,target){if(caster.ap<5||caster.mana<20||hexDistance(caster,target)>5)return{ok:false};caster.ap-=5;caster.mana-=20;const before=target.hp;target.hp=Math.min(target.maxHp,target.hp+24);changeResolve(target,5);return{ok:true,healed:target.hp-before};}
export function divine(state,a,t,rng=Math.random){return castMagic(state,a,t,{ap:5,mana:20,range:5,base:16,label:'Кара',element:'holy',spellPower:a.spellPower??1},{rng});}
export function flame(state,a,t,rng=Math.random){return castMagic(state,a,t,{ap:4,mana:16,range:5,base:19,label:'Вспышка',element:'fire',spellPower:a.spellPower??1},{rng});}
export function lightning(state,a,t,rng=Math.random){return castMagic(state,a,t,{ap:5,mana:20,range:5,base:15,label:'Молния',element:'lightning',spellPower:a.spellPower??1},{rng});}
export function precise(state,a,t,W,part,rng=Math.random){if(a.ap<5)return{ok:false};const before=a.ap;const x=weaponAttack(state,a,t,W,{part,rng});if(!x.ok)return x;a.ap=before-5;return x;}
export const SKILL_HANDLERS={smoke,prepare,stoneSkin,rage,heal,divine,flame,lightning,precise};
