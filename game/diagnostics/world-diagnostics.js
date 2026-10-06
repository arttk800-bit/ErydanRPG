// ============================================================================
// WORLD / SIMULATION DIAGNOSTICS
// Read-only snapshot of canonical world position, seconds and simulation mode.
// ============================================================================
export function runWorldDiagnostics(state){
 if(!state)return{ok:true,checks:[['Session not loaded',true]],clock:null,current:null,simulation:null};
 const clock=state.clock||{},runtime=state.simulation?.runtime||{},current=state.world?.current||{};
 const checks=[
  ['Clock day valid',Number.isInteger(clock.day)&&clock.day>=1],
  ['Clock minute valid',Number.isFinite(clock.minute)&&clock.minute>=0&&clock.minute<1440],
  ['Clock second valid',Number.isFinite(clock.second)&&clock.second>=0&&clock.second<86400],
  ['Simulation mode valid',['world','travel','inventory','character','dialogue','sleep'].includes(runtime.mode)],
  ['Event accumulator valid',Number.isFinite(runtime.eventAccumulator)&&runtime.eventAccumulator>=0],
  ['Fast-forward scope valid',!runtime.fastForward||runtime.mode==='travel'||runtime.mode==='sleep'],
  ['Sleep state coherent',runtime.mode==='sleep'?Number.isFinite(runtime.sleep?.remainingSeconds)&&runtime.sleep.remainingSeconds>0:!runtime.sleep]
 ];
 return{ok:checks.every(([,ok])=>ok),checks,clock:{day:clock.day,minute:clock.minute,second:clock.second},current:{regionId:current.regionId||null,locationId:current.locationId||null,districtId:current.districtId||null,placeId:current.placeId||null},journey:state.world?.journey||null,simulation:{mode:runtime.mode||null,eventAccumulator:runtime.eventAccumulator??null,fastForward:!!runtime.fastForward,sleep:runtime.sleep||null,lastAdvance:state.simulation?.lastAdvance||null}}
}
