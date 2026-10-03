import {changeResolve} from './resolve.js';
export function tickBleeding(state,u){if(!u.alive||u.escaped)return 0;const d=Math.max(0,u.bleed||0);if(!d)return 0;u.hp=Math.max(0,u.hp-d);if(u.hp<=0)u.lethal=u.lethal||'bleed';return d;}
export function tickBuffs(u){if(!u.buffs)return;for(const k of Object.keys(u.buffs))if(Number.isFinite(u.buffs[k])&&u.buffs[k]>0)u.buffs[k]--;}
export function applyPanicPressure(u,amount){return changeResolve(u,-Math.max(0,amount));}
