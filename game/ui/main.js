import {GameState} from '../core/game-state.js';
import {createUnit} from '../data/unit-factory.js';
import {createClient} from '../client/bootstrap.js';
import {renderBattlefield} from './battlefield.js';
import {renderHud} from './hud.js';
import {icon} from './icons.js';
import {combatMove} from '../combat/movement-action.js';

const board=document.querySelector('#board'),hud=document.querySelector('#hud'),turn=document.querySelector('#turn');

function fatal(err){
 console.error(err);
 if(turn)turn.textContent='Ошибка запуска';
 if(board){board.className='startup-error';board.textContent=String(err?.stack||err);}
}

async function start(){
 const weapons={
 sword:{name:'Меч',type:'melee',range:1,ap:3,acc:8,dmg:[10,16]},
 axe:{name:'Топор',type:'melee',range:1,ap:3,acc:3,dmg:[12,18]},
 dagger:{name:'Кинжал',type:'melee',range:1,ap:2,acc:12,dmg:[7,11]},
 bow:{name:'Лук',type:'bow',range:6,ap:4,acc:5,dmg:[8,13]},
 crossbow:{name:'Арбалет',type:'bow',range:7,ap:4,acc:10,dmg:[12,18]},
 staff:{name:'Посох',type:'melee',range:1,ap:3,acc:0,dmg:[6,10]},
 greataxe:{name:'Секира',type:'melee',range:1,ap:4,acc:0,dmg:[15,22]}
 };
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
  renderBattlefield(board,state,{onHex:p=>{if(!u||u.team!=='ally')return;const res=combatMove(state,u,p.q,p.r,weapons);if(res.ok)client.store.emit?.();else draw();},onUnit:t=>{if(u&&t.team!==u.team)client.actions.target(t);}});
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
