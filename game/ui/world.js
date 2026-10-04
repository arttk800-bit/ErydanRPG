import {WORLD_DATA} from '../data/world.js';
import {WorldSystem} from '../systems/world.js';
import {CENTRAL_LANDS} from '../data/regions/central-lands.js';

function el(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n}
const POI_KEY='eirdan.region-poi.v1';
const TYPES={city:'Город',village:'Деревня',fort:'Крепость',ruin:'Руины',cave:'Пещера',camp:'Лагерь',special:'Особая',exit:'Переход'};
function loadPoi(regionId){try{const all=JSON.parse(localStorage.getItem(POI_KEY)||'{}');if(Array.isArray(all[regionId]))return all[regionId]}catch{}return regionId==='forest'?CENTRAL_LANDS.points.map(p=>({...p})):[]}
function savePoi(regionId,items){let all={};try{all=JSON.parse(localStorage.getItem(POI_KEY)||'{}')}catch{}all[regionId]=items;localStorage.setItem(POI_KEY,JSON.stringify(all))}
function slug(s){return String(s||'poi').toLowerCase().trim().replace(/[^a-zа-яё0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,48)||'poi'}

export const WorldUI={
 ready:true,
 mount(root,state,onChange){
  let pixels=null,mw=0,mh=0,indexToId={};
  for(const [id,r] of Object.entries(WORLD_DATA.regions))indexToId[r.index]=id;
  const current=WorldSystem.ensure(state);
  if(current.regionId&&!WORLD_DATA.regions[current.regionId])current.regionId=null;
  let mode=current.regionId==='forest'?'region':'world';
  let cleanup=()=>{};

  function renderWorld(){
   cleanup();root.replaceChildren();
   const statusText=()=>current.regionId?'Вы находитесь в регионе: '+WORLD_DATA.regions[current.regionId].name:'Выберите регион';
   const head=el('div');head.className='world-head';head.append(el('h2','Карта мира'));
   const status=el('p',statusText());status.className='world-region-status';head.append(status);root.append(head);
   const frame=el('div');frame.className='world-map-frame';
   const img=el('img');img.className='world-map-image';img.src=WORLD_DATA.map.asset;img.alt='Карта мира Эйрдан';frame.append(img);
   const shade=el('canvas');shade.className='world-region-shade';frame.append(shade);root.append(frame);
   function draw(){if(!pixels)return;shade.width=mw;shade.height=mh;const ctx=shade.getContext('2d'),out=ctx.createImageData(mw,mh);const selected=current.regionId?WORLD_DATA.regions[current.regionId]?.index:0;for(let p=0,i=0;p<pixels.length;p++,i+=4){const idx=pixels[p];if(idx>0&&idx!==selected){out.data[i+3]=92}}ctx.putImageData(out,0,0)}
   const mask=new Image();mask.onload=()=>{mw=mask.naturalWidth;mh=mask.naturalHeight;const c=document.createElement('canvas');c.width=mw;c.height=mh;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(mask,0,0);const d=x.getImageData(0,0,mw,mh).data;pixels=new Uint8Array(mw*mh);for(let p=0,i=0;p<pixels.length;p++,i+=4)pixels[p]=d[i];draw()};mask.src=WORLD_DATA.map.mask;
   frame.onclick=e=>{if(!pixels)return;const r=frame.getBoundingClientRect(),x=Math.max(0,Math.min(mw-1,Math.floor((e.clientX-r.left)/r.width*mw))),y=Math.max(0,Math.min(mh-1,Math.floor((e.clientY-r.top)/r.height*mh))),id=indexToId[pixels[y*mw+x]];if(!id)return;WorldSystem.enterRegion(state,id);status.textContent=statusText();draw();onChange?.(state);if(id==='forest'){mode='region';renderRegion()}};
   cleanup=()=>{frame.onclick=null};
  }

  function renderRegion(){
   cleanup();root.replaceChildren();
   const region=WORLD_DATA.regions.forest;
   const head=el('div');head.className='region-head';
   const back=el('button','← Мир');back.className='region-back';
   const title=el('div');title.append(el('h2',region.name),el('p','Карта региона'));
   const edit=el('button','Редактор');edit.className='region-edit-toggle';
   head.append(back,title,edit);root.append(head);
   const frame=el('div');frame.className='region-map-frame';
   const img=el('img');img.className='region-map-image';img.src=region.map.asset;img.alt=region.name;frame.append(img);
   const layer=el('div');layer.className='region-poi-layer';frame.append(layer);root.append(frame);
   const panel=el('div');panel.className='region-editor hidden';
   const type=el('select');for(const [v,label] of Object.entries(TYPES)){const o=el('option',label);o.value=v;type.append(o)}
   const name=el('input');name.placeholder='Название локации';
   const hint=el('p','Выберите тип и нажмите на карту. Метку можно перетаскивать.');hint.className='quiet';
   const exportBtn=el('button','Экспортировать JSON');
   const clearBtn=el('button','Сбросить к штатным');
   panel.append(type,name,hint,exportBtn,clearBtn);root.append(panel);
   let editing=false,items=loadPoi('forest'),drag=null;

   function paint(){
    layer.replaceChildren();
    for(const item of items){
     const pin=el('button');pin.className='region-poi';pin.dataset.id=item.id;pin.dataset.type=item.type;pin.style.left=(item.x*100)+'%';pin.style.top=(item.y*100)+'%';pin.title=item.name||TYPES[item.type];
     const dot=el('span','●');const label=el('span',item.name||TYPES[item.type]);pin.append(dot,label);layer.append(pin);
     pin.onclick=e=>{e.stopPropagation();if(!editing)return;if(confirm('Удалить «'+(item.name||TYPES[item.type])+'»?')){items=items.filter(x=>x.id!==item.id);persist()}};
     pin.onpointerdown=e=>{if(!editing)return;e.preventDefault();e.stopPropagation();drag=item;pin.setPointerCapture?.(e.pointerId)};
     pin.onpointermove=e=>{if(!drag)return;const r=frame.getBoundingClientRect();drag.x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));drag.y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));pin.style.left=(drag.x*100)+'%';pin.style.top=(drag.y*100)+'%'};
     pin.onpointerup=e=>{if(!drag)return;drag=null;persist()};
    }
   }
   function persist(){savePoi('forest',items);paint()}
   frame.onclick=e=>{if(!editing||e.target.closest('.region-poi'))return;const r=frame.getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));const label=name.value.trim()||TYPES[type.value];items.push({id:'forest-'+slug(label)+'-'+Date.now().toString(36),name:label,type:type.value,x:+x.toFixed(5),y:+y.toFixed(5)});name.value='';persist()};
   edit.onclick=()=>{editing=!editing;panel.classList.toggle('hidden',!editing);frame.classList.toggle('editing',editing);edit.textContent=editing?'Готово':'Редактор'};
   back.onclick=()=>{mode='world';renderWorld()};
   exportBtn.onclick=async()=>{const data=JSON.stringify({region:'forest',map:region.map.asset,points:items},null,2);try{await navigator.clipboard.writeText(data);exportBtn.textContent='JSON скопирован'}catch{const blob=new Blob([data],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='region-central-lands-poi.json';a.click();URL.revokeObjectURL(a.href)}};
   clearBtn.onclick=()=>{if(confirm('Сбросить локальные изменения и вернуть штатные метки Центральных земель?')){items=CENTRAL_LANDS.points.map(p=>({...p}));persist()}};
   paint();
   cleanup=()=>{frame.onclick=null;back.onclick=null;edit.onclick=null};
  }

  if(mode==='region')renderRegion();else renderWorld();
  return()=>cleanup();
 }
};
