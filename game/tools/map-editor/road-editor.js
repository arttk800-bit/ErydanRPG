const KEY='eirdan.region-roads.v1',NS='http://www.w3.org/2000/svg';
const clone=v=>JSON.parse(JSON.stringify(v));
export function loadEditableRoads(regionId,fallback){try{const all=JSON.parse(localStorage.getItem(KEY)||'{}');if(all[regionId]){const roads=all[regionId];let migrated=false;for(const [owner,a] of Object.entries(roads.access||{})){if(Array.isArray(a?.ports)){const first=a.ports.find(p=>p?.node);if(first)roads.access[owner]={node:first.node,...(first.pointId?{pointId:first.pointId}:{})};else delete roads.access[owner];migrated=true}}if(regionId==='forest'){const obsolete=new Set(['r08','r09','r25']);roads.nodes=(roads.nodes||[]).filter(n=>!obsolete.has(n.id));roads.edges=(roads.edges||[]).filter(e=>!obsolete.has(e[0])&&!obsolete.has(e[1]));for(const [id,a] of Object.entries(roads.access||{}))if(obsolete.has(a.node))delete roads.access[id];all[regionId]=roads;localStorage.setItem(KEY,JSON.stringify(all))}else if(migrated){all[regionId]=roads;localStorage.setItem(KEY,JSON.stringify(all))}return roads}}catch{}return clone(fallback)}
export function saveEditableRoads(regionId,roads){let all={};try{all=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}all[regionId]=roads;localStorage.setItem(KEY,JSON.stringify(all))}
export class RoadEditor{
 constructor({frame,regionId,roads,getPois=()=>[],onChange,onSelection}){Object.assign(this,{frame,regionId,roads,getPois,onChange,onSelection});this.active=false;this.roadType='road';this.selected=null;this.selectedEdge=null;this.drag=null;this.layer=document.createElementNS(NS,'svg');this.layer.classList.add('road-editor-layer','hidden');this.layer.setAttribute('viewBox','0 0 1 1');this.layer.setAttribute('preserveAspectRatio','none');this.layer.onclick=e=>{e.stopPropagation();if(!this.active||e.target!==this.layer)return;const p=this.point(e.clientX,e.clientY);this.addAt(p.x,p.y)};frame.append(this.layer);this.paint()}
 selection(){return{nodeId:this.selected,edge:this.selectedEdge,node:this.roads.nodes.find(n=>n.id===this.selected)||null}}
 notify(){this.onSelection?.(this.selection())}
 setActive(v){this.active=!!v;this.layer.classList.toggle('hidden',!this.active);if(!v)this.clearSelection();this.paint()}
 setRoadType(v){this.roadType=v||'road'}
 point(x,y){const r=this.frame.getBoundingClientRect(),u=(x-r.left)/r.width,v=(y-r.top)/r.height;return{x:Math.max(0,Math.min(1,u)),y:Math.max(0,Math.min(1,v))}}
 addAt(x,y){const id='r-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),node={id,x:+x.toFixed(5),y:+y.toFixed(5)};this.roads.nodes.push(node);if(this.selected)this.connect(this.selected,id);this.selected=id;this.selectedEdge=null;this.commit();this.notify()}
 isAccessNode(id){return Object.values(this.roads.access||{}).some(a=>a?.node===id)}
 degree(id){return(this.roads.edges||[]).filter(e=>e[0]===id||e[1]===id).length}
 connect(a,b){if(a===b)return false;if(this.roads.edges.some(e=>(e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a)))return false;this.roads.edges.push([a,b,[],{roadType:this.roadType}]);return true}
 select(id){if(this.selected&&this.selected!==id)this.connect(this.selected,id);this.selected=id;this.selectedEdge=null;this.commit();this.notify()}
 selectEdge(e){this.selected=null;this.selectedEdge=e;this.paint();this.notify()}
 clearSelection(){this.selected=null;this.selectedEdge=null;this.paint();this.notify()}
 removeSelectedNode(){if(!this.selected)return;this.removeNode(this.selected);this.notify()}
 removeSelectedEdge(){if(!this.selectedEdge)return;this.roads.edges=this.roads.edges.filter(e=>e!==this.selectedEdge);this.selectedEdge=null;this.commit();this.notify()}
 removeNode(id){this.roads.nodes=this.roads.nodes.filter(n=>n.id!==id);this.roads.edges=this.roads.edges.filter(e=>e[0]!==id&&e[1]!==id);for(const [p,a] of Object.entries(this.roads.access||{})){if(a?.node===id)delete this.roads.access[p]}if(this.selected===id)this.selected=null;this.commit()}
 clearAll(){this.roads.nodes=[];this.roads.edges=[];this.roads.access={};this.selected=null;this.selectedEdge=null;this.commit();this.notify()}
 bindPoi(poiId,nodeId=this.selected){if(!nodeId)return false;const poi=this.getPois().find(p=>p.id===poiId);const node=this.roads.nodes.find(n=>n.id===nodeId);if(!poi||!node)return false;for(const [id,a] of Object.entries(this.roads.access||{}))if(a.node===nodeId&&id!==poiId)delete this.roads.access[id];this.roads.access=this.roads.access||{};this.roads.access[poiId]={node:nodeId};node.x=+poi.x.toFixed(5);node.y=+poi.y.toFixed(5);this.commit();this.notify();return true}
 bindTransition(ownerId,pointId){
  const point=this.getPois().find(p=>p.id===pointId&&(p.class==='transition'||p.type==='transition'));
  if(!point)return false;
  let nearest=null;for(const node of this.roads.nodes||[]){const d=Math.hypot(node.x-point.x,node.y-point.y);if(!nearest||d<nearest.d)nearest={node,d}}
  if(!nearest||nearest.d>.08){const node={id:'transition-'+ownerId,x:+point.x.toFixed(5),y:+point.y.toFixed(5)};if(!this.roads.nodes.some(n=>n.id===node.id))this.roads.nodes.push(node);nearest={node:this.roads.nodes.find(n=>n.id===node.id),d:0}}
  this.roads.access=this.roads.access||{};this.roads.access[ownerId]={node:nearest.node.id,pointId};
  nearest.node.x=+point.x.toFixed(5);nearest.node.y=+point.y.toFixed(5);this.commit();this.notify();return true
 }
 nearestPoi(x,y,max=.045){let best=null;for(const p of this.getPois()){const d=Math.hypot(p.x-x,p.y-y);if(d<=max&&(!best||d<best.d))best={p,d}}return best?.p||null}
 commit(){saveEditableRoads(this.regionId,this.roads);this.paint();this.onChange?.(this.roads)}
 paint(){this.layer.replaceChildren();if(!this.active)return;const by=new Map(this.roads.nodes.map(n=>[n.id,n]));for(const edge of this.roads.edges){const a=by.get(edge[0]),b=by.get(edge[1]);if(!a||!b)continue;const l=document.createElementNS(NS,'line');[['x1',a.x*1000],['y1',a.y*1000],['x2',b.x*1000],['y2',b.y*1000]].forEach(([k,v])=>l.setAttribute(k,v/1000));l.classList.add('road-editor-edge');l.dataset.roadType=(edge[3]&&edge[3].roadType)||'road';if(this.selectedEdge===edge)l.classList.add('selected');l.onpointerdown=e=>{e.preventDefault();e.stopPropagation();this.selectEdge(edge)};this.layer.append(l)}
  for(const n of this.roads.nodes){const c=document.createElementNS(NS,'circle');c.setAttribute('cx',n.x);c.setAttribute('cy',n.y);c.setAttribute('r',this.selected===n.id?.012:.008);c.setAttribute('vector-effect','non-scaling-stroke');c.classList.add('road-editor-node');if(this.degree(n.id)>2)c.classList.add('junction');if(this.isAccessNode(n.id))c.classList.add('bound');c.onpointerdown=e=>{e.preventDefault();e.stopPropagation();this.drag={id:n.id,pointerId:e.pointerId,x:e.clientX,y:e.clientY,moved:false};c.setPointerCapture?.(e.pointerId)};c.onpointermove=e=>{if(this.frame.dataset.pinching==='1'||!this.drag||this.drag.id!==n.id)return;const p=this.point(e.clientX,e.clientY);if(Math.hypot(e.clientX-this.drag.x,e.clientY-this.drag.y)>5)this.drag.moved=true;n.x=+p.x.toFixed(5);n.y=+p.y.toFixed(5);c.setAttribute('cx',n.x);c.setAttribute('cy',n.y);for(const line of this.layer.querySelectorAll('.road-editor-edge')){}this.paint()};c.onpointerup=e=>{e.preventDefault();e.stopPropagation();if(!this.drag||this.drag.id!==n.id)return;const moved=this.drag.moved;this.drag=null;if(moved)this.commit();else this.select(n.id)};this.layer.append(c)}}
 destroy(){this.layer.remove()}
}
