const KEY='eirdan.region-roads.v1';
const svgNS='http://www.w3.org/2000/svg';
const clone=v=>JSON.parse(JSON.stringify(v));
export function loadEditableRoads(regionId,fallback){try{const all=JSON.parse(localStorage.getItem(KEY)||'{}');if(all[regionId])return all[regionId]}catch{}return clone(fallback)}
export function saveEditableRoads(regionId,roads){let all={};try{all=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}all[regionId]=roads;localStorage.setItem(KEY,JSON.stringify(all))}
export class RoadEditor{
 constructor({frame,regionId,roads,onChange,onSelection}){this.frame=frame;this.regionId=regionId;this.roads=roads;this.onChange=onChange;this.onSelection=onSelection;this.active=false;this.kind='road';this.selected=null;this.selectedEdge=null;this.layer=document.createElementNS(svgNS,'svg');this.layer.classList.add('road-editor-layer','hidden');this.layer.setAttribute('viewBox','0 0 1000 1000');frame.append(this.layer);this.paint()}
 selection(){return{nodeId:this.selected,edge:this.selectedEdge}}
 notifySelection(){this.onSelection?.(this.selection())}
 setActive(v){this.active=!!v;this.layer.classList.toggle('hidden',!this.active);if(!this.active)this.clearSelection();this.paint()}
 setKind(kind){this.kind=kind||'road'}
 point(clientX,clientY){const r=this.frame.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(clientY-r.top)/r.height))}}
 addAt(x,y){const id='r-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),node={id,x:+x.toFixed(5),y:+y.toFixed(5),kind:this.kind};this.roads.nodes.push(node);if(this.selected)this.connect(this.selected,id);this.selected=id;this.selectedEdge=null;this.commit();this.notifySelection();return node}
 connect(a,b){if(a===b)return;if(!this.roads.edges.some(e=>(e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a)))this.roads.edges.push([a,b])}
 select(id){if(this.selected&&this.selected!==id)this.connect(this.selected,id);this.selected=id;this.selectedEdge=null;this.commit();this.notifySelection()}
 selectEdge(edge){this.selected=null;this.selectedEdge=edge;this.paint();this.notifySelection()}
 clearSelection(){this.selected=null;this.selectedEdge=null;this.paint();this.notifySelection()}
 removeSelectedNode(){if(!this.selected)return false;this.removeNode(this.selected);this.notifySelection();return true}
 removeSelectedEdge(){if(!this.selectedEdge)return false;this.removeEdge(this.selectedEdge);this.selectedEdge=null;this.notifySelection();return true}
 removeNode(id){this.roads.nodes=this.roads.nodes.filter(n=>n.id!==id);this.roads.edges=this.roads.edges.filter(e=>e[0]!==id&&e[1]!==id);for(const [poi,a] of Object.entries(this.roads.access||{}))if(a.node===id)delete this.roads.access[poi];if(this.selected===id)this.selected=null;this.commit()}
 removeEdge(edge){this.roads.edges=this.roads.edges.filter(e=>e!==edge);this.commit()}
 bindPoi(poiId,nodeId=this.selected){if(!nodeId)return false;this.roads.access=this.roads.access||{};this.roads.access[poiId]={node:nodeId};this.commit();return true}
 commit(){saveEditableRoads(this.regionId,this.roads);this.paint();this.onChange?.(this.roads)}
 paint(){this.layer.replaceChildren();if(!this.active)return;const nodes=new Map(this.roads.nodes.map(n=>[n.id,n]));for(const edge of this.roads.edges){const a=nodes.get(edge[0]),b=nodes.get(edge[1]);if(!a||!b)continue;const line=document.createElementNS(svgNS,'line');for(const [k,v] of [['x1',a.x*1000],['y1',a.y*1000],['x2',b.x*1000],['y2',b.y*1000]])line.setAttribute(k,v);line.classList.add('road-editor-edge');if(this.selectedEdge===edge)line.classList.add('selected');line.onclick=e=>{e.stopPropagation();this.selectEdge(edge)};this.layer.append(line)}for(const n of this.roads.nodes){const c=document.createElementNS(svgNS,'circle');c.setAttribute('cx',n.x*1000);c.setAttribute('cy',n.y*1000);c.setAttribute('r',this.selected===n.id?12:8);c.classList.add('road-editor-node','road-kind-'+(n.kind||'road'));c.onclick=e=>{e.stopPropagation();this.select(n.id)};this.layer.append(c)}}
 destroy(){this.layer.remove()}
}
