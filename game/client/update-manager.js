import {actionDiagnostics} from '../diagnostics/action-diagnostics.js';

export class UpdateManager{
 constructor({registration,getInstalled,fetchRemote,onState,onAvailable,onReady,onApply}){
  this.registration=registration;this.getInstalled=getInstalled;this.fetchRemote=fetchRemote;this.onState=onState;this.onAvailable=onAvailable;this.onReady=onReady;this.onApply=onApply;this.busy=false;this.available=null;this.state='idle';
 }
 setState(state,data={}){this.state=state;actionDiagnostics.record('update',state,data);this.onState?.(state,data)}
 same(a,b){return a?.version===b?.version&&a?.build===b?.build}
 async check({manual=false}={}){
  if(this.busy){actionDiagnostics.record('update','blocked',{state:this.state});return null}
  this.busy=true;this.setState('checking',{manual});
  try{
   const installed=await this.getInstalled(),remote=await this.fetchRemote();
   actionDiagnostics.record('update','compared',{installed,remote});
   if(this.same(installed,remote)){this.available=null;this.setState('current',{version:installed.version});this.busy=false;return null}
   this.available=remote;this.setState('available',{remote});this.onAvailable?.(remote);
   this.busy=false;return remote;
  }catch(error){this.setState('error',{step:'manifest',message:errorMessage(error)});this.busy=false;return null}
 }
 async update(){
  if(this.busy){actionDiagnostics.record('update','blocked',{state:this.state});return false}
  this.busy=true;
  try{
   let remote=this.available;
   if(!remote){
    this.setState('checking',{manual:true});
    const installed=await this.getInstalled();remote=await this.fetchRemote();
    if(this.same(installed,remote)){this.available=null;this.setState('current',{version:installed.version});return true}
    this.available=remote;
   }
   this.setState('downloading',{remote,step:'service-worker-update'});
   await this.registration.update();
   let worker=this.registration.installing||this.registration.waiting;
   if(worker?.state==='installing')await waitWorker(worker);
   worker=this.registration.waiting||this.registration.installing;
   if(worker?.state==='installing')await waitWorker(worker);
   if(worker&&worker.state==='installed')worker.postMessage({type:'SKIP_WAITING'});
   this.setState('installing',{remote,step:'activate-and-verify'});
   await waitForBuild(remote.build,this.registration,20000);
   this.setState('applied',{remote});
   await this.onApply?.(remote);
   return true;
  }catch(error){this.setState('error',{step:'activation',message:errorMessage(error)});return false}
  finally{this.busy=false}
 }
 async download(){return this.update()}
 async apply(){return this.update()}
}
function errorMessage(error){return error instanceof Error?error.message:String(error)}
function waitWorker(worker,timeout=30000){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{cleanup();reject(new Error('worker install timeout'))},timeout);const done=()=>{if(worker.state==='installed'||worker.state==='activated'){cleanup();resolve()}else if(worker.state==='redundant'){cleanup();reject(new Error('worker became redundant'))}};const cleanup=()=>{clearTimeout(timer);worker.removeEventListener('statechange',done)};worker.addEventListener('statechange',done);done()})}
function waitForBuild(expected,registration,timeout=20000){return new Promise((resolve,reject)=>{let done=false;const finish=(ok,reason)=>{if(done)return;done=true;clearInterval(poll);clearTimeout(timer);navigator.serviceWorker.removeEventListener('message',message);navigator.serviceWorker.removeEventListener('controllerchange',ask);ok?resolve():reject(new Error(reason||'active build mismatch'))};const message=e=>{if((e.data?.type==='SW_ACTIVATED'||e.data?.type==='SW_BUILD')&&e.data.build===expected)finish(true)};const ask=()=>{registration.active?.postMessage({type:'GET_BUILD'});navigator.serviceWorker.controller?.postMessage({type:'GET_BUILD'});registration.waiting?.postMessage({type:'SKIP_WAITING'})};navigator.serviceWorker.addEventListener('message',message);navigator.serviceWorker.addEventListener('controllerchange',ask);const poll=setInterval(ask,250);const timer=setTimeout(()=>finish(false,'expected service worker '+expected+' did not activate'),timeout);ask()})}
