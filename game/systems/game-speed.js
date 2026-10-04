const ALLOWED=[1,2,4];
export const GameSpeedSystem={
 get(state){const n=Number(state?.runtime?.gameSpeed||1);return ALLOWED.includes(n)?n:1},
 set(state,value){state.runtime=state.runtime||{};const n=Number(value);state.runtime.gameSpeed=ALLOWED.includes(n)?n:1;return state.runtime.gameSpeed},
 options(){return [...ALLOWED]}
};
