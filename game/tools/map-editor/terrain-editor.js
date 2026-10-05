import {TERRAIN_TYPES} from '../../map/terrain.js';
import {saveTerrainZones} from './terrain-store.js';
const NS='http://www.w3.org/2000/svg';
export class TerrainEditor{
 constructor({frame,mapId,zones,onChange,onSelection}){Object.assign(this,{frame,mapId,zones,onChange,onSelection});this.active=false;this.type='forest';this.draft=[];this.selected=null;this.drag=null;this.layer=document.createElementNS(NS,'svg');this.layer.classList.add('terrain-editor-layer','hidden');this.layer.setAttribute('viewBox','0 0 1 1');this.layer.setAttribute('preserveAspectRatio','none');this.layer.onclick=e=>{e.preventDefault();e.stopPropagation();if(!this.active||e.target!==this.layer)return;const p=this.point(e.clientX,e.clientY);this.draft.push({x:+p.x.toFixed(5),y:+p.y.toFixed(5)});this.paint()};frame.append(this.layer);this.paint()}
 point(x,y){const r=this.frame.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(x-r.left)/r.width)),y:Math.max(0,Math.min(1,(y-r.top)/r.height))}}
 selection(){return this.zones.find(z=>z.id===this.selected)||null}
 notify(){this.onSelection?.(this.selection())}
 setActive(v){this.active=!!v;this.layer.classList.toggle('hidden',!this.active);if(!v){this.draft=[];this.drag=null}this.paint()}
 setType(type){if(TERRAIN_TYPES[type]&&type!=='plain')this.type=type}
 finish(){if(this.draft.length<3)return false;const zone={id:'terrain-'+Date.now().toString(36),type:this.type,priority:this.zones.length+1,polygon:this.draft.map(p=>({...p}))};this.zones.push(zone);this.draft=[];this.selected=zone.id;this.commit();this.notify();return true}
 undoLastPoint(){if(!this.draft.length)return false;this.draft.pop();this.paint();return true}
 cancelDraft(){this.draft=[];this.paint()}
 select(id){this.selected=id;this.paint();this.notify()}
 removeSelected(){if(!this.selected)return false;const i=this.zones.findIndex(z=>z.id===this.selected);if(i<0)return false;this.zones.splice(i,1);this.selected=null;this.commit();this.notify();return true}
 clear(){this.zones.splice(0);this.selected=null;this.draft=[];this.commit();this.notify()}
 commit(){saveTerrainZones(this.mapId,this.zones);this.paint();this.onChange?.(this.zones)}
 paint(){this.layer.replaceChildren();if(!this.active)return;for(const z of this.zones){if(!z.polygon?.length)continue;const p=document.createElementNS(NS,'polygon');p.setAttribute('points',z.polygon.map(v=>v.x+','+v.y).join(' '));p.dataset.terrain=z.type;p.classList.add('terrain-zone');if(this.selected===z.id)p.classList.add('selected');p.onpointerdown=e=>{e.preventDefault();e.stopPropagation();this.select(z.id)};this.layer.append(p);if(this.selected===z.id)z.polygon.forEach((v,i)=>{const c=document.createElementNS(NS,'circle');c.setAttribute('cx',v.x);c.setAttribute('cy',v.y);c.setAttribute('r','.009');c.classList.add('terrain-vertex','terrain-zone-vertex');c.onpointerdown=e=>{e.preventDefault();e.stopPropagation();this.drag={zone:z,index:i,pointerId:e.pointerId};c.setPointerCapture?.(e.pointerId)};c.onpointermove=e=>{if(!this.drag||this.drag.zone!==z||this.drag.index!==i)return;const q=this.point(e.clientX,e.clientY);v.x=+q.x.toFixed(5);v.y=+q.y.toFixed(5);this.paint()};c.onpointerup=e=>{if(!this.drag)return;this.drag=null;this.commit()};this.layer.append(c)})}if(this.draft.length){const line=document.createElementNS(NS,'polyline');line.setAttribute('points',this.draft.map(v=>v.x+','+v.y).join(' '));line.dataset.terrain=this.type;line.classList.add('terrain-draft');this.layer.append(line);for(const v of this.draft){const c=document.createElementNS(NS,'circle');c.setAttribute('cx',v.x);c.setAttribute('cy',v.y);c.setAttribute('r','.006');c.classList.add('terrain-vertex');this.layer.append(c)}}}
 destroy(){this.layer.remove()}
}
