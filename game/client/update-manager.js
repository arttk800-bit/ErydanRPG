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
   const activation=await this.activateServiceWorker(remote);
   await this.onApply?.(remote,activation);runtimeTrace.end(trace,{ok:true,remote,activation});return true;
  }catch(error){this.setState('error',{step:'reload',message:errorMessage(error)});runtimeTrace.error('update.reload',error);runtimeTrace.end(trace,{ok:false});return false}
  finally{this.busy=false}
 }
 async activateServiceWorker(remote){
  const reg=this.registration;if(!reg)return;
  this.setState('reloading',{remote,phase:'service-worker'});
  await reg.update();
  const worker=reg.waiting||reg.installing;
  if(worker){
   if(worker.state==='installing')await waitWorkerState(worker,'installed',8000);
   (reg.waiting||worker).postMessage({type:'SKIP_WAITING'});
  }
  const expected=remote?.build||null;
  try{const build=await waitForControllerBuild(expected,5000);this.setState('reloading',{remote,phase:'activated',build});return{activated:true,build}}
  catch(error){runtimeTrace.system('update','activation-fallback',{expected,message:errorMessage(error)});return{activated:false,build:await controllerBuild()}}
 }
 async download(){return this.update()}
 async apply(){return this.update()}
}
function errorMessage(error){return error instanceof Error?error.message:String(error)}

function waitWorkerState(worker,state,timeout){return new Promise((resolve,reject)=>{if(worker.state===state||worker.state==='activated')return resolve();const timer=setTimeout(()=>{worker.removeEventListener('statechange',on);reject(new Error('service worker install timeout'))},timeout);function on(){if(worker.state===state||worker.state==='activated'){clearTimeout(timer);worker.removeEventListener('statechange',on);resolve()}else if(worker.state==='redundant'){clearTimeout(timer);worker.removeEventListener('statechange',on);reject(new Error('service worker became redundant'))}}worker.addEventListener('statechange',on)})}
async function controllerBuild(timeout=1200){if(!navigator.serviceWorker?.controller)return null;return new Promise(resolve=>{const timer=setTimeout(()=>{navigator.serviceWorker.removeEventListener('message',on);resolve(null)},timeout);function on(e){if(e.data?.type==='SW_BUILD'){clearTimeout(timer);navigator.serviceWorker.removeEventListener('message',on);resolve(e.data.build||null)}}navigator.serviceWorker.addEventListener('message',on);navigator.serviceWorker.controller.postMessage({type:'GET_BUILD'})})}
function waitForControllerBuild(expected,timeout){return new Promise((resolve,reject)=>{let done=false,timer=null;const finish=v=>{if(done)return;done=true;clearTimeout(timer);navigator.serviceWorker.removeEventListener('controllerchange',check);resolve(v)};const check=async()=>{const build=await controllerBuild();if(!expected||build===expected)finish(build)};timer=setTimeout(async()=>{navigator.serviceWorker.removeEventListener('controllerchange',check);const build=await controllerBuild();if(!expected||build===expected)finish(build);else if(!done){done=true;reject(new Error('service worker activation timeout'))}},timeout);navigator.serviceWorker.addEventListener('controllerchange',check);check()})}
