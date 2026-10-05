import {formatDiagnosticLog} from './format.js';
import {runtimeTrace} from './runtime-trace.js';
import {makeZip,downloadBlob} from './zip.js';
function json(v){return JSON.stringify(v,null,2)}
export function downloadDiagnosticArchive(d,buildMeta={}){
 const stamp=new Date().toISOString().replace(/[:.]/g,'-');
 const summary={format:'eirdan-diagnostic-archive',version:1,generatedAt:new Date().toISOString(),release:{version:buildMeta?.version||null,build:buildMeta?.build||null,stage:buildMeta?.stage||null},ok:d.ok,checks:d.checks,update:d.update,runtimeTrace:d.runtimeTrace};
 const files=[
  {name:'summary.json',data:json(summary)},
  {name:'shell-diagnostic.txt',data:formatDiagnosticLog(d)},
  {name:'runtime-trace.json',data:json(runtimeTrace.export())},
  {name:'actions.json',data:json(d.actions||[])},
  {name:'state-diagnostics.json',data:json(d.state||{})},
  {name:'world-simulation-diagnostics.json',data:json(d.world||{})},
  {name:'pwa-cache-diagnostics.json',data:json(d.pwa||{})},
  {name:'audio-diagnostics.json',data:json(d.audio||{})},
  {name:'map-diagnostics.json',data:json(d.map||{})},
  {name:'travel-diagnostics.json',data:json(d.travel||{})},
  {name:'ui-smoke-diagnostics.json',data:json(d.ui||{})}
 ];
 const blob=makeZip(files),name='Eirdan-diagnostics-'+(buildMeta?.version||'unknown')+'-'+stamp+'.zip';
 runtimeTrace.system('diagnostics','archive',{name,files:files.map(x=>x.name),bytes:blob.size});
 downloadBlob(blob,name);return{name,size:blob.size,files:files.map(x=>x.name)};
}
