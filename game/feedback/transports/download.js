// ============================================================================
// FEEDBACK DOWNLOAD TRANSPORT
// Saves a feedback package locally. Server delivery will use another transport.
// ============================================================================
import {makeZip,downloadBlob} from '../../diagnostics/zip.js';
export const FeedbackDownloadTransport={
 async send(pkg){
  const blob=makeZip(pkg.files),stamp=new Date().toISOString().replace(/[:.]/g,'-');
  const name='Eirdan-'+pkg.report.type+'-'+stamp+'.zip';
  downloadBlob(blob,name);return{name,size:blob.size};
 }
};
