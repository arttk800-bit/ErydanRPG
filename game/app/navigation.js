import {runtimeTrace} from '../diagnostics/runtime-trace.js';
const SCREEN_IDS={main:'screen-main',game:'screen-game',settings:'screen-settings',debug:'screen-debug'};
export class Navigation{
 constructor(root=document){this.root=root;this.stack=['main'];runtimeTrace.system('navigation','init',{stack:this.stack})}
 current(){return this.stack.at(-1)}
 show(name,{push=true}={}){const trace=runtimeTrace.begin('navigation.show',{from:this.current(),to:name,push});try{if(!SCREEN_IDS[name])throw new Error('Unknown screen: '+name);const overlay=name==='settings'||name==='debug';if(!overlay)for(const id of Object.values(SCREEN_IDS))this.root.getElementById(id)?.classList.add('hidden');else this.root.getElementById(SCREEN_IDS.settings)?.classList.add('hidden');this.root.getElementById(SCREEN_IDS[name])?.classList.remove('hidden');if(push&&this.current()!==name)this.stack.push(name);runtimeTrace.end(trace,{ok:true,stack:[...this.stack],ui:runtimeTrace.uiSnapshot()});return name}catch(e){runtimeTrace.error('navigation.show',e,{name});runtimeTrace.end(trace,{ok:false});throw e}}
 back(){const trace=runtimeTrace.begin('navigation.back',{stack:[...this.stack]});if(this.stack.length>1)this.stack.pop();const out=this.show(this.current(),{push:false});runtimeTrace.end(trace,{stack:[...this.stack]});return out}
 reset(name='main'){const trace=runtimeTrace.begin('navigation.reset',{name});this.stack=[name];const out=this.show(name,{push:false});runtimeTrace.end(trace,{stack:[...this.stack]});return out}
}
