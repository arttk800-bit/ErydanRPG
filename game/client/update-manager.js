import {actionDiagnostics} from '../diagnostics/action-diagnostics.js';
import {runtimeTrace} from '../diagnostics/runtime-trace.js';

export class UpdateManager{
 constructor({registration,getInstalled,fetchRemote,onState,onAvailable,onReady,onApply}){
  this.registration=registration;this.getInstalled=getInstalled;this.fetchRemote=fetchRemote;this.onState=onState;this.onAvailable=onAvailable;this.onReady=onReady;this.onApply=onApply;this.busy=false;this.available=null;this.state='idle';
 }
 setState(state,data={}){runtimeTrace.system('update','state',{from:this.state,to:state,...data});this.state=state;actionDiagnostics.record('update',state,data);this.onState?.(state,data)}
 same(a,b){return a?.version===b?.version&&a?.build===b?.build}
 async check({manual=false}={}){
  const trace=runtimeTrace.begin('update.check',{manual});
  if(this.busy){actionDiagnostics.record('update','blocked',{state:this.state});return null}
  this.busy=true;this.setState('checking',{manual});
  try{
   const installed=await this.getInstalled(),remote=await this.fetchRemote();
   actionDiagnostics.record('update','compared',{installed,remote});
   if(this.same(installed,remote)){this.available=null;this.setState('current',{version:installed.version});this.busy=false;return null}
   this.available=remote;this.setState('available',{remote});this.onAvailable?.(remote);
   this.busy=false;runtimeTrace.end(trace,{ok:true,available:true,remote});return remote;
  }catch(error){this.setState('error',{step:'manifest',message:errorMessage(error)});runtimeTrace.error('update.check',error);runtimeTrace.end(trace,{ok:false});this.busy=false;return null}
 }
 async update(){
  const trace=runtimeTrace.begin('update.reload');
  if(this.busy){actionDiagnostics.record('update','blocked',{state:this.state});return false}
  this.busy=true;
  try{
   const remote=this.available||await this.fetchRemote();
   this.available=remote;this.setState('reloading',{remote});
   await this.onApply?.(remote);runtimeTrace.end(trace,{ok:true,remote});return true;
  }catch(error){this.setState('error',{step:'reload',message:errorMessage(error)});runtimeTrace.error('update.reload',error);runtimeTrace.end(trace,{ok:false});return false}
  finally{this.busy=false}
 }
 async download(){return this.update()}
 async apply(){return this.update()}
}
function errorMessage(error){return error instanceof Error?error.message:String(error)}
