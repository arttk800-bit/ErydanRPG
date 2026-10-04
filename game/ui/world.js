import {WORLD_DATA} from '../data/world.js';
import {WorldSystem} from '../systems/world.js';

function el(tag,text){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node}
function action(label,type,id){const b=el('button',label);b.dataset.worldAction=type;if(id)b.dataset.worldId=id;return b}

export const WorldUI={
 ready:true,
 mount(root,state,onChange){
  function draw(){
   root.replaceChildren();
   const current=WorldSystem.ensure(state);
   const head=el('div');head.className='world-head';
   head.append(el('h2',current.cityId?WORLD_DATA.cities[current.cityId].name:'Карта мира'),el('p',WorldSystem.clockLabel(state)));
   root.append(head);
   const grid=el('div');grid.className='world-grid';
   if(current.cityId){
    const city=WORLD_DATA.cities[current.cityId];
    for(const id of Object.keys(city.places))grid.append(action(city.places[id].name,'city-place',id));
    root.append(grid,action('← На карту мира','leave-city'));
    if(current.cityPlaceId){
     const place=city.places[current.cityPlaceId],info=el('div');info.className='world-info';
     info.append(el('h3',place.name),el('p',place.desc));root.append(info);
    }
   }else{
    for(const id of Object.keys(WORLD_DATA.places)){const p=WORLD_DATA.places[id];grid.append(action(p.icon+' '+p.name,'place',id))}
    root.append(grid);
   }
  }
  root.onclick=e=>{
   const b=e.target.closest('[data-world-action]');if(!b)return;
   const type=b.dataset.worldAction,id=b.dataset.worldId;
   if(type==='place')WorldSystem.enterPlace(state,id);
   if(type==='city-place')WorldSystem.enterCityPlace(state,id);
   if(type==='leave-city'){const w=WorldSystem.ensure(state);w.cityId=null;w.cityPlaceId=null}
   draw();if(onChange)onChange(state);
  };
  draw();
  return()=>{root.onclick=null};
 }
};
