import {Navigation} from './navigation.js';
import {Lifecycle} from './lifecycle.js';
import {createSession} from '../core/session.js';
import {saveGame,listSaves,loadGame,deleteSave,persistenceSupported} from '../core/persistence.js';
import {runShellDiagnostics} from '../diagnostics/shell-diagnostics.js';

const BUILD_URL='../ui/build.json',SETTINGS_KEY='eirdan.shell.settings.v1';
const nav=new Navigation(document);let session=null,installPrompt=null,modalOpen=false;
const $=s=>document.querySelector(s);
function loadSettings(){try{return{theme:'dark',volume:70,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{return{theme:'dark',volume:70}}}
function saveSettings(s){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(s))}catch{}}
const settings=loadSettings();
function applySettings(){$('#app').dataset.theme=settings.theme;$('#theme').value=settings.theme;$('#volume').value=settings.volume}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.add('hidden'),2200)}
function closeModal(){modalOpen=false;$('#modal').classList.add('hidden')}
function modal(title,body,actions=[['Закрыть',closeModal]]){modalOpen=true;$('#modalTitle').textContent=title;$('#modalBody').innerHTML=body;const box=$('#modalActions');box.replaceChildren();for(const [label,fn] of actions){const b=document.createElement('button');b.textContent=label;b.onclick=fn;box.append(b)}$('#modal').classList.remove('hidden')}
async function loadBuild(){try{const r=await fetch(BUILD_URL+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('build '+r.status);const m=await r.json();$('#versionBadge').textContent='Версия '+m.version+' · '+m.build;return m}catch(e){console.warn('Build metadata unavailable',e);$('#versionBadge').textContent='Eirdan';return null}}
async function registerPwa(){if(!('serviceWorker' in navigator))return;try{const reg=await navigator.serviceWorker.register('../sw.js',{scope:'../'});reg.addEventListener('updatefound',()=>{const w=reg.installing;w?.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)modal('Доступно обновление','<p>Новая версия Eirdan готова.</p>',[['Обновить сейчас',()=>location.reload()],['Позже',closeModal]])})})}catch(e){console.warn('PWA registration failed',e)}}
async function persist(){if(session&&persistenceSupported())try{await saveGame(session)}catch(e){console.warn('Save failed',e)}}
async function newGame(){session=createSession();await persist();$('#sessionInfo').textContent=session.meta.worldId;nav.reset('game');toast('Новая игра создана')}
function saveLabel(s){const when=s.meta.updatedAt||s.meta.createdAt;let date='';try{date=new Date(when).toLocaleString('ru-RU')}catch{}return 'День '+s.clock.day+' · '+date}
async function openLoad(){if(!persistenceSupported())return modal('Загрузить игру','<p>IndexedDB недоступен в этом браузере.</p>');const saves=await listSaves();if(!saves.length)return modal('Загрузить игру','<p>Сохранений пока нет.</p>');const body=saves.map(s=>'<div class="saveRow" data-save="'+s.meta.worldId+'"><button class="saveChoice">'+saveLabel(s)+'</button><button class="saveDelete" aria-label="Удалить сохранение">Удалить</button></div>').join('');modal('Загрузить игру','<div class="saveList">'+body+'</div>');document.querySelectorAll('.saveRow').forEach(row=>{const id=row.dataset.save;row.querySelector('.saveChoice').onclick=async()=>{session=await loadGame(id);closeModal();$('#sessionInfo').textContent=session.meta.worldId;nav.reset('game');toast('Сохранение загружено')};row.querySelector('.saveDelete').onclick=()=>confirmDelete(id)})}
function confirmDelete(worldId){modal('Удалить сохранение?','<p>Это действие нельзя отменить.</p>',[['Удалить',async()=>{await deleteSave(worldId);if(session?.meta?.worldId===worldId)session=null;closeModal();toast('Сохранение удалено');await openLoad()}],['Отмена',()=>openLoad()]])}
async function debug(){const d=await runShellDiagnostics({session,persistenceSupported:persistenceSupported()});modal('Диагностика Shell','<p><b>'+(d.ok?'PASS':'CHECK')+'</b></p>'+d.checks.map(([n,ok])=>'<p>'+(ok?'✓':'×')+' '+n+'</p>').join(''))}
function handleBack(){if(modalOpen){closeModal();return true}if(nav.current()==='main')return false;nav.back();return true}
const lifecycle=new Lifecycle({onBack:handleBack,onSuspend:persist});
document.addEventListener('click',e=>{const a=e.target.closest('[data-action]')?.dataset.action;if(!a)return;if(a==='new-game')newGame();if(a==='load-game')openLoad();if(a==='settings')nav.show('settings');if(a==='back')handleBack();if(a==='debug')debug();if(a==='game-menu')modal('Меню игры','<p>Текущая игровая сессия активна.</p>',[['Продолжить',closeModal],['Сохранить',async()=>{await persist();closeModal();toast('Игра сохранена')}],['Настройки',()=>{closeModal();nav.show('settings')}],['В главное меню',async()=>{await persist();closeModal();nav.reset('main')}]]);});
$('#theme').addEventListener('change',e=>{settings.theme=e.target.value;saveSettings(settings);applySettings()});
$('#volume').addEventListener('input',e=>{settings.volume=Number(e.target.value);saveSettings(settings)});
$('#fullscreen').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch{toast('Полный экран недоступен на этом устройстве')}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#installPwa').classList.remove('hidden')});
$('#installPwa').addEventListener('click',async()=>{if(!installPrompt)return;await installPrompt.prompt();installPrompt=null;$('#installPwa').classList.add('hidden')});
window.addEventListener('appinstalled',()=>toast('Eirdan установлен'));
$('#versionBadge').addEventListener('click',()=>modal('Версия Eirdan','<p>Application Shell 1.0: lifecycle, PWA, persistence, управление сохранениями и диагностика.</p>'));
applySettings();nav.reset('main');lifecycle.start();loadBuild();registerPwa();
