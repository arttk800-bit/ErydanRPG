import {WORLD_DATA} from '../data/world.js';
import {WorldSystem} from '../systems/world.js';

function el(tag,text){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node}
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src})}

export const WorldUI={
 ready:true,
 mount(root,state,onChange){
  let disposed=false,maskPixels=null,maskWidth=0,maskHeight=0,shadeCanvas=null,indexPixels=null;
  const indexToId=new Map(Object.entries(WORLD_DATA.regions).map(([id,r])=>[r.index,id]));

  function drawShade(){
   if(!shadeCanvas||!maskPixels)return;
   const ctx=shadeCanvas.getContext('2d'),out=ctx.createImageData(maskWidth,maskHeight),current=WorldSystem.ensure(state).regionId;
   for(let i=0;i<maskPixels.length;i+=4){
    const p=i/4,index=indexPixels[p],id=indexToId.get(index);if(!id)continue;
    const status=WorldSystem.regionStatus(state,id),alpha=id===current?0:status==='unknown'?220:118;
    out.data[i]=0;out.data[i+1]=0;out.data[i+2]=0;out.data[i+3]=alpha;
    if(id===current){const x=p%maskWidth,y=Math.floor(p/maskWidth);let edge=false;for(let dy=-2;dy<=2&&!edge;dy++)for(let dx=-2;dx<=2;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=maskWidth||ny>=maskHeight||indexPixels[ny*maskWidth+nx]!==index){edge=true;break}}if(edge){out.data[i]=18;out.data[i+1]=12;out.data[i+2]=7;out.data[i+3]=235}}
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
    const data=ctx.getImageData(0,0,c.width,c.height);maskPixels=data.data;maskWidth=c.width;maskHeight=c.height;indexPixels=new Uint8Array(maskWidth*maskHeight);for(let p=0,i=0;p<indexPixels.length;p++,i+=4){const r=maskPixels[i],g=maskPixels[i+1],b=maskPixels[i+2],a=maskPixels[i+3];indexPixels[p]=a===0?0:(r===g&&g===b?r:Math.round((r+g+b)/3))}
    if(shadeCanvas.width!==maskWidth||shadeCanvas.height!==maskHeight){shadeCanvas.width=maskWidth;shadeCanvas.height=maskHeight}
    drawShade();
   }catch(err){console.error('World region mask failed',err)}
  }

  root.onclick=e=>{
   const frame=e.target.closest('.world-map-frame');if(!frame||!maskPixels)return;
   const rect=frame.getBoundingClientRect(),x=Math.max(0,Math.min(maskWidth-1,Math.floor((e.clientX-rect.left)/rect.width*maskWidth))),y=Math.max(0,Math.min(maskHeight-1,Math.floor((e.clientY-rect.top)/rect.height*maskHeight)));
   const index=indexPixels[y*maskWidth+x],id=indexToId.get(index);if(!id)return;
   WorldSystem.enterRegion(state,id);const s=root.querySelector('.world-region-status');if(s)s.textContent=statusText();drawShade();if(onChange)onChange(state);
  };
  draw();return()=>{disposed=true;root.onclick=null};
 }
};
