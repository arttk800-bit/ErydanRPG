export const PauseSystem={
 ensure(state){state.runtime=state.runtime||{};state.runtime.pause=state.runtime.pause||{reasons:{}};return state.runtime.pause},
 set(state,reason,on=true){const p=this.ensure(state);if(on)p.reasons[reason]=true;else delete p.reasons[reason];return this.isPaused(state)},
 toggleManual(state){const p=this.ensure(state);return this.set(state,'manual',!p.reasons.manual)},
 isPaused(state){return Object.keys(this.ensure(state).reasons).length>0},
 reasons(state){return Object.keys(this.ensure(state).reasons)}
};
