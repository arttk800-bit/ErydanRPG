import {GameState} from '../core/game-state.js';
import {createUnit} from '../data/unit-factory.js';
import {createClient} from '../client/bootstrap.js';
import {renderBattlefield} from './battlefield.js';
import {renderHud} from './hud.js';
import {icon} from './icons.js';

const board=document.querySelector('#board'),hud=document.querySelector('#hud'),turn=document.querySelector('#turn');

function fatal(err){
 console.error(err);
 if(turn)turn.textContent='Ошибка запуска';
 if(board){board.className='startup-error';board.textContent=String(err?.stack||err);}
}

async function start(){
 const weapons=await (await fetch('../data/weapons.json')).json();
 const state=new GameState(1);
 state.units=[
  createUnit({id:'a0',name:'Леон',team:'ally',cls:'guardian',q:1,r:4}),
  createUnit({id:'e0',name:'Враг',team:'enemy',cls:'guardian',q:12,r:4})
 ];
 state.order=[...state.units];
 const client=await createClient({weapons,state});
 function draw(){
  const u=state.order[state.turnIndex];
  if(turn)turn.textContent=u?`Ход: ${u.name} · раунд ${state.round}`:'';
  renderBattlefield(board,state,{onUnit:t=>{if(u&&t.team!==u.team)client.actions.target(t);}});
  renderHud(hud,u,[
   {id:'attack',label:'Атака',icon:icon('attack'),onClick:()=>client.actions.select('attack')},
   {id:'aim',label:'Точная',icon:icon('aim'),onClick:()=>client.actions.select('aim')},
   {id:'guard',label:'Готовность',icon:icon('guard'),onClick:()=>client.actions.execute('guard')},
   {id:'rest',label:'Передышка',icon:icon('rest'),onClick:()=>client.actions.execute('rest')},
   {id:'bandage',label:'Перевязка',icon:icon('bandage'),onClick:()=>client.actions.execute('bandage')}
  ]);
 }
 client.store.subscribe(draw);draw();
}
start().catch(fatal);
