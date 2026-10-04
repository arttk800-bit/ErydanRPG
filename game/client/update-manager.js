import {actionDiagnostics} from '../diagnostics/action-diagnostics.js';

export class UpdateManager{
 constructor({registration,getInstalled,fetchRemote,onState,onAvailable,onReady,onApply}){
  this.registration=registration;this.getInstalled=getInstalled;this.fetchRemote=fetchRemote;this.onState=onState;this.onAvailable=onAvailable;this.onReady=onReady;this.onApply=onApply;this.busy=false;this.available=null;this.state='idle';
 }
 setState(state,data={}){this.state=state;actionDiagnostics.record('update',state,data);this.onState?.(state,data)}
 async exclusive(task){if(this.busy){actionDiagnostics.record('update','blocked',{state:this.state});return false}this.busy=true;try{return await task()}finally{this.busy=false}}
 same(a,b){return a?.version===b?.version&&a?.build===b?.build}
 async check({manual=false}={}){
  return this.exclusive(async()=>{this.setState('checking',{manual});
   try{const installed=await this.getInstalled(),remote=await this.fetchRemote();actionDiagnostics.record('update','compared',{installed,remote});if(this.same(installed,remote)){this.available=null;this.setState('current',{version:installed.version});return null}this.available=remote;this.setState('available',{remote});this.onAvailable?.(remote);return remote}
   catch(error){this.setState('error',{step:'manifest',message:errorMessage(error)});return null}
  });
 }
 async download(meta=this.available){
  return this.exclusive(async()=>{if(!meta){this.setState('error',{step:'metadata',message:'no update metadata'});return false}
   try{
    this.setState('downloading',{remote:meta,step:'service-worker-update'});
    await this.registration.update();
    const worker=this.registration.installing||this.registration.waiting||this.registration.active;
    if(worker&&worker.state==='installing')await waitWorker(worker);
    await waitForBuild(meta.build,this.registration,30000);
    this.setState('ready',{remote:meta,workerState:(this.registration.active||this.registration.waiting)?.state||null});this.onReady?.(meta);return true;
   }catch(error){this.setState('error',{step:'service-worker',message:errorMessage(error)});return false}
  });
 }
 async apply(){
  return this.exclusive(async()=>{try{
    const remote=this.available||await this.fetchRemote();this.setState('installing',{remote,step:'verify-active-build'});
    await waitForBuild(remote.build,this.registration,12000);
    this.setState('applied',{remote});await this.onApply?.(remote);return true;
   }catch(error){this.setState('error',{step:'activation',message:errorMessage(error)});return false}
  });
 }
}
function errorMessage(error){return error instanceof Error?error.message:String(error)}
function waitWorker(worker,timeout=30000){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{cleanup();reject(new Error('worker install timeout'))},timeout);const done=()=>{if(worker.state==='installed'||worker.state==='activated'){cleanup();resolve()}else if(worker.state==='redundant'){cleanup();reject(new Error('worker became redundant'))}};const cleanup=()=>{clearTimeout(timer);worker.removeEventListener('statechange',done)};worker.addEventListener('statechange',done);done()})}
function waitForBuild(expected,registration,timeout=20000){return new Promise((resolve,reject)=>{let done=false;const finish=(ok,reason)=>{if(done)return;done=true;clearInterval(poll);clearTimeout(timer);navigator.serviceWorker.removeEventListener('message',message);ok?resolve():reject(new Error(reason||'active build mismatch'))};const message=e=>{if((e.data?.type==='SW_ACTIVATED'||e.data?.type==='SW_BUILD')&&e.data.build===expected)finish(true)};const ask=()=>{registration.active?.postMessage({type:'GET_BUILD'});navigator.serviceWorker.controller?.postMessage({type:'GET_BUILD'})};navigator.serviceWorker.addEventListener('message',message);const poll=setInterval(ask,300);const timer=setTimeout(()=>finish(false,'expected service worker '+expected+' did not activate'),timeout);ask()})}
