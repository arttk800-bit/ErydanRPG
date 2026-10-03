import {hexDistance} from '../core/hex-grid.js';
import {legalSteps} from '../core/movement.js';
export function enemiesOf(state,u){return state.units.filter(x=>x.team!==u.team&&x.alive&&!x.escaped);}
export function friendsOf(state,u){return state.units.filter(x=>x.team===u.team&&x.alive&&!x.escaped);}
export function adjacentEnemies(state,u){return enemiesOf(state,u).filter(x=>hexDistance(u,x)<=1);}
export function nearestEnemy(state,u){return enemiesOf(state,u).sort((a,b)=>hexDistance(u,a)-hexDistance(u,b))[0]??null;}
export function legalActionContext(state,u){return{unit:u,enemies:enemiesOf(state,u),friends:friendsOf(state,u),adjacentEnemies:adjacentEnemies(state,u),steps:legalSteps(state,u)};}
