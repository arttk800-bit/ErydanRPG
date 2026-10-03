import {hexDistance} from '../core/hex-grid.js';
import {weaponAttack} from './actions.js';
import {changeResolve} from './resolve.js';

export function shieldBash(state, actor, target, weapons, rng=Math.random){
  if(actor.ap<4 || hexDistance(actor,target)>1) return {ok:false,reason:'requirements'};
  const before=actor.ap;
  const out=weaponAttack(state,actor,target,weapons,{rng});
  if(!out.ok) return out;
  actor.ap=before-4;
  if(out.hit){ target.st=Math.max(0,target.st-20); changeResolve(target,-6); }
  return out;
}

export function sweep(state, actor, weapons, rng=Math.random){
  if(actor.ap<6) return {ok:false,reason:'ap'};
  const targets=state.units.filter(u=>u.alive&&!u.escaped&&u.team!==actor.team&&hexDistance(actor,u)<=1);
  if(!targets.length) return {ok:false,reason:'no-targets'};
  actor.ap-=6;
  const hits=[];
  for(const target of targets){
    const saved=actor.ap; actor.ap=99;
    const out=weaponAttack(state,actor,target,weapons,{rng});
    actor.ap=saved;
    if(out.ok) hits.push({id:target.id,...out});
  }
  return {ok:true,hits};
}
