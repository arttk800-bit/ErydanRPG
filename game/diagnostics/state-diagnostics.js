// ============================================================================
// STATE DIAGNOSTICS
// Read-only validation of canonical session/save state. Persistence owns storage.
// ============================================================================
import {STATE_VERSION,validateGameState} from '../core/state.js';

export function runStateDiagnostics(state,{persistenceSupported=false}={}){
 const validation=state?validateGameState(state):{ok:true,errors:[]};
 const version=state?.meta?.stateVersion??null;
 const checks=[
  ['Persistence API available',!!persistenceSupported],
  ['Canonical state valid',validation.ok],
  ['State schema current',!state||version===STATE_VERSION],
  ['World identity',!state||!!(state.meta?.worldId&&state.meta?.worldName)],
  ['Host player',!state||!!state.session?.players?.[state.session?.hostPlayerId]]
 ];
 return{ok:checks.every(([,ok])=>ok),checks,version,currentVersion:STATE_VERSION,errors:validation.errors||[],save:{worldId:state?.meta?.worldId||null,saveVersion:state?.meta?.saveVersion??null,createdAt:state?.meta?.createdAt||null,updatedAt:state?.meta?.updatedAt||null}};
}
