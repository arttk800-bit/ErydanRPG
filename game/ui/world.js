import {WORLD_DATA} from '../data/world.js';
import {WorldSystem} from '../systems/world.js';

function el(tag,text){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node}
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src})}

export const WorldUI={
 ready:true,
 mount(root,state,onChange){
  let disposed=false,maskPixels=null,maskWidth=0,maskHeight=0,shadeCanvas=null;
  const indexToId=new Map(Object.entries(WORLD_DATA.regions).map(([id,r])=>[r.index,id]));

  function drawShade(){
   if(!shadeCanvas||!maskPixels)return;
   const ctx=shadeCanvas.getContext('2d'),out=ctx.createImageData(maskWidth,maskHeight),current=WorldSystem.ensure(state).regionId;
   for(let i=0;i<maskPixels.length;i+=4){
    const index=maskPixels[i],id=indexToId.get(index);if(!id)continue;
    const status=WorldSystem.regionStatus(state,id),alpha=id===current?0:status==='unknown'?205:72;
    out.data[i]=0;out.data[i+1]=0;out.data[i+2]=0;out.data[i+3]=alpha;
   }
   ctx.putImageData(out,0,0);
  }

  function statusText(){
   const current=WorldSystem.ensure(state);
   return current.regionId&&WORLD_DATA.regions[current.regionId]?'Вы находитесь в регионе: '+WORLD_DATA.regions[current.regionId].name:'Выберите регион';
  }

  async function draw(){
   root.replaceChildren();
   const head=el('div');head.className='world-head';head.append(el('h2','Карта мира'));
   const status=el('p',statusText());status.className='world-region-status';head.append(status);root.append(head);
   const frame=el('div');frame.className='world-map-frame';
   const img=el('img');img.className='world-map-image';img.src=WORLD_DATA.map.asset;img.alt='Карта мира Эйрдан';
   shadeCanvas=el('canvas');shadeCanvas.className='world-region-shade';shadeCanvas.width=WORLD_DATA.map.width;shadeCanvas.height=WORLD_DATA.map.height;
   frame.append(img,shadeCanvas);root.append(frame);
   try{
    const mask=await loadImage(WORLD_DATA.map.mask);if(disposed)return;
    const c=document.createElement('canvas');c.width=mask.naturalWidth;c.height=mask.naturalHeight;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(mask,0,0);
    const data=ctx.getImageData(0,0,c.width,c.height);maskPixels=data.data;maskWidth=c.width;maskHeight=c.height;
    if(shadeCanvas.width!==maskWidth||shadeCanvas.height!==maskHeight){shadeCanvas.width=maskWidth;shadeCanvas.height=maskHeight}
    drawShade();
   }catch(err){console.error('World region mask failed',err)}
  }

  root.onclick=e=>{
   const frame=e.target.closest('.world-map-frame');if(!frame||!maskPixels)return;
   const rect=frame.getBoundingClientRect(),x=Math.max(0,Math.min(maskWidth-1,Math.floor((e.clientX-rect.left)/rect.width*maskWidth))),y=Math.max(0,Math.min(maskHeight-1,Math.floor((e.clientY-rect.top)/rect.height*maskHeight)));
   const index=maskPixels[(y*maskWidth+x)*4],id=indexToId.get(index);if(!id)return;
   WorldSystem.enterRegion(state,id);const s=root.querySelector('.world-region-status');if(s)s.textContent=statusText();drawShade();if(onChange)onChange(state);
  };
  draw();return()=>{disposed=true;root.onclick=null};
 }
};
