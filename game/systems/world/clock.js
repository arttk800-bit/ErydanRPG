// ============================================================================
// WORLD CLOCK
// Owns continuous in-session game time with hidden seconds.
// ============================================================================
import {PauseSystem} from '../pause.js';
const SECONDS_PER_DAY=86400;
function normalize(clock){while(clock.second>=SECONDS_PER_DAY){clock.second-=SECONDS_PER_DAY;clock.day++}}
export const WorldClockSystem={
 ensure(state){
  state.clock=state.clock||{day:1,minute:480};
  if(!Number.isFinite(state.clock.second))state.clock.second=Math.max(0,Number(state.clock.minute||0)*60);
  state.simulation=state.simulation||{};
  return state.clock
 },
 advanceSeconds(state,seconds,reason='simulation'){
  if(PauseSystem.isPaused(state)||!Number.isFinite(seconds)||seconds<=0)return 0;
  const clock=this.ensure(state),before=clock.second;
  clock.second+=seconds;normalize(clock);clock.minute=clock.second/60;
  state.simulation.lastAdvance={seconds:clock.second-before,reason,day:clock.day,minute:clock.minute};
  return seconds
 },
 advance(state,minutes,reason='simulation'){return this.advanceSeconds(state,minutes*60,reason)/60},
 label(state){const c=this.ensure(state),whole=Math.floor(c.second),h=Math.floor(whole/3600),m=Math.floor((whole%3600)/60);return 'День '+c.day+' · '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')}
};
