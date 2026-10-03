import {changeResolve} from './resolve.js';import {markDead} from '../core/turn-manager.js';
export function beginTurn(state,u){u.ap=u.maxAp??u.ap;u.guarding=false;if(u.buffs){for(const k of Object.keys(u.buffs))if(typeof u.buffs[k]==='number'&&u.buffs[k]>0)u.buffs[k]--;}if(u.bleed>0){const d=Math.max(1,Math.floor(u.bleed));u.hp=Math.max(0,u.hp-d);changeResolve(u,-Math.min(6,1+Math.floor(d/2)));if(u.hp<=0)markDead(state,u);}return u;}
export function rest(u){if(u.ap<3)return false;u.ap-=3;u.st=Math.min(u.maxSt??100,u.st+30);return true;}
export function concentrate(u){if(u.ap<3)return false;u.ap-=3;u.mana=Math.min(u.maxMana??100,u.mana+25);return true;}
export function guard(u){if(u.ap<4)return false;u.ap-=4;u.guarding=true;return true;}
export function bandage(u){if(u.ap<4||u.bandages<=0)return false;u.ap-=4;u.bandages--;for(const p of Object.values(u.body??{}))p.bleed=Math.max(0,(p.bleed||0)-2);u.bleed=Object.values(u.body??{}).reduce((s,p)=>s+(p.bleed||0),0);return true;}
