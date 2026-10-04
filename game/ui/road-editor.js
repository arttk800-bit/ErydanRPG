const KEY='eirdan.region-roads.v1',NS='http://www.w3.org/2000/svg';
const clone=v=>JSON.parse(JSON.stringify(v));
export function loadEditableRoads(regionId,fallback){try{const all=JSON.parse(localStorage.getItem(KEY)||'{}');if(all[regionId])return all[regionId]}catch{}return clone(fallback)}
export function saveEditableRoads(regionId,roads){let all={};try{all=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}all[regionId]=roads;localStorage.setItem(KEY,JSON.stringify(all))}
export class RoadEditor{
 constructor({frame,regionId,roads,getPois=()=>[],onChange,onSelection}){Object.assign(this,{frame,regionId,roads,getPois,onChange,onSelection});this.active=false;this.terrain='normal';this.selected=null;this.selectedEdge=null;this.drag=null;this.layer=document.createElementNS(NS,'svg');this.layer.classList.add('road-editor-layer','hidden');this.layer.setAttribute('viewBox','0 0 1 1');this.layer.setAttribute('preserveAspectRatio','none');frame.append(this.layer);this.paint()}
 selection(){return{nodeId:this.selected,edge:this.selectedEdge,node:this.roads.nodes.find(n=>n.id===this.selected)||null}}
 notify(){this.onSelection?.(this.selection())}
 setActive(v){this.active=!!v;this.layer.classList.toggle('hidden',!this.active);if(!v)this.clearSelection();this.paint()}
 setTerrain(v){this.terrain=v||'normal'}
 point(x,y){const r=this.frame.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(x-r.left)/r.width)),y:Math.max(0,Math.min(1,(y-r.top)/r.height))}}
 addAt(x,y){const id='r-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),node={id,x:+x.toFixed(5),y:+y.toFixed(5),terrain:this.terrain,effects:['swamp','river'].includes(this.terrain)?['wet']:[]};this.roads.nodes.push(node);if(this.selected)this.connect(this.selected,id);this.selected=id;this.selectedEdge=null;this.commit();this.notify()}
 connect(a,b){if(a!==b&&!this.roads.edges.some(e=>(e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a)))this.roads.edges.push([a,b])}
 select(id){if(this.selected&&this.selected!==id)this.connect(this.selected,id);this.selected=id;this.selectedEdge=null;this.commit();this.notify()}
 selectEdge(e){this.selected=null;this.selectedEdge=e;this.paint();this.notify()}
 clearSelection(){this.selected=null;this.selectedEdge=null;this.paint();this.notify()}
 removeSelectedNode(){if(!this.selected)return;this.removeNode(this.selected);this.notify()}
 removeSelectedEdge(){if(!this.selectedEdge)return;this.roads.edges=this.roads.edges.filter(e=>e!==this.selectedEdge);this.selectedEdge=null;this.commit();this.notify()}
 removeNode(id){this.roads.nodes=this.roads.nodes.filter(n=>n.id!==id);this.roads.edges=this.roads.edges.filter(e=>e[0]!==id&&e[1]!==id);for(const [p,a] of Object.entries(this.roads.access||{}))if(a.node===id)delete this.roads.access[p];if(this.selected===id)this.selected=null;this.commit()}
 clearAll(){this.roads.nodes=[];this.roads.edges=[];this.roads.access={};this.selected=null;this.selectedEdge=null;this.commit();this.notify()}
 bindPoi(poiId,nodeId=this.selected){if(!nodeId)return;this.roads.access=this.roads.access||{};this.roads.access[poiId]={node:nodeId};this.commit();this.notify()}
 nearestPoi(x,y,max=.045){let best=null;for(const p of this.getPois()){const d=Math.hypot(p.x-x,p.y-y);if(d<=max&&(!best||d<best.d))best={p,d}}return best?.p||null}
 commit(){saveEditableRoads(this.regionId,this.roads);this.paint();this.onChange?.(this.roads)}
 paint(){this.layer.replaceChildren();if(!this.active)return;const by=new Map(this.roads.nodes.map(n=>[n.id,n]));for(const edge of this.roads.edges){const a=by.get(edge[0]),b=by.get(edge[1]);if(!a||!b)continue;const l=document.createElementNS(NS,'line');[['x1',a.x*1000],['y1',a.y*1000],['x2',b.x*1000],['y2',b.y*1000]].forEach(([k,v])=>l.setAttribute(k,v/1000));l.classList.add('road-editor-edge','road-edge-'+(a.terrain||'normal')+'-'+(b.terrain||'normal'));l.dataset.fromTerrain=a.terrain||'normal';l.dataset.toTerrain=b.terrain||'normal';if(this.selectedEdge===edge)l.classList.add('selected');l.onpointerdown=e=>{e.preventDefault();e.stopPropagation();this.selectEdge(edge)};this.layer.append(l)}
  for(const n of this.roads.nodes){const c=document.createElementNS(NS,'circle');c.setAttribute('cx',n.x);c.setAttribute('cy',n.y);c.setAttribute('r',this.selected===n.id?.012:.008);c.setAttribute('vector-effect','non-scaling-stroke');c.classList.add('road-editor-node','road-terrain-'+(n.terrain||'normal'));if(Object.values(this.roads.access||{}).some(a=>a.node===n.id))c.classList.add('bound');c.onpointerdown=e=>{e.preventDefault();e.stopPropagation();this.drag={id:n.id,pointerId:e.pointerId,x:e.clientX,y:e.clientY,moved:false};c.setPointerCapture?.(e.pointerId)};c.onpointermove=e=>{if(!this.drag||this.drag.id!==n.id)return;const p=this.point(e.clientX,e.clientY);if(Math.hypot(e.clientX-this.drag.x,e.clientY-this.drag.y)>5)this.drag.moved=true;n.x=+p.x.toFixed(5);n.y=+p.y.toFixed(5);c.setAttribute('cx',n.x);c.setAttribute('cy',n.y);for(const line of this.layer.querySelectorAll('.road-editor-edge')){}this.paint()};c.onpointerup=e=>{if(!this.drag||this.drag.id!==n.id)return;const moved=this.drag.moved;this.drag=null;if(moved){this.commit();const p=this.nearestPoi(n.x,n.y);if(p&&confirm('Привязать этот узел к «'+p.name+'»?'))this.bindPoi(p.id,n.id)}else this.select(n.id)};this.layer.append(c)}}
 destroy(){this.layer.remove()}
}
