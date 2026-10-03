import {resolveBattleState,isCombatantActive} from './battle-lifecycle.js';

export function currentUnit(state){
  return state.order[state.turnIndex] ?? null;
}
export function rebuildTurnOrder(state){
  state.order=state.units.filter(Boolean);
  if(state.turnIndex>=state.order.length) state.turnIndex=0;
  return state.order;
}
export function nextTurn(state){
  if(resolveBattleState(state,'pre-next-turn').over) return null;
  if(!state.order.length) rebuildTurnOrder(state);
  if(!state.order.length){ resolveBattleState(state,'empty-order'); return null; }
  const start=state.turnIndex;
  let wrapped=false, scans=0;
  do{
    state.turnIndex++;
    if(state.turnIndex>=state.order.length){state.turnIndex=0;wrapped=true;}
    scans++;
    if(scans>state.order.length){
      resolveBattleState(state,'no-active-turns');
      return null;
    }
  }while(!isCombatantActive(currentUnit(state)));
  if(wrapped) state.round++;
  resolveBattleState(state,'post-next-turn');
  return currentUnit(state);
}
export function addUnitToBattle(state,unit){
  state.units.push(unit);
  state.order.push(unit);
  resolveBattleState(state,'summon');
  return unit;
}
export function markEscaped(state,unit){
  unit.escaped=true;
  resolveBattleState(state,'escape');
}
export function markDead(state,unit){
  unit.alive=false;
  resolveBattleState(state,'death');
}
