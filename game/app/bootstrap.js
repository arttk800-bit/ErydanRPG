import {Navigation} from './navigation.js';
import {Lifecycle} from './lifecycle.js';
import {createSession} from '../core/session.js';
import {saveGame,listSaves,loadGame,deleteSave,persistenceSupported} from '../core/persistence.js';
import {runShellDiagnostics} from '../diagnostics/shell-diagnostics.js';
import {loadInstalledRelease,loadCurrentRelease,releaseChangesHtml} from '../client/release.js';
import {mountGameScreen} from './game-screen.js';
import {UpdateManager} from '../client/update-manager.js';
import {actionDiagnostics} from '../diagnostics/action-diagnostics.js';
import {downloadDiagnosticArchive} from '../diagnostics/archive.js';
import {runtimeTrace} from '../diagnostics/runtime-trace.js';
import {preloadStartupAssets} from '../client/asset-loader.js';
import {PauseSystem} from '../systems/pause.js';

const BUILD_URL='../data/version.json',SETTINGS_KEY='eirdan.shell.settings.v1';
let buildMeta=null;
const nav=new Navigation(document);let session=null,installPrompt=null,modalOpen=false,modalPauseReason=null,swRegistration=null,updateManager=null;
const $=s=>document.querySelector(s);
runtimeTrace.setStateProvider(()=>session);
window.addEventListener('error',e=>runtimeTrace.error('window',e.error||e.message,{filename:e.filename,line:e.lineno,col:e.colno}));
window.addEventListener('unhandledrejection',e=>runtimeTrace.error('promise',e.reason));
function loadSettings(){try{return{theme:'dark',volume:70,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{return{theme:'dark',volume:70}}}
function saveSettings(s){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(s))}catch{}}
const settings=loadSettings();
function applySettings(){$('#app').dataset.theme=settings.theme;$('#theme').value=settings.theme;$('#volume').value=settings.volume}
export function notifyDiscovery(name){toast('Вы узнали о новом месте: '+(name||'неизвестное место'))}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.add('hidden'),2200)}
function closeModal(){modalOpen=false;$('#modal').classList.add('hidden');if(session&&modalPauseReason){PauseSystem.set(session,modalPauseReason,false);modalPauseReason=null}}
function modal(title,body,actions=[['Закрыть',closeModal]]){modalOpen=true;$('#modalTitle').textContent=title;$('#modalBody').innerHTML=body;const box=$('#modalActions');box.replaceChildren();for(const [label,fn] of actions){const b=document.createElement('button');b.textContent=label;b.onclick=fn;box.append(b)}$('#modal').classList.remove('hidden')}
async function activeSwBuild(timeout=1200){if(!navigator.serviceWorker?.controller)return null;return new Promise(resolve=>{const t=setTimeout(()=>{navigator.serviceWorker.removeEventListener('message',on);resolve(null)},timeout),on=e=>{if(e.data?.type==='SW_BUILD'){clearTimeout(t);navigator.serviceWorker.removeEventListener('message',on);resolve(e.data.build||null)}};navigator.serviceWorker.addEventListener('message',on);navigator.serviceWorker.controller.postMessage({type:'GET_BUILD'})})}
async function loadBuild(){buildMeta=await loadInstalledRelease();const active=await activeSwBuild();buildMeta.runtimeBuild=active;$('#versionBadge').textContent='Версия '+buildMeta.version+(active&&active!==buildMeta.build?' · runtime '+active:'');return buildMeta}
function installedRuntimeRelease(){return buildMeta?.runtimeBuild?{...buildMeta,build:buildMeta.runtimeBuild}:buildMeta}
function updateButton(label='Проверить обновления',disabled=false,progress=0,state='idle'){const b=$('#checkUpdates');if(!b)return;b.textContent=label;b.disabled=disabled;b.style.setProperty('--update-progress',Math.max(0,Math.min(100,progress))+'%');b.dataset.state=state}
function resetUpdateButton(delay=1800){clearTimeout(resetUpdateButton.t);resetUpdateButton.t=setTimeout(()=>{if(!updateManager?.busy)updateButton()},delay)}
async function fetchRemoteBuild(){const r=await fetch(BUILD_URL+'?update='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('build '+r.status);return r.json()}
function updateVisual(state,data={}){
 const map={checking:['Проверка версии…',35],reloading:['Перезагрузка…',100],current:['Версия актуальна',100]};
 if(state==='error'){const step={manifest:'версия',metadata:'метаданные','service-worker':'загрузка',activation:'активация'}[data.step]||data.step||'обновление';updateButton('Ошибка: '+step,false,100,'error');console.error('Eirdan update error',data);resetUpdateButton(6000);return}
 if(map[state])updateButton(map[state][0],['checking','reloading'].includes(state),map[state][1],state);
 if(state==='current')resetUpdateButton(2200);
}
async function registerPwa(){
 if(!('serviceWorker' in navigator))return;
 try{
  swRegistration=await navigator.serviceWorker.register('../sw.js',{scope:'../',updateViaCache:'none'});
  updateManager=new UpdateManager({
   registration:swRegistration,
   getInstalled:()=>Promise.resolve(installedRuntimeRelease()),
   fetchRemote:fetchRemoteBuild,
   onState:updateVisual,
   onAvailable:meta=>updateButton('Перезагрузить до '+meta.version,false,100,'ready'),
   onReady:null,
   onApply:async remote=>{await persist();const url=new URL(location.href);url.searchParams.set('build',remote.build||Date.now().toString());url.searchParams.set('reload',Date.now().toString());location.replace(url.toString())}
  });
  setInterval(()=>{if(!updateManager.busy)updateManager.check()},5*60*1000);
 }catch(e){console.warn('PWA registration failed',e)}
}
async function persist(){if(session&&persistenceSupported())try{await saveGame(session)}catch(e){console.warn('Save failed',e)}}
async function defaultWorldName(){const saves=persistenceSupported()?await listSaves():[];const used=new Set(saves.map(worldName));let n=1;while(used.has('Мир '+n))n+=1;return 'Мир '+n}
function newGame(){modal('Новый мир','<label>Название мира <span class="muted">(необязательно)</span><input id="worldNameInput" maxlength="48" autocomplete="off" placeholder="Мир 1"></label>',[['Создать',async()=>{const input=$('#worldNameInput');const name=input?.value.trim()||await defaultWorldName();session=createSession({worldName:name});await persist();closeModal();nav.reset('game');mountGameScreen(session,persist);toast('Мир «'+session.meta.worldName+'» создан')}],['Отмена',closeModal]]);setTimeout(()=>$('#worldNameInput')?.focus(),0)}
function worldName(s){return s.meta.worldName||'Старый мир'}
function saveLabel(s){const when=s.meta.updatedAt||s.meta.createdAt;let date='';try{date=new Date(when).toLocaleString('ru-RU')}catch{}return worldName(s)+' · День '+s.clock.day+(date?' · '+date:'')}
async function openLoad(){if(!persistenceSupported())return modal('Загрузить игру','<p>IndexedDB недоступен в этом браузере.</p>');const saves=await listSaves();if(!saves.length)return modal('Загрузить игру','<p>Сохранений пока нет.</p>');const body=saves.map(s=>'<div class="saveRow" data-save="'+s.meta.worldId+'"><button class="saveChoice">'+saveLabel(s)+'</button><button class="saveDelete" aria-label="Удалить сохранение">Удалить</button></div>').join('');modal('Загрузить игру','<div class="saveList">'+body+'</div>');document.querySelectorAll('.saveRow').forEach(row=>{const id=row.dataset.save;row.querySelector('.saveChoice').onclick=async()=>{session=await loadGame(id);closeModal();nav.reset('game');mountGameScreen(session,persist);toast('Сохранение загружено')};row.querySelector('.saveDelete').onclick=()=>confirmDelete(id)})}
function confirmDelete(worldId){modal('Удалить сохранение?','<p>Это действие нельзя отменить.</p>',[['Удалить',async()=>{await deleteSave(worldId);if(session?.meta?.worldId===worldId)session=null;closeModal();toast('Сохранение удалено');await openLoad()}],['Отмена',()=>openLoad()]])}
async function debug(){
 const d=await runShellDiagnostics({session,persistenceSupported:persistenceSupported(),updateManager,installedBuild:buildMeta,remoteBuild:fetchRemoteBuild,swRegistration});
 const actionTail=d.actions.slice(-12).map(x=>'<p>#'+x.id+' '+x.action+' → '+x.phase+'</p>').join('');
 const body='<p><b>'+(d.ok?'PASS':'CHECK')+'</b></p>'+d.checks.map(([n,ok])=>'<p>'+(ok?'✓':'×')+' '+n+'</p>').join('')+'<hr><p><b>Actions</b></p>'+actionTail+'<hr><p class="muted">Архив создаётся локально. Интернет и отправка на сервер не используются.</p>';
 modal('Диагностика Shell',body,[['Скачать диагностику',function(){
  try{actionDiagnostics.record('diagnostics-archive','start');const result=downloadDiagnosticArchive(d,buildMeta);actionDiagnostics.record('diagnostics-archive','success',result);this.textContent='Скачано';toast('Диагностика сохранена ZIP-архивом')}
  catch(e){actionDiagnostics.record('diagnostics-archive','error',{message:String(e)});runtimeTrace.error('diagnostics.archive',e);toast('Не удалось сохранить диагностику')}
 }],['Закрыть',closeModal]]);
}
function openGameMenu(){if(!session)return;PauseSystem.set(session,'game-menu',true);modalPauseReason='game-menu';modal('Меню игры','<nav class="game-menu-list"><button data-menu="continue">Продолжить</button><button data-menu="save">Сохранить игру</button><button data-menu="settings">Настройки</button><button data-menu="main">В главное меню</button></nav>',[]);const body=$('#modalBody');body.querySelector('[data-menu="continue"]').onclick=closeModal;body.querySelector('[data-menu="save"]').onclick=async()=>{await persist();toast('Игра сохранена')};body.querySelector('[data-menu="settings"]').onclick=()=>{closeModal();nav.show('settings')};body.querySelector('[data-menu="main"]').onclick=async()=>{await persist();closeModal();nav.reset('main')}}
function handleBack(){if(modalOpen){closeModal();return true}if(nav.current()==='settings'){nav.back();return true}if(nav.current()==='game'){openGameMenu();return true}return true}
const lifecycle=new Lifecycle({onBack:handleBack,onSuspend:persist});
document.addEventListener('click',e=>{const raw=e.target.closest('button,a,input,select,summary,[data-action]');if(raw)runtimeTrace.ui('click',raw.tagName.toLowerCase(),{text:(raw.textContent||'').trim().slice(0,120),action:raw.dataset?.action||null,id:raw.id||null,className:raw.className||null,disabled:!!raw.disabled});const target=e.target.closest('[data-action]');const a=target?.dataset.action;if(!a)return;actionDiagnostics.record(a,'click',{disabled:!!target.disabled,screen:nav.current()});if(a==='new-game')newGame();if(a==='load-game')openLoad();if(a==='settings')nav.show('settings');if(a==='check-updates'){if(updateManager?.busy)return;if(updateManager?.available)updateManager.update();else updateManager?.check({manual:true})};if(a==='back')handleBack();if(a==='debug')debug();if(a==='game-menu')openGameMenu();});
$('#theme').addEventListener('change',e=>{runtimeTrace.ui('change','select',{id:'theme',value:e.target.value});settings.theme=e.target.value;saveSettings(settings);applySettings()});
$('#volume').addEventListener('input',e=>{runtimeTrace.ui('input','range',{id:'volume',value:e.target.value});settings.volume=Number(e.target.value);saveSettings(settings)});
$('#fullscreen').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch{toast('Полный экран недоступен на этом устройстве')}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#installPwa').classList.remove('hidden')});
$('#installPwa').addEventListener('click',async()=>{if(!installPrompt)return;await installPrompt.prompt();installPrompt=null;$('#installPwa').classList.add('hidden')});
window.addEventListener('appinstalled',()=>toast('Eirdan установлен'));
$('#versionBadge').addEventListener('click',async()=>{try{const meta=await loadCurrentRelease();modal('Версия Eirdan',releaseChangesHtml(meta))}catch(e){console.warn('Release metadata unavailable',e);modal('Версия Eirdan','<p><b>'+(buildMeta?.version||'Версия недоступна')+'</b></p><p>История изменений временно недоступна.</p>')}});
applySettings();nav.reset('main');lifecycle.start();await loadBuild();await registerPwa();
const loader=$('#startupLoader'),loaderProgress=$('#startupLoaderProgress'),loaderText=$('#startupLoaderText'),loaderDetail=$('#startupLoaderDetail');
try{
 await preloadStartupAssets({build:buildMeta?.build,onProgress:({loaded,total,ratio})=>{loaderProgress.value=ratio;loaderText.textContent='Подготовка игры… '+Math.round(ratio*100)+'%';loaderDetail.textContent='Ресурсы '+loaded+' / '+total}});
 loaderText.textContent='Готово';loaderProgress.value=1;
}catch(e){console.warn('Startup asset preload failed',e);runtimeTrace.error('asset.preload',e);loaderText.textContent='Часть ресурсов загрузится по мере игры';loaderDetail.textContent='Можно продолжать'}
setTimeout(()=>{loader.classList.add('done');setTimeout(()=>loader.remove(),220)},120);
updateManager?.check();
