import {TERRAIN_TYPES} from '../../map/terrain.js';import {saveTerrainZones} from './terrain-store.js';
const NS='http://www.w3.org/2000/svg';
export class TerrainEditor{
 constructor({frame,mapId,zones,onChange}){Object.assign(this,{frame,mapId,zones,onChange});this.active=false;this.type='forest';this.draft=[];this.selected=null;this.layer=document.createElementNS(NS,'svg');this.layer.classList.add('terrain-editor-layer','hidden');this.layer.setAttribute('viewBox','0 0 1 1');this.layer.setAttribute('preserveAspectRatio','none');this.layer.onclick=e=>{e.preventDefault();e.stopPropagation();if(!this.active)return;const p=this.point(e.clientX,e.clientY);this.draft.push({x:+p.x.toFixed(5),y:+p.y.toFixed(5)});this.paint()};frame.append(this.layer);this.paint()}
 point(x,y){const r=this.frame.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(x-r.left)/r.width)),y:Math.max(0,Math.min(1,(y-r.top)/r.height))}}
 setActive(v){this.active=!!v;this.layer.classList.toggle('hidden',!this.active);if(!v)this.draft=[];this.paint()}
 setType(type){if(TERRAIN_TYPES[type])this.type=type}
 finish(){if(this.draft.length<3)return false;this.zones.push({id:'terrain-'+Date.now().toString(36),type:this.type,priority:this.zones.length+1,polygon:this.draft.map(p=>({...p}))});this.draft=[];this.commit();return true}
 cancelDraft(){this.draft=[];this.paint()}
 removeSelected(){if(!this.selected)return false;this.zones.splice(this.zones.findIndex(z=>z.id===this.selected),1);this.selected=null;this.commit();return true}
 clear(){this.zones.splice(0);this.selected=null;this.draft=[];this.commit()}
 commit(){saveTerrainZones(this.mapId,this.zones);this.paint();this.onChange?.(this.zones)}
 paint(){this.layer.replaceChildren();if(!this.active)return;for(const z of this.zones){if(!z.polygon?.length)continue;const p=document.createElementNS(NS,'polygon');p.setAttribute('points',z.polygon.map(v=>v.x+','+v.y).join(' '));p.dataset.terrain=z.type;p.classList.add('terrain-zone');if(this.selected===z.id)p.classList.add('selected');p.onpointerdown=e=>{e.preventDefault();e.stopPropagation();this.selected=z.id;this.paint()};this.layer.append(p)}if(this.draft.length){const line=document.createElementNS(NS,'polyline');line.setAttribute('points',this.draft.map(v=>v.x+','+v.y).join(' '));line.dataset.terrain=this.type;line.classList.add('terrain-draft');this.layer.append(line);for(const v of this.draft){const c=document.createElementNS(NS,'circle');c.setAttribute('cx',v.x);c.setAttribute('cy',v.y);c.setAttribute('r','.006');c.classList.add('terrain-vertex');this.layer.append(c)}}}
 destroy(){this.layer.remove()}
}
