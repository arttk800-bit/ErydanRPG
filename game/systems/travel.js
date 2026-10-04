import {RoadSystem} from './roads.js';
import {PauseSystem} from './pause.js';
function atPolyline(polyline,t){if(!polyline?.length)return null;if(polyline.length===1)return{...polyline[0]};const lens=[];let total=0;for(let i=1;i<polyline.length;i++){const n=Math.hypot(polyline[i].x-polyline[i-1].x,polyline[i].y-polyline[i-1].y);lens.push(n);total+=n}let target=Math.max(0,Math.min(1,t))*total;for(let i=0;i<lens.length;i++){if(target<=lens[i]){const a=polyline[i],b=polyline[i+1],q=lens[i]?target/lens[i]:0;return{x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q}}target-=lens[i]}return{...polyline.at(-1)}}
export const TravelSystem={
 ensure(state){state.world=state.world||{};state.world.travel=state.world.travel||{status:'idle'};return state.world.travel},
 start(state,{roads,points,fromId,toId,method='walk'}){const route=RoadSystem.route(roads,points,fromId,toId);if(!route)return null;const t={status:'travelling',regionId:roads.regionId,fromId,toId,method,progress:0,route,position:atPolyline(route.polyline,0)};state.world.travel=t;return t},
 tick(state,deltaSeconds,speed=.025){const t=this.ensure(state);if(t.status!=='travelling'||PauseSystem.isPaused(state))return t;const before=t.progress;t.progress=Math.min(1,t.progress+Math.max(0,deltaSeconds)*speed);t.position=atPolyline(t.route.polyline,t.progress);t.deltaProgress=t.progress-before;if(t.progress>=1)t.status='arrived';return t},
 pauseForEvent(state,eventId){const t=this.ensure(state);if(t.status==='travelling')t.status='event';t.eventId=eventId||null;PauseSystem.set(state,'event',true);return t},
 resumeEvent(state){const t=this.ensure(state);PauseSystem.set(state,'event',false);if(t.status==='event'){t.status='travelling';t.eventId=null}return t},
 cancel(state){state.world.travel={status:'idle'};return state.world.travel}
};
