import {WORLD_DATA} from '../data/world.js';
import {WorldSystem} from '../systems/world.js';

function el(tag,text){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node}

export const WorldUI={
 ready:true,
 mount(root,state,onChange){
  function draw(){
   root.replaceChildren();
   const current=WorldSystem.ensure(state);
   const head=el('div');head.className='world-head';
   head.append(el('h2','Карта мира'));
   const status=el('p',current.regionId&&WORLD_DATA.regions[current.regionId]?'Вы находитесь в регионе: '+WORLD_DATA.regions[current.regionId].name:'Выберите регион');
   status.className='world-region-status';head.append(status);root.append(head);

   const frame=el('div');frame.className='world-map-frame';
   const img=el('img');img.className='world-map-image';img.src='../assets/eirdan-world-map.jpg';img.alt='Карта мира Эйрдан';
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 1152 1536');svg.classList.add('world-region-overlay');
   for(const [id,region] of Object.entries(WORLD_DATA.regions)){
    const poly=document.createElementNS('http://www.w3.org/2000/svg','polygon');
    poly.setAttribute('points',region.polygon);poly.dataset.regionId=id;poly.setAttribute('aria-label',region.name);
    if(current.regionId===id)poly.classList.add('selected');svg.append(poly);
   }
   frame.append(img,svg);root.append(frame);
  }
  root.onclick=e=>{
   const p=e.target.closest('[data-region-id]');if(!p)return;
   WorldSystem.enterRegion(state,p.dataset.regionId);draw();if(onChange)onChange(state);
  };
  draw();return()=>{root.onclick=null};
 }
};
