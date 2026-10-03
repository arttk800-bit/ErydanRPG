import {hexId,inBounds,neighbors,occupied,hexDistance} from './hex-grid.js';

export function ensureMovementTelemetry(state){
 state.movement ??={events:[],byUnit:new Map(),backtracks:0};
 return state.movement;
}
export function movementHistory(state,unitId){
 const m=ensureMovementTelemetry(state);
 if(!m.byUnit.has(unitId))m.byUnit.set(unitId,[]);
 return m.byUnit.get(unitId);
}
export function canMoveTo(state,unit,q,r){
 return !!unit&&unit.alive&&!unit.escaped&&inBounds(q,r)&&!occupied(state,q,r,unit.id);
}
export function recordMove(state,unit,from,to,reason='move'){
 const m=ensureMovementTelemetry(state),h=movementHistory(state,unit.id);
 const event={round:state.round,unitId:unit.id,from:hexId(from.q,from.r),to:hexId(to.q,to.r),reason};
 const prev=h.at(-1);
 if(prev&&prev.from===event.to&&prev.to===event.from){event.immediateBacktrack=true;m.backtracks++;}
 h.push(event);if(h.length>32)h.shift();
 m.events.push(event);if(m.events.length>2000)m.events.shift();
 return event;
}
export function moveUnit(state,unit,q,r,reason='move'){
 if(!canMoveTo(state,unit,q,r))return {ok:false,reason:'illegal-destination'};
 const from={q:unit.q,r:unit.r};unit.q=q;unit.r=r;
 return {ok:true,event:recordMove(state,unit,from,{q,r},reason)};
}
export function legalSteps(state,unit){return neighbors(unit.q,unit.r).filter(p=>canMoveTo(state,unit,p.q,p.r));}
export function chooseStepToward(state,unit,target,{avoidImmediateBacktrack=true}={}){
 let steps=legalSteps(state,unit);
 if(avoidImmediateBacktrack){
   const prev=movementHistory(state,unit.id).at(-1);
   if(prev){const filtered=steps.filter(p=>hexId(p.q,p.r)!==prev.from);if(filtered.length)steps=filtered;}
 }
 return steps.sort((a,b)=>hexDistance(a,target)-hexDistance(b,target))[0]??null;
}
export function stepToward(state,unit,target,reason='move_toward'){
 const p=chooseStepToward(state,unit,target);return p?moveUnit(state,unit,p.q,p.r,reason):{ok:false,reason:'no-route'};
}
