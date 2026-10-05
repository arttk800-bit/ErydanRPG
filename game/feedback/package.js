// ============================================================================
// FEEDBACK PACKAGE
// Builds the portable feedback payload used by download and future transports.
// ============================================================================
import {runtimeTrace} from '../diagnostics/runtime-trace.js';
import {formatDiagnosticLog} from '../diagnostics/format.js';
import {collectDeviceInfo} from './device-info.js';

const safeName=(name,i)=>{const ext=(name.match(/\.[a-z0-9]+$/i)||['.bin'])[0];return 'screenshots/screenshot-'+String(i+1).padStart(2,'0')+ext.toLowerCase()};
async function bytes(file){return new Uint8Array(await file.arrayBuffer())}

export async function buildFeedbackPackage({type,title,text,steps='',expected='',actual='',screenshots=[],includeDiagnostics=false,technicalInfoConsent=false,diagnostics=null,buildMeta=null}){
 const report={format:'eirdan-feedback',version:1,createdAt:new Date().toISOString(),type,title:title.trim(),text:text.trim(),
  bug:type==='bug'?{steps:steps.trim(),expected:expected.trim(),actual:actual.trim()}:null,
  technicalInfoConsent:!!technicalInfoConsent,technicalInfo:technicalInfoConsent?collectDeviceInfo():null,
  release:{version:buildMeta?.version||null,build:buildMeta?.build||null,stage:buildMeta?.stage||null},
  attachments:screenshots.map((f,i)=>({file:safeName(f.name,i),originalName:f.name,type:f.type||null,size:f.size}))};
 const files=[{name:'report.json',data:JSON.stringify(report,null,2)},{name:'report.txt',data:formatReport(report)}];
 for(let i=0;i<screenshots.length;i++)files.push({name:safeName(screenshots[i].name,i),data:await bytes(screenshots[i])});
 if(includeDiagnostics&&diagnostics){
  files.push({name:'diagnostics/summary.json',data:JSON.stringify({ok:diagnostics.ok,at:diagnostics.at,checks:diagnostics.checks,update:diagnostics.update},null,2)});
  files.push({name:'diagnostics/diagnostic.txt',data:formatDiagnosticLog(diagnostics)});
  files.push({name:'diagnostics/runtime-trace.json',data:JSON.stringify(runtimeTrace.export(),null,2)});
  for(const key of ['map','travel','ui'])files.push({name:'diagnostics/'+key+'-diagnostics.json',data:JSON.stringify(diagnostics[key]||{},null,2)});
 }
 return{report,files};
}
function formatReport(r){
 const out=['EIRDAN FEEDBACK','Type: '+r.type,'Created: '+r.createdAt,'Release: '+(r.release.version||'?')+' / '+(r.release.build||'?'),'','TITLE',r.title,'','DESCRIPTION',r.text];
 if(r.bug)out.push('','STEPS',r.bug.steps||'-','','EXPECTED',r.bug.expected||'-','','ACTUAL',r.bug.actual||'-');
 out.push('','Technical info consent: '+(r.technicalInfoConsent?'YES':'NO'),'Screenshots: '+r.attachments.length);
 return out.join('\n');
}
