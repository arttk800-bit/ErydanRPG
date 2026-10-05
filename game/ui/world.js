import {WORLD_DATA} from '../data/world.js';
import {WorldSystem} from '../systems/world/world.js';
import {CENTRAL_LANDS} from '../data/regions/central-lands.js';
import {VELIGRAD} from '../data/locations/veligrad.js';
import {CENTRAL_LANDS_ROADS} from '../data/regions/central-lands-roads.js';
import {TravelSystem} from '../systems/travel/travel.js';
import {RoadEditor,loadEditableRoads} from '../tools/map-editor/road-editor.js';
import {TerrainEditor} from '../tools/map-editor/terrain-editor.js';
import {loadTerrainZones} from '../tools/map-editor/terrain-store.js';
import {mapMetrics} from '../data/map-metrics.js';
import {mapPoint} from './map-gestures.js';
import {GameSpeedSystem} from '../systems/game-speed.js';

function el(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n}
function choiceMenu(options,initial=options[0]?.[0]){const box=el('details');box.className='map-choice';const summary=el('summary');const menu=el('div');menu.className='map-choice-menu';let value=initial;const label=()=>options.find(([v])=>v===value)?.[1]||value;summary.textContent=label();for(const [v,l] of options){const b=el('button',l);b.type='button';b.onclick=e=>{e.preventDefault();e.stopPropagation();value=v;summary.textContent=label();box.open=false;box.onchange?.({target:box})};menu.append(b)}box.append(summary,menu);Object.defineProperty(box,'value',{get:()=>value,set:v=>{value=v;summary.textContent=label()}});return box}
const POI_KEY='eirdan.region-poi.v1';
const CLASSES={location:'Локация',district:'Район',place:'Место',transition:'Переход'};
const TYPES={city:'Город',village:'Поселение',fort:'Крепость',tower:'Башня',ruins:'Руины',mountain_pass:'Перевал',marsh:'Топи',landmark:'Ориентир',location:'Локация',district:'Район',place:'Место',transition:'Переход'};
const TYPE_ICONS={city:'♜',village:'⌂',fort:'◆',tower:'▲',ruins:'✦',mountain_pass:'⌃',marsh:'≈',landmark:'◇',location:'○',district:'▦',place:'●',transition:'⇢'};
function pointIcon(item){return TYPE_ICONS[item.type]||TYPE_ICONS[item.class]||'●'}
function pointTypeLabel(item){return TYPES[item.type]||TYPES[item.class]||'Место'}
function legendFor(items,state,editing){const visible=items.filter(p=>editing||WorldSystem.isDiscovered(state,p));const types=[...new Set(visible.map(p=>p.type||p.class))];const box=el('details');box.className='map-legend';box.onclick=e=>e.stopPropagation();box.onpointerdown=e=>e.stopPropagation();const sum=el('summary','Легенда');box.append(sum);const body=el('div');body.className='map-legend-items';for(const t of types){const sample=visible.find(p=>(p.type||p.class)===t);const row=el('div');row.append(el('span',pointIcon(sample)),el('span',pointTypeLabel(sample)));body.append(row)}box.append(body);return box}
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
function readStored(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return{}}}
function mapBundle(mapId,{kind,id,map,points,fallbackRoads={nodes:[],edges:[],access:{}},fallbackTerrain=[]}){const roads=loadEditableRoads(mapId,fallbackRoads),terrain=loadTerrainZones(kind==='region'?'region:'+mapId:mapId,fallbackTerrain);return{kind,id,map,points,roads,terrain}}
function exportAllMaps(){
 const stored=readStored(POI_KEY),maps={...stored};
 if(!Array.isArray(maps.forest))maps.forest=CENTRAL_LANDS.points.map(p=>({...p}));
 if(!Array.isArray(maps['location:veligrad']))maps['location:veligrad']=VELIGRAD.points.map(p=>({...p}));
 const ids=new Set([...Object.keys(maps),...Object.keys(readStored('eirdan.region-roads.v1')),...Object.keys(readStored('eirdan.map-terrain.v1')),'forest','location:veligrad']);
 return {format:'eirdan-map-editor',version:2,exportedAt:new Date().toISOString(),maps:Object.fromEntries([...ids].map(key=>{const isForest=key==='forest',isVeligrad=key==='location:veligrad',points=maps[key]||(isForest?CENTRAL_LANDS.points:isVeligrad?VELIGRAD.points:[]),kind=key.startsWith('location:')?'location':'region',id=key.replace(/^location:/,''),map=isForest?CENTRAL_LANDS.map.asset:isVeligrad?VELIGRAD.map:null,fallbackRoads=isForest?CENTRAL_LANDS_ROADS:{nodes:[],edges:[],access:{}};return[key,mapBundle(key,{kind,id,map,points,fallbackRoads})]}))};
}
function exportAllButton(){const b=el('button','Экспорт всех карт');b.onclick=()=>downloadJson('eirdan-map-editor-all.json',exportAllMaps());return b}
function clampPin(pin){pin.style.transform='translate(-50%,-50%)'}
function pointDescription(item){return item.description||({location:'Отдельная локация. Её можно посетить и исследовать.',district:'Район внутри текущей локации.',place:'Отдельное место на карте.',transition:'Переход к другой области карты.'}[item.class]||'Место на карте.')}
function actionPanel(item,state,onTravel,onFavorite){const box=el('section');box.className='map-point-card';const top=el('div');top.className='map-point-card-head';top.append(el('h3',item.name||CLASSES[item.class]||'Место'));const desc=el('p',pointDescription(item));const actions=el('div');actions.className='map-point-actions';const walk=el('button','Идти пешком');const horse=el('button','На лошади');const fav=el('button',WorldSystem.isFavorite(state,item)?'★ В избранном':'☆ В избранное');const travelLocked=['travelling','event','stopped','camp'].includes(state.world?.travel?.status);walk.disabled=travelLocked;horse.disabled=travelLocked;walk.onclick=()=>onTravel(item,'walk');horse.onclick=()=>onTravel(item,'horse');fav.onclick=()=>onFavorite(item,fav);actions.append(walk,horse,fav);box.append(top,desc,actions);if(item.class==='location'&&item.map){const enter=el('button','Открыть карту локации');enter.className='map-point-enter';enter.onclick=()=>onTravel(item,'enter');box.append(enter)}return box}

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
   const head=el('div');head.className='world-head';const fogToggle=el('button','Туман: вкл');fogToggle.className='world-fog-toggle';head.append(el('h2','Карта мира'),fogToggle);let fogEnabled=true;
   const status=el('p',statusText());status.className='world-region-status';head.append(status);root.append(head);
   const frame=el('div');frame.className='world-map-frame';
   const img=el('img');img.className='world-map-image';img.src=WORLD_DATA.map.asset;img.alt='Карта мира Эйрдан';frame.append(img);
   const shade=el('canvas');shade.className='world-region-shade';frame.append(shade);const regionLabel=el('div');regionLabel.className='world-selected-region';frame.append(regionLabel);root.append(frame);
   function draw(){regionLabel.textContent=current.regionId?WORLD_DATA.regions[current.regionId]?.name||'':'';const center=current.regionId?regionCenters[WORLD_DATA.regions[current.regionId]?.index]:null;if(center){regionLabel.style.left=(center.x/mw*100)+'%';regionLabel.style.top=(center.y/mh*100)+'%'}if(!pixels)return;shade.width=mw;shade.height=mh;const ctx=shade.getContext('2d'),out=ctx.createImageData(mw,mh);const selected=current.regionId?WORLD_DATA.regions[current.regionId]?.index:0;for(let p=0,i=0;p<pixels.length;p++,i+=4){const idx=pixels[p],id=indexToId[idx];if(fogEnabled&&idx>0&&idx!==selected&&!WorldSystem.isRegionAvailable(state,id)){out.data[i]=18;out.data[i+1]=24;out.data[i+2]=23;out.data[i+3]=218}else if(idx>0&&idx!==selected){out.data[i+3]=58}}ctx.putImageData(out,0,0)}
   const mask=new Image();mask.onload=()=>{mw=mask.naturalWidth;mh=mask.naturalHeight;const c=document.createElement('canvas');c.width=mw;c.height=mh;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(mask,0,0);const d=x.getImageData(0,0,mw,mh).data;pixels=new Uint8Array(mw*mh);const sums={};for(let p=0,i=0;p<pixels.length;p++,i+=4){const idx=d[i];pixels[p]=idx;if(idx>0){const q=sums[idx]||(sums[idx]={x:0,y:0,n:0});q.x+=p%mw;q.y+=Math.floor(p/mw);q.n++}}regionCenters={};for(const [idx,q] of Object.entries(sums))regionCenters[idx]={x:q.x/q.n,y:q.y/q.n};draw()};mask.src=WORLD_DATA.map.mask;
   fogToggle.onclick=()=>{fogEnabled=!fogEnabled;fogToggle.textContent='Туман: '+(fogEnabled?'вкл':'выкл');draw()};frame.onclick=e=>{if(!pixels)return;const r=frame.getBoundingClientRect(),x=Math.max(0,Math.min(mw-1,Math.floor((e.clientX-r.left)/r.width*mw))),y=Math.max(0,Math.min(mh-1,Math.floor((e.clientY-r.top)/r.height*mh))),id=indexToId[pixels[y*mw+x]];if(!id||!WorldSystem.isRegionAvailable(state,id))return;WorldSystem.enterRegion(state,id);status.textContent=statusText();draw();onChange?.(state);if(id==='forest'){mode='region';renderRegion()}};
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
   const layer=el('div');layer.className='region-poi-layer';frame.append(layer);
   const party=el('div');party.className='party-marker';party.title='Ваш отряд';frame.append(party);root.append(frame);
   const actionHost=el('div');actionHost.className='map-point-action-host';root.append(actionHost);
   let editing=false,items=loadPoi('forest'),roads=loadEditableRoads('forest',CENTRAL_LANDS_ROADS),terrainZones=loadTerrainZones('region:forest',[]);roads.metrics={...mapMetrics('region','forest')};roads.regionId='forest';let roadEditor=null,terrainEditor=null,editorMode='poi',editorLabels=false,drag=null,selected=current.placeId||current.districtId||current.locationId||null,travelTimer=null,lastTravelAt=0;const legendHost=el('div');legendHost.className='map-legend-host';frame.append(legendHost);
   const panel=el('div');panel.className='region-editor hidden';
   const type=choiceMenu([['location-map','Локация с картой'],['location','Локация без карты'],['place','Конечное место']],'location-map')
   const name=el('input');name.placeholder='Название локации';
   const hint=el('p','Выберите функциональный класс и нажмите на карту. Конкретный тип и иконка задаются отдельно данными карты. Метку можно перетаскивать.');hint.className='quiet';
   const modeSelect=choiceMenu([['poi','Метки'],['road','Дороги'],['terrain','Местность']],'poi')
   const terrainType=choiceMenu([['forest','Лес'],['swamp','Болото'],['mountain','Горы'],['water','Глубокая вода'],['blocked','Непроходимая область']],'forest');const finishTerrain=el('button','Замкнуть полигон'),undoTerrain=el('button','Удалить последнюю точку'),cancelTerrain=el('button','Отменить вершины'),terrainSelection=el('p','Зона не выбрана'),deleteTerrain=el('button','Удалить выбранную зону'),clearTerrain=el('button','Удалить все зоны');terrainSelection.className='quiet';deleteTerrain.disabled=true;const roadType=choiceMenu([['trail','Тропа'],['road','Дорога'],['highway','Тракт'],['rough','Бездорожье']],'road')
   const toggleLabels=el('button','Развернуть названия');const clearRoads=el('button','Удалить все узлы');const clearOptionalPoi=el('button','Удалить обычные метки');const bindRoadPoi=el('button','Привязать узел к метке');bindRoadPoi.disabled=true;
   const exportBtn=el('button','Экспорт меток');const roadExport=el('button','Экспорт дорог');const terrainExport=el('button','Экспорт местности');const mapExport=el('button','Экспорт карты целиком');const roadSelection=el('p','Ничего не выбрано');roadSelection.className='quiet';const deleteRoadNode=el('button','Удалить узел');const deleteRoadEdge=el('button','Удалить участок');const clearRoadSelection=el('button','Снять выбор');deleteRoadNode.disabled=true;deleteRoadEdge.disabled=true;
   const clearBtn=el('button','Сбросить к штатным');
   panel.append(modeSelect,type,name,roadType,terrainType,finishTerrain,undoTerrain,cancelTerrain,terrainSelection,deleteTerrain,clearTerrain,toggleLabels,hint,roadSelection,deleteRoadNode,deleteRoadEdge,clearRoadSelection,bindRoadPoi,clearRoads,clearOptionalPoi,exportBtn,roadExport,terrainExport,mapExport,exportAllButton(),clearBtn);root.append(panel);roadEditor=new RoadEditor({frame,regionId:'forest',roads,getPois:()=>items,onChange:r=>{roads=r},onSelection:s=>{deleteRoadNode.disabled=!s.nodeId;deleteRoadEdge.disabled=!s.edge;bindRoadPoi.disabled=!s.nodeId;const np=s.node?roadEditor?.nearestPoi(s.node.x,s.node.y,.08):null;bindRoadPoi.textContent=np?'Привязать к «'+np.name+'»':'Привязать узел к метке';roadSelection.textContent=s.nodeId?'Выбран узел: '+s.nodeId:s.edge?'Выбран участок: '+s.edge[0]+' → '+s.edge[1]:'Ничего не выбрано'}});terrainEditor=new TerrainEditor({frame,mapId:'region:forest',zones:terrainZones,onChange:z=>{terrainZones=z},onSelection:z=>{terrainSelection.textContent=z?'Выбрана зона: '+z.type+' · '+z.id:'Зона не выбрана';deleteTerrain.disabled=!z}});finishTerrain.onclick=()=>terrainEditor.finish();undoTerrain.onclick=()=>terrainEditor.undoLastPoint();cancelTerrain.onclick=()=>terrainEditor.cancelDraft();deleteTerrain.onclick=()=>terrainEditor.removeSelected();clearTerrain.onclick=()=>{if(confirm('Удалить все зоны местности региона?'))terrainEditor.clear()};terrainType.onchange=()=>terrainEditor.setType(terrainType.value);terrainEditor.setType(terrainType.value);deleteRoadNode.onclick=()=>roadEditor.removeSelectedNode();deleteRoadEdge.onclick=()=>roadEditor.removeSelectedEdge();clearRoadSelection.onclick=()=>roadEditor.clearSelection();toggleLabels.onclick=()=>{editorLabels=!editorLabels;toggleLabels.textContent=editorLabels?'Свернуть названия':'Развернуть названия';paint()};clearRoads.onclick=()=>{if(confirm('Удалить ВСЕ дорожные узлы и участки региона?'))roadEditor.clearAll()};clearOptionalPoi.onclick=()=>{if(confirm('Удалить все обычные метки, сохранив функциональные точки и локации с картами?')){items=items.filter(p=>p.map||p.class==='transition'||p.type==='transition');persist()}};bindRoadPoi.onclick=()=>{const sel=roadEditor.selection().node;if(!sel)return;const p=roadEditor.nearestPoi(sel.x,sel.y,.08);if(!p){alert('Рядом с выбранным узлом нет метки.');return}if(confirm('Привязать выбранный узел к месту «'+p.name+'»?'))roadEditor.bindPoi(p.id,sel.id)};
   

   function partyPoint(){const t=TravelSystem.ensure(state);if(t.regionId==='forest'&&t.position&&['travelling','event','stopped','camp'].includes(t.status))return t.position;if(state.world?.position?.position)return state.world.position.position;const id=state.world?.position?.pointId||current.locationId||current.placeId||'veligrad';return items.find(p=>p.id===id)||CENTRAL_LANDS.points.find(p=>p.id===id)||CENTRAL_LANDS.points.find(p=>p.id==='veligrad')}
   function paintParty(){const p=partyPoint();party.classList.toggle('hidden',!p);if(p){party.style.left=(p.x*100)+'%';party.style.top=(p.y*100)+'%'}for(const pin of layer.querySelectorAll('.region-poi')){const item=items.find(x=>x.id===pin.dataset.id);if(!item||!p)continue;const near=Math.hypot(item.x-p.x,item.y-p.y)<.045;pin.classList.toggle('party-near',near)}}
   function paint(){
    layer.replaceChildren();legendHost.replaceChildren(legendFor(items,state,editing));
    for(const item of items){
     if(!editing&&!WorldSystem.isDiscovered(state,item))continue;
     const pin=el('button');pin.className='region-poi'+(((editing&&editorLabels)||selected===item.id)?' expanded':'');pin.dataset.id=item.id;pin.dataset.type=item.type;pin.dataset.class=item.class||'place';pin.style.left=(item.x*100)+'%';pin.style.top=(item.y*100)+'%';pin.title=item.name||TYPES[item.type];if(WorldSystem.isFavorite(state,item))pin.classList.add('favorite');
     const dot=el('span',WorldSystem.isFavorite(state,item)?'★':pointIcon(item));const label=el('span',item.name||TYPES[item.type]);pin.append(dot,label);layer.append(pin);clampPin(pin,frame,item);
     pin.onclick=e=>{e.stopPropagation();if(editing&&editorMode==='road')return;if(editing){if(confirm('Удалить «'+item.name+'»?')){items=items.filter(x=>x.id!==item.id);persist()}return}selected=item.id;paint();showActions(item)};
     pin.onpointerdown=e=>{if(!editing||editorMode!=='poi')return;e.preventDefault();e.stopPropagation();drag=item;pin.setPointerCapture?.(e.pointerId)};
     pin.onpointermove=e=>{if(!drag)return;const p=mapPoint(frame,e.clientX,e.clientY);drag.x=p.x;drag.y=p.y;pin.style.left=(drag.x*100)+'%';pin.style.top=(drag.y*100)+'%'};
     pin.onpointerup=e=>{if(!drag)return;drag=null;persist()};
    }
    paintParty();
   }
   function persist(){savePoi('forest',items);paint()}
   function routeStatus(t){let box=actionHost.querySelector('.travel-status');if(!box){box=el('section');box.className='travel-status';actionHost.append(box)}const p=TravelSystem.progress(state),pct=Math.round(p.ratio*100),km=n=>(n/1000).toFixed(n>=10000?1:2);box.replaceChildren(el('div','Путь: '+pct+'% · '+km(p.done)+' км / '+km(p.total)+' км · осталось '+km(p.left)+' км'));const bar=el('progress');bar.max=1;bar.value=p.ratio;box.append(bar);const actions=el('div');actions.className='travel-actions';const camp=el('button',t.status==='camp'?'Свернуть лагерь':'Разбить лагерь');camp.onclick=()=>{t.status==='camp'?TravelSystem.resume(state,{roads,points:items,terrainZones}):TravelSystem.camp(state,{roads,points:items,terrainZones});routeStatus(t)};const cancel=el('button','Отменить путь');cancel.onclick=()=>{TravelSystem.cancel(state,{roads,points:items,terrainZones});box.remove();paintParty();onChange?.(state)};actions.append(camp,cancel);box.append(actions)}
   function startTravel(target,method){const active=TravelSystem.ensure(state);if(['travelling','event','stopped','camp'].includes(active.status)){const msg=el('p','Сначала отмените текущий путь.');msg.className='quiet map-route-status';actionHost.append(msg);return}const anchored=state.world?.position?.pointId||null,from=anchored||current.locationId||current.placeId||'veligrad';if(anchored===target.id){WorldSystem.enterMapPoint(state,target);onChange?.(state);paint();return}const free=anchored?null:state.world?.position?.position||active.position||null,t=TravelSystem.start(state,{roads,points:items,fromId:from,toId:target.id,method,fromPosition:free,terrainZones});if(!t){const msg=el('p','К этой точке пока нет доступного маршрута.');msg.className='quiet map-route-status';actionHost.append(msg);return}state.world.camp=null;const old=actionHost.querySelector('.map-route-status');old?.remove();const msg=el('p',(method==='horse'?'Верхом':'Пешком')+': '+(t.distanceTotal/1000).toFixed(2)+' км');msg.className='quiet map-route-status';actionHost.append(msg);routeStatus(t);lastTravelAt=performance.now();if(!travelTimer)travelTimer=requestAnimationFrame(travelFrame);onChange?.(state);paintParty()}
   function travelFrame(now){travelTimer=null;const t=TravelSystem.ensure(state);if(!['travelling','event','stopped','camp'].includes(t.status))return;const dt=Math.min(.1,Math.max(0,(now-(lastTravelAt||now))/1000));lastTravelAt=now;if(t.status==='travelling'){const gs=GameSpeedSystem.get(state),before=t.distanceDone||0;TravelSystem.tick(state,dt,roads,gs);if((t.distanceDone||0)>before){state.clock.minute+=dt*gs;while(state.clock.minute>=1440){state.clock.minute-=1440;state.clock.day++}}paintParty();routeStatus(t);if(t.status==='arrived'){const dest=items.find(p=>p.id===t.toId);state.world.position={regionId:'forest',pointId:t.toId};if(dest)WorldSystem.enterMapPoint(state,dest);onChange?.(state);paint();if(dest)showActions(dest);return}}travelTimer=requestAnimationFrame(travelFrame)}
   function showActions(item){actionHost.replaceChildren(actionPanel(item,state,(p,method)=>{if(method==='enter'&&p.map){const here=state.world?.position?.pointId||current.locationId||current.placeId||'veligrad';if(here!==p.id){startTravel(p,'walk');return}WorldSystem.enterMapPoint(state,p);onChange?.(state);mode='location';renderLocation(p);return}startTravel(p,method)},(p,b)=>{const favorite=WorldSystem.toggleFavorite(state,p);b.textContent=favorite?'★ В избранном':'☆ В избранное';onChange?.(state);paint()}))}
   frame.onclick=e=>{if(e.target.closest('.region-poi'))return;if(!editing){selected=null;actionHost.replaceChildren();WorldSystem.clearMapPoint(state);onChange?.(state);paint();return}if(editorMode==='road')return;const mp=mapPoint(frame,e.clientX,e.clientY),x=mp.x,y=mp.y;const choice=type.value,cls=choice==='location-map'?'location':choice,label=name.value.trim()||(choice==='location-map'?'Локация с картой':choice==='location'?'Локация':'Место');items.push({id:'forest-'+slug(label)+'-'+Date.now().toString(36),name:label,class:cls,type:cls,...(choice==='location-map'?{map:null}:{}),x:+x.toFixed(5),y:+y.toFixed(5)});name.value='';persist()};
   function syncEditorTools(){const road=editorMode==='road',terrain=editorMode==='terrain';for(const x of [roadType,roadSelection,deleteRoadNode,deleteRoadEdge,clearRoadSelection,bindRoadPoi,clearRoads,roadExport])x.classList.toggle('hidden',!road);for(const x of [terrainType,finishTerrain,undoTerrain,cancelTerrain,terrainSelection,deleteTerrain,clearTerrain,terrainExport])x.classList.toggle('hidden',!terrain);for(const x of [type,name,toggleLabels,clearOptionalPoi,exportBtn])x.classList.toggle('hidden',road||terrain);mapExport.classList.toggle('hidden',false);hint.textContent=road?'Ставьте и соединяйте дорожные узлы. Тип местности определяется отдельными полигонами.':terrain?'Ставьте вершины границы местности и нажмите «Замкнуть полигон».':'Создавайте и перемещайте метки.'}
   modeSelect.onchange=()=>{editorMode=modeSelect.value;drag=null;roadEditor.setActive(editing&&editorMode==='road');terrainEditor.setActive(editing&&editorMode==='terrain');frame.dataset.editorMode=editorMode;syncEditorTools();paint()};roadType.onchange=()=>roadEditor.setRoadType(roadType.value);roadEditor.setRoadType(roadType.value);syncEditorTools();roadExport.onclick=()=>downloadJson('region-central-lands-roads.json',roads);terrainExport.onclick=()=>downloadJson('region-central-lands-terrain.json',{mapId:'region:forest',zones:terrainZones});mapExport.onclick=()=>downloadJson('region-central-lands-map.json',mapBundle('forest',{kind:'region',id:'forest',map:region.map.asset,points:items,fallbackRoads:CENTRAL_LANDS_ROADS}));
   edit.onclick=()=>{editing=!editing;panel.classList.toggle('hidden',!editing);frame.classList.toggle('editing',editing);frame.dataset.editorMode=editing?editorMode:'';edit.textContent=editing?'Готово':'Редактор';roadEditor.setActive(editing&&editorMode==='road');terrainEditor.setActive(editing&&editorMode==='terrain');paint()};
   back.onclick=()=>{mode='world';renderWorld()};
   exportBtn.onclick=()=>downloadJson('region-central-lands-poi.json',{region:'forest',map:region.map.asset,points:items});
   clearBtn.onclick=()=>{if(confirm('Сбросить локальные изменения и вернуть штатные метки Центральных земель?')){items=CENTRAL_LANDS.points.map(p=>({...p}));persist()}};
   if(!state.world.position?.pointId)state.world.position={regionId:'forest',pointId:'veligrad'};
   const existingTravel=TravelSystem.ensure(state);if(['travelling','event','stopped','camp'].includes(existingTravel.status)){lastTravelAt=performance.now();travelTimer=requestAnimationFrame(travelFrame)}
   paint();
   cleanup=()=>{roadEditor?.destroy();terrainEditor?.destroy();if(travelTimer)cancelAnimationFrame(travelTimer);travelTimer=null;frame.onclick=null;back.onclick=null;edit.onclick=null};
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
   const cls=choiceMenu([['district','Район'],['place','Место'],['transition','Переход']],'district')
   const name=el('input');name.placeholder='Название';
   const hint=el('p','Расставьте районы, отдельные места и переходы. Поселения внутри города недоступны.');hint.className='quiet';
   const exportBtn=el('button','Экспортировать JSON');const clearBtn=el('button','Удалить все локальные метки');panel.append(cls,name,hint,exportBtn,exportAllButton(),clearBtn);root.append(panel);
   const key='location:'+location.id;let editing=false,items=loadPoi(key),selected=current.placeId||current.districtId||null,drag=null;
   if(location.id==='veligrad'&&!items.length)items=VELIGRAD.points.map(p=>({...p}));
   function persist(){savePoi(key,items);paint()}
   function showActions(item){actionHost.replaceChildren(actionPanel(item,state,(p,method)=>{WorldSystem.enterMapPoint(state,p);onChange?.(state);actionHost.querySelector('p')?.insertAdjacentHTML('afterend','<p class="quiet">Маршрут выбран: '+(method==='horse'?'на лошади':'пешком')+'. Расчёт пути будет подключён позже.</p>')},(p,b)=>{const favorite=WorldSystem.toggleFavorite(state,p);b.textContent=favorite?'★ В избранном':'☆ В избранное';onChange?.(state);paint()}))}
   function paint(){layer.replaceChildren();for(const item of items){if(!editing&&!WorldSystem.isDiscovered(state,item))continue;const pin=el('button');pin.className='region-poi'+((editing||selected===item.id)?' expanded':'');pin.dataset.class=item.class;pin.style.left=(item.x*100)+'%';pin.style.top=(item.y*100)+'%';if(WorldSystem.isFavorite(state,item))pin.classList.add('favorite');pin.append(el('span',WorldSystem.isFavorite(state,item)?'★':'●'),el('span',item.name||CLASSES[item.class]||'Место'));layer.append(pin);clampPin(pin,frame,item);
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
