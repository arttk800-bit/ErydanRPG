import {Navigation} from './navigation.js';
import {Lifecycle} from './lifecycle.js';
import {createSession} from '../core/session.js';
import {saveGame,listSaves,loadGame,deleteSave,persistenceSupported} from '../core/persistence.js';
import {runShellDiagnostics} from '../diagnostics/shell-diagnostics.js';
import {loadInstalledRelease,loadCurrentRelease,releaseChangesHtml} from '../client/release.js';
import {mountGameScreen} from './game-screen.js';
import {UpdateManager} from '../client/update-manager.js';
import {actionDiagnostics} from '../diagnostics/action-diagnostics.js';
import {uploadDiagnostic} from '../diagnostics/uploader.js';
import {formatDiagnosticLog} from '../diagnostics/format.js';

const BUILD_URL='../ui/build.json',SETTINGS_KEY='eirdan.shell.settings.v1';
let buildMeta=null;
const nav=new Navigation(document);let session=null,installPrompt=null,modalOpen=false,swRegistration=null,updateManager=null;
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
function resetUpdateButton(delay=1800){clearTimeout(resetUpdateButton.t);resetUpdateButton.t=setTimeout(()=>{if(!updateManager?.busy)updateButton()},delay)}
async function fetchRemoteBuild(){const r=await fetch(BUILD_URL+'?update='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('build '+r.status);return r.json()}
function updateVisual(state,data={}){
 const map={checking:['Проверка версии…',30],downloading:['Скачивание…',55],installing:['Установка…',90],applied:['Запуск новой версии…',100],current:['Обновлений нет',100],error:['Ошибка обновления',100]};
 if(map[state])updateButton(map[state][0],['checking','downloading','installing','applied'].includes(state),map[state][1],state);
 if(state==='current'||state==='error')resetUpdateButton(2200);
}
async function registerPwa(){
 if(!('serviceWorker' in navigator))return;
 try{
  swRegistration=await navigator.serviceWorker.register('../sw.js',{scope:'../',updateViaCache:'none'});
  updateManager=new UpdateManager({
   registration:swRegistration,
   getInstalled:()=>Promise.resolve(buildMeta),
   fetchRemote:fetchRemoteBuild,
   onState:updateVisual,
   onAvailable:meta=>updateButton('Обновить до '+meta.version,false,100,'ready'),
   onReady:meta=>modal('Обновление готово','<p>Версия <b>'+meta.version+'</b> загружена.</p>',[['Применить',()=>updateManager.apply()],['Позже',closeModal]]),
   onApply:async remote=>{await persist();const url=new URL(location.href);url.searchParams.set('build',remote.build);url.searchParams.set('t',Date.now().toString());location.replace(url.toString())}
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
async function debug(){const d=await runShellDiagnostics({session,persistenceSupported:persistenceSupported(),updateManager,installedBuild:buildMeta,remoteBuild:fetchRemoteBuild,swRegistration});const actionTail=d.actions.slice(-12).map(x=>'<p>#'+x.id+' '+x.action+' → '+x.phase+'</p>').join('');modal('Диагностика Shell','<p><b>'+(d.ok?'PASS':'CHECK')+'</b></p>'+d.checks.map(([n,ok])=>'<p>'+(ok?'✓':'×')+' '+n+'</p>').join('')+'<hr><p><b>Actions</b></p>'+actionTail,[['Отправить диагностику',async()=>{try{actionDiagnostics.record('diagnostics-upload','start');const log=formatDiagnosticLog(d);const result=await uploadDiagnostic({build:buildMeta?.build,log,summary:{ok:d.ok,checks:d.checks.length,actions:d.actions.length,version:buildMeta?.version},onStatus:(phase,data)=>{actionDiagnostics.record('diagnostics-upload',phase,data);const labels={sending:'Отправка в Worker…',accepted:'Worker принял лог. Ожидаю GitHub…',waiting:'Проверка доставки в GitHub…',confirmed:'GitHub подтвердил доставку',pending:'GitHub пока не подтвердил доставку'};if(labels[phase])toast(labels[phase])}});if(result.confirmed){actionDiagnostics.record('diagnostics-upload','success',{runId:result.runId});closeModal();toast('Диагностика доставлена в GitHub · '+result.runId)}else{actionDiagnostics.record('diagnostics-upload','pending',{runId:result.runId});toast('Worker принял лог, GitHub не подтвердил · '+result.runId)}}catch(e){actionDiagnostics.record('diagnostics-upload','error',{message:String(e)});toast('Ошибка отправки диагностики')}}],['Закрыть',closeModal]])}
function handleBack(){if(modalOpen){closeModal();return true}if(nav.current()==='main')return false;nav.back();return true}
const lifecycle=new Lifecycle({onBack:handleBack,onSuspend:persist});
document.addEventListener('click',e=>{const target=e.target.closest('[data-action]');const a=target?.dataset.action;if(!a)return;actionDiagnostics.record(a,'click',{disabled:!!target.disabled,screen:nav.current()});if(a==='new-game')newGame();if(a==='load-game')openLoad();if(a==='settings')nav.show('settings');if(a==='check-updates'){if(updateManager?.busy)return;if(updateManager?.available)updateManager.download();else updateManager?.check({manual:true})};if(a==='back')handleBack();if(a==='debug')debug();if(a==='game-menu')modal('Меню игры','<p>Текущая игровая сессия активна.</p>',[['Продолжить',closeModal],['Сохранить',async()=>{await persist();closeModal();toast('Игра сохранена')}],['Настройки',()=>{closeModal();nav.show('settings')}],['В главное меню',async()=>{await persist();closeModal();nav.reset('main')}]]);});
$('#theme').addEventListener('change',e=>{settings.theme=e.target.value;saveSettings(settings);applySettings()});
$('#volume').addEventListener('input',e=>{settings.volume=Number(e.target.value);saveSettings(settings)});
$('#fullscreen').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch{toast('Полный экран недоступен на этом устройстве')}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#installPwa').classList.remove('hidden')});
$('#installPwa').addEventListener('click',async()=>{if(!installPrompt)return;await installPrompt.prompt();installPrompt=null;$('#installPwa').classList.add('hidden')});
window.addEventListener('appinstalled',()=>toast('Eirdan установлен'));
$('#versionBadge').addEventListener('click',async()=>{try{const meta=await loadCurrentRelease();modal('Версия Eirdan',releaseChangesHtml(meta))}catch(e){console.warn('Release metadata unavailable',e);modal('Версия Eirdan','<p><b>'+(buildMeta?.version||'Версия недоступна')+'</b></p><p>История изменений временно недоступна.</p>')}});
applySettings();nav.reset('main');lifecycle.start();await loadBuild();await registerPwa();updateManager?.check();
