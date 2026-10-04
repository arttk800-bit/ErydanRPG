// Combat Lab UI adapter. It owns Combat Lab controls; legacy game modules do not.
const $=id=>document.getElementById(id);
const CLASSES={archer:'Лучник',crossbowman:'Арбалетчик',guardian:'Страж',berserker:'Берсеркер',priest:'Священник',firemage:'Маг огня',wizard:'Волшебник',assassin:'Ассасин',rogue:'Разбойник'};
const keys=Object.keys(CLASSES);
let runtime=null;

function values(){
 const mode=$('battleMode')?.value||'1v1';
 return {mode,allies:['a0','a1','a2'].map(id=>$(id)?.value||'guardian'),enemies:Math.max(1,Math.min(6,+($('enemies')?.value||3))),terrain:$('terrain')?.value||'normal'};
}
function fill(){
 const o=Object.entries(CLASSES).map(([v,n])=>'<option value="'+v+'">'+n+'</option>').join('');
 ['a0','a1','a2'].forEach((id,i)=>{const e=$(id);if(e){e.innerHTML=o;e.value=['guardian','archer','priest'][i]}});
}
function modeUI(){
 const duel=$('battleMode')?.value==='1v1';
 $('enemyCountLabel')?.classList.toggle('hidden',duel);
 $('ally1Label')?.classList.toggle('hidden',duel);$('ally2Label')?.classList.toggle('hidden',duel);
 $('random')?.classList.toggle('hidden',duel);
 if($('start'))$('start').textContent='Начать бой';
 if($('modeHint'))$('modeHint').textContent=duel?'ГГ против одного противника.':'Тестовый режим 3 vs 3.';
}
function unavailable(action){
 if($('modeHint'))$('modeHint').textContent=action+': Combat runtime ещё не подключён.';
}
export function attachCombatRuntime(api){runtime=api;window.EirdanCombat=api;return api}
export function initCombatUI(){
 fill();modeUI();
 $('battleMode')?.addEventListener('change',modeUI);
 $('random')?.addEventListener('click',()=>['a0','a1','a2'].forEach(id=>{if($(id))$(id).value=keys[Math.floor(Math.random()*keys.length)]}));
 $('start')?.addEventListener('click',()=>runtime?.startBattle?runtime.startBattle(values()):unavailable('Бой'));
 $('sim1v1')?.addEventListener('click',()=>runtime?.simulate?runtime.simulate('1v1',100,values()):unavailable('Симуляция'));
 $('sim3v3')?.addEventListener('click',()=>runtime?.simulate?runtime.simulate('3v3',100,values()):unavailable('Симуляция'));
 window.EIRDAN_COMBAT_UI_READY=true;
}
