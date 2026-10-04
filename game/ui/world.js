import {WORLD_DATA} from '../data/world.js';
import {WorldSystem} from '../systems/world.js';

function el(tag,text){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node}

export const WorldUI={
 ready:true,
 mount(root,state,onChange){
  function statusText(){const current=WorldSystem.ensure(state);return current.regionId&&WORLD_DATA.regions[current.regionId]?'Вы находитесь в регионе: '+WORLD_DATA.regions[current.regionId].name:'Выберите регион'}

  function renderSelection(){
   const current=WorldSystem.ensure(state).regionId;
   root.querySelectorAll('.world-zone').forEach(zone=>{const selected=zone.dataset.region===current;zone.classList.toggle('selected',selected);zone.setAttribute('aria-pressed',selected?'true':'false')});
   const status=root.querySelector('.world-region-status');if(status)status.textContent=statusText();
  }

  root.replaceChildren();
  const head=el('div');head.className='world-head';head.append(el('h2','Карта мира'));
  const status=el('p',statusText());status.className='world-region-status';head.append(status);root.append(head);
  const frame=el('div');frame.className='world-map-frame';
  const img=el('img');img.className='world-map-image';img.src=WORLD_DATA.map.asset;img.alt='Карта мира Эйрдан';frame.append(img);
  const layer=el('div');layer.className='world-zone-layer';
  for(const [id,region] of Object.entries(WORLD_DATA.regions)){
   const z=region.zone;if(!z)continue;const button=el('button',region.name);button.type='button';button.className='world-zone';button.dataset.region=id;button.setAttribute('aria-label',region.name);button.style.left=z.x+'%';button.style.top=z.y+'%';button.style.width=z.w+'%';button.style.height=z.h+'%';layer.append(button);
  }
  frame.append(layer);root.append(frame);renderSelection();

  root.onclick=e=>{const zone=e.target.closest('.world-zone');if(!zone)return;WorldSystem.enterRegion(state,zone.dataset.region);renderSelection();if(onChange)onChange(state)};
  return()=>{root.onclick=null};
 }
};
