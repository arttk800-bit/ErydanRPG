import {hexDistance} from '../core/hex-grid.js';import {legalSteps} from '../core/movement.js';
export function shouldRetreat(state,u){if(!u.alive||u.escaped)return false;const enemies=state.units.filter(x=>x.alive&&!x.escaped&&x.team!==u.team);const adjacent=enemies.filter(e=>hexDistance(u,e)<=1).length;return (u.resolve??100)<=15||((u.resolve??100)<=30&&adjacent>=2);}
export function retreatEdge(u){return u.team==='ally'?0:13;}
export function chooseRetreatStep(state,u){const edge=retreatEdge(u);return legalSteps(state,u).sort((a,b)=>Math.abs(a.q-edge)-Math.abs(b.q-edge))[0]??null;}
export function atRetreatEdge(u){return u.q===retreatEdge(u);}
