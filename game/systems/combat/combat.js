import {W,PD,GRID,DEFAULT_BATTLE_CFG,CLASS_POOL} from '../../alpha14p/data/constants.js';
import {GameRNG,pick} from '../../alpha14p/core/rng.js';
import {createCombatState,makeUnit,generateTerrain} from './state.js';
import {hd,distance,neighbors,isBlockedTerrain,movementCost} from './movement.js';
import {hitChance} from './attacks.js';
import {applyHit} from './damage.js';
import {nearestEnemy} from './ai.js';

const partKeys=['head','torso','larm','rarm','lleg','rleg'];
const rndPart=()=>{let x=GameRNG.random()*100;return x<10?'head':x<50?'torso':x<62?'larm':x<74?'rarm':x<87?'lleg':'rleg'};
function at(s,q,r){return s.units.find(u=>u.alive&&u.q===q&&u.r===r)}
function blocked(s,q,r){return isBlockedTerrain(s.terrain[q+','+r])}
function activeWeapon(a,t){return a.cls==='archer'&&distance(a,t)<=1&&a.w2?a.w2:a.w}
function coverPenalty(s,a,t){let pen=0,steps=Math.max(1,Math.ceil(distance(a,t)));for(let i=1;i<steps;i++){let q=Math.round(a.q+(t.q-a.q)*i/steps),r=Math.round(a.r+(t.r-a.r)*i/steps),z=s.terrain[q+','+r];if(z==='tree')pen+=25;else if(z==='bush')pen+=7;else if(z==='rock')pen+=35}if(s.terrain[t.q+','+t.r]==='bush')pen+=10;return Math.min(75,pen)}
function pathStep(s,a,t,range=1){let queue=[[a.q,a.r]],seen=new Set([a.q+','+a.r]),parent=new Map(),key=(q,r)=>q+','+r,goal=null;while(queue.length){let[q,r]=queue.shift();if(!(q===a.q&&r===a.r)&&hd(q,r,t.q,t.r)<=range){goal=[q,r];break}for(const[nq,nr]of neighbors(q,r,GRID)){let k=key(nq,nr);if(seen.has(k)||blocked(s,nq,nr))continue;let o=at(s,nq,nr);if(o&&o!==a)continue;seen.add(k);parent.set(k,[q,r]);queue.push([nq,nr])}}if(!goal)return null;let cur=goal,prev=parent.get(key(...cur));while(prev&&!(prev[0]===a.q&&prev[1]===a.r)){cur=prev;prev=parent.get(key(...cur))}return cur}
function attack(s,a,t){let wk=activeWeapon(a,t),w=W[wk];if(a.ap<w.ap||distance(a,t)>w.r)return false;a.ap-=w.ap;a.st=Math.max(0,a.st-14);let ch=hitChance({attacker:a,target:t,weapon:w,part:null,partData:PD,distance:distance(a,t),coverPenalty:coverPenalty(s,a,t)});if(GameRNG.random()*100<=ch){let p=rndPart(),fat=a.st<25 ? 0.7 : (a.st<50 ? 0.88 : 1),raw=Math.max(1,Math.round((w.min+GameRNG.random()*(w.max-w.min))*fat));applyHit(t,p,w,raw);s.log.unshift(a.name+' → '+t.name+' · '+W[wk].n+' · '+PD[p].n+' · '+raw)}else s.log.unshift(a.name+' → '+t.name+' · ПРОМАХ');return true}
function checkEnd(s){let A=s.units.some(u=>u.alive&&u.team==='ally'),E=s.units.some(u=>u.alive&&u.team==='enemy');s.over=!A||!E;return s.over}
function advance(s){if(checkEnd(s))return false;do{s.idx++;if(s.idx>=s.order.length){s.idx=0;s.round++}}while(!s.order[s.idx].alive);let c=s.order[s.idx];if(c.prepared)c.prepared=false;if(c.bleed){c.hp=Math.max(0,c.hp-c.bleed);if(!c.hp)c.alive=false;if(checkEnd(s))return false}c.ap=9;c.st=Math.min(c.maxSt||100,c.st+12);return true}
function act(s,a){let t=nearestEnemy(s,a,distance);if(!t)return'none';let w=W[activeWeapon(a,t)],d=distance(a,t);if(a.st<25&&a.ap>=4){a.ap-=4;a.st=Math.min(a.maxSt,a.st+30);return'skill'}if(d<=w.r&&a.ap>=w.ap){attack(s,a,t);checkEnd(s);return'attack'}if(d<=w.r){if(a.ap>=4&&!a.prepared){a.ap-=4;a.prepared=true;return'skill'}return'end'}let mc=movementCost(a),max=Math.floor(a.ap/mc.ap),route=[],g={...a};for(let i=0;i<max;i++){let o=pathStep(s,g,t,w.r);if(!o)break;route.push(o);g={...g,q:o[0],r:o[1]};if(hd(g.q,g.r,t.q,t.r)<=w.r)break}if(route.length){let d=route.at(-1);a.q=d[0];a.r=d[1];a.ap-=mc.ap*route.length;a.st=Math.max(0,a.st-mc.st*route.length);return'move'}return'end'}
function step(s){if(s.over)return false;let a=s.order[s.idx];let action=act(s,a);if(!s.over&&(action==='end'||action==='none'))advance(s);return !s.over}
function build(options={}){let s=createCombatState(DEFAULT_BATTLE_CFG),duel=options.mode==='1v1';s.cfg.allies=duel?[options.allies?.[0]||'guardian']:(options.allies||DEFAULT_BATTLE_CFG.allies);s.cfg.enemies=duel?1:(options.enemies||3);s.cfg.terrain=options.terrain||'normal';let ap=duel ? [[2,5]] : [[1,4],[1,5],[1,6]], ep=duel ? [[11,5]] : [[12,2],[12,3],[12,4],[12,5],[12,6],[11,7]];for(let i=0;i<(duel?1:3);i++)s.units.push(makeUnit('a'+i,i?'Союзник '+(i+1):'ГГ','ally',...ap[i],s.cfg.allies[i]||'guardian'));for(let i=0;i<s.cfg.enemies;i++)s.units.push(makeUnit('e'+i,'Враг '+(i+1),'enemy',...ep[i],pick(CLASS_POOL)));s.order=[...s.units];generateTerrain(s,GRID,hd);return s}
let current=null;
export const CombatRuntime={
 startBattle(options){current=build(options);window.dispatchEvent(new CustomEvent('eirdan:combat-start',{detail:current}));return current},
 getState(){return current},
 step(){if(!current)return null;step(current);window.dispatchEvent(new CustomEvent('eirdan:combat-update',{detail:current}));return current},
 endTurn(){if(current){advance(current);window.dispatchEvent(new CustomEvent('eirdan:combat-update',{detail:current})}return current},
 async simulate(mode,n=100,options={}){let wins={ally:0,enemy:0,draw:0},rounds=0;for(let i=0;i<n;i++){let s=build({...options,mode}),guard=0;while(!s.over&&s.round<=250&&guard++<6000)step(s);let A=s.units.some(u=>u.alive&&u.team==='ally'),E=s.units.some(u=>u.alive&&u.team==='enemy'),r=A&&!E?'ally':E&&!A?'enemy':'draw';wins[r]++;rounds+=s.round;if(i%5===4)await new Promise(r=>setTimeout(r,0))}let result={mode,n,wins,averageRounds:rounds/n};window.dispatchEvent(new CustomEvent('eirdan:combat-simulation',{detail:result}));return result}
};
export {dirs,hd,distance,neighbors,isBlockedTerrain,movementCost} from './movement.js';
export {hitChance} from './attacks.js';
export {armorSlotForPart,armorCoverageForPart} from './armor.js';
export {createCombatState} from './state.js';
export const COMBAT_MODULE_VERSION='combat-runtime-1';
