export class ActionDiagnostics{
 constructor(limit=300){this.limit=limit;this.events=[];this.seq=0}
 record(action,phase,data={}){
  const item={id:++this.seq,at:new Date().toISOString(),action,phase,data};
  this.events.push(item);if(this.events.length>this.limit)this.events.shift();
  return item;
 }
 latest(action){return [...this.events].reverse().find(x=>x.action===action)||null}
 snapshot(){return this.events.slice()}
 verify(action,expectedPhase){const e=this.latest(action);return{ok:!!e&&e.phase===expectedPhase,event:e}}
}
export const actionDiagnostics=new ActionDiagnostics();
