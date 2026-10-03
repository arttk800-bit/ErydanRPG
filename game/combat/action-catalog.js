import {weaponAttack} from './actions.js';import {guard,rest,bandage,concentrate} from './status.js';import {smoke,prepare,stoneSkin,rage,heal,divine,flame,lightning,precise} from './skills.js';import {fireball,wave} from './skill-engine.js';
export function installCombatActions(reg,W){
 const simple={guard:u=>guard(u),rest:u=>rest(u),bandage:u=>bandage(u),concentrate:u=>concentrate(u),smoke:u=>smoke(u),prepare:u=>prepare(u),stone:u=>stoneSkin(u),rage:u=>rage(u)};
 for(const [id,fn] of Object.entries(simple))reg.register(id,{execute:({actor})=>({ok:fn(actor)})});
 reg.register('attack',{execute:({state,actor,target,rng})=>weaponAttack(state,actor,target,W,{rng})});
 reg.register('aim',{execute:({state,actor,target,part,rng})=>precise(state,actor,target,W,part,rng)});
 reg.register('heal',{execute:({actor,target})=>heal(actor,target)});
 reg.register('divine',{execute:({state,actor,target,rng})=>divine(state,actor,target,rng)});
 reg.register('flame',{execute:({state,actor,target,rng})=>flame(state,actor,target,rng)});
 reg.register('lightning',{execute:({state,actor,target,rng})=>lightning(state,actor,target,rng)});
 reg.register('fireball',{execute:({state,actor,target,rng})=>fireball(state,actor,target,{rng})});
 reg.register('wave',{execute:({state,actor,target,rng})=>wave(state,actor,target,{rng})});
 return reg;
}
