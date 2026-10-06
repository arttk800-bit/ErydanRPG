// APK release metadata. Run prepare before export, manifest only after signed export.
import {readFileSync, writeFileSync, statSync} from 'node:fs';
import {createHash} from 'node:crypto';

const mode = process.argv[2];
const run = Number(process.env.GITHUB_RUN_NUMBER);
if (!Number.isSafeInteger(run) || run < 1) throw new Error('GITHUB_RUN_NUMBER required');
const code = 1000 + run;
const version = `0.1.1-updater.${run}`;
if (mode === 'prepare') {
  const path = 'godot/export_presets.cfg';
  const preset = readFileSync(path, 'utf8');
  for (const key of ['version/code=', 'version/name=']) {
    if (!preset.includes(key)) throw new Error(`Missing ${key}`);
  }
  writeFileSync(path, preset.replace(/^version\/code=.*$/m, `version/code=${code}`)
    .replace(/^version\/name=.*$/m, `version/name="${version}"`));
  const projectPath = 'godot/project.godot';
  let project = readFileSync(projectPath, 'utf8');
  if (!project.includes('[eirdan]')) throw new Error('Missing [eirdan] project settings');
  project = project.replace(/^config\/version=.*$/m, `config/version="${version}"`);
  if (/^runtime\/version_code=.*$/m.test(project)) {
    project = project.replace(/^runtime\/version_code=.*$/m, `runtime/version_code=${code}`);
  } else {
    project = project.replace(/^\[eirdan\]$/m, `[eirdan]\nruntime/version_code=${code}`);
  }
  writeFileSync(projectPath, project);
} else if (mode === 'manifest') {
  const apk = 'build/eirdan-runtime-debug.apk';
  const repository = process.env.GITHUB_REPOSITORY;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? '')) throw new Error('Invalid repository');
  const badging = readFileSync('build/apk-badging.txt', 'utf8');
  const identity = badging.match(/^package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/m);
  const minSdk = Number(badging.match(/^sdkVersion:'(\d+)'/m)?.[1]);
  if (!identity || identity[1] !== 'org.eirdan.runtime' || Number(identity[2]) !== code || identity[3] !== version) throw new Error('Exported APK identity mismatch');
  if (!Number.isSafeInteger(minSdk) || minSdk < 1) throw new Error('Missing APK min SDK');
  if (!/^native-code: 'arm64-v8a'\s*$/m.test(badging)) throw new Error('APK must contain only arm64-v8a');
  if (!badging.includes("name='android.permission.REQUEST_INSTALL_PACKAGES'")) throw new Error('APK missing installer permission');
  const manifest = {
    format: 'eirdan-runtime-update', format_version: 1,
    application_id: 'org.eirdan.runtime', abi: 'arm64-v8a',
    version_code: code, version_name: version, min_sdk: minSdk,
    apk_url: `https://github.com/${repository}/releases/download/runtime-${code}/eirdan-runtime-debug.apk`,
    size_bytes: statSync(apk).size,
    sha256: createHash('sha256').update(readFileSync(apk)).digest('hex'),
  };
  writeFileSync('build/runtime-update.json', JSON.stringify(manifest, null, 2) + '\n');
} else throw new Error('Expected prepare or manifest');
