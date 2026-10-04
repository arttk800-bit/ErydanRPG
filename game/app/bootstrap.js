import {Navigation} from './navigation.js';
import {createSession} from '../core/session.js';

const BUILD_URL='../ui/build.json';
const SETTINGS_KEY='eirdan.shell.settings.v1';
const nav=new Navigation(document);
let session=null;
let installPrompt=null;

const $=s=>document.querySelector(s);
function loadSettings(){try{return{theme:'dark',volume:70,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{return{theme:'dark',volume:70}}}
function saveSettings(s){localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));}
const settings=loadSettings();
function applySettings(){document.querySelector('#app').dataset.theme=settings.theme;$('#theme').value=settings.theme;$('#volume').value=settings.volume;}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.add('hidden'),2200);}
function modal(title,body,actions=[['Закрыть',()=>closeModal()]]){ $('#modalTitle').textContent=title;$('#modalBody').innerHTML=body;const box=$('#modalActions');box.replaceChildren();for(const [label,fn] of actions){const b=document.createElement('button');b.textContent=label;b.onclick=fn;box.append(b)}$('#modal').classList.remove('hidden');}
function closeModal(){$('#modal').classList.add('hidden');}
async function loadBuild(){try{const r=await fetch(BUILD_URL+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error();const m=await r.json();$('#versionBadge').textContent='Версия '+m.version+' · '+m.build;return m}catch{$('#versionBadge').textContent='Версия недоступна';return null}}
async function registerPwa(){if(!('serviceWorker' in navigator))return;try{const reg=await navigator.serviceWorker.register('../sw.js',{scope:'../'});reg.addEventListener('updatefound',()=>{const w=reg.installing;w?.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)modal('Доступно обновление','<p>Новая версия Eirdan готова. Обновление применится после перезапуска.</p>',[['Обновить сейчас',()=>location.reload()],['Позже',closeModal]])})})}catch(e){console.warn('PWA registration failed',e)}}
function newGame(){session=createSession();$('#sessionInfo').textContent=session.meta.worldId;nav.reset('game');}
function openLoad(){modal('Загрузить игру','<p>Хранилище сохранений будет подключено на этапе Persistence. Оболочка уже имеет отдельную точку входа для загрузки.</p>');}
function quit(){modal('Покинуть игру','<p>В браузерной/PWA-версии приложение не закрывает себя принудительно. Можно вернуться в главное меню или закрыть окно приложения.</p>');}
function debug(){modal('Отладка',`<p>Shell: OK</p><p>PWA: ${'serviceWorker' in navigator?'поддерживается':'не поддерживается'}</p><p>Session: ${session?'active':'none'}</p>`);}
document.addEventListener('click',e=>{const a=e.target.closest('[data-action]')?.dataset.action;if(!a)return;if(a==='new-game')newGame();if(a==='load-game')openLoad();if(a==='settings')nav.show('settings');if(a==='quit')quit();if(a==='back')nav.back();if(a==='debug')debug();if(a==='game-menu')modal('Меню игры','<p>Текущая игровая сессия активна.</p>',[['Продолжить',closeModal],['Настройки',()=>{closeModal();nav.show('settings')}],['В главное меню',()=>{closeModal();nav.reset('main')}]]);});
$('#theme').addEventListener('change',e=>{settings.theme=e.target.value;saveSettings(settings);applySettings()});
$('#volume').addEventListener('input',e=>{settings.volume=Number(e.target.value);saveSettings(settings)});
$('#fullscreen').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch{toast('Полный экран недоступен на этом устройстве')}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#installPwa').classList.remove('hidden')});
$('#installPwa').addEventListener('click',async()=>{if(!installPrompt)return;await installPrompt.prompt();installPrompt=null;$('#installPwa').classList.add('hidden')});
window.addEventListener('appinstalled',()=>toast('Eirdan установлен'));
window.addEventListener('popstate',()=>nav.back());
$('#versionBadge').addEventListener('click',()=>modal('Версия Eirdan','<p>Новая архитектурная ветка: Application Shell + PWA.</p>'));
applySettings();loadBuild();registerPwa();nav.reset('main');
