import {hexDistance} from '../core/hex-grid.js';import {legalSteps} from '../core/movement.js';
export function nearestEnemyDistance(state,u,p=u){let d=99;for(const e of state.units)if(e.alive&&!e.escaped&&e.team!==u.team)d=Math.min(d,hexDistance(p,e));return d;}
export function chooseRangedReposition(state,u,target,preferred=4){const d=hexDistance(u,target);if(d>=2&&d<=preferred)return null;return legalSteps(state,u).sort((a,b)=>{const ad=Math.abs(hexDistance(a,target)-preferred),bd=Math.abs(hexDistance(b,target)-preferred);return ad-bd||nearestEnemyDistance(state,u,b)-nearestEnemyDistance(state,u,a);})[0]??null;}
export function underMeleePressure(state,u){return state.units.some(e=>e.alive&&!e.escaped&&e.team!==u.team&&hexDistance(u,e)<=1);}
