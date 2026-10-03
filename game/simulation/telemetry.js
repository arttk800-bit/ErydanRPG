import {hexId} from '../core/hex-grid.js';
export function compactBattleSummary(state){
 return {seed:state.seed,rounds:state.round,result:state.result,over:state.over,
  movementEvents:state.movement?.events.length??0,immediateBacktracks:state.movement?.backtracks??0,
  units:state.units.map(u=>({id:u.id,team:u.team,cls:u.cls,alive:u.alive,escaped:!!u.escaped,hp:u.hp,hex:hexId(u.q,u.r)}))};
}
export function anomalyTrace(state,kind,tail=40){
 return {kind,...compactBattleSummary(state),movementTail:(state.movement?.events??[]).slice(-tail)};
}
