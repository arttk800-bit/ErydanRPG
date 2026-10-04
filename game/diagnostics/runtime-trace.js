const KEY='eirdan.runtime-trace.v1',MAX_EVENTS=6000,MAX_BYTES=4*1024*1024;
function clone(v){try{return structuredClone(v)}catch{try{return JSON.parse(JSON.stringify(v))}catch{return String(v)}}}
function compactState(s){if(!s)return null;return clone({clock:s.clock,world:s.world,meta:s.meta?{worldId:s.meta.worldId,worldName:s.meta.worldName}:null})}
function diff(a,b,path='',out=[]){if(Object.is(a,b))return out;if(typeof a!=='object'||a===null||typeof b!=='object'||b===null){out.push({path:path||'$',before:a,after:b});return out}const keys=new Set([...Object.keys(a),...Object.keys(b)]);for(const k of keys){if(out.length>=80)break;diff(a[k],b[k],path?path+'.'+k:k,out)}return out}
class RuntimeTrace{
 constructor(){this.seq=0;this.events=[];this.spans=new Map();this.stateProvider=null;this.dirty=false;this.load();setInterval(()=>this.flush(),4000)}
 setStateProvider(fn){this.stateProvider=fn}
 state(){try{return compactState(this.stateProvider?.())}catch{return null}}
 record(kind,name,data={}){const e={id:++this.seq,at:new Date().toISOString(),mono:Math.round(performance.now()),kind,name,data:clone(data)};this.events.push(e);if(this.events.length>MAX_EVENTS)this.events.splice(0,this.events.length-MAX_EVENTS);this.dirty=true;return e}
 begin(name,data={}){const id='t'+(++this.seq),before=this.state();this.spans.set(id,{id,name,start:performance.now(),before});this.record('span','begin:'+name,{traceId:id,...data});return id}
 end(id,data={}){const x=this.spans.get(id);if(!x)return null;this.spans.delete(id);const after=this.state(),changes=diff(x.before,after);return this.record('span','end:'+x.name,{traceId:id,durationMs:+(performance.now()-x.start).toFixed(2),changes,...data})}
 uiSnapshot(){try{const screen=document.querySelector('[data-screen]:not(.hidden),.screen:not(.hidden)');return{screen:screen?.dataset?.screen||screen?.id||null,modal:document.querySelector('dialog[open],.modal:not(.hidden)')?.id||null,actionCard:document.querySelector('.map-point-action h3,.map-point-action strong')?.textContent||null,travel:document.querySelector('.travel-status')?.textContent?.trim().slice(0,300)||null,focused:document.activeElement?.id||document.activeElement?.tagName||null}}catch{return null}}
 ui(action,element,data={}){return this.record('ui',action,{element,ui:this.uiSnapshot(),...data})}
 checkpoint(name,data={}){return this.record('checkpoint',name,{state:this.state(),ui:this.uiSnapshot(),...data})}
 system(name,phase,data={}){return this.record('system',name,{phase,...data})}
 animation(name,data={}){return this.record('animation',name,data)}
 error(source,error,data={}){return this.record('error',source,{message:String(error?.message||error),stack:error?.stack||null,...data})}
 snapshot(){return this.events.slice()}
 export(){return{format:'eirdan-runtime-trace',version:1,generatedAt:new Date().toISOString(),events:this.snapshot()}}
 load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(Array.isArray(x?.events)){this.events=x.events.slice(-MAX_EVENTS);this.seq=this.events.reduce((m,e)=>Math.max(m,e.id||0),0)}}catch{}}
 flush(){if(!this.dirty)return;try{let payload=JSON.stringify({events:this.events});while(payload.length>MAX_BYTES&&this.events.length>100){this.events.splice(0,Math.ceil(this.events.length*.1));payload=JSON.stringify({events:this.events})}localStorage.setItem(KEY,payload);this.dirty=false}catch{}}
 selfTest(){const before=this.events.length,id=this.begin('runtimeTrace.selfTest',{probe:true});this.system('runtimeTrace.selfTest','probe',{ok:true});this.end(id,{ok:true});const added=this.events.slice(before);return{ok:added.some(e=>e.name==='begin:runtimeTrace.selfTest')&&added.some(e=>e.name==='end:runtimeTrace.selfTest'),events:added.length}}
 clear(){this.events=[];this.spans.clear();this.dirty=true;this.flush()}
}
export const runtimeTrace=new RuntimeTrace();
