import fs from 'node:fs';
import {createHash} from 'node:crypto';

const manifestUrl=new URL('../game/client/asset-manifest.json',import.meta.url);
const assetBase=new URL('../game/client/asset-cache.js',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(manifestUrl,'utf8'));
let changed=false;
for(const asset of manifest.assets){
  const fileUrl=new URL(asset.path,assetBase);
  const sha256=createHash('sha256').update(fs.readFileSync(fileUrl)).digest('hex');
  if(asset.sha256!==sha256){asset.sha256=sha256;changed=true}
}
if(process.argv.includes('--check')){
  if(changed){console.error('Asset integrity metadata is stale. Run: node scripts/update-asset-integrity.mjs');process.exitCode=1}
  else console.log('asset integrity metadata: OK');
}else{
  fs.writeFileSync(manifestUrl,JSON.stringify(manifest,null,2)+'\\n');
  console.log(changed?'asset integrity metadata updated':'asset integrity metadata already current');
}
