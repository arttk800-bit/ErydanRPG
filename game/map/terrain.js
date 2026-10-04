// Polygonal terrain model. Map geometry owns zones; travel consumes their traversal profile.
export const TERRAIN_TYPES={
 plain:{label:'Равнина',walk:1,horse:1,passable:true},
 forest:{label:'Лес',walk:.86,horse:.68,passable:true},
 swamp:{label:'Болото',walk:.55,horse:.32,passable:true},
 mountain:{label:'Горы',walk:.66,horse:.48,passable:true},
 water:{label:'Глубокая вода',walk:0,horse:0,passable:false},
 blocked:{label:'Непроходимая область',walk:0,horse:0,passable:false}
};
function inside(p,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a.y>p.y)!==(b.y>p.y))&&(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y||1e-12)+a.x))hit=!hit}return hit}
function crossT(a,b,c,d){const rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y,den=rx*sy-ry*sx;if(Math.abs(den)<1e-12)return null;const qx=c.x-a.x,qy=c.y-a.y,t=(qx*sy-qy*sx)/den,u=(qx*ry-qy*rx)/den;return t>1e-8&&t<1-1e-8&&u>=0&&u<=1?t:null}
function zoneAt(zones,p){let best=null;for(const z of zones||[]){if(!z?.polygon?.length||!inside(p,z.polygon))continue;if(!best||(z.priority||0)>=(best.priority||0))best=z}return best}
export const TerrainSystem={
 type(id){return TERRAIN_TYPES[id]||TERRAIN_TYPES.plain},
 at(zones,p){const z=zoneAt(zones,p);return z?.type||'plain'},
 segmentSpans(zones,a,b){
  const cuts=[0,1];for(const z of zones||[]){const p=z?.polygon||[];for(let i=0;i<p.length;i++){const t=crossT(a,b,p[i],p[(i+1)%p.length]);if(t!=null)cuts.push(t)}}
  cuts.sort((x,y)=>x-y);const uniq=cuts.filter((v,i)=>!i||Math.abs(v-cuts[i-1])>1e-7),out=[];
  for(let i=1;i<uniq.length;i++){const t0=uniq[i-1],t1=uniq[i],m=(t0+t1)/2,p={x:a.x+(b.x-a.x)*m,y:a.y+(b.y-a.y)*m},terrain=this.at(zones,p);out.push({terrain,fraction:t1-t0,passable:this.type(terrain).passable})}
  return out;
 },
 pathPassable(zones,path){for(let i=1;i<(path?.length||0);i++)if(this.segmentSpans(zones,path[i-1],path[i]).some(s=>!s.passable))return false;return true}
};
