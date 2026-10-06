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
} else if (mode === 'manifest') {
  const apk = 'build/eirdan-runtime-debug.apk';
  const repository = process.env.GITHUB_REPOSITORY;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? '')) throw new Error('Invalid repository');
  const manifest = {
    format: 'eirdan-runtime-update', format_version: 1,
    application_id: 'org.eirdan.runtime', abi: 'arm64-v8a',
    version_code: code, version_name: version, min_sdk: 24,
    apk_url: `https://github.com/${repository}/releases/download/runtime-${code}/eirdan-runtime-debug.apk`,
    size_bytes: statSync(apk).size,
    sha256: createHash('sha256').update(readFileSync(apk)).digest('hex'),
  };
  writeFileSync('build/runtime-update.json', JSON.stringify(manifest, null, 2) + '\n');
} else throw new Error('Expected prepare or manifest');
