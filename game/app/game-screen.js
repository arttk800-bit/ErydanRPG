import {WorldUI} from '../ui/world.js';
import {PauseSystem} from '../systems/pause.js';
export function mountGameScreen(state,onChange){
 const root=document.querySelector('#worldRoot');
 if(!root||!state)return ()=>{};
 const top=document.querySelector('.topbar');
 let clock=top?.querySelector('.game-clock');
 if(top&&!clock){clock=document.createElement('div');clock.className='game-clock';const pause=document.createElement('button');pause.className='game-pause';pause.type='button';pause.onclick=()=>{PauseSystem.toggleManual(state);paint();onChange?.(state)};clock.append(document.createElement('span'),document.createElement('span'),pause);top.insertBefore(clock,top.lastElementChild)}
 function paint(){if(!clock)return;const [game,real,pause]=clock.children;const d=new Date(),c=state.clock||{day:1,minute:720},whole=Math.floor(c.minute),h=Math.floor(whole/60),m=whole%60;game.textContent='Игровое: '+String(c.day).padStart(2,'0')+'.01.1000 · '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');real.textContent='Реальное: '+d.toLocaleTimeString('ru-RU',{hour12:false});const paused=PauseSystem.isPaused(state);pause.textContent=paused?'▶':'Ⅱ';pause.title=paused?'Продолжить':'Пауза';pause.classList.toggle('active',paused)}
 paint();const timer=setInterval(paint,1000);const unmount=WorldUI.mount(root,state,onChange);
 return ()=>{clearInterval(timer);unmount?.();clock?.remove()};
}
