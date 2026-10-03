export function isCombatantActive(u){
  return !!u && u.alive === true && u.escaped !== true;
}
export function activeUnits(state,team){
  return state.units.filter(u=>isCombatantActive(u)&&u.team===team);
}
export function battleSnapshot(state,reason='state-check'){
  return {
    reason,
    round:state.round,
    turnIndex:state.turnIndex ?? 0,
    ally:activeUnits(state,'ally').map(u=>u.id),
    enemy:activeUnits(state,'enemy').map(u=>u.id),
    units:state.units.map(u=>({
      id:u.id,team:u.team,cls:u.cls,alive:!!u.alive,escaped:!!u.escaped,
      hp:u.hp,q:u.q,r:u.r
    }))
  };
}
export function resolveBattleState(state,reason='state-check'){
  if(state.over) return {over:true,result:state.result,snapshot:state.lastBattleSnapshot ?? null};
  const ally=activeUnits(state,'ally'), enemy=activeUnits(state,'enemy');
  if(ally.length && enemy.length) return {over:false,result:null,snapshot:null};
  state.over=true;
  state.result=ally.length?'ally':enemy.length?'enemy':'draw';
  state.lastBattleSnapshot=battleSnapshot(state,reason);
  return {over:true,result:state.result,snapshot:state.lastBattleSnapshot};
}
