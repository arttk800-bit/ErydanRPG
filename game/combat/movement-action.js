import {moveUnit,stepToward} from '../core/movement.js';import {resolveLeavingThreat} from './disengage.js';
export function combatMove(state,u,q,r,weapons,{rng=Math.random,reason='move'}={}){return moveUnit(state,u,q,r,reason,{beforeMove:({from,to})=>({opportunity:resolveLeavingThreat(state,u,from,to,weapons,{rng})})});}
export function combatStepToward(state,u,target,weapons,{rng=Math.random,reason='approach'}={}){return stepToward(state,u,target,reason,{beforeMove:({from,to})=>({opportunity:resolveLeavingThreat(state,u,from,to,weapons,{rng})})});}
