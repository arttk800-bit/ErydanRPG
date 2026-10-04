import {WORLD_DATA} from '../data/world.js';
import {WorldSystem} from '../systems/world.js';

function el(tag,text){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node}

export const WorldUI={
 ready:true,
 mount(root,state,onChange){
  let pixels=null,mw=0,mh=0,indexToId={};
  for(const [id,r] of Object.entries(WORLD_DATA.regions))indexToId[r.index]=id;
  const current=WorldSystem.ensure(state);
  if(current.regionId&&!WORLD_DATA.regions[current.regionId])current.regionId=null;

  const statusText=()=>current.regionId?'Вы находитесь в регионе: '+WORLD_DATA.regions[current.regionId].name:'Выберите регион';
  root.replaceChildren();
  const head=el('div');head.className='world-head';head.append(el('h2','Карта мира'));
  const status=el('p',statusText());status.className='world-region-status';head.append(status);root.append(head);
  const frame=el('div');frame.className='world-map-frame';
  const img=el('img');img.className='world-map-image';img.src=WORLD_DATA.map.asset;img.alt='Карта мира Эйрдан';frame.append(img);
  const shade=el('canvas');shade.className='world-region-shade';frame.append(shade);root.append(frame);

  function draw(){
   if(!pixels)return;shade.width=mw;shade.height=mh;
   const ctx=shade.getContext('2d'),out=ctx.createImageData(mw,mh);
   const selected=current.regionId?WORLD_DATA.regions[current.regionId]?.index:0;
   for(let p=0,i=0;p<pixels.length;p++,i+=4){const idx=pixels[p];if(idx>0&&idx!==selected){out.data[i]=0;out.data[i+1]=0;out.data[i+2]=0;out.data[i+3]=92}}
   ctx.putImageData(out,0,0);
  }
  const mask=new Image();mask.onload=()=>{mw=mask.naturalWidth;mh=mask.naturalHeight;const c=document.createElement('canvas');c.width=mw;c.height=mh;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(mask,0,0);const d=x.getImageData(0,0,mw,mh).data;pixels=new Uint8Array(mw*mh);for(let p=0,i=0;p<pixels.length;p++,i+=4)pixels[p]=d[i];draw()};mask.src=WORLD_DATA.map.mask;

  frame.onclick=e=>{if(!pixels)return;const r=frame.getBoundingClientRect(),x=Math.max(0,Math.min(mw-1,Math.floor((e.clientX-r.left)/r.width*mw))),y=Math.max(0,Math.min(mh-1,Math.floor((e.clientY-r.top)/r.height*mh))),id=indexToId[pixels[y*mw+x]];if(!id)return;WorldSystem.enterRegion(state,id);status.textContent=statusText();draw();if(onChange)onChange(state)};
  return()=>{frame.onclick=null};
 }
};
