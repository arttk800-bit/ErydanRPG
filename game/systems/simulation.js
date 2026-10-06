// ============================================================================
// WORLD SIMULATION
// Advances normal world time 1:1 with real time. Travel/sleep fast-forward is
// explicit and owned by those modes; there is no global game-speed multiplier.
// ============================================================================
import {PauseSystem} from './pause.js';
import {WorldClockSystem} from './world/clock.js';
const EVENT_STEP_SECONDS=15*60;
const FAST_FORWARD=16;
export const SimulationSystem={
 ensure(state){state.simulation=state.simulation||{};state.simulation.runtime=state.simulation.runtime||{mode:'world',eventAccumulator:0,sleep:null,fastForward:false};return state.simulation.runtime},
 setMode(state,mode){const r=this.ensure(state);r.mode=mode||'world';if(r.mode!=='travel'&&r.mode!=='sleep')r.fastForward=false;return r.mode},
 setFastForward(state,on){const r=this.ensure(state);r.fastForward=Boolean(on&&(r.mode==='travel'||r.mode==='sleep'));return r.fastForward},
 toggleFastForward(state){return this.setFastForward(state,!this.ensure(state).fastForward)},
 multiplier(state){const r=this.ensure(state);return r.fastForward&&(r.mode==='travel'||r.mode==='sleep')?FAST_FORWARD:1},
 startSleep(state,{hours=8}={}){const r=this.ensure(state);r.sleep={remainingSeconds:Math.max(1,Number(hours)||8)*3600,startedDay:state.clock.day,startedMinute:state.clock.minute};r.mode='sleep';r.fastForward=false;return r.sleep},
 stopSleep(state){const r=this.ensure(state);r.sleep=null;r.mode='world';r.fastForward=false},
 tick(state,realSeconds,{active=true,onTemporalStep}={}){if(!active||PauseSystem.isPaused(state))return{gameSeconds:0,steps:0};const r=this.ensure(state),gameSeconds=Math.max(0,realSeconds)*this.multiplier(state),advanced=WorldClockSystem.advanceSeconds(state,gameSeconds,r.mode);r.eventAccumulator=(r.eventAccumulator||0)+advanced;let steps=0;while(r.eventAccumulator>=EVENT_STEP_SECONDS){r.eventAccumulator-=EVENT_STEP_SECONDS;steps++;onTemporalStep?.({seconds:EVENT_STEP_SECONDS,mode:r.mode,day:state.clock.day,minute:state.clock.minute})}if(r.sleep&&advanced>0){r.sleep.remainingSeconds-=advanced;if(r.sleep.remainingSeconds<=0)this.stopSleep(state)}return{gameSeconds:advanced,steps}}
};
