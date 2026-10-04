import {Navigation} from './navigation.js';
import {Lifecycle} from './lifecycle.js';
import {createSession} from '../core/session.js';
import {saveGame,listSaves,loadGame,deleteSave,persistenceSupported} from '../core/persistence.js';
import {runShellDiagnostics} from '../diagnostics/shell-diagnostics.js';
import {loadInstalledRelease,loadCurrentRelease,releaseChangesHtml} from '../client/release.js';
import {mountGameScreen} from './game-screen.js';

const BUILD_URL='../ui/build.json',SETTINGS_KEY='eirdan.shell.settings.v1';
let buildMeta=null;
const nav=new Navigation(document);let session=null,installPrompt=null,modalOpen=false,swRegistration=null,updateAvailable=false,updateChecking=false;
const $=s=>document.querySelector(s);
function loadSettings(){try{return{theme:'dark',volume:70,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{return{theme:'dark',volume:70}}}
function saveSettings(s){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(s))}catch{}}
const settings=loadSettings();
function applySettings(){$('#app').dataset.theme=settings.theme;$('#theme').value=settings.theme;$('#volume').value=settings.volume}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.add('hidden'),2200)}
function closeModal(){modalOpen=false;$('#modal').classList.add('hidden')}
function modal(title,body,actions=[['Закрыть',closeModal]]){modalOpen=true;$('#modalTitle').textContent=title;$('#modalBody').innerHTML=body;const box=$('#modalActions');box.replaceChildren();for(const [label,fn] of actions){const b=document.createElement('button');b.textContent=label;b.onclick=fn;box.append(b)}$('#modal').classList.remove('hidden')}
async function loadBuild(){buildMeta=await loadInstalledRelease();$('#versionBadge').textContent='Версия '+buildMeta.version;return buildMeta}
function updateButton(label='Проверить обновления',disabled=false,progress=0,state='idle'){const b=$('#checkUpdates');if(!b)return;b.textContent=label;b.disabled=disabled;b.style.setProperty('--update-progress',Math.max(0,Math.min(100,progress))+'%');b.dataset.state=state}
function resetUpdateButton(delay=1800){clearTimeout(resetUpdateButton.t);resetUpdateButton.t=setTimeout(()=>updateButton(),delay)}
function sameBuild(a,b){return a?.version===b?.version&&a?.build===b?.build}
async function fetchRemoteBuild(){const r=await fetch(BUILD_URL+'?update='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('build '+r.status);return r.json()}
function offerUpdate(meta){updateAvailable=true;updateButton('Обновить до '+meta.version,false,100,'ready');if(nav.current()==='game'&&!modalOpen)modal('Доступно обновление','<p>Доступна версия <b>'+meta.version+'</b>. Можно обновить сейчас или продолжить игру.</p>',[['Обновить',()=>downloadUpdate(meta)],['Позже',closeModal]])}
async function checkForUpdates({manual=false}={}){
  if(updateChecking)return;
  updateChecking=true;
  if(manual)updateButton('Проверка версии…',true,30,'working');
  try{
    const remote=await fetchRemoteBuild();
    if(!sameBuild(buildMeta,remote)){
      offerUpdate(remote);
    }else{
      updateAvailable=false;
      if(manual){updateButton('Обновлений нет',false,100,'ready');resetUpdateButton()}
      else updateButton();
    }
  }catch(e){
    console.warn('Update check failed',e);
    if(manual){updateButton('Ошибка проверки',false,100,'ready');resetUpdateButton(2500)}
  }finally{
    updateChecking=false;
    $('#checkUpdates')?.removeAttribute('disabled');
  }
}
function waitForServiceWorkerBuild(expected,timeout=20000){return new Promise((resolve,reject)=>{let done=false;const onMessage=e=>{if((e.data?.type==='SW_ACTIVATED'||e.data?.type==='SW_BUILD')&&e.data.build===expected)finish(true)};const finish=ok=>{if(done)return;done=true;clearInterval(poll);clearTimeout(timer);navigator.serviceWorker.removeEventListener('message',onMessage);ok?resolve():reject(new Error('service worker build mismatch'))};navigator.serviceWorker.addEventListener('message',onMessage);const poll=setInterval(()=>navigator.serviceWorker.controller?.postMessage({type:'GET_BUILD'}),250);const timer=setTimeout(()=>finish(false),timeout);navigator.serviceWorker.controller?.postMessage({type:'GET_BUILD'})})}
async function applyUpdate(){
  await persist();
  updateButton('Установка…',true,90,'working');
  const remote=await fetchRemoteBuild();
  await swRegistration.update();
  const worker=swRegistration.installing||swRegistration.waiting;
  if(worker?.state==='installing')await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('install timeout')),30000);const done=()=>{if(worker.state==='installed'||worker.state==='activated'){clearTimeout(timer);resolve()}else if(worker.state==='redundant'){clearTimeout(timer);reject(new Error('worker redundant'))}};worker.addEventListener('statechange',done);done()});
  swRegistration.waiting?.postMessage({type:'SKIP_WAITING'});
  await waitForServiceWorkerBuild(remote.build);
  updateButton('Запуск новой версии…',true,100,'ready');
  const url=new URL(location.href);
  url.searchParams.set('build',remote.build);
  url.searchParams.set('t',Date.now().toString());
  location.replace(url.toString());
}
async function downloadUpdate(meta){
  meta=await meta;
  closeModal();
  updateButton('Скачивание…',true,55,'working');
  try{
    if(!swRegistration)throw new Error('service worker unavailable');
    await swRegistration.update();
    let worker=swRegistration.installing||swRegistration.waiting;
    if(worker?.state==='installing'){
      await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('update timeout')),30000);const done=()=>{if(worker.state==='installed'){clearTimeout(timer);resolve()}else if(worker.state==='redundant'){clearTimeout(timer);reject(new Error('worker redundant'))}};worker.addEventListener('statechange',done);done()});
    }
    updateButton('Обновление готово',false,100,'ready');
    modal('Обновление готово','<p>Версия <b>'+meta.version+'</b> загружена.</p>',[['Применить',applyUpdate],['Позже',closeModal]]);
  }catch(e){
    console.warn('Update download failed',e);
    updateButton('Ошибка загрузки',false,100,'ready');
    resetUpdateButton(2500);
  }
}
async function registerPwa(){
  if(!('serviceWorker' in navigator))return;
  try{
    swRegistration=await navigator.serviceWorker.register('../sw.js',{scope:'../',updateViaCache:'none'});
    navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='UPDATE_READY'&&updateAvailable)updateButton('Обновление готово',false,100,'ready')});
    swRegistration.addEventListener('updatefound',()=>{const w=swRegistration.installing;w?.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller&&updateAvailable)updateButton('Обновление готово',false,100,'ready')})});
    setInterval(()=>checkForUpdates(),5*60*1000);
  }catch(e){console.warn('PWA registration failed',e)}
}
async function persist(){if(session&&persistenceSupported())try{await saveGame(session)}catch(e){console.warn('Save failed',e)}}
function newGame(){modal('Новый мир','<label>Название мира<input id="worldNameInput" maxlength="48" autocomplete="off" placeholder="Например: Эйрдан"></label>',[['Создать',async()=>{const input=$('#worldNameInput');const name=input?.value.trim();if(!name){input?.focus();return}session=createSession({worldName:name});await persist();closeModal();nav.reset('game');mountGameScreen(session,persist);toast('Мир «'+session.meta.worldName+'» создан')}],['Отмена',closeModal]]);setTimeout(()=>$('#worldNameInput')?.focus(),0)}
function worldName(s){return s.meta.worldName||'Старый мир'}
function saveLabel(s){const when=s.meta.updatedAt||s.meta.createdAt;let date='';try{date=new Date(when).toLocaleString('ru-RU')}catch{}return worldName(s)+' · День '+s.clock.day+(date?' · '+date:'')}
async function openLoad(){if(!persistenceSupported())return modal('Загрузить игру','<p>IndexedDB недоступен в этом браузере.</p>');const saves=await listSaves();if(!saves.length)return modal('Загрузить игру','<p>Сохранений пока нет.</p>');const body=saves.map(s=>'<div class="saveRow" data-save="'+s.meta.worldId+'"><button class="saveChoice">'+saveLabel(s)+'</button><button class="saveDelete" aria-label="Удалить сохранение">Удалить</button></div>').join('');modal('Загрузить игру','<div class="saveList">'+body+'</div>');document.querySelectorAll('.saveRow').forEach(row=>{const id=row.dataset.save;row.querySelector('.saveChoice').onclick=async()=>{session=await loadGame(id);closeModal();nav.reset('game');mountGameScreen(session,persist);toast('Сохранение загружено')};row.querySelector('.saveDelete').onclick=()=>confirmDelete(id)})}
function confirmDelete(worldId){modal('Удалить сохранение?','<p>Это действие нельзя отменить.</p>',[['Удалить',async()=>{await deleteSave(worldId);if(session?.meta?.worldId===worldId)session=null;closeModal();toast('Сохранение удалено');await openLoad()}],['Отмена',()=>openLoad()]])}
async function debug(){const d=await runShellDiagnostics({session,persistenceSupported:persistenceSupported()});modal('Диагностика Shell','<p><b>'+(d.ok?'PASS':'CHECK')+'</b></p>'+d.checks.map(([n,ok])=>'<p>'+(ok?'✓':'×')+' '+n+'</p>').join(''))}
function handleBack(){if(modalOpen){closeModal();return true}if(nav.current()==='main')return false;nav.back();return true}
const lifecycle=new Lifecycle({onBack:handleBack,onSuspend:persist});
document.addEventListener('click',e=>{const a=e.target.closest('[data-action]')?.dataset.action;if(!a)return;if(a==='new-game')newGame();if(a==='load-game')openLoad();if(a==='settings')nav.show('settings');if(a==='check-updates'){if(updateAvailable)downloadUpdate(fetchRemoteBuild().catch(()=>buildMeta));else checkForUpdates({manual:true})};if(a==='back')handleBack();if(a==='debug')debug();if(a==='game-menu')modal('Меню игры','<p>Текущая игровая сессия активна.</p>',[['Продолжить',closeModal],['Сохранить',async()=>{await persist();closeModal();toast('Игра сохранена')}],['Настройки',()=>{closeModal();nav.show('settings')}],['В главное меню',async()=>{await persist();closeModal();nav.reset('main')}]]);});
$('#theme').addEventListener('change',e=>{settings.theme=e.target.value;saveSettings(settings);applySettings()});
$('#volume').addEventListener('input',e=>{settings.volume=Number(e.target.value);saveSettings(settings)});
$('#fullscreen').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch{toast('Полный экран недоступен на этом устройстве')}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#installPwa').classList.remove('hidden')});
$('#installPwa').addEventListener('click',async()=>{if(!installPrompt)return;await installPrompt.prompt();installPrompt=null;$('#installPwa').classList.add('hidden')});
window.addEventListener('appinstalled',()=>toast('Eirdan установлен'));
$('#versionBadge').addEventListener('click',async()=>{try{const meta=await loadCurrentRelease();modal('Версия Eirdan',releaseChangesHtml(meta))}catch(e){console.warn('Release metadata unavailable',e);modal('Версия Eirdan','<p><b>'+(buildMeta?.version||'Версия недоступна')+'</b></p><p>История изменений временно недоступна.</p>')}});
applySettings();nav.reset('main');lifecycle.start();await loadBuild();await registerPwa();checkForUpdates();
