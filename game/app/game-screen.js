// ============================================================================
// GAME SCREEN
// Mounts campaign UI and the real-time simulation loop.
// ============================================================================
import {WorldUI} from '../ui/world.js';
import {PauseSystem} from '../systems/pause.js';
import {runtimeTrace} from '../diagnostics/runtime-trace.js';
import {SimulationSystem} from '../systems/simulation.js';
let activeCleanup=null;
export function mountGameScreen(state,onChange,{audio}={}){
 activeCleanup?.();activeCleanup=null;runtimeTrace.system('game-screen','mount',{current:state?.world?.current});
 const root=document.querySelector('#worldRoot');if(!root||!state)return()=>{};
 const top=document.querySelector('.topbar');top?.querySelector('.game-clock')?.remove();let clock=null;
 if(top){
  clock=document.createElement('div');clock.className='game-clock';
  const game=document.createElement('span'),real=document.createElement('span'),warp=document.createElement('button'),pause=document.createElement('button');
  warp.className='game-fast-forward';warp.type='button';warp.onclick=()=>{SimulationSystem.toggleFastForward(state);paint();onChange?.(state)};
  pause.className='game-pause';pause.type='button';pause.onclick=()=>{const t=runtimeTrace.begin('game.pause.toggle');PauseSystem.toggleManual(state);paint();onChange?.(state);runtimeTrace.end(t,{paused:PauseSystem.isPaused(state),ui:runtimeTrace.uiSnapshot()})};
  clock.append(game,real,warp,pause);top.insertBefore(clock,top.lastElementChild)
 }
 function paint(){if(!clock)return;const [game,real,warp,pause]=clock.children,c=state.clock||{day:1,minute:480},whole=Math.floor(c.minute),h=Math.floor(whole/60),m=whole%60;game.textContent='Игровое: '+String(c.day).padStart(2,'0')+'.01.1000 · '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');real.textContent='Реальное: '+new Date().toLocaleTimeString('ru-RU',{hour12:false});const sim=SimulationSystem.ensure(state),canWarp=sim.mode==='travel'||sim.mode==='sleep';warp.hidden=!canWarp;warp.textContent=sim.fastForward?'Обычная скорость':'Перемотка';warp.classList.toggle('active',sim.fastForward);const paused=PauseSystem.isPaused(state);pause.textContent=paused?'▶':'Ⅱ';pause.title=paused?'Продолжить':'Пауза';pause.classList.toggle('active',paused)}
 paint();SimulationSystem.ensure(state);audio?.syncEnvironment(state);const syncedChange=next=>{audio?.syncEnvironment(next||state);return onChange?.(next||state)};let lastFrame=performance.now(),simulationFrame=0;
 const runSimulation=now=>{const dt=Math.min(.25,Math.max(0,(now-lastFrame)/1000));lastFrame=now;SimulationSystem.tick(state,dt,{active:!document.hidden});paint();simulationFrame=requestAnimationFrame(runSimulation)};
 simulationFrame=requestAnimationFrame(runSimulation);const timer=setInterval(paint,1000);const unmount=WorldUI.mount(root,state,syncedChange,context=>audio?.setContext(context));
 const dispose=()=>{runtimeTrace.system('game-screen','unmount',{current:state?.world?.current});clearInterval(timer);cancelAnimationFrame(simulationFrame);unmount?.();audio?.stop();clock?.remove();if(activeCleanup===dispose)activeCleanup=null};activeCleanup=dispose;return dispose
}
