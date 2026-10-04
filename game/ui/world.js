import {WORLD_DATA} from '../data/world.js';
import {WorldSystem} from '../systems/world.js';
import {CENTRAL_LANDS} from '../data/regions/central-lands.js';
import {VELIGRAD} from '../data/locations/veligrad.js';

function el(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n}
const POI_KEY='eirdan.region-poi.v1';
const CLASSES={location:'Локация',district:'Район',place:'Место',transition:'Переход'};
const TYPES={location:'Локация',district:'Район',place:'Место',transition:'Переход'};
function loadPoi(regionId){
 try{
  const all=JSON.parse(localStorage.getItem(POI_KEY)||'{}');let local=all[regionId];
  if(Array.isArray(local)){
   if(regionId==='forest'){
    let changed=false;
    const migrated=local.map(p=>{
     const canonical=CENTRAL_LANDS.points.find(c=>(c.id===p.id)||(Math.abs(c.x-p.x)<0.0001&&Math.abs(c.y-p.y)<0.0001));
     if(canonical&&(/^(Город|Деревня|Крепость|Руины|Особая)$/.test(p.name)||String(p.id).startsWith('forest-'))){changed=true;return {...p,id:canonical.id,name:canonical.name,class:canonical.class,type:canonical.type}}
     if(canonical&&(!p.class||p.class!==canonical.class||p.type!==canonical.type||p.map!==canonical.map)){changed=true;return {...p,id:canonical.id,name:canonical.name,class:canonical.class,type:canonical.type,...(canonical.map?{map:canonical.map}:{})}}
     return p;
    });
    if(changed){all[regionId]=migrated;localStorage.setItem(POI_KEY,JSON.stringify(all))}
    return migrated;
   }
   return local;
  }
 }catch{}
 return regionId==='forest'?CENTRAL_LANDS.points.map(p=>({...p})):regionId==='location:veligrad'?VELIGRAD.points.map(p=>({...p})):[];
}
function savePoi(regionId,items){let all={};try{all=JSON.parse(localStorage.getItem(POI_KEY)||'{}')}catch{}all[regionId]=items;localStorage.setItem(POI_KEY,JSON.stringify(all))}
function slug(s){return String(s||'poi').toLowerCase().trim().replace(/[^a-zа-яё0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,48)||'poi'}
function downloadJson(filename,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0)}
function clampPin(pin,frame,item){requestAnimationFrame(()=>{const fr=frame.getBoundingClientRect(),pr=pin.getBoundingClientRect();let dx=0,dy=0;if(pr.left<fr.left)dx=fr.left-pr.left;if(pr.right>fr.right)dx=fr.right-pr.right;if(pr.top<fr.top)dy=fr.top-pr.top;if(pr.bottom>fr.bottom)dy=fr.bottom-pr.bottom;if(dx||dy){pin.style.transform='translate(calc(-50% + '+dx+'px),calc(-50% + '+dy+'px))'}else pin.style.transform='translate(-50%,-50%)'})}
function pointDescription(item){return item.description||({location:'Отдельная локация. Её можно посетить и исследовать.',district:'Район внутри текущей локации.',place:'Отдельное место на карте.',transition:'Переход к другой области карты.'}[item.class]||'Место на карте.')}
function actionPanel(item,state,onTravel,onFavorite){const box=el('section');box.className='map-point-card';const top=el('div');top.className='map-point-card-head';top.append(el('h3',item.name||CLASSES[item.class]||'Место'));const desc=el('p',pointDescription(item));const actions=el('div');actions.className='map-point-actions';const walk=el('button','Идти пешком');const horse=el('button','На лошади');const fav=el('button',WorldSystem.isFavorite(state,item)?'★ В избранном':'☆ В избранное');walk.onclick=()=>onTravel(item,'walk');horse.onclick=()=>onTravel(item,'horse');fav.onclick=()=>onFavorite(item,fav);actions.append(walk,horse,fav);box.append(top,desc,actions);if(item.class==='location'&&item.map){const enter=el('button','Открыть карту локации');enter.className='map-point-enter';enter.onclick=()=>onTravel(item,'enter');box.append(enter)}return box}

export const WorldUI={
 ready:true,
 mount(root,state,onChange){
  let pixels=null,mw=0,mh=0,indexToId={},regionCenters={};
  for(const [id,r] of Object.entries(WORLD_DATA.regions))indexToId[r.index]=id;
  const current=WorldSystem.ensure(state);
  if(current.regionId&&!WORLD_DATA.regions[current.regionId])current.regionId=null;
  let mode=current.locationId==='veligrad'?'location':(current.regionId==='forest'?'region':'world');
  let cleanup=()=>{};

  function renderWorld(){
   cleanup();root.replaceChildren();
   const statusText=()=>current.regionId?'Вы находитесь в регионе: '+WORLD_DATA.regions[current.regionId].name:'Выберите регион';
   const head=el('div');head.className='world-head';head.append(el('h2','Карта мира'));
   const status=el('p',statusText());status.className='world-region-status';head.append(status);root.append(head);
   const frame=el('div');frame.className='world-map-frame';
   const img=el('img');img.className='world-map-image';img.src=WORLD_DATA.map.asset;img.alt='Карта мира Эйрдан';frame.append(img);
   const shade=el('canvas');shade.className='world-region-shade';frame.append(shade);const regionLabel=el('div');regionLabel.className='world-selected-region';frame.append(regionLabel);root.append(frame);
   function draw(){regionLabel.textContent=current.regionId?WORLD_DATA.regions[current.regionId]?.name||'':'';const center=current.regionId?regionCenters[WORLD_DATA.regions[current.regionId]?.index]:null;if(center){regionLabel.style.left=(center.x/mw*100)+'%';regionLabel.style.top=(center.y/mh*100)+'%'}if(!pixels)return;shade.width=mw;shade.height=mh;const ctx=shade.getContext('2d'),out=ctx.createImageData(mw,mh);const selected=current.regionId?WORLD_DATA.regions[current.regionId]?.index:0;for(let p=0,i=0;p<pixels.length;p++,i+=4){const idx=pixels[p];if(idx>0&&idx!==selected){out.data[i+3]=92}}ctx.putImageData(out,0,0)}
   const mask=new Image();mask.onload=()=>{mw=mask.naturalWidth;mh=mask.naturalHeight;const c=document.createElement('canvas');c.width=mw;c.height=mh;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(mask,0,0);const d=x.getImageData(0,0,mw,mh).data;pixels=new Uint8Array(mw*mh);const sums={};for(let p=0,i=0;p<pixels.length;p++,i+=4){const idx=d[i];pixels[p]=idx;if(idx>0){const q=sums[idx]||(sums[idx]={x:0,y:0,n:0});q.x+=p%mw;q.y+=Math.floor(p/mw);q.n++}}regionCenters={};for(const [idx,q] of Object.entries(sums))regionCenters[idx]={x:q.x/q.n,y:q.y/q.n};draw()};mask.src=WORLD_DATA.map.mask;
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
   const actionHost=el('div');actionHost.className='map-point-action-host';root.append(actionHost);
   const panel=el('div');panel.className='region-editor hidden';
   const type=el('select');for(const [v,label] of Object.entries(CLASSES)){const o=el('option',label);o.value=v;type.append(o)}
   const name=el('input');name.placeholder='Название локации';
   const hint=el('p','Выберите тип и нажмите на карту. Метку можно перетаскивать.');hint.className='quiet';
   const exportBtn=el('button','Экспортировать JSON');
   const clearBtn=el('button','Сбросить к штатным');
   panel.append(type,name,hint,exportBtn,clearBtn);root.append(panel);
   let editing=false,items=loadPoi('forest'),drag=null,selected=current.placeId||current.districtId||current.locationId||null;

   function paint(){
    layer.replaceChildren();
    for(const item of items){
     const pin=el('button');pin.className='region-poi'+((editing||selected===item.id)?' expanded':'');pin.dataset.id=item.id;pin.dataset.type=item.type;pin.dataset.class=item.class||'place';pin.style.left=(item.x*100)+'%';pin.style.top=(item.y*100)+'%';pin.title=item.name||TYPES[item.type];if(WorldSystem.isFavorite(state,item))pin.classList.add('favorite');
     const dot=el('span',WorldSystem.isFavorite(state,item)?'★':'●');const label=el('span',item.name||TYPES[item.type]);pin.append(dot,label);layer.append(pin);clampPin(pin,frame,item);
     pin.onclick=e=>{e.stopPropagation();if(editing){if(confirm('Удалить «'+item.name+'»?')){items=items.filter(x=>x.id!==item.id);persist()}return}selected=item.id;paint();showActions(item)};
     pin.onpointerdown=e=>{if(!editing)return;e.preventDefault();e.stopPropagation();drag=item;pin.setPointerCapture?.(e.pointerId)};
     pin.onpointermove=e=>{if(!drag)return;const r=frame.getBoundingClientRect();drag.x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));drag.y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));pin.style.left=(drag.x*100)+'%';pin.style.top=(drag.y*100)+'%'};
     pin.onpointerup=e=>{if(!drag)return;drag=null;persist()};
    }
   }
   function persist(){savePoi('forest',items);paint()}
   function showActions(item){actionHost.replaceChildren(actionPanel(item,state,(p,method)=>{if(method==='enter'&&p.map){WorldSystem.enterMapPoint(state,p);onChange?.(state);mode='location';renderLocation(p);return}WorldSystem.enterMapPoint(state,p);onChange?.(state);actionHost.querySelector('p')?.insertAdjacentHTML('afterend','<p class="quiet">Маршрут выбран: '+(method==='horse'?'на лошади':'пешком')+'. Расчёт пути будет подключён позже.</p>')},(p,b)=>{const favorite=WorldSystem.toggleFavorite(state,p);b.textContent=favorite?'★ В избранном':'☆ В избранное';onChange?.(state);paint()}))}
   frame.onclick=e=>{if(e.target.closest('.region-poi'))return;if(!editing){selected=null;actionHost.replaceChildren();WorldSystem.clearMapPoint(state);onChange?.(state);paint();return}const r=frame.getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));const cls=type.value,label=name.value.trim()||CLASSES[cls];items.push({id:'forest-'+slug(label)+'-'+Date.now().toString(36),name:label,class:cls,type:cls,x:+x.toFixed(5),y:+y.toFixed(5)});name.value='';persist()};
   edit.onclick=()=>{editing=!editing;panel.classList.toggle('hidden',!editing);frame.classList.toggle('editing',editing);edit.textContent=editing?'Готово':'Редактор';paint()};
   back.onclick=()=>{mode='world';renderWorld()};
   exportBtn.onclick=()=>downloadJson('region-central-lands-poi.json',{region:'forest',map:region.map.asset,points:items});
   clearBtn.onclick=()=>{if(confirm('Сбросить локальные изменения и вернуть штатные метки Центральных земель?')){items=CENTRAL_LANDS.points.map(p=>({...p}));persist()}};
   paint();
   cleanup=()=>{frame.onclick=null;back.onclick=null;edit.onclick=null};
  }

  function renderLocation(location){
   cleanup();root.replaceChildren();
   const head=el('div');head.className='region-head';
   const back=el('button','← Регион');back.className='region-back';
   const title=el('div');title.append(el('h2',location.name),el('p','Карта локации'));
   const edit=el('button','Редактор');edit.className='region-edit-toggle';head.append(back,title,edit);root.append(head);
   const frame=el('div');frame.className='region-map-frame';
   const img=el('img');img.className='region-map-image';img.src=location.map;img.alt=location.name;frame.append(img);
   const layer=el('div');layer.className='region-poi-layer';frame.append(layer);root.append(frame);
   const actionHost=el('div');actionHost.className='map-point-action-host';root.append(actionHost);
   const panel=el('div');panel.className='region-editor hidden';
   const cls=el('select');for(const [v,label] of Object.entries({district:'Район',place:'Место',transition:'Переход'})){const o=el('option',label);o.value=v;cls.append(o)}
   const name=el('input');name.placeholder='Название';
   const hint=el('p','Расставьте районы, отдельные места и переходы. Поселения внутри города недоступны.');hint.className='quiet';
   const exportBtn=el('button','Экспортировать JSON');const clearBtn=el('button','Удалить все локальные метки');panel.append(cls,name,hint,exportBtn,clearBtn);root.append(panel);
   const key='location:'+location.id;let editing=false,items=loadPoi(key),selected=current.placeId||current.districtId||null,drag=null;
   if(location.id==='veligrad'&&!items.length)items=VELIGRAD.points.map(p=>({...p}));
   function persist(){savePoi(key,items);paint()}
   function showActions(item){actionHost.replaceChildren(actionPanel(item,state,(p,method)=>{WorldSystem.enterMapPoint(state,p);onChange?.(state);actionHost.querySelector('p')?.insertAdjacentHTML('afterend','<p class="quiet">Маршрут выбран: '+(method==='horse'?'на лошади':'пешком')+'. Расчёт пути будет подключён позже.</p>')},(p,b)=>{const favorite=WorldSystem.toggleFavorite(state,p);b.textContent=favorite?'★ В избранном':'☆ В избранное';onChange?.(state);paint()}))}
   function paint(){layer.replaceChildren();for(const item of items){const pin=el('button');pin.className='region-poi'+((editing||selected===item.id)?' expanded':'');pin.dataset.class=item.class;pin.style.left=(item.x*100)+'%';pin.style.top=(item.y*100)+'%';if(WorldSystem.isFavorite(state,item))pin.classList.add('favorite');pin.append(el('span',WorldSystem.isFavorite(state,item)?'★':'●'),el('span',item.name||CLASSES[item.class]||'Место'));layer.append(pin);clampPin(pin,frame,item);
    pin.onclick=e=>{e.stopPropagation();if(editing){if(confirm('Удалить «'+item.name+'»?')){items=items.filter(x=>x.id!==item.id);persist()}return}selected=item.id;paint();showActions(item)};
    pin.onpointerdown=e=>{if(!editing)return;e.preventDefault();e.stopPropagation();drag=item;pin.setPointerCapture?.(e.pointerId)};
    pin.onpointermove=e=>{if(!drag)return;const r=frame.getBoundingClientRect();drag.x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));drag.y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));pin.style.left=(drag.x*100)+'%';pin.style.top=(drag.y*100)+'%'};
    pin.onpointerup=()=>{if(drag){drag=null;persist()}}}}
   frame.onclick=e=>{if(e.target.closest('.region-poi'))return;if(!editing){selected=null;WorldSystem.clearMapPoint(state);onChange?.(state);paint();return}const r=frame.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height,c=cls.value,label=name.value.trim()||({district:'Район',place:'Место',transition:'Переход'}[c]);items.push({id:location.id+'-'+slug(label)+'-'+Date.now().toString(36),name:label,class:c,type:c,x:+x.toFixed(5),y:+y.toFixed(5)});name.value='';persist()};
   edit.onclick=()=>{editing=!editing;panel.classList.toggle('hidden',!editing);frame.classList.toggle('editing',editing);edit.textContent=editing?'Готово':'Редактор';paint()};
   back.onclick=()=>{current.locationId=null;current.districtId=null;current.placeId=null;onChange?.(state);mode='region';renderRegion()};
   exportBtn.onclick=()=>downloadJson('location-'+location.id+'-poi.json',{location:location.id,map:location.map,points:items});
   clearBtn.onclick=()=>{if(confirm('Удалить все локальные метки этой локации?')){items=[];persist()}};paint();
   cleanup=()=>{frame.onclick=null;back.onclick=null;edit.onclick=null};
  }

  if(mode==='location'){const location=CENTRAL_LANDS.points.find(p=>p.id===current.locationId&&p.map);if(location)renderLocation(location);else renderRegion()}else if(mode==='region')renderRegion();else renderWorld();
  return()=>cleanup();
 }
};
