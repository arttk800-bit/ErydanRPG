// ============================================================================
// WORLD CLOCK
// Owns continuous in-session game time. It never advances while paused/hidden.
// ============================================================================
import {PauseSystem} from '../pause.js';
const MINUTES_PER_DAY=1440;
function normalize(clock){while(clock.minute>=MINUTES_PER_DAY){clock.minute-=MINUTES_PER_DAY;clock.day++}}
export const WorldClockSystem={
 ensure(state){state.clock=state.clock||{day:1,minute:480};state.simulation=state.simulation||{};state.simulation.clock=state.simulation.clock||{fraction:0};return state.simulation.clock},
 advance(state,minutes,reason='simulation'){if(PauseSystem.isPaused(state)||!Number.isFinite(minutes)||minutes<=0)return 0;const runtime=this.ensure(state),total=runtime.fraction+minutes,whole=Math.floor(total);runtime.fraction=total-whole;if(!whole)return 0;state.clock.minute+=whole;normalize(state.clock);state.simulation.lastAdvance={minutes:whole,reason,day:state.clock.day,minute:state.clock.minute};return whole},
 label(state){const c=state.clock||{day:1,minute:0},m=Math.floor(c.minute);return 'День '+c.day+' · '+String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
};