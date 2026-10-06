import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync
} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sourceDir=join(root,'packages','sources','eirdan.world.events');
const metadata=JSON.parse(readFileSync(join(sourceDir,'package.json'),'utf8'));
const payloadPath=join(sourceDir,metadata.payload);
const artifactName=`${metadata.id}-${metadata.version}.zip`;
const artifactPath=join(root,'packages','dist',artifactName);
const catalogPath=join(root,'packages','catalog.json');
const sha256=value=>createHash('sha256').update(value).digest('hex');
const run=(command,args,options={})=>{
  const result=spawnSync(command,args,{encoding:'utf8',...options});
  if(result.status!==0)throw new Error(`${command} failed: ${result.stderr||result.stdout}`);
  return result.stdout;
};

function expectedManifest(payload){
  return {
    format:'eirdan-package',
    format_version:2,
    id:metadata.id,
    version:metadata.version,
    kind:metadata.kind,
    runtime_min:metadata.runtime_min,
    priority:metadata.priority,
    dependencies:metadata.dependencies,
    conflicts:metadata.conflicts,
    payload:metadata.payload,
    sha256:sha256(payload),
    files:[]
  };
}

function expectedCatalog(archive){
  return {
    format:'eirdan-package-catalog',
    format_version:1,
    generated_at:metadata.published_at,
    packages:[{
      id:metadata.id,
      title:metadata.title,
      version:metadata.version,
      channel:metadata.channel,
      category:metadata.category,
      apply:metadata.apply,
      runtime_min:metadata.runtime_min,
      size_bytes:archive.length,
      sha256:sha256(archive),
      url:`https://raw.githubusercontent.com/arttk800-bit/ErydanRPG/main/packages/dist/${artifactName}`
    }]
  };
}

function build(){
  const payload=readFileSync(payloadPath);
  const work=mkdtempSync(join(tmpdir(),'eirdan-package-'));
  try{
    const stagedPayload=join(work,metadata.payload);
    const stagedManifest=join(work,'manifest.json');
    copyFileSync(payloadPath,stagedPayload);
    writeFileSync(stagedManifest,`${JSON.stringify(expectedManifest(payload),null,2)}\n`);
    const fixedDate=new Date('2026-01-01T00:00:00Z');
    utimesSync(stagedPayload,fixedDate,fixedDate);
    utimesSync(stagedManifest,fixedDate,fixedDate);
    mkdirSync(dirname(artifactPath),{recursive:true});
    rmSync(artifactPath,{force:true});
    run('zip',['-q','-X',artifactPath,'manifest.json',metadata.payload],{
      cwd:work,
      env:{...process.env,TZ:'UTC'}
    });
    const archive=readFileSync(artifactPath);
    writeFileSync(catalogPath,`${JSON.stringify(expectedCatalog(archive),null,2)}\n`);
    console.log(`package built: ${artifactName} (${archive.length} bytes)`);
  }finally{
    rmSync(work,{recursive:true,force:true});
  }
}

function check(){
  assert.ok(existsSync(artifactPath),`missing artifact: ${artifactName}`);
  const archive=readFileSync(artifactPath);
  const catalog=JSON.parse(readFileSync(catalogPath,'utf8'));
  assert.deepEqual(catalog,expectedCatalog(archive),'catalog metadata/hash differs from artifact');
  const archivedManifest=JSON.parse(run('unzip',['-p',artifactPath,'manifest.json']));
  const archivedPayload=Buffer.from(run('unzip',['-p',artifactPath,metadata.payload],{encoding:null}));
  const sourcePayload=readFileSync(payloadPath);
  assert.deepEqual(archivedManifest,expectedManifest(sourcePayload),'archive manifest differs from source');
  assert.equal(sha256(archivedPayload),archivedManifest.sha256,'inner payload hash mismatch');
  assert.deepEqual(archivedPayload,sourcePayload,'archived payload differs from source');
  assert.equal(statSync(artifactPath).size,catalog.packages[0].size_bytes,'catalog size mismatch');
  console.log(`official package integrity: OK (${artifactName})`);
}

if(process.argv.includes('--check'))check();
else build();
