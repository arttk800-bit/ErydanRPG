const VERSION_URL='../data/version.json';
const CHANGELOG_URL='../data/changelog.json';
export async function fetchJson(url){const r=await fetch(url+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error(url+' '+r.status);return r.json()}
export const loadInstalledRelease=()=>fetchJson(VERSION_URL);
export const loadChangelog=()=>fetchJson(CHANGELOG_URL);
export async function loadCurrentRelease(){const [version,changelog]=await Promise.all([loadInstalledRelease(),loadChangelog()]);const release=changelog.releases?.find(r=>r.version===version.version)||null;return{...version,release}}
export function releaseChangesHtml(meta){const r=meta?.release;if(!r)return '<p>Описание изменений для этой версии отсутствует.</p>';const items=(r.changes||[]).map(x=>'<li>'+escapeHtml(x)+'</li>').join('');return '<p><b>'+escapeHtml(r.version)+(r.build?' · '+escapeHtml(r.build):'')+'</b></p>'+(r.stage?'<p>'+escapeHtml(r.stage)+'</p>':'')+(items?'<ul>'+items+'</ul>':'')}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
