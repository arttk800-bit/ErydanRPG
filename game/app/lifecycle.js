export class Lifecycle{
 constructor({onBack,onSuspend,onResume}={}){this.onBack=onBack;this.onSuspend=onSuspend;this.onResume=onResume;this.started=false}
 start(){if(this.started)return;this.started=true;history.replaceState({eirdan:true},'');history.pushState({eirdan:true},'');window.addEventListener('popstate',()=>{const handled=this.onBack?.()!==false;if(handled)history.pushState({eirdan:true},'')});document.addEventListener('visibilitychange',()=>{if(document.hidden)this.onSuspend?.();else this.onResume?.()});window.addEventListener('pagehide',()=>this.onSuspend?.())}
}
