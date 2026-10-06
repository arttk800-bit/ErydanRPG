// ============================================================================
// POI AUTHORING
// Owns generic Map Editor POI create/delete/drag/export/reset interactions.
// Host map UI supplies point data through explicit getters/setters.
// ============================================================================
import {mapPoint} from '../../ui/map-gestures.js';
import {mapPointSlug} from '../../ui/map-points.js';

export function createPoiAuthoring({frame,panel,getItems,setItems,persist,getEditing,getMode,getDrag,setDrag,createPoint,resetConfirm,resetItems,onReset=()=>{}}){
 const {poiType,name,clearPoi}=panel;
 function addFromEvent(event){
  if(!getEditing()||getMode()!=='poi')return false;
  const p=mapPoint(frame,event.clientX,event.clientY),choice=poiType.value;
  const point=createPoint({choice,label:name.value.trim(),x:+p.x.toFixed(5),y:+p.y.toFixed(5),slug:value=>mapPointSlug(value)});
  if(!point)return false;setItems([...getItems(),point]);name.value='';persist();return true;
 }
 function bindPin(pin,item){
  pin.onpointerdown=e=>{if(!getEditing()||getMode()!=='poi')return;e.preventDefault();e.stopPropagation();setDrag(item);pin.setPointerCapture?.(e.pointerId)};
  pin.onpointermove=e=>{const drag=getDrag();if(!drag)return;const p=mapPoint(frame,e.clientX,e.clientY);drag.x=p.x;drag.y=p.y;pin.style.left=(drag.x*100)+'%';pin.style.top=(drag.y*100)+'%'};
  pin.onpointerup=()=>{if(!getDrag())return;setDrag(null);persist()};
 }
 clearPoi.onclick=()=>{if(confirm(resetConfirm)){setItems(resetItems());onReset();persist()}};
 return {addFromEvent,remove(item){if(!confirm('Удалить «'+item.name+'»?'))return false;setItems(getItems().filter(x=>x.id!==item.id));persist();return true},bindPin,destroy(){clearPoi.onclick=null}};
}
