import {WorldUI} from '../ui/world.js';
import {PauseSystem} from '../systems/pause.js';
import {runtimeTrace} from '../diagnostics/runtime-trace.js';
import {GameSpeedSystem} from '../systems/game-speed.js';
let activeCleanup=null;
export function mountGameScreen(state,onChange,{audio}={}){activeCleanup?.();activeCleanup=null;runtimeTrace.system('game-screen','mount',{current:state?.world?.current});
 const root=document.querySelector('#worldRoot');
 if(!root||!state)return ()=>{};
 const top=document.querySelector('.topbar');
 top?.querySelector('.game-clock')?.remove();
 let clock=null;
 if(top){clock=document.createElement('div');clock.className='game-clock';const speed=document.createElement('details');speed.className='game-speed';const speedSummary=document.createElement('summary');speedSummary.textContent='×'+GameSpeedSystem.get(state);const speedMenu=document.createElement('div');speedMenu.className='game-speed-menu';for(const n of GameSpeedSystem.options()){const b=document.createElement('button');b.type='button';b.textContent='×'+n;b.onclick=e=>{e.preventDefault();GameSpeedSystem.set(state,n);speed.open=false;paint();onChange?.(state)};speedMenu.append(b)}speed.append(speedSummary,speedMenu);const pause=document.createElement('button');pause.className='game-pause';pause.type='button';pause.onclick=()=>{const t=runtimeTrace.begin('game.pause.toggle');PauseSystem.toggleManual(state);paint();onChange?.(state);runtimeTrace.end(t,{paused:PauseSystem.isPaused(state),ui:runtimeTrace.uiSnapshot()})};clock.append(document.createElement('span'),document.createElement('span'),speed,pause);top.insertBefore(clock,top.lastElementChild)}
 function paint(){if(!clock)return;const [game,real,speed,pause]=clock.children;const d=new Date(),c=state.clock||{day:1,minute:720},whole=Math.floor(c.minute),h=Math.floor(whole/60),m=whole%60;game.textContent='Игровое: '+String(c.day).padStart(2,'0')+'.01.1000 · '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');real.textContent='Реальное: '+d.toLocaleTimeString('ru-RU',{hour12:false});const currentSpeed=GameSpeedSystem.get(state);speed.querySelector('summary').textContent='×'+currentSpeed;for(const b of speed.querySelectorAll('.game-speed-menu button'))b.classList.toggle('active',b.textContent==='×'+currentSpeed);const paused=PauseSystem.isPaused(state);pause.textContent=paused?'▶':'Ⅱ';pause.title=paused?'Продолжить':'Пауза';pause.classList.toggle('active',paused)}
 paint();const timer=setInterval(paint,1000);const unmount=WorldUI.mount(root,state,onChange,context=>audio?.setContext(context));
 const dispose=()=>{runtimeTrace.system('game-screen','unmount',{current:state?.world?.current});clearInterval(timer);unmount?.();audio?.stop();clock?.remove();if(activeCleanup===dispose)activeCleanup=null};activeCleanup=dispose;return dispose;
}
