import {resolveBattleState} from '../core/battle-lifecycle.js';import {nextTurn,currentUnit} from '../core/turn-manager.js';import {aiTurn} from '../ai/controller.js';import {compactBattleSummary,anomalyTrace} from './telemetry.js';
export function runHeadless(state,api,{hardCap=500,longBattleRounds=100}={}){
 let actions=0;const traces=[];resolveBattleState(state,'simulation-start');
 while(!state.over&&actions<hardCap){
  const u=currentUnit(state);if(!u){nextTurn(state);continue;}
  const before=actions;const events=aiTurn(state,u,api);actions+=Math.max(1,events.length);
  resolveBattleState(state,'post-ai-turn');if(state.over)break;nextTurn(state);
  if(actions===before)actions++;
 }
 if(!state.over)traces.push(anomalyTrace(state,'HARD_CAP_'+hardCap));
 if(state.round>longBattleRounds)traces.push(anomalyTrace(state,'LONG_BATTLE'));
 return{...compactBattleSummary(state),actions,hardCapHit:!state.over,traces};
}
