import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const manifest=JSON.parse(fs.readFileSync(new URL('../game/client/asset-manifest.json',import.meta.url),'utf8'));
assert.equal(manifest.schema,1);
assert.equal(manifest.cacheSchema,3);
const startup=manifest.assets.filter(asset=>asset.startup);
assert.equal(startup.length,4);
assert.ok(startup.every(asset=>asset.type==='image'));
assert.ok(manifest.assets.filter(asset=>asset.type==='audio').every(asset=>!asset.startup));
assert.ok(manifest.assets.length>=4);
const ids=new Set(),paths=new Set(),integrityErrors=[];
for(const asset of manifest.assets){
  assert.ok(asset.id&&asset.path&&asset.revision&&asset.type);
  assert.ok(!ids.has(asset.id));ids.add(asset.id);
  assert.ok(!paths.has(asset.path));paths.add(asset.path);
  assert.match(asset.revision,/^[a-f0-9]{40,64}$/);
  const fileUrl=new URL(asset.path,new URL('../game/client/asset-cache.js',import.meta.url));
  assert.ok(fs.existsSync(fileUrl),'missing asset '+asset.path);
  if(asset.sha256){
    const sha256=createHash('sha256').update(fs.readFileSync(fileUrl)).digest('hex');
    if(asset.sha256!==sha256)integrityErrors.push(asset.id+' expected '+sha256);
  }
}
assert.deepEqual(integrityErrors,[],'sha256 mismatch: '+integrityErrors.join('; '));
const sw=fs.readFileSync(new URL('../game/sw.js',import.meta.url),'utf8');
assert.ok(sw.includes("const ASSET_CACHE='eirdan-assets-v2'"));
assert.ok(sw.includes("url.pathname.includes('/assets/')"));
assert.ok(sw.includes("url.searchParams.has('rev')"));
const cacheSource=fs.readFileSync(new URL('../game/client/asset-cache.js',import.meta.url),'utf8');
assert.ok(cacheSource.includes("new URL(ASSET_MANIFEST_URL)"));
assert.ok(!cacheSource.includes("ASSET_MANIFEST_URL+'?t='"));
console.log('asset cache manifest + SHA-256: OK');
