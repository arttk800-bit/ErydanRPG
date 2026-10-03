import {legalActionContext,nearestEnemy} from './legal-actions.js';import {hexDistance} from '../core/hex-grid.js';import {stepToward} from '../core/movement.js';
export function chooseAiIntent(state,u){
 const c=legalActionContext(state,u);if(!c.enemies.length)return{type:'end'};
 if(c.adjacentEnemies.length)return{type:'attack',target:c.adjacentEnemies.sort((a,b)=>a.hp-b.hp)[0]};
 const t=nearestEnemy(state,u);return t?{type:'approach',target:t}:{type:'end'};
}
export function executeAiIntent(state,u,intent,api){
 if(intent.type==='attack')return api.attack(state,u,intent.target);
 if(intent.type==='approach')return stepToward(state,u,intent.target,'ai_approach');
 return{ok:true,type:'end'};
}
export function aiTurn(state,u,api,{maxActions=16}={}){
 const out=[];for(let i=0;i<maxActions&&u.alive&&!u.escaped&&!state.over;i++){
  const intent=chooseAiIntent(state,u);const beforeAP=u.ap;const r=executeAiIntent(state,u,intent,api);out.push({intent:intent.type,target:intent.target?.id??null,result:r});
  if(intent.type==='end'||r?.ok===false)break;if(intent.type==='approach'&&hexDistance(u,intent.target)<=1)continue;if(u.ap===beforeAP&&intent.type!=='approach')break;
 }return out;
}
