// ============================================================================
// WORLD SIMULATION
// Converts active real time into game time and provides temporal event ticks.
// Gameplay systems consume the elapsed game minutes; UI never owns the clock.
// ============================================================================
import {PauseSystem} from './pause.js';
import {GameSpeedSystem} from './game-speed.js';
import {WorldClockSystem} from './world/clock.js';
const BASE_GAME_MINUTES_PER_REAL_SECOND=2/3; // 1 game hour = 90 real seconds at x1.
const PASSIVE_FACTOR=.5;
const EVENT_STEP_MINUTES=15;
export const SimulationSystem={
 ensure(state){state.simulation=state.simulation||{};state.simulation.runtime=state.simulation.runtime||{mode:'world',eventAccumulator:0,sleep:null};return state.simulation.runtime},
 setMode(state,mode){const r=this.ensure(state);r.mode=mode||'world';return r.mode},
 startSleep(state,{untilMinute=null}={}){const r=this.ensure(state);r.sleep={untilMinute:Number.isFinite(untilMinute)?untilMinute:null,startedDay:state.clock.day,startedMinute:state.clock.minute};r.mode='sleep';return r.sleep},
 stopSleep(state){const r=this.ensure(state);r.sleep=null;r.mode='world'},
 factor(state){const r=this.ensure(state);if(r.mode==='sleep')return 32;if(r.mode==='inventory'||r.mode==='character'||r.mode==='dialogue')return PASSIVE_FACTOR;return GameSpeedSystem.get(state)},
 tick(state,realSeconds,{active=true,onTemporalStep}={}){if(!active||PauseSystem.isPaused(state))return{gameMinutes:0,steps:0};const r=this.ensure(state),gameMinutes=Math.max(0,realSeconds)*BASE_GAME_MINUTES_PER_REAL_SECOND*this.factor(state),advanced=WorldClockSystem.advance(state,gameMinutes,r.mode);r.eventAccumulator=(r.eventAccumulator||0)+gameMinutes;let steps=0;while(r.eventAccumulator>=EVENT_STEP_MINUTES){r.eventAccumulator-=EVENT_STEP_MINUTES;steps++;onTemporalStep?.({minutes:EVENT_STEP_MINUTES,mode:r.mode,day:state.clock.day,minute:state.clock.minute})}if(r.sleep?.untilMinute!=null&&state.clock.minute>=r.sleep.untilMinute&&state.clock.day>r.sleep.startedDay||r.sleep?.untilMinute!=null&&r.sleep.startedDay===state.clock.day&&r.sleep.startedMinute<r.sleep.untilMinute&&state.clock.minute>=r.sleep.untilMinute)this.stopSleep(state);return{gameMinutes:advanced,steps}}
};