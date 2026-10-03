import {hexDistance} from '../core/hex-grid.js';
import {physicalHit,magicHit} from './damage.js';
export function canAct(u,cost=0){return !!u&&u.alive&&!u.escaped&&(u.ap??0)>=cost;}
export function spendAP(u,cost){if(!canAct(u,cost))return false;u.ap-=cost;return true;}
export function attackRange(a,w){return Number(w?.range??1);}
export function canTarget(a,t,w){return !!a&&!!t&&a.team!==t.team&&t.alive&&!t.escaped&&hexDistance(a,t)<=attackRange(a,w);}
export function physicalAttack(state,a,t,{part='torso',weapon,weaponKind='sword',cost=4,mult=1,crit=false,rng=Math.random}={}){
 if(!canAct(a,cost))return{ok:false,reason:'ap'};if(!canTarget(a,t,weapon))return{ok:false,reason:'range'};
 spendAP(a,cost);return{ok:true,...physicalHit(state,a,t,part,weaponKind,weapon,{mult,crit,rng})};
}
export function spellAttack(state,a,t,{base,cost=4,mana=0,range=5,mult=1,label='Магия',element='arcane',spellPower=1,rng=Math.random}={}){
 if(!canAct(a,cost))return{ok:false,reason:'ap'};if((a.mana??0)<mana)return{ok:false,reason:'mana'};
 if(a.team===t.team||!t.alive||t.escaped||hexDistance(a,t)>range)return{ok:false,reason:'range'};
 spendAP(a,cost);a.mana-=mana;return{ok:true,...magicHit(state,a,t,base,{mult,label,element,spellPower,rng})};
}
