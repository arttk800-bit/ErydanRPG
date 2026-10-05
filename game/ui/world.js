// ============================================================================
// WORLD UI ADAPTER
// Composes world/region/location presentation and forwards actions to systems.
// Gameplay rules, travel simulation and editor internals belong to their owners.
// ============================================================================
import {WORLD_DATA} from '../data/world.js';
import {WorldSystem} from '../systems/world/world.js';
import {MapViewSystem} from '../map/view-state.js';
import {CENTRAL_LANDS} from '../data/regions/central-lands.js';
import {VELIGRAD} from '../data/locations/veligrad.js';
import {CENTRAL_LANDS_ROADS} from '../data/regions/central-lands-roads.js';
import {TravelSystem} from '../systems/travel/travel.js';
import {loadEditableRoads} from '../tools/map-editor/road-editor.js';
import {createMapEditorSession} from '../tools/map-editor/session.js';
import {loadTerrainZones} from '../tools/map-editor/terrain-store.js';
import {mapMetrics} from '../data/map-metrics.js';
import {mapPoint} from './map-gestures.js';
import {createPoiAuthoring} from '../tools/map-editor/poi-authoring.js';
import {GameSpeedSystem} from '../systems/game-speed.js';
import {loadPoi,savePoi} from '../map/poi-store.js';
import {mapBundle} from '../tools/map-editor/export-data.js';
import {el,downloadJson} from './map-ui.js';
import {MAP_POINT_CLASSES as CLASSES,MAP_POINT_TYPES as TYPES,pointIcon,legendFor,actionPanel} from './map-points.js';

function clampPin(pin){pin.style.transform='translate(-50%,-50%)'}


export const WorldUI={
 ready:true,
 mount(root,state,onChange,onAudioContext=()=>{}){
  let pixels=null,mw=0,mh=0,indexToId={},regionCenters={};
  for(const [id,r] of Object.entries(WORLD_DATA.regions))indexToId[r.index]=id;
  const current=WorldSystem.ensure(state);
  if(current.regionId&&!WORLD_DATA.regions[current.regionId])current.regionId=null;
  const view=MapViewSystem.ensure(state);let mode=view.level;
  let cleanup=()=>{};

  // --------------------------------------------------------------------------
  // WORLD MAP VIEW — renders global regions/fog and forwards region selection.
  // --------------------------------------------------------------------------
  function renderWorld(){
   cleanup();onAudioContext('world');root.replaceChildren();
   const statusText=()=>current.regionId?'Отряд находится в регионе: '+(WORLD_DATA.regions[current.regionId]?.name||current.regionId):'Местоположение отряда не определено';
   const head=el('div');head.className='world-head';const fogToggle=el('button','Туман: вкл');fogToggle.className='world-fog-toggle';head.append(el('h2','Карта мира'),fogToggle);let fogEnabled=true;
   const status=el('p',statusText());status.className='world-region-status';head.append(status);root.append(head);
   const frame=el('div');frame.className='world-map-frame';
   const img=el('img');img.className='world-map-image';img.src=WORLD_DATA.map.asset;img.alt='Карта мира Эйрдан';frame.append(img);
   const shade=el('canvas');shade.className='world-region-shade';frame.append(shade);const regionLabel=el('div');regionLabel.className='world-selected-region';frame.append(regionLabel);root.append(frame);
   function draw(){regionLabel.textContent=view.regionId?WORLD_DATA.regions[view.regionId]?.name||'':'';const center=view.regionId?regionCenters[WORLD_DATA.regions[view.regionId]?.index]:null;if(center){regionLabel.style.left=(center.x/mw*100)+'%';regionLabel.style.top=(center.y/mh*100)+'%'}if(!pixels)return;shade.width=mw;shade.height=mh;const ctx=shade.getContext('2d'),out=ctx.createImageData(mw,mh);const selected=view.regionId?WORLD_DATA.regions[view.regionId]?.index:0;for(let p=0,i=0;p<pixels.length;p++,i+=4){const idx=pixels[p],id=indexToId[idx];if(fogEnabled&&idx>0&&idx!==selected&&!WorldSystem.isRegionAvailable(state,id)){out.data[i]=18;out.data[i+1]=24;out.data[i+2]=23;out.data[i+3]=218}else if(idx>0&&idx!==selected){out.data[i+3]=58}}ctx.putImageData(out,0,0)}
   const mask=new Image();mask.onload=()=>{mw=mask.naturalWidth;mh=mask.naturalHeight;const c=document.createElement('canvas');c.width=mw;c.height=mh;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(mask,0,0);const d=x.getImageData(0,0,mw,mh).data;pixels=new Uint8Array(mw*mh);const sums={};for(let p=0,i=0;p<pixels.length;p++,i+=4){const idx=d[i];pixels[p]=idx;if(idx>0){const q=sums[idx]||(sums[idx]={x:0,y:0,n:0});q.x+=p%mw;q.y+=Math.floor(p/mw);q.n++}}regionCenters={};for(const [idx,q] of Object.entries(sums))regionCenters[idx]={x:q.x/q.n,y:q.y/q.n};draw()};mask.src=WORLD_DATA.map.mask;
   fogToggle.onclick=()=>{fogEnabled=!fogEnabled;fogToggle.textContent='Туман: '+(fogEnabled?'вкл':'выкл');draw()};frame.onclick=e=>{if(!pixels)return;const r=frame.getBoundingClientRect(),x=Math.max(0,Math.min(mw-1,Math.floor((e.clientX-r.left)/r.width*mw))),y=Math.max(0,Math.min(mh-1,Math.floor((e.clientY-r.top)/r.height*mh))),id=indexToId[pixels[y*mw+x]];if(!id)return;MapViewSystem.region(state,id);mode='region';draw();onChange?.(state);renderRegion(id)};
   cleanup=()=>{frame.onclick=null};
  }

  // --------------------------------------------------------------------------
  // REGION VIEW — renders regional POIs/travel state; systems own game rules.
  // Map Editor is composed through tools/map-editor public interfaces.
  // --------------------------------------------------------------------------
  function renderRegion(regionId=view.regionId||current.regionId||'forest'){
   cleanup();onAudioContext('world');root.replaceChildren();
   const region=WORLD_DATA.regions[regionId];
   if(!region?.map){const head=el('div');head.className='region-head';const back=el('button','← Мир');back.className='region-back';head.append(back,el('h2',region?.name||'Регион'));root.append(head,el('p','Карта этого региона пока не добавлена. Предпросмотр не изменяет положение отряда.'));back.onclick=()=>{MapViewSystem.world(state);mode='world';onChange?.(state);renderWorld()};cleanup=()=>{back.onclick=null};return}
   
   const head=el('div');head.className='region-head';
   const back=el('button','← Мир');back.className='region-back';
   const title=el('div');title.append(el('h2',region.name),el('p','Карта региона'));
   const edit=el('button','Редактор');edit.className='region-edit-toggle';
   head.append(back,title,edit);root.append(head);
   const frame=el('div');frame.className='region-map-frame';
   const img=el('img');img.className='region-map-image';img.src=region.map.asset;img.alt=region.name;frame.append(img);
   const layer=el('div');layer.className='region-poi-layer';frame.append(layer);
   const party=el('div');party.className='party-marker';party.title='Ваш отряд';frame.append(party);const freeTarget=el('div');freeTarget.className='free-travel-target hidden';frame.append(freeTarget);root.append(frame);
   const actionHost=el('div');actionHost.className='map-point-action-host';root.append(actionHost);
   let editing=false,items=loadPoi('forest'),roads=loadEditableRoads('forest',CENTRAL_LANDS_ROADS),terrainZones=loadTerrainZones('region:forest',[]);roads.metrics={...mapMetrics('region','forest')};roads.regionId='forest';let editorMode='poi',editorLabels=false,drag=null,selected=current.placeId||current.districtId||current.locationId||null,travelTimer=null,lastTravelAt=0;const legendHost=el('div');legendHost.className='map-legend-host';frame.append(legendHost);
   const editorSession=createMapEditorSession({root,frame,editButton:edit,kind:'region',panelOptions:{poiOptions:[['location-map','Локация с картой'],['location','Локация без карты'],['place','Конечное место']],poiInitial:'location-map',poiPlaceholder:'Название локации',hintText:'Выберите функциональный класс и нажмите на карту. Метку можно перетаскивать.',clearLabel:'Сбросить к штатным'},roadMapId:'forest',terrainMapId:'region:forest',roads,zones:terrainZones,getPois:()=>items,getMode:()=>editorMode,setMode:value=>{editorMode=value;drag=null},getEditing:()=>editing,setEditing:value=>{editing=value},onPaint:paint,onModeChange:syncEditorTools,onRoadsChange:r=>{roads=r},onZonesChange:z=>{terrainZones=z},onRoadSelection:(s,{panel,roadEditor})=>{panel.bindRoadPoi.disabled=!s.nodeId;const np=s.node?roadEditor.nearestPoi(s.node.x,s.node.y,.08):null;panel.bindRoadPoi.textContent=np?'Привязать к «'+np.name+'»':'Привязать узел к метке';panel.road.selection.textContent=s.nodeId?'Выбран узел: '+s.nodeId:s.edge?'Выбран участок: '+s.edge[0]+' → '+s.edge[1]:'Ничего не выбрано'},clearTerrainMessage:'Удалить все зоны местности региона?',clearRoadsMessage:'Удалить ВСЕ дорожные узлы и участки региона?'});
   const {panel:editorPanel,roadEditor}=editorSession;const {hint,mapExport,toggleLabels,bindRoadPoi,clearOptionalPoi}=editorPanel;
   const poiAuthoring=createPoiAuthoring({frame,panel:editorPanel,getItems:()=>items,setItems:value=>{items=value},persist:()=>persist(),getEditing:()=>editing,getMode:()=>editorMode,getDrag:()=>drag,setDrag:value=>{drag=value},createPoint:({choice,label,x,y,slug})=>{const cls=choice==='location-map'?'location':choice,resolved=label||(choice==='location-map'?'Локация с картой':choice==='location'?'Локация':'Место');return{id:'forest-'+slug(resolved)+'-'+Date.now().toString(36),name:resolved,class:cls,type:cls,...(choice==='location-map'?{map:null}:{}),x,y}},exportFile:'region-central-lands-poi.json',exportPayload:()=>({region:'forest',map:region.map.asset,points:items}),resetConfirm:'Сбросить локальные изменения и вернуть штатные метки Центральных земель?',resetItems:()=>CENTRAL_LANDS.points.map(p=>({...p}))});
   toggleLabels.onclick=()=>{editorLabels=!editorLabels;toggleLabels.textContent=editorLabels?'Свернуть названия':'Развернуть названия';paint()};clearOptionalPoi.onclick=()=>{if(confirm('Удалить все обычные метки, сохранив функциональные точки и локации с картами?')){items=items.filter(p=>p.map||p.class==='transition'||p.type==='transition');persist()}};bindRoadPoi.onclick=()=>{const sel=roadEditor.selection().node;if(!sel)return;const p=roadEditor.nearestPoi(sel.x,sel.y,.08);if(!p){alert('Рядом с выбранным узлом нет метки.');return}if(confirm('Привязать выбранный узел к месту «'+p.name+'»?'))roadEditor.bindPoi(p.id,sel.id)};
   function partyPoint(){const t=TravelSystem.ensure(state);if(t.regionId==='forest'&&t.position&&['travelling','event','stopped','camp'].includes(t.status))return t.position;if(state.world?.position?.position)return state.world.position.position;const id=state.world?.position?.pointId||current.locationId||current.placeId||'veligrad';return items.find(p=>p.id===id)||CENTRAL_LANDS.points.find(p=>p.id===id)||CENTRAL_LANDS.points.find(p=>p.id==='veligrad')}
   function paintParty(){const p=partyPoint(),t=TravelSystem.ensure(state),active=['travelling','event','stopped','camp'].includes(t.status),startId=active?(t.fromId&&t.fromId!=='road-position'&&t.fromId!=='free-position'?t.fromId:null):null,targetId=active?t.toId:null;party.classList.toggle('hidden',!p);if(p){party.style.left=(p.x*100)+'%';party.style.top=(p.y*100)+'%'}for(const pin of layer.querySelectorAll('.region-poi')){const item=items.find(x=>x.id===pin.dataset.id);if(!item||!p)continue;const near=Math.hypot(item.x-p.x,item.y-p.y)<.045,isStart=item.id===startId,isTarget=item.id===targetId;pin.classList.toggle('party-near',near);pin.classList.toggle('route-start',isStart);pin.classList.toggle('route-target',isTarget);pin.classList.toggle('travel-label',near||isStart||isTarget)}}
   function paint(){
    layer.replaceChildren();legendHost.replaceChildren(legendFor(items,state,editing));
    for(const item of items){
     if(!editing&&!WorldSystem.isDiscovered(state,item))continue;
     const favorite=WorldSystem.isFavorite(state,item);const pin=el('button');pin.className='region-poi'+(((editing&&editorLabels)||selected===item.id||favorite)?' expanded':'');pin.dataset.id=item.id;pin.dataset.type=item.type;pin.dataset.class=item.class||'place';pin.style.left=(item.x*100)+'%';pin.style.top=(item.y*100)+'%';pin.title=item.name||TYPES[item.type];if(favorite)pin.classList.add('favorite');
     const dot=el('span',pointIcon(item));dot.className='point-symbol';const label=el('span',item.name||TYPES[item.type]);label.className='point-label';pin.append(dot,label);if(favorite){const star=el('span','★');star.className='point-favorite';pin.append(star)};layer.append(pin);clampPin(pin,frame,item);
     pin.onclick=e=>{e.stopPropagation();if(editing&&editorMode==='road')return;if(editing){poiAuthoring.remove(item);return}selected=item.id;paint();showActions(item)};
     poiAuthoring.bindPin(pin,item);
    }
    paintParty();
   }
   function persist(){savePoi('forest',items);paint()}
   function routeStatus(t){let box=actionHost.querySelector('.travel-status');if(!box){box=el('section');box.className='travel-status';actionHost.append(box)}const p=TravelSystem.progress(state),pct=Math.round(p.ratio*100),km=n=>(n/1000).toFixed(n>=10000?1:2);box.replaceChildren(el('div','Путь: '+pct+'% · '+km(p.done)+' км / '+km(p.total)+' км · осталось '+km(p.left)+' км'));const bar=el('progress');bar.max=1;bar.value=p.ratio;box.append(bar);const actions=el('div');actions.className='travel-actions';const camp=el('button',t.status==='camp'?'Свернуть лагерь':'Разбить лагерь');camp.onclick=()=>{t.status==='camp'?TravelSystem.resume(state,{roads,points:items,terrainZones}):TravelSystem.camp(state,{roads,points:items,terrainZones});routeStatus(t)};const cancel=el('button','Отменить путь');cancel.onclick=()=>{TravelSystem.cancel(state,{roads,points:items,terrainZones});box.remove();paintParty();onChange?.(state)};actions.append(camp,cancel);box.append(actions)}
   function startTravel(target,method){onAudioContext('travel');const active=TravelSystem.ensure(state);if(['travelling','event','stopped','camp'].includes(active.status)){const msg=el('p','Сначала отмените текущий путь.');msg.className='quiet map-route-status';actionHost.append(msg);return}const anchored=state.world?.position?.pointId||null,from=anchored||current.locationId||current.placeId||'veligrad';if(anchored===target.id){WorldSystem.enterMapPoint(state,target);onChange?.(state);paint();return}const free=anchored?null:state.world?.position?.position||active.position||null,t=TravelSystem.start(state,{roads,points:items,fromId:from,toId:target.id||null,toPosition:target.id?null:{x:target.x,y:target.y},method,fromPosition:free,terrainZones});if(!t){const msg=el('p','К этой точке пока нет доступного маршрута.');msg.className='quiet map-route-status';actionHost.append(msg);return}state.world.camp=null;const old=actionHost.querySelector('.map-route-status');old?.remove();const msg=el('p',(method==='horse'?'Верхом':'Пешком')+': '+(t.distanceTotal/1000).toFixed(2)+' км');msg.className='quiet map-route-status';actionHost.append(msg);routeStatus(t);lastTravelAt=performance.now();if(!travelTimer)travelTimer=requestAnimationFrame(travelFrame);onChange?.(state);paintParty()}
   function travelFrame(now){travelTimer=null;const t=TravelSystem.ensure(state);if(!['travelling','event','stopped','camp'].includes(t.status))return;const dt=Math.min(.1,Math.max(0,(now-(lastTravelAt||now))/1000));lastTravelAt=now;if(t.status==='travelling'){const gs=GameSpeedSystem.get(state),before=t.distanceDone||0;TravelSystem.tick(state,dt,roads,gs);if((t.distanceDone||0)>before){state.clock.minute+=dt*gs;while(state.clock.minute>=1440){state.clock.minute-=1440;state.clock.day++}}paintParty();routeStatus(t);if(t.status==='arrived'){const dest=items.find(p=>p.id===t.toId);state.world.position=dest?{regionId:'forest',pointId:t.toId}:{regionId:'forest',pointId:null,position:{...t.position}};freeTarget.classList.add('hidden');if(dest)WorldSystem.enterMapPoint(state,dest);else WorldSystem.clearMapPoint(state);onChange?.(state);paint();if(dest)showActions(dest);else actionHost.replaceChildren();return}}travelTimer=requestAnimationFrame(travelFrame)}
   function showActions(item){actionHost.replaceChildren(actionPanel(item,state,(p,method)=>{if(method==='enter'&&p.map){const here=state.world?.position?.pointId||current.locationId||current.placeId||'veligrad';if(here!==p.id){startTravel(p,'walk');return}WorldSystem.enterMapPoint(state,p);onChange?.(state);mode='location';renderLocation(p);return}startTravel(p,method)},(p,b)=>{const favorite=WorldSystem.toggleFavorite(state,p);b.textContent=favorite?'★ В избранном':'☆ В избранное';onChange?.(state);paint()}))}
   frame.onclick=e=>{if(e.target.closest('.region-poi'))return;const mp=mapPoint(frame,e.clientX,e.clientY);if(!editing){selected=null;WorldSystem.clearMapPoint(state);const target={x:mp.x,y:mp.y};freeTarget.style.left=(target.x*100)+'%';freeTarget.style.top=(target.y*100)+'%';freeTarget.classList.remove('hidden');const card=el('section');card.className='map-point-card free-travel-card';card.append(el('h3','Точка на карте'),el('p','Свободное перемещение с учётом дорог и зон местности.'));const actions=el('div');actions.className='map-point-actions';const walk=el('button','Идти пешком'),horse=el('button','На лошади'),cancel=el('button','Отмена');walk.onclick=ev=>{ev.stopPropagation();startTravel(target,'walk')};horse.onclick=ev=>{ev.stopPropagation();startTravel(target,'horse')};cancel.onclick=ev=>{ev.stopPropagation();freeTarget.classList.add('hidden');actionHost.replaceChildren()};actions.append(walk,horse,cancel);card.append(actions);actionHost.replaceChildren(card);onChange?.(state);paint();freeTarget.classList.remove('hidden');return}poiAuthoring.addFromEvent(e)};
   function syncEditorTools(){editorPanel.sync(editorMode);mapExport.classList.toggle('hidden',false);hint.textContent=editorMode==='road'?'Ставьте и соединяйте дорожные узлы. Тип местности определяется отдельными полигонами.':editorMode==='terrain'?'Неразмеченная территория имеет обычную скорость. Размечайте только зоны с модификатором; вершины выбранной зоны можно перетаскивать.':'Создавайте и перемещайте метки.'}
      back.onclick=()=>{MapViewSystem.world(state);mode='world';onChange?.(state);renderWorld()};
   if(!state.world.position?.pointId)state.world.position={regionId:'forest',pointId:'veligrad'};
   const existingTravel=TravelSystem.ensure(state);if(['travelling','event','stopped','camp'].includes(existingTravel.status)){lastTravelAt=performance.now();travelTimer=requestAnimationFrame(travelFrame)}
   paint();
   cleanup=()=>{poiAuthoring.destroy();editorSession.destroy();if(travelTimer)cancelAnimationFrame(travelTimer);travelTimer=null;frame.onclick=null;back.onclick=null;edit.onclick=null};
  }

  // --------------------------------------------------------------------------
  // LOCATION VIEW — renders location POIs and delegates editor tooling.
  // --------------------------------------------------------------------------
  function renderLocation(location){
   cleanup();onAudioContext('town');root.replaceChildren();
   const head=el('div');head.className='region-head';
   const back=el('button','← Регион');back.className='region-back';
   const title=el('div');title.append(el('h2',location.name),el('p','Карта локации'));
   const edit=el('button','Редактор');edit.className='region-edit-toggle';head.append(back,title,edit);root.append(head);
   const frame=el('div');frame.className='region-map-frame';
   const img=el('img');img.className='region-map-image';img.src=location.map;img.alt=location.name;frame.append(img);
   const layer=el('div');layer.className='region-poi-layer';frame.append(layer);root.append(frame);
   const actionHost=el('div');actionHost.className='map-point-action-host';root.append(actionHost);
   const localParty=el('div');localParty.className='party-marker';localParty.title='Ваш отряд';frame.append(localParty);
   const key='location:'+location.id;let editing=false,editorMode='poi',items=loadPoi(key),selected=current.placeId||current.districtId||null,drag=null;
   if(location.id==='veligrad'){const legacy=items.some(p=>p.class==='transition'||p.type==='transition');if(!items.length||legacy){const custom=items.filter(p=>p.class!=='transition'&&p.type!=='transition');const canonical=VELIGRAD.points.map(p=>({...p}));items=custom.length?[...custom.filter(p=>!canonical.some(c=>c.id===p.id)),...canonical]:canonical;savePoi(key,items)}}
   let roads=loadEditableRoads(key,{nodes:[],edges:[],access:{}}),terrainZones=loadTerrainZones(key,[]);
   const editorSession=createMapEditorSession({root,frame,editButton:edit,kind:'location',panelOptions:{poiOptions:[['district','Район'],['place','Место'],['gate','Ворота'],['entrance','Вход'],['exit','Выход']],poiInitial:'district',poiPlaceholder:'Название',hintText:'Расставьте районы, места и физические входы/выходы.',clearLabel:'Удалить все локальные метки'},roadMapId:key,terrainMapId:key,roads,zones:terrainZones,getPois:()=>items,getMode:()=>editorMode,setMode:value=>{editorMode=value;drag=null},getEditing:()=>editing,setEditing:value=>{editing=value},onPaint:paint,onModeChange:syncEditorTools,onRoadsChange:r=>{roads=r},onZonesChange:z=>{terrainZones=z},onRoadSelection:s=>{editorSession.panel.road.selection.textContent=s.nodeId?'Выбран узел: '+s.nodeId:s.edge?'Выбран участок: '+s.edge[0]+' → '+s.edge[1]:'Ничего не выбрано'},clearTerrainMessage:'Удалить все зоны местности этой локации?',clearRoadsMessage:'Удалить ВСЕ дорожные узлы и участки этой локации?'});
   const {panel:editorPanel}=editorSession;const {hint,roadExport,terrainExport,mapExport}=editorPanel;
   const poiAuthoring=createPoiAuthoring({frame,panel:editorPanel,getItems:()=>items,setItems:value=>{items=value},persist:()=>persist(),getEditing:()=>editing,getMode:()=>editorMode,getDrag:()=>drag,setDrag:value=>{drag=value},createPoint:({choice,label,x,y,slug})=>{const resolved=label||({district:'Район',place:'Место',gate:'Ворота',entrance:'Вход',exit:'Выход'}[choice]);return{id:location.id+'-'+slug(resolved)+'-'+Date.now().toString(36),name:resolved,class:choice,type:choice,x,y}},exportFile:'location-'+location.id+'-poi.json',exportPayload:()=>({location:location.id,map:location.map,points:items}),resetConfirm:'Удалить все локальные метки этой локации?',resetItems:()=>[]});
   function persist(){savePoi(key,items);paint()}
   function showActions(item){actionHost.replaceChildren(actionPanel(item,state,(p,method)=>{WorldSystem.enterMapPoint(state,p);onChange?.(state);actionHost.querySelector('p')?.insertAdjacentHTML('afterend','<p class="quiet">Маршрут выбран: '+(method==='horse'?'на лошади':'пешком')+'. Расчёт пути будет подключён позже.</p>')},(p,b)=>{const favorite=WorldSystem.toggleFavorite(state,p);b.textContent=favorite?'★ В избранном':'☆ В избранное';onChange?.(state);paint()}))}
   function partyLocationPoint(){const id=state.world?.position?.locationPointId||current.placeId||current.districtId||location.spawnPointId;return items.find(p=>p.id===id)||items.find(p=>p.id===location.spawnPointId)||null}
   function paintParty(){const p=partyLocationPoint();localParty.classList.toggle('hidden',!p);if(p){localParty.style.left=(p.x*100)+'%';localParty.style.top=(p.y*100)+'%'}}
   function paint(){layer.replaceChildren();for(const item of items){if(!editing&&!WorldSystem.isDiscovered(state,item))continue;const favorite=WorldSystem.isFavorite(state,item);const pin=el('button');pin.className='region-poi'+((editing||selected===item.id||favorite)?' expanded':'');pin.dataset.class=item.class;pin.style.left=(item.x*100)+'%';pin.style.top=(item.y*100)+'%';if(favorite)pin.classList.add('favorite');const dot=el('span','●');dot.className='point-symbol';const label=el('span',item.name||CLASSES[item.class]||'Место');label.className='point-label';pin.append(dot,label);if(favorite){const star=el('span','★');star.className='point-favorite';pin.append(star)};layer.append(pin);clampPin(pin,frame,item);
    pin.onclick=e=>{e.stopPropagation();if(editing&&editorMode!=='poi')return;if(editing){poiAuthoring.remove(item);return}selected=item.id;paint();showActions(item)};
    poiAuthoring.bindPin(pin,item)}paintParty()}
   frame.onclick=e=>{if(e.target.closest('.region-poi'))return;if(!editing){selected=null;WorldSystem.clearMapPoint(state);onChange?.(state);paint();return}poiAuthoring.addFromEvent(e)};
   function syncEditorTools(){editorPanel.sync(editorMode);hint.textContent=editorMode==='road'?'Ставьте и соединяйте дорожные узлы локации.':editorMode==='terrain'?'Неразмеченная территория имеет обычную скорость. Размечайте только местность с модификатором.':'Расставьте районы, места и физические входы/выходы.'}
      back.onclick=()=>{MapViewSystem.region(state,view.regionId||current.regionId||'forest');onChange?.(state);mode='region';renderRegion(view.regionId||current.regionId||'forest')};
   roadExport.onclick=()=>downloadJson('location-'+location.id+'-roads.json',roads);
   terrainExport.onclick=()=>downloadJson('location-'+location.id+'-terrain.json',{mapId:key,zones:terrainZones});
   mapExport.onclick=()=>downloadJson('location-'+location.id+'-map.json',mapBundle(key,{kind:'location',id:location.id,map:location.map,points:items}));
   syncEditorTools();paint();
   cleanup=()=>{poiAuthoring.destroy();editorSession.destroy();frame.onclick=null;back.onclick=null;edit.onclick=null};
  }

  if(mode==='location'){const location=CENTRAL_LANDS.points.find(p=>p.id===(view.locationId||current.locationId)&&p.map);if(location)renderLocation(location);else renderRegion(view.regionId||current.regionId||'forest')}else if(mode==='region')renderRegion(view.regionId||current.regionId||'forest');else renderWorld();
  return()=>cleanup();
 }
};
