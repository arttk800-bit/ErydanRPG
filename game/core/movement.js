import {COLS,ROWS,hexDistance,hexId,neighbors} from './hex-grid.js';
function movementState(state){return state.movement??=( {events:[],backtracks:0,history:new Map()} );}
export function occupied(state,q,r,except=null){return state.units.some(u=>u!==except&&u.alive&&!u.escaped&&u.q===q&&u.r===r);}
export function legalSteps(state,u){return neighbors(u.q,u.r).filter(p=>p.q>=0&&p.q<COLS&&p.r>=0&&p.r<ROWS&&!occupied(state,p.q,p.r,u));}
export function movementHistory(state,id){return movementState(state).history.get(id)??[];}
export function chooseStepToward(state,u,target){
 const opts=legalSteps(state,u);if(!opts.length)return null;
 const prev=movementHistory(state,u.id).at(-1)?.from;
 opts.sort((a,b)=>hexDistance(a,target)-hexDistance(b,target)+(hexId(a.q,a.r)===prev?2:0)-(hexId(b.q,b.r)===prev?2:0));
 return opts[0];
}
export function moveUnit(state,u,q,r,reason='move',{beforeMove=null,afterMove=null}={}){
 if(!u?.alive||u.escaped)return{ok:false,reason:'inactive'};
 if(!legalSteps(state,u).some(p=>p.q===q&&p.r===r))return{ok:false,reason:'illegal-step'};
 const from={q:u.q,r:u.r,hex:hexId(u.q,u.r)},to={q,r,hex:hexId(q,r)};
 const pre=beforeMove?.({state,u,from,to});if(pre?.cancel)return{ok:false,reason:pre.reason??'cancelled'};
 u.q=q;u.r=r;
 const ms=movementState(state),h=movementHistory(state,u.id);
 const immediateBacktrack=!!(h.length&&h.at(-1).from===to.hex);
 if(immediateBacktrack)ms.backtracks++;
 const ev={unit:u.id,from:from.hex,to:to.hex,reason,round:state.round,immediateBacktrack};
 h.push(ev);if(h.length>24)h.shift();ms.history.set(u.id,h);ms.events.push(ev);
 afterMove?.({state,u,from,to,event:ev,pre});
 return{ok:true,from,to,event:ev,pre};
}
export function stepToward(state,u,target,reason='approach',hooks={}){
 const p=chooseStepToward(state,u,target);if(!p)return{ok:false,reason:'blocked'};
 return moveUnit(state,u,p.q,p.r,reason,hooks);
}
