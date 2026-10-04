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

function renderBattle(s){
 $('setup')?.classList.add('hidden');$('battle')?.classList.remove('hidden');$('hud')?.classList.remove('hidden');
 if($('round'))$('round').textContent=(s.over?'Бой завершён · ':'')+'Раунд '+s.round+' · ход '+(s.order[s.idx]?.name||'');
 if($('summary'))$('summary').innerHTML=s.units.map(u=>'<div class="card"><b>'+u.name+'</b><br>'+CLASSES[u.cls]+'<br>HP '+u.hp+'/'+u.maxHp+' · AP '+u.ap+' · ST '+u.st+'<br>Щит '+u.shield+'/'+u.maxShield+' · Броня '+u.armorHead+'/'+u.armorBody+(u.alive?'':' · ВЫБЫЛ')+'</div>').join('');
 const cv=$('battleCanvas'),box=$('grid');if(!cv||!box)return;const rect=box.getBoundingClientRect(),dpr=Math.max(1,devicePixelRatio||1);cv.width=Math.max(1,Math.round(rect.width*dpr));cv.height=Math.max(1,Math.round(rect.height*dpr));const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,rect.width,rect.height);
 const tw=Math.max(30,Math.min(52,rect.width/14)),th=tw*.5,ox=rect.width/2+(10-14)*tw/4,oy=Math.max(th*2,(rect.height-(14+10)*th/2)/2+th);
 for(let q=0;q<14;q++)for(let r=0;r<10;r++){let x=ox+(q-r)*tw/2,y=oy+(q+r)*th/2;c.beginPath();c.moveTo(x,y-th/2);c.lineTo(x+tw/2,y);c.lineTo(x,y+th/2);c.lineTo(x-tw/2,y);c.closePath();let u=s.units.find(v=>v.alive&&v.q===q&&v.r===r),t=s.terrain[q+','+r];c.fillStyle=u?(u.team==='ally'?'#183c58':'#522027'):t?'#303a34':((q+r)&1?'#18221e':'#151e1b');c.fill();c.strokeStyle='#46534f';c.stroke();if(u){c.fillStyle=u.team==='ally'?'#79b9ff':'#ff7582';c.font='bold 15px system-ui';c.textAlign='center';c.fillText(String(+u.id.slice(1)+1),x,y+5)}}
}
function ensureRuntimeControls(){
 let a=$('hud')?.querySelector('.actions');if(!a)return;
 if(!$('combatStep')){let b=document.createElement('button');b.id='combatStep';b.textContent='Шаг боя';b.onclick=()=>runtime?.step();a.append(b)}
 if(!$('combatEndTurn')){let b=document.createElement('button');b.id='combatEndTurn';b.textContent='Конец хода';b.onclick=()=>runtime?.endTurn();a.append(b)}
 $('back')?.addEventListener('click',()=>{$('setup')?.classList.remove('hidden');$('battle')?.classList.add('hidden');$('hud')?.classList.add('hidden')},{once:false});
}
window.addEventListener('eirdan:combat-start',e=>{ensureRuntimeControls();renderBattle(e.detail)});
window.addEventListener('eirdan:combat-update',e=>renderBattle(e.detail));
window.addEventListener('eirdan:combat-simulation',e=>{let r=e.detail;if($('modeHint'))$('modeHint').textContent=(r.mode==='1v1'?'1v1':'3v3')+' ×'+r.n+' · союзники '+r.wins.ally+' · враги '+r.wins.enemy+' · ничьи '+r.wins.draw+' · среднее '+r.averageRounds.toFixed(1)+' раундов';$('simProgress')?.classList.add('hidden')});
