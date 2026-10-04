import {W,CL,ARMORS,PD,CLASS_POOL,GRID,DEFAULT_BATTLE_CFG,mkbody} from '../alpha14p/data/constants.js';import {GameRNG,pick} from '../alpha14p/core/rng.js';
const TEST_POOL=['guardian'];

const INV_ITEMS={
 sword_iron:{n:'Железный меч',type:'weapon',slot:'main',w:1.35,ico:'⚔',desc:'Одноручный меч',size:[1,3],combat:{weapon:'sword'}},
 axe_iron:{n:'Боевой топор',type:'weapon',slot:'main',w:1.8,ico:'◆',desc:'Одноручный топор',size:[2,2],combat:{weapon:'axe'}},
 greatsword:{n:'Двуручный меч',type:'weapon',slot:'main',w:3.4,ico:'⚔',desc:'Двуручное оружие',two:true,size:[1,4],combat:{weapon:'greatsword'}},
 greataxe:{n:'Двуручный топор',type:'weapon',slot:'main',w:4.2,ico:'◆',desc:'Двуручное оружие',two:true,size:[2,4],combat:{weapon:'greataxe'}},
 shield_round:{n:'Круглый щит',type:'shield',slot:'off',w:3.2,ico:'◉',desc:'Щит · 55 прочности',size:[2,2],combat:{shield:55}},
 helm_medium:{n:'Кольчужный капюшон',type:'armor',slot:'head',w:2.1,ico:'♜',desc:'Средний шлем · броня 30',size:[2,2],combat:{head:30}},
 helm_heavy:{n:'Латный шлем',type:'armor',slot:'head',w:3.6,ico:'♜',desc:'Тяжёлый шлем · броня 45',size:[2,2],combat:{head:45}},
 armor_medium:{n:'Кольчуга',type:'armor',slot:'body',w:8.4,ico:'▦',desc:'Средняя броня · 55',size:[3,3],combat:{body:55,armCover:.50,legCover:.20,kind:'medium'}},
 armor_heavy:{n:'Латный доспех',type:'armor',slot:'body',w:14.5,ico:'▦',desc:'Тяжёлый доспех · 80',size:[3,4],combat:{body:80,armCover:.75,legCover:.40,kind:'heavy'}},
 boots_light:{n:'Кожаные сапоги',type:'armor',slot:'feet',w:1.1,ico:'♟',desc:'Кожаные сапоги',size:[2,2],combat:{def:0,st:0}},
 boots_heavy:{n:'Латные сапоги',type:'armor',slot:'feet',w:3.2,ico:'♟',desc:'Латные сапоги',size:[2,2],combat:{def:2,st:-5}},
 shirt_linen:{n:'Льняная рубаха',type:'armor',slot:'bodyInner',w:.4,ico:'♧',desc:'Нижний слой торса',size:[2,2],combat:{}},
 trousers_wool:{n:'Шерстяные штаны',type:'armor',slot:'legs',w:.8,ico:'♜',desc:'Верхний слой ног',size:[2,2],combat:{}},
 cloak_wool:{n:'Шерстяной плащ',type:'armor',slot:'cloak',w:1.2,ico:'◒',desc:'Тёплый дорожный плащ',size:[2,3],combat:{}},
 amulet_copper:{n:'Медный амулет',type:'jewelry',slot:'neck',w:.08,ico:'◇',desc:'Простой амулет',size:[1,1],combat:{}},
 ring_iron:{n:'Железное кольцо',type:'jewelry',slot:'ring1',altSlots:['ring1','ring2'],w:.03,ico:'○',desc:'Простое кольцо',size:[1,1],combat:{}},
 backpack_small:{n:'Походный рюкзак',type:'bag',slot:'back',w:1.3,ico:'▣',desc:'Рюкзак 8×6',grid:[8,6],size:[3,3],combat:{capacity:18}},
 backpack_large:{n:'Большой походный рюкзак',type:'bag',slot:'back',w:2.4,ico:'▣',desc:'Рюкзак 10×7',grid:[10,7],size:[4,4],combat:{capacity:30,def:-1}},
 belt_pouch:{n:'Поясная сумка',type:'bag',slot:'belt',w:.35,ico:'▤',desc:'Малая сумка 4×3',grid:[4,3],size:[2,2],combat:{}},
 dagger:{n:'Кинжал',type:'weapon',slot:'main',w:.55,ico:'†',desc:'Одноручный кинжал',size:[1,2],combat:{weapon:'dagger'}}
};
const SLOT_NAMES={head:'Голова',neck:'Амулет',cloak:'Плащ',bodyInner:'Торс · низ',body:'Торс · верх',hands:'Кисти',belt:'Пояс / сумка',legsInner:'Ноги · низ',legs:'Ноги · верх',feet:'Обувь',main:'Правая рука',off:'Левая рука',ring1:'Кольцо I',ring2:'Кольцо II',back:'Рюкзак'};
let uidSeq=1;
const mk=(typeId,location)=>({uid:'itm_'+String(uidSeq++).padStart(6,'0'),typeId,location:{...location},rotation:0});
let playerInventory={cap:30,instances:{},equip:Object.fromEntries(Object.keys(SLOT_NAMES).map(k=>[k,null])),containers:{},environment:[],selected:null,selectedSlot:null,collapsed:{},layouts:{}};
function addInst(typeId,location){let o=mk(typeId,location);playerInventory.instances[o.uid]=o;return o.uid}
let backUid=addInst('backpack_small',{type:'equip',slot:'back'}),pouchUid=addInst('belt_pouch',{type:'equip',slot:'belt'});
playerInventory.equip.back=backUid;playerInventory.equip.belt=pouchUid;playerInventory.containers[backUid]=[];playerInventory.containers[pouchUid]=[];
for(const id of ['sword_iron','boots_light','shirt_linen']){let uid=addInst(id,{type:'container',containerId:backUid});playerInventory.containers[backUid].push(uid)}
function itemOf(uid){return INV_ITEMS[playerInventory.instances[uid]?.typeId]}
function containerUids(){return Object.values(playerInventory.equip).filter(uid=>uid&&INV_ITEMS[playerInventory.instances[uid]?.typeId]?.type==='bag')}
function invWeight(){let seen=new Set();function weigh(uid){if(!uid||seen.has(uid))return 0;seen.add(uid);let it=itemOf(uid),n=it?.w||0;if(it?.type==='bag')n+=(playerInventory.containers[uid]||[]).reduce((s,x)=>s+weigh(x),0);return n}return Object.values(playerInventory.equip).filter(Boolean).reduce((s,u)=>s+weigh(u),0)}
function footprint(uid,rot){let s=itemOf(uid)?.size||[1,1];return rot?[s[1],s[0]]:s}
function layoutFor(cid){let bag=itemOf(cid),ids=playerInventory.containers[cid]||[],[cols,rows]=bag?.grid||[0,0],lay=playerInventory.layouts[cid]||(playerInventory.layouts[cid]={}),occ=Array.from({length:rows},()=>Array(cols).fill(false));for(const uid of ids){let p=lay[uid];if(!p)continue;let [w,h]=footprint(uid,p.rot);let ok=p.x>=0&&p.y>=0&&p.x+w<=cols&&p.y+h<=rows;for(let y=p.y;y<p.y+h&&ok;y++)for(let x=p.x;x<p.x+w;x++)if(occ[y][x])ok=false;if(!ok){delete lay[uid];continue}for(let y=p.y;y<p.y+h;y++)for(let x=p.x;x<p.x+w;x++)occ[y][x]=true}for(const uid of ids){if(lay[uid])continue;let found=null;for(let rot=0;rot<2&&!found;rot++){let [w,h]=footprint(uid,!!rot);for(let y=0;y<=rows-h&&!found;y++)for(let x=0;x<=cols-w&&!found;x++){let ok=true;for(let yy=y;yy<y+h&&ok;yy++)for(let xx=x;xx<x+w;xx++)if(occ[yy][xx])ok=false;if(ok)found={x,y,rot:!!rot}}}if(found){lay[uid]=found;let [w,h]=footprint(uid,found.rot);for(let y=found.y;y<found.y+h;y++)for(let x=found.x;x<found.x+w;x++)occ[y][x]=true}}return lay}
function canPlace(cid,uid,x,y,rot,ignoreUid=uid){let bag=itemOf(cid),[cols,rows]=bag?.grid||[0,0],[w,h]=footprint(uid,rot);if(x<0||y<0||x+w>cols||y+h>rows)return false;let lay=layoutFor(cid);for(const other of playerInventory.containers[cid]||[]){if(other===ignoreUid)continue;let p=lay[other];if(!p)continue;let [ow,oh]=footprint(other,p.rot);if(x< p.x+ow&&x+w>p.x&&y<p.y+oh&&y+h>p.y)return false}return true}
function findSpot(cid,uid,rot=null){let bag=itemOf(cid),[cols,rows]=bag?.grid||[0,0];for(const r of rot==null?[false,true]:[rot]){let [w,h]=footprint(uid,r);for(let y=0;y<=rows-h;y++)for(let x=0;x<=cols-w;x++)if(canPlace(cid,uid,x,y,r,null))return{x,y,rot:r}}return null}
function removeFromLocation(uid){let o=playerInventory.instances[uid];if(!o)return;if(o.location.type==='container'){let a=playerInventory.containers[o.location.containerId]||[];let i=a.indexOf(uid);if(i>=0)a.splice(i,1);delete playerInventory.layouts[o.location.containerId]?.[uid]}else if(o.location.type==='equip'){if(playerInventory.equip[o.location.slot]===uid)playerInventory.equip[o.location.slot]=null}else if(o.location.type==='environment'){let i=playerInventory.environment.indexOf(uid);if(i>=0)playerInventory.environment.splice(i,1)}}
function moveToContainer(uid,cid,spot=null){spot=spot||findSpot(cid,uid);if(!spot)return false;removeFromLocation(uid);(playerInventory.containers[cid]||(playerInventory.containers[cid]=[])).push(uid);playerInventory.layouts[cid]||(playerInventory.layouts[cid]={});playerInventory.layouts[cid][uid]=spot;let o=playerInventory.instances[uid];o.location={type:'container',containerId:cid};o.rotation=spot.rot?90:0;return true}
function firstSpot(uid,exclude=null){for(const cid of containerUids())if(cid!==exclude){let s=findSpot(cid,uid);if(s)return{cid,spot:s}}return null}
function dropItem(uid){removeFromLocation(uid);playerInventory.environment.push(uid);playerInventory.instances[uid].location={type:'environment'};renderInventory();renderEnvironment();refreshInventoryCombat()}
function equipUid(uid,slot=null){let it=itemOf(uid);if(!it)return false;let slots=it.altSlots||[it.slot];slot=slot&&slots.includes(slot)?slot:(slots.find(s=>!playerInventory.equip[s])||slots[0]);if(!slot)return false;let displaced=[];if(playerInventory.equip[slot]&&playerInventory.equip[slot]!==uid)displaced.push(playerInventory.equip[slot]);if(slot==='main'&&it.two&&playerInventory.equip.off)displaced.push(playerInventory.equip.off);if(slot==='off'&&itemOf(playerInventory.equip.main)?.two){$('actionHint').textContent='Двуручное оружие занимает обе руки.';return false}let source=playerInventory.instances[uid]?.location?.containerId||null,plans=[];for(const old of displaced){let p=firstSpot(old,source===old?null:null);if(!p){$('actionHint').textContent='Недостаточно места для снимаемого предмета.';return false}plans.push([old,p])}removeFromLocation(uid);for(const [old,p] of plans)moveToContainer(old,p.cid,p.spot);playerInventory.equip[slot]=uid;playerInventory.instances[uid].location={type:'equip',slot};if(it.type==='bag')playerInventory.containers[uid]||(playerInventory.containers[uid]=[]);renderInventory();refreshInventoryCombat();return true}
function unequipUid(uid){let p=firstSpot(uid,uid);if(!p){$('actionHint').textContent='Недостаточно места в доступных контейнерах.';return false}moveToContainer(uid,p.cid,p.spot);renderInventory();refreshInventoryCombat();return true}
function rotateUid(uid){let o=playerInventory.instances[uid];if(o?.location.type!=='container')return;let cid=o.location.containerId,p=layoutFor(cid)[uid],nr=!p.rot,spot=null;if(canPlace(cid,uid,p.x,p.y,nr))spot={x:p.x,y:p.y,rot:nr};else{let bag=itemOf(cid),[cols,rows]=bag.grid;for(let y=0;y<rows&&!spot;y++)for(let x=0;x<cols&&!spot;x++)if(canPlace(cid,uid,x,y,nr))spot={x,y,rot:nr}}if(!spot){$('actionHint').textContent='Для поворота нет свободного места.';return}playerInventory.layouts[cid][uid]=spot;o.rotation=nr?90:0;renderInventory()}
function sortAll(){for(const cid of containerUids()){let ids=playerInventory.containers[cid]||[];ids.sort((a,b)=>{let A=itemOf(a)?.size||[1,1],B=itemOf(b)?.size||[1,1];return B[0]*B[1]-A[0]*A[1]});playerInventory.layouts[cid]={};layoutFor(cid)}renderInventory()}
function showItemTip(el,uid){let it=itemOf(uid);if(!it)return;let tip=$('itemTip'),r=el.getBoundingClientRect(),w=Math.min(260,innerWidth-20);tip.style.width=w+'px';tip.innerHTML='<b>'+it.n+'</b><small>'+it.desc+'</small><small>ID '+uid+' · '+it.w+' кг · '+(it.size||[1,1]).join('×')+'</small>';tip.classList.remove('hidden');let left=r.right+8;if(left+w>innerWidth-10)left=r.left-w-8;tip.style.left=Math.max(10,left)+'px';tip.style.top=Math.max(10,Math.min(innerHeight-150,r.top))+'px'}
function hideItemTip(){$('itemTip')?.classList.add('hidden')}
let dragState=null;
function bindItemPress(el,uid){let down=null,timer=null;el.onpointerdown=e=>{down={x:e.clientX,y:e.clientY,id:e.pointerId};timer=setTimeout(()=>showItemTip(el,uid),320);el.setPointerCapture?.(e.pointerId)};el.onpointermove=e=>{if(!down)return;let d=Math.hypot(e.clientX-down.x,e.clientY-down.y);if(d>10&&!dragState){clearTimeout(timer);hideItemTip();startDrag(uid,e)}if(dragState)moveDrag(e)};el.onpointerup=e=>{clearTimeout(timer);if(dragState)endDrag(e);else{playerInventory.selected=uid;renderInventory()}down=null};el.onpointercancel=()=>{clearTimeout(timer);cancelDrag();down=null}}
function startDrag(uid,e){let it=itemOf(uid),g=document.createElement('div');g.className='dragGhost';g.innerHTML='<b>'+it.ico+'</b><small>'+it.n+'</small>';document.body.append(g);dragState={uid,ghost:g};moveDrag(e)}
function moveDrag(e){if(!dragState)return;dragState.ghost.style.left=e.clientX+'px';dragState.ghost.style.top=e.clientY+'px'}
function endDrag(e){let s=dragState;if(!s)return;let target=document.elementFromPoint(e.clientX,e.clientY),uid=s.uid,ok=false;if(target?.closest('[data-equip-slot]'))ok=equipUid(uid,target.closest('[data-equip-slot]').dataset.equipSlot);else if(target?.closest('[data-container-id]')){let cid=target.closest('[data-container-id]').dataset.containerId,spot=findSpot(cid,uid);if(spot)ok=moveToContainer(uid,cid,spot)}else if(target?.closest('#environmentWindow')){dropItem(uid);ok=true}s.ghost.remove();dragState=null;if(!ok)renderInventory()}
function cancelDrag(){dragState?.ghost?.remove();dragState=null}
function renderInventory(){let root=$('allContainers');if(!root)return;root.innerHTML='';for(const cid of containerUids()){let bag=itemOf(cid),ids=playerInventory.containers[cid]||[],lay=layoutFor(cid),card=document.createElement('section');card.className='containerCard';card.dataset.containerId=cid;let collapsed=!!playerInventory.collapsed[cid],used=ids.filter(u=>lay[u]).length;card.innerHTML='<div class="containerTitle"><b>'+bag.n+'</b><small>'+bag.grid[0]+'×'+bag.grid[1]+' · '+used+' предмет. '+(collapsed?'▸':'▾')+'</small></div><div class="bag tetrisBag '+(collapsed?'hidden':'')+'" data-container-id="'+cid+'"></div>';card.querySelector('.containerTitle').onclick=()=>{playerInventory.collapsed[cid]=!collapsed;renderInventory()};let grid=card.querySelector('.bag');grid.style.setProperty('--cols',bag.grid[0]);grid.style.setProperty('--rows',bag.grid[1]);for(let y=0;y<bag.grid[1];y++)for(let x=0;x<bag.grid[0];x++){let cell=document.createElement('button');cell.className='cellBg';cell.style.gridColumn=x+1;cell.style.gridRow=y+1;grid.append(cell)}for(const uid of ids){let p=lay[uid];if(!p)continue;let it=itemOf(uid),[w,h]=footprint(uid,p.rot),el=document.createElement('button');el.className='invItem';el.dataset.uid=uid;el.style.gridColumn=(p.x+1)+' / span '+w;el.style.gridRow=(p.y+1)+' / span '+h;el.innerHTML='<div class="ico" style="transform:rotate('+(p.rot?90:0)+'deg)">'+it.ico+'</div><small>'+it.n+'</small>';bindItemPress(el,uid);grid.append(el)}root.append(card)}$('invStats').textContent='Вес '+invWeight().toFixed(1)+' / '+playerInventory.cap.toFixed(1)+' кг · контейнеров '+containerUids().length;renderCharacter();renderEnvironment();renderSelectedActions()}
function renderCharacter(){let eq=$('equip');if(!eq)return;eq.innerHTML=Object.entries(SLOT_NAMES).map(([slot,n])=>{let uid=playerInventory.equip[slot],it=itemOf(uid),two=slot==='off'&&itemOf(playerInventory.equip.main)?.two&&!uid;return '<button class="slot '+(!uid&&!two?'empty':'')+'" data-equip-slot="'+slot+'" title="'+n+'"><span class="slotIco">'+(two?'↔':it?.ico||'—')+'</span><small>'+n+'</small></button>'}).join('');eq.querySelectorAll('.slot').forEach(el=>{let slot=el.dataset.equipSlot,uid=playerInventory.equip[slot];if(uid)bindItemPress(el,uid)})}
function renderSelectedActions(){let box=$('itemActions'),uid=playerInventory.selected,it=itemOf(uid);if(!box)return;if(!uid||!it){box.classList.add('hidden');box.innerHTML='';return}let loc=playerInventory.instances[uid].location,buttons=[];if(it.slot)buttons.push('<button data-a="equip">Экипировать</button>');if(loc.type==='container')buttons.push('<button data-a="rotate">Повернуть</button>');if(loc.type==='equip')buttons.push('<button data-a="unequip">Снять</button>');buttons.push('<button data-a="drop">Выбросить</button>');box.innerHTML=buttons.join('');box.classList.remove('hidden');box.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.a==='equip')equipUid(uid);if(b.dataset.a==='rotate')rotateUid(uid);if(b.dataset.a==='unequip')unequipUid(uid);if(b.dataset.a==='drop')dropItem(uid)})}
function renderEnvironment(){let root=$('environmentList');if(!root)return;root.innerHTML=playerInventory.environment.length?playerInventory.environment.map(uid=>{let it=itemOf(uid);return '<div class="envItem" data-env-uid="'+uid+'"><span>'+it.ico+' '+it.n+' <small>'+uid+'</small></span><button data-pick="'+uid+'">Подобрать</button></div>'}).join(''):'<div class="note">Рядом ничего не лежит.</div>';root.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{let uid=b.dataset.pick,p=firstSpot(uid);if(!p){$('actionHint').textContent='Нет места в доступных контейнерах.';return}moveToContainer(uid,p.cid,p.spot);renderInventory()})}
function renderDebugItems(){let root=$('debugItemList');if(!root)return;root.innerHTML=Object.entries(INV_ITEMS).map(([id,it])=>'<span>'+it.ico+' '+it.n+'</span><button data-add="'+id+'">Добавить</button>').join('');root.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{let uid=addInst(b.dataset.add,{type:'environment'}),p=firstSpot(uid);if(p)moveToContainer(uid,p.cid,p.spot);else{playerInventory.environment.push(uid);playerInventory.instances[uid].location={type:'environment'};$('actionHint').textContent='Контейнеры заполнены: предмет добавлен в окружение.'}renderInventory()})}
function openInventory(){renderInventory();$('invOverlay').classList.remove('hidden');restoreInvWindow()}
function closeInventory(){$('invOverlay').classList.add('hidden');saveInvWindow()}
function saveInvWindow(){let p=$('invOverlay')?.querySelector('.invPanel');if(!p)return;try{localStorage.setItem('eirdan-inv-window',JSON.stringify({left:p.style.left,top:p.style.top,width:p.style.width,height:p.style.height,min:p.classList.contains('minimized')}))}catch(_){}}
function restoreInvWindow(){let p=$('invOverlay')?.querySelector('.invPanel');if(!p)return;try{let s=JSON.parse(localStorage.getItem('eirdan-inv-window')||'null');if(s){p.style.left=s.left||p.style.left;p.style.top=s.top||p.style.top;p.style.width=s.width||p.style.width;p.style.height=s.height||p.style.height;p.classList.toggle('minimized',!!s.min)}}catch(_){}}
function makeDraggable(winId,barId,key){let p=$(winId),bar=$(barId);if(!p||!bar)return;let d=null;bar.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;let r=p.getBoundingClientRect();d={x:e.clientX-r.left,y:e.clientY-r.top};bar.setPointerCapture?.(e.pointerId)});bar.addEventListener('pointermove',e=>{if(!d)return;p.style.left=Math.max(0,Math.min(innerWidth-p.offsetWidth,e.clientX-d.x))+'px';p.style.top=Math.max(0,Math.min(innerHeight-p.offsetHeight,e.clientY-d.y))+'px';p.style.right='auto';p.style.bottom='auto'});bar.addEventListener('pointerup',()=>d=null);bar.addEventListener('pointercancel',()=>d=null)}
function initInvWindow(){let p=$('invOverlay')?.querySelector('.invPanel');makeDraggable(p?.id||'__none','invDrag','inv');let bar=$('invDrag'),d=null;if(p&&bar){bar.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;let r=p.getBoundingClientRect();d={x:e.clientX-r.left,y:e.clientY-r.top}});bar.addEventListener('pointermove',e=>{if(!d)return;p.style.left=Math.max(0,Math.min(innerWidth-p.offsetWidth,e.clientX-d.x))+'px';p.style.top=Math.max(0,Math.min(innerHeight-p.offsetHeight,e.clientY-d.y))+'px'});bar.addEventListener('pointerup',()=>d=null)}makeDraggable('charWindow','charDrag','char');makeDraggable('environmentWindow','envDrag','env');makeDraggable('debugItemsWindow','debugItemsDrag','debug');$('invMin').onclick=()=>p.classList.toggle('minimized');$('invCharacter').onclick=()=>$('charWindow').classList.toggle('hidden');$('openCharacter')?.addEventListener('click',()=>$('charWindow').classList.remove('hidden'));$('charClose').onclick=()=>$('charWindow').classList.add('hidden');$('charMin').onclick=()=>$('charWindow').classList.toggle('minimized');$('invSort').onclick=sortAll;$('openEnvironment').onclick=()=>{$('environmentWindow').classList.remove('hidden');renderEnvironment()};$('envClose').onclick=()=>$('environmentWindow').classList.add('hidden');$('envMin').onclick=()=>$('environmentWindow').classList.toggle('minimized');$('openDebugItems').onclick=()=>{$('debugItemsWindow').classList.remove('hidden');renderDebugItems()};$('debugItemsClose').onclick=()=>$('debugItemsWindow').classList.add('hidden')}
function equipSelected(){let uid=playerInventory.selected;if(uid)equipUid(uid)}
function unequipSelected(){let uid=playerInventory.selected;if(uid)unequipUid(uid)}
function discardSelected(){let uid=playerInventory.selected;if(uid)dropItem(uid)}
function rotateSelected(){let uid=playerInventory.selected;if(uid)rotateUid(uid)}
function sortInventory(){sortAll()}
function activeContainerId(){return containerUids()[0]||null}
function activeBag(){let c=activeContainerId();return c?(playerInventory.containers[c]||[]):[]}
function syncBagAlias(){}
function itemBonusText(id){let it=INV_ITEMS[id];if(!it)return 'пусто';let c=it.combat||{},w=c.weapon&&W[c.weapon],a=[];if(w)a.push('урон '+w.min+'-'+w.max,'AP '+w.ap,'точн '+(w.acc>=0?'+':'')+w.acc,'проб '+Math.round((w.pen||0)*100)+'%','бронеурон x'+(w.ad||0),'щитоурон x'+(w.sd||0));if(c.shield)a.push('щит +'+c.shield);if(c.head!=null)a.push('броня головы +'+c.head);if(c.body!=null)a.push('броня корпуса +'+c.body,'руки '+Math.round((c.armCover||0)*100)+'%','ноги '+Math.round((c.legCover||0)*100)+'%');if(c.def)a.push('DEF '+(c.def>0?'+':'')+c.def);if(c.st)a.push('ST '+(c.st>0?'+':'')+c.st);if(c.capacity)a.push('вес +'+c.capacity+' кг');return it.n+' ['+a.join(', ')+']'}
function loadoutText(eq){return ['Правая рука: '+itemBonusText(eq.main),'Левая рука: '+(INV_ITEMS[eq.main]?.two?'ЗАНЯТА ДВУРУЧНЫМ ОРУЖИЕМ':itemBonusText(eq.off)),'Голова: '+itemBonusText(eq.head),'Корпус: '+itemBonusText(eq.body),'Ноги: '+itemBonusText(eq.feet),'Спина: '+itemBonusText(eq.back)].join('\n')}
function unitDerivedText(u){return 'ИТОГ: оружие '+W[u.w].n+' '+W[u.w].min+'-'+W[u.w].max+' · HP '+u.hp+'/'+u.maxHp+' · ST '+u.st+'/'+(u.maxSt||100)+' · DEF '+u.def+' · щит '+u.shield+'/'+u.maxShield+' · броня головы '+u.armorHead+'/'+u.maxArmorHead+' · корпуса '+u.armorBody+'/'+u.maxArmorBody+' · покрытие рук '+Math.round((u.armCover||0)*100)+'% · ног '+Math.round((u.legCover||0)*100)+'%'}
function randomLoadout(){let main=pick(['sword_iron','axe_iron','greatsword','greataxe','dagger']),two=INV_ITEMS[main].two;return{main,off:two?null:(GameRNG.random()<.65?'shield_round':null),head:pick([null,'helm_medium','helm_heavy']),body:pick([null,'armor_medium','armor_heavy']),feet:pick(['boots_light','boots_heavy']),back:pick([null,'backpack_small','backpack_large'])}}
function applyLoadoutToUnit(u,eq){let old=playerInventory.equip;playerInventory.equip=eq;syncPlayerInventoryToCombat(u);playerInventory.equip=old;u.loadout=structuredClone(eq)}
function downloadTxt(name,text){let a=document.createElement('a');a.href='data:text/plain;charset=utf-8,'+encodeURIComponent('\uFEFF'+text);a.download=name;a.target='_blank';a.rel='noopener';document.body.append(a);a.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));a.remove()}
function playerUnit(){return units.find(u=>u.id==='a0')}
function syncPlayerInventoryToCombat(u=playerUnit()){
 if(!u)return;
 let mainIt=INV_ITEMS[playerInventory.equip.main],offIt=INV_ITEMS[playerInventory.equip.off],headIt=INV_ITEMS[playerInventory.equip.head],bodyIt=INV_ITEMS[playerInventory.equip.body],feetIt=INV_ITEMS[playerInventory.equip.feet],backIt=INV_ITEMS[playerInventory.equip.back];
 let main=mainIt?.combat||{},off=offIt?.combat||{},head=headIt?.combat||{},body=bodyIt?.combat||{},feet=feetIt?.combat||{},back=backIt?.combat||{};
 u.w=main.weapon&&W[main.weapon]?main.weapon:'dagger';u.w2=null;
 u.maxShield=off.shield||0;u.shield=u.maxShield;
 u.maxArmorHead=head.head||0;u.armorHead=u.maxArmorHead;
 u.maxArmorBody=body.body||0;u.armorBody=u.maxArmorBody;u.armCover=body.armCover||0;u.legCover=body.legCover||0;
 u.armorKind=body.kind||'none';u.armorName=bodyIt?.n||'Без брони';u.helmetName=headIt?.n||'Без шлема';u.bootsName=feetIt?.n||'Без обуви';u.backpackName=backIt?.n||'Без рюкзака';
 u.def=6+(feet.def||0)+(back.def||0);u.maxSt=100+(feet.st||0);u.st=Math.min(u.st,u.maxSt);
 playerInventory.cap=30+(back.capacity||0);
}
function refreshInventoryCombat(){
 let u=playerUnit();if(u){syncPlayerInventoryToCombat(u);nextRender()}renderInventory()
}
const SPRITE_SRC={
 guardian:'data:image/png;base64,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',
 archer:'data:image/png;base64,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',
 berserker:'data:image/png;base64,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'
};
const SPRITES={};for(const[k,v]of Object.entries(SPRITE_SRC)){let im=new Image();im.onload=()=>{SPRITES[k]=im;if(!$('battle')?.classList.contains('hidden'))drawField()};im.src=v}

let cfg=structuredClone(DEFAULT_BATTLE_CFG),units=[],terrain={},order=[],idx=0,round=1,over=false,auto=false,combatSpeed=1,combatTimer=null,combatLog=[],fullLog=[];
const combatDelay=()=>Math.max(45,Math.round(520/combatSpeed));
let combatFloats=[],moveAnimations=new Map(),fieldAnimFrame=0;
function combatFloat(u,text,kind='hit'){if(simulationRunning||!u)return;combatFloats.push({q:u.q,r:u.r,text,kind,born:performance.now()});requestFieldFrame()}
function queueAi(fn=aiTurn){clearTimeout(combatTimer);combatTimer=setTimeout(fn,combatDelay())}
const log=s=>{let line='R'+round+' · '+s;combatLog.unshift(line);if(combatLog.length>80)combatLog.length=80;fullLog.push(line)};
const $=id=>document.getElementById(id);
function gear(cls){if(cls==='guardian')return{w:pick(['sword','axe']),w2:null,shield:55};if(cls==='berserker')return{w:pick(['greatsword','greataxe']),w2:null,shield:0};if(['priest','firemage','wizard'].includes(cls))return{w:pick(['staff','wand']),w2:null,shield:0};if(cls==='archer')return{w:'bow',w2:'dagger',shield:0};if(cls==='crossbowman')return{w:'crossbow',w2:'dagger',shield:0};if(cls==='assassin')return{w:'dagger',w2:'dagger',shield:0};if(cls==='rogue')return{w:'throwknife',w2:'dagger',shield:0};return{w:'sword',w2:null,shield:0}}
function make(id,name,team,q,r,cls){let g=gear(cls),ak=pick(['light','medium','heavy']),ar=ARMORS[ak],magic=['priest','firemage','wizard'].includes(cls);return{id,name,team,q,r,cls,w:g.w,w2:g.w2,shield:g.shield,maxShield:g.shield,armorKind:ak,armorName:ar.n,armCover:ar.arm,legCover:ar.leg,body:mkbody(),hp:90,maxHp:90,bleed:0,armorHead:ar.head,maxArmorHead:ar.head,armorBody:ar.body,maxArmorBody:ar.body,ap:9,maxAp:9,st:100,mana:magic?80:0,maxMana:magic?80:0,skill:63,def:6,alive:true,bandages:1,loaded:false,guarding:false,poison:0,shock:0,stun:0,buffs:{stone:0,rage:0}}}
const hd=(q1,r1,q2,r2)=>Math.abs(q1-q2)+Math.abs(r1-r2);
function genTerrain(){terrain={};let density={open:.04,sparse:.11,normal:.18,dense:.28}[cfg.terrain]??.18,safe=[[1,4],[1,5],[1,6],[12,2],[12,3],[12,4],[12,5],[12,6],[11,7]];for(let q=0;q<GRID.C;q++)for(let r=0;r<GRID.R;r++){if(safe.some(p=>hd(q,r,p[0],p[1])<=1))continue;if(GameRNG.random()<density){let x=GameRNG.random();terrain[q+','+r]=x<.34?'rock':x<.68?'tree':'bush'}}}
let pendingDuel=false,simulationRunning=false;
function fill(){let o=TEST_POOL.map(c=>'<option value="'+c+'">'+CL[c].n+'</option>').join('');['a0','a1','a2'].forEach((id,i)=>{$(id).innerHTML=o;$(id).value=cfg.allies[i]})}fill();
$('random').onclick=()=>['a0','a1','a2'].forEach(id=>$(id).value=pick(TEST_POOL));
function updateModeUI(){let duel=$('battleMode').value==='1v1';$('enemyCountLabel').classList.toggle('hidden',duel);$('ally1Label').classList.toggle('hidden',duel);$('ally2Label').classList.toggle('hidden',duel);$('random').classList.toggle('hidden',duel);$('start').textContent=duel?'Подготовить бой 1 vs 1':'Начать бой';$('modeHint').textContent=duel?'ГГ против одного Стража. Сначала настрой экипировку, затем нажми «Вступить в бой».':'Тестовый режим 3 vs 3. Временно доступен только Страж.'}
$('battleMode').onchange=updateModeUI;updateModeUI();
$('start').onclick=()=>{
 if($('battleMode').value==='1v1'){pendingDuel=true;$('prepFight').classList.remove('hidden');openInventory();return}
 pendingDuel=false;$('prepFight').classList.add('hidden');beginBattle(false)
};
function beginBattle(duel=false){
 cfg.allies=duel?[$('a0').value]:['a0','a1','a2'].map(id=>$(id).value);cfg.enemies=duel?1:Math.max(1,Math.min(6,+$('enemies').value||3));cfg.terrain=$('terrain').value;
 let ap=duel?[[2,5]]:[[1,4],[1,5],[1,6]],ep=duel?[[11,5]]:[[12,2],[12,3],[12,4],[12,5],[12,6],[11,7]];
 units=[];let allyN=duel?1:3;for(let i=0;i<allyN;i++)units.push(make('a'+i,i?'Союзник '+(i+1):'ГГ','ally',...ap[i],cfg.allies[i]));
 for(let i=0;i<cfg.enemies;i++)units.push(make('e'+i,'Враг '+(i+1),'enemy',...ep[i],pick(TEST_POOL)));
 syncPlayerInventoryToCombat(units[0]);units[0].loadout=structuredClone(playerInventory.equip);order=[...units];idx=0;round=1;over=false;auto=false;combatLog=[];fullLog=[];genTerrain();fullLog.push('=== START ===','Режим: '+(duel?'1v1':'3v3')+' · местность '+cfg.terrain,...units.map(u=>u.name+' ['+u.q+','+u.r+'] · '+unitDerivedText(u)+(u.loadout?'\n'+loadoutText(u.loadout):'')));render();$('setup').classList.add('hidden');$('battle').classList.remove('hidden');$('hud').classList.remove('hidden');ensureBattleControls()
}
$('prepFight').onclick=()=>{if(!pendingDuel)return;pendingDuel=false;$('prepFight').classList.add('hidden');closeInventory();beginBattle(true)};

function canvasLayout(){
 let cv=$('battleCanvas'),box=$('grid').getBoundingClientRect(),dpr=Math.max(1,window.devicePixelRatio||1);
 if(cv.width!==Math.round(box.width*dpr)||cv.height!==Math.round(box.height*dpr)){cv.width=Math.round(box.width*dpr);cv.height=Math.round(box.height*dpr)}
 let ctx=cv.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
 let tileW=Math.min(box.width/(GRID.C+GRID.R)*1.72,box.height/(GRID.C+GRID.R)*3.15),tileH=tileW*.5;
 tileW=Math.max(34,tileW*1.14);tileH=tileW*.5;
 let fieldW=(GRID.C+GRID.R)*tileW/2,fieldH=(GRID.C+GRID.R)*tileH/2;
 let ox=box.width/2+(GRID.R-GRID.C)*tileW/4,oy=Math.max(tileH*1.8,(box.height-fieldH)/2+tileH);
 return{cv,ctx,tileW,tileH,ox,oy,w:box.width,h:box.height}
}
function cellHeight(q,r){return terrain[q+','+r+'#z']||0}
function isoCenter(q,r,L,z=cellHeight(q,r)){return{x:L.ox+(q-r)*L.tileW/2,y:L.oy+(q+r)*L.tileH/2-z*L.tileH*.72}}
function isoTile(ctx,x,y,L){let hw=L.tileW/2,hh=L.tileH/2;ctx.beginPath();ctx.moveTo(x,y-hh);ctx.lineTo(x+hw,y);ctx.lineTo(x,y+hh);ctx.lineTo(x-hw,y);ctx.closePath()}
function requestFieldFrame(){if(fieldAnimFrame)return;fieldAnimFrame=requestAnimationFrame(()=>{fieldAnimFrame=0;drawField()})}
function drawField(){
 let L=canvasLayout(),{ctx}=L;ctx.clearRect(0,0,L.w,L.h);let by=new Map(units.filter(u=>u.alive).map(u=>[u.q+','+u.r,u])),active=order[idx],mc=active?moveCost(active):null,reachableSet=!auto&&active?.id==='a0'?reachablePaths(active):null;
 let cells=[];for(let q=0;q<GRID.C;q++)for(let r=0;r<GRID.R;r++)cells.push([q,r]);cells.sort((a,b)=>(a[0]+a[1])-(b[0]+b[1]));
 for(const [q,r] of cells){let {x,y}=isoCenter(q,r,L),u=by.get(q+','+r),t=terrain[q+','+r],reachable=!!reachableSet&&!u&&!blocked(q,r)&&reachableSet.has(q+','+r);isoTile(ctx,x,y,L);let movingHere=u&&moveAnimations.has(u.id);ctx.fillStyle=reachable?'#244a3d':u&&!movingHere?(u.team==='ally'?'#183c58':'#522027'):t==='bush'?'#234331':t==='rock'||t==='tree'?'#343b37':((q+r)&1?'#18221e':'#151e1b');ctx.fill();ctx.strokeStyle=reachable?'#79d6b8':'#46534f';ctx.lineWidth=reachable?2:1;ctx.stroke();if(t&&!u){ctx.fillStyle='#b6c3bd';ctx.font='bold '+Math.max(10,L.tileH*.45)+'px system-ui';ctx.textAlign='center';ctx.fillText(t==='rock'?'◆':t==='tree'?'♠':'✦',x,y+3)}}
 let actors=units.filter(u=>u.alive).map(u=>({u,p:isoCenter(u.q,u.r,L)})).sort((a,b)=>a.p.y-b.p.y);
 for(const {u,p:baseP} of actors){let anim=moveAnimations.get(u.id),p=baseP;if(anim){let age=performance.now()-anim.start,seg=Math.min(anim.path.length-1,Math.floor(age/anim.stepMs)),t=Math.min(1,(age-seg*anim.stepMs)/anim.stepMs),a=isoCenter(anim.path[seg][0],anim.path[seg][1],L),b=isoCenter(anim.path[Math.min(seg+1,anim.path.length-1)][0],anim.path[Math.min(seg+1,anim.path.length-1)][1],L);let hop=Math.sin(Math.PI*t)*L.tileH*.62;p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t-hop};if(age>=anim.stepMs*(anim.path.length-1)){moveAnimations.delete(u.id);p=baseP}else requestFieldFrame()}let h=L.tileH*2.25,footY=p.y+L.tileH*.15;ctx.save();ctx.fillStyle=u.team==='ally'?'rgba(60,140,255,.42)':'rgba(225,70,85,.42)';ctx.beginPath();ctx.ellipse(p.x,footY,L.tileW*.29,L.tileH*.21,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=u.team==='ally'?'#79b9ff':'#ff7582';ctx.font='900 '+Math.max(16,L.tileH*.82)+'px system-ui';ctx.textAlign='center';ctx.strokeStyle='#07100d';ctx.lineWidth=4;ctx.strokeText(String(Number(u.id.slice(1))+1),p.x,p.y-L.tileH*.22);ctx.fillText(String(Number(u.id.slice(1))+1),p.x,p.y-L.tileH*.22);ctx.restore()}
 let now=performance.now();combatFloats=combatFloats.filter(f=>now-f.born<950);for(const f of combatFloats){let p=isoCenter(f.q,f.r,L),age=(now-f.born)/950;ctx.save();ctx.globalAlpha=Math.max(0,1-age);ctx.font='900 '+Math.max(14,L.tileH*.65)+'px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#07100d';ctx.fillStyle=f.kind==='miss'?'#d7ddd9':f.kind==='block'?'#8fd4ff':'#ff707b';let yy=p.y-L.tileH-age*L.tileH*1.5;ctx.strokeText(f.text,p.x,yy);ctx.fillText(f.text,p.x,yy);ctx.restore()}if(combatFloats.length)requestFieldFrame();
 window.__isoLayout=L
}
function render(){drawField();$('round').textContent='Раунд 1 · '+units.length+' бойцов · '+cfg.terrain;$('summary').innerHTML=units.map(u=>'<div class="card"><b>'+u.name+'</b><br>'+CL[u.cls].n+'<br>'+W[u.w].n+(u.w2?' + '+W[u.w2].n:'')+'<br>'+(u.id==='a0'?(u.helmetName+' · '+u.armorName+' · '+u.bootsName):u.armorName)+'<br>HP '+u.hp+' · AP '+u.ap+' · ST '+u.st+'/'+(u.maxSt||100)+' · DEF '+u.def+'<br>Щит '+u.shield+'/'+u.maxShield+' · Броня '+u.armorHead+'/'+u.armorBody+'<br>Кровотечение '+u.bleed+(u.prepared?' · ПРИГОТОВЛЕН':'')+(u.alive?'':' · ВЫБЫЛ')+'</div>').join('')}
$('back').onclick=()=>{hideResultOverlay();$('resultOverlay').dataset.kind='';$('resultNew').textContent='Новый бой';$('sim1v1').disabled=false;$('sim3v3').disabled=false;window.lastSimulationReport=null;window.lastSimulationFile=null;pendingDuel=false;$('prepFight').classList.add('hidden');$('setup').classList.remove('hidden');$('battle').classList.add('hidden');$('hud').classList.add('hidden')};

const dirs=()=>[[1,0],[-1,0],[0,1],[0,-1]];
const neigh=(q,r)=>dirs().map(d=>[q+d[0],r+d[1]]).filter(p=>p[0]>=0&&p[0]<GRID.C&&p[1]>=0&&p[1]<GRID.R);
const at=(q,r)=>units.find(u=>u.alive&&u.q===q&&u.r===r);
const blocked=(q,r)=>['rock','tree'].includes(terrain[q+','+r]);
const dist=(a,b)=>hd(a.q,a.r,b.q,b.r);
const activeWeapon=(a,t)=>(a.cls==='archer'&&dist(a,t)<=1&&a.w2)?a.w2:a.w;
const moveCost=a=>{let legs=['lleg','rleg'].map(k=>a.body[k]),crip=legs.filter(x=>x.hp<=0).length;return crip?{ap:4,st:18}:{ap:a.st<25?3:2,st:8}};
const partKeys=['head','torso','larm','rarm','lleg','rleg'];
const rndPart=()=>{let x=GameRNG.random()*100;return x<10?'head':x<50?'torso':x<62?'larm':x<74?'rarm':x<87?'lleg':'rleg'};
function coverPenalty(a,t){let pen=0,steps=Math.max(1,Math.ceil(dist(a,t)));for(let i=1;i<steps;i++){let q=Math.round(a.q+(t.q-a.q)*i/steps),r=Math.round(a.r+(t.r-a.r)*i/steps),z=terrain[q+','+r];if(z==='tree')pen+=25;else if(z==='bush')pen+=7;else if(z==='rock')pen+=35}if(terrain[t.q+','+t.r]==='bush')pen+=10;return Math.min(75,pen)}
function chance(a,t,p=null,wk=null){let w=W[wk||activeWeapon(a,t)],pen=w.type==='bow'?Math.max(0,dist(a,t)-2)*8:0,fat=a.st<25?20:a.st<50?8:0,cov=w.type==='bow'?coverPenalty(a,t):0,ready=t.prepared?15:0;return Math.max(5,Math.min(95,a.skill+w.acc-t.def-pen-fat-cov-ready+(p?PD[p].mod:0)))}
function oneHit(a,t,p,wk,m=1){
 let w=W[wk],fat=a.st<25?.7:a.st<50?.88:1,raw=Math.max(1,Math.round((w.min+GameRNG.random()*(w.max-w.min))*fat*m));
 let pre={hp:t.hp,part:t.body[p].hp,shield:t.shield,ah:t.armorHead,ab:t.armorBody,bleed:t.bleed};
 if(t.shield>0&&GameRNG.random()<(w.type==='bow'?.82:.65)){
  let sd=Math.max(1,Math.round(raw*w.sd)),actual=Math.min(t.shield,sd);t.shield=Math.max(0,t.shield-sd);
  log('[АТАКА] '+a.name+' → '+t.name+' · '+W[wk].n+' · '+PD[p].n+' · сырой '+raw+' · ЩИТ поглотил '+actual+' ('+pre.shield+'→'+t.shield+')');combatFloat(t,'ЩИТ −'+actual,'block');return
 }
 let slot=p==='head'?'armorHead':p==='torso'||p.includes('arm')||p.includes('leg')?'armorBody':null,cover=p==='head'?1:p==='torso'?1:p.includes('arm')?t.armCover:t.legCover,bodyD=raw,armorHit=false,armorLoss=0,pen=1;
 if(slot&&t[slot]>0&&GameRNG.random()<cover){
  armorHit=true;let max='max'+slot[0].toUpperCase()+slot.slice(1),ratio=t[slot]/Math.max(1,t[max]);pen=Math.min(.7,(w.pen||.1)+(1-ratio)*.45);bodyD=Math.max(1,Math.round(raw*pen));armorLoss=Math.min(t[slot],Math.max(1,Math.round(raw*(w.ad||.5))));t[slot]=Math.max(0,t[slot]-Math.max(1,Math.round(raw*(w.ad||.5))))
 }
 if(t.prepared){let beforePrep=bodyD;bodyD=Math.max(1,Math.round(bodyD*.8));log('[ПРИГОТОВИТЬСЯ] '+t.name+' поглощает '+(beforePrep-bodyD)+' урона · '+beforePrep+'→'+bodyD)}let before=t.body[p].hp;t.body[p].hp=Math.max(0,before-bodyD);t.hp=Math.max(0,t.hp-bodyD);
 let cripple=before>0&&t.body[p].hp<=0&&['larm','rarm','lleg','rleg'].includes(p);if(cripple)t.bleed=Math.min(12,(t.bleed||0)+2);
 if(t.hp<=0||t.body.head.hp<=0||t.body.torso.hp<=0)t.alive=false;
 combatFloat(t,'−'+bodyD,'hit');log('[АТАКА] '+a.name+' → '+t.name+' · '+W[wk].n+' · '+PD[p].n+' · сырой '+raw+(armorHit?' · БРОНЯ '+(slot==='armorHead'?'голова':'корпус')+' −'+armorLoss+' ('+(slot==='armorHead'?pre.ah:pre.ab)+'→'+t[slot]+'), прошло '+bodyD+' ['+Math.round(pen*100)+'%]':' · без брони, прошло '+bodyD)+' · часть '+pre.part+'→'+t.body[p].hp+' · HP '+pre.hp+'→'+t.hp+(cripple?' · КОНЕЧНОСТЬ ВЫВЕДЕНА · bleed '+pre.bleed+'→'+t.bleed:'')+(t.alive?'':' · ВЫБЫЛ'))
}
function attack(a,t,p=null){let wk=activeWeapon(a,t),w=W[wk],cost=p?5:w.ap;if(a.ap<cost||dist(a,t)>w.r)return false;let ap0=a.ap,st0=a.st,d=dist(a,t);a.ap-=cost;a.st=Math.max(0,a.st-(p?18:14));let ch=chance(a,t,p,wk);log('[НАМЕРЕНИЕ] '+a.name+' атакует '+t.name+' · '+W[wk].n+' · дистанция '+d+' · шанс '+Math.round(ch)+'% · AP '+ap0+'→'+a.ap+' · ST '+st0+'→'+a.st);if(GameRNG.random()*100<=ch)oneHit(a,t,p||rndPart(),wk,p?PD[p].m:1);else{log('[ПРОМАХ] '+a.name+' → '+t.name+' · '+W[wk].n+' · шанс '+Math.round(ch)+'% · позиция ['+a.q+','+a.r+']→['+t.q+','+t.r+']');combatFloat(t,'ПРОМАХ','miss')}checkEnd();return true}
function restSkill(a){
 if(a.ap<4||a.st>=a.maxSt)return false;let ap0=a.ap,st0=a.st;a.ap-=4;a.st=Math.min(a.maxSt||100,a.st+30);log('[НАВЫК] '+a.name+' · ПЕРЕДЫШКА · AP '+ap0+'→'+a.ap+' · ST '+st0+'→'+a.st);return true
}
function prepareSkill(a){
 if(a.ap<4||a.prepared)return false;let ap0=a.ap;a.ap-=4;a.prepared=true;log('[НАВЫК] '+a.name+' · ПРИГОТОВИТЬСЯ · AP '+ap0+'→'+a.ap+' · до следующего хода: точность атак по цели −15, прошедший урон ×0.80');return true
}
function battleResultText(A,E){
 let result=A&&!E?'ПОБЕДА':E&&!A?'ПОРАЖЕНИЕ':'БОЙ ЗАВЕРШЁН';
 let lines=['=== '+result+' ===','Раунд: '+round,''];
 for(const u of units){
  let head=u.body?.head?.hp??0,torso=u.body?.torso?.hp??0;
  lines.push(u.name+' · '+(u.alive?'жив':'выбыл'));
  lines.push('HP '+u.hp+'/'+u.maxHp+' · Голова '+head+'/'+(u.body?.head?.max??'?')+' · Туловище '+torso+'/'+(u.body?.torso?.max??'?'));
  lines.push('Оружие: '+(W[u.w]?.n||u.w)+' · Броня: '+(u.armorName||'Без брони')+' · Щит '+u.shield+'/'+u.maxShield+' · Кровотечение '+u.bleed);if(u.loadout){lines.push(loadoutText(u.loadout));lines.push(unitDerivedText(u))}
 }
 lines.push('','--- ПОЛНЫЙ ЖУРНАЛ БОЯ ---',...fullLog);
 return lines.join('\n')
}
function checkEnd(){let A=units.some(u=>u.alive&&u.team==='ally'),E=units.some(u=>u.alive&&u.team==='enemy'),was=over;over=!A||!E;if(over){$('round').textContent=(A?'Победа':'Поражение')+' · раунд '+round;if(!was&&!simulationRunning)setTimeout(()=>showBattleResult(A,E),0)}return over}
function showResultOverlay(){let o=$('resultOverlay');if(o){o.style.display='grid';o.classList.remove('hidden')}}
function hideResultOverlay(){let o=$('resultOverlay');if(o){o.classList.add('hidden');o.style.display=''}}
function showBattleResult(A,E){
 if(simulationRunning||$('resultOverlay').dataset.kind==='simulation')return;
 $('resultOverlay').dataset.kind='battle';$('resultNew').textContent=combatContext?.type==='arena'?'Вернуться на арену':'Новый бой';
 window.lastBattleReport=battleResultText(A,E);
 let title=A&&!E?'Победа':E&&!A?'Поражение':'Бой завершён';
 $('resultTitle').textContent=title;
 $('resultBrief').textContent='Раунд '+round+' · '+units.map(u=>u.name+': '+(u.alive?u.hp+' HP':'выбыл')).join(' · ');
 showResultOverlay();
 let autoBtn=$('auto'),endBtn=$('endTurn');if(autoBtn){autoBtn.disabled=true;autoBtn.textContent='Бой завершён'}if(endBtn)endBtn.disabled=true;
}
function advanceTurnCore(){
 if(over)return false;
 do{idx++;if(idx>=order.length){idx=0;round++}}while(!order[idx].alive);
 let c=order[idx];
 if(c.prepared){c.prepared=false;log('[СОСТОЯНИЕ] '+c.name+': Приготовиться завершено')}
 if(c.bleed){let hp0=c.hp;log('[СОСТОЯНИЕ] '+c.name+': кровотечение −'+c.bleed+' · HP '+hp0+'→'+Math.max(0,hp0-c.bleed));c.hp=Math.max(0,c.hp-c.bleed);if(c.hp<=0)c.alive=false;if(checkEnd())return false}
 let st0=c.st;c.ap=9;c.st=Math.min(c.maxSt||100,c.st+12);log('[ХОД] '+c.name+' · позиция ['+c.q+','+c.r+'] · AP=9 · ST '+st0+'→'+c.st+' · HP '+c.hp+'/'+c.maxHp+' · bleed '+c.bleed+(c.prepared?' · ПРИГОТОВЛЕН':''));return true
}
function nextTurn(){if(!advanceTurnCore())return nextRender();nextRender();let c=order[idx];if(auto||c.id!=='a0')queueAi()}
function pathStep(a,t,range=1){
 const start=a.q+','+a.r,queue=[[a.q,a.r]],seen=new Set([start]),parent=new Map(),key=(q,r)=>q+','+r;
 let goal=null,limit=GRID.C*GRID.R+20;
 while(queue.length&&limit--){
  let [q,r]=queue.shift();
  if(!(q===a.q&&r===a.r)&&hd(q,r,t.q,t.r)<=range){goal=[q,r];break}
  for(const [nq,nr] of neigh(q,r)){
   let k=key(nq,nr);if(seen.has(k)||blocked(nq,nr))continue;
   let occ=at(nq,nr);if(occ&&occ!==a&&occ!==t)continue;
   if(occ===t)continue;
   seen.add(k);parent.set(k,[q,r]);queue.push([nq,nr])
  }
 }
 if(!goal)return null;
 let cur=goal,prev=parent.get(key(cur[0],cur[1]));
 while(prev&&!(prev[0]===a.q&&prev[1]===a.r)){cur=prev;prev=parent.get(key(cur[0],cur[1]))}
 return cur
}
function chooseCombatAction(a){
 let foes=units.filter(x=>x.alive&&x.team!==a.team).sort((x,y)=>dist(a,x)-dist(a,y)),t=foes[0];if(!t){checkEnd();return 'none'}
 let wk=activeWeapon(a,t),w=W[wk],d=dist(a,t);
 // Exhausted: recover before another attack whenever possible.
 if(a.st<25&&a.ap>=4&&a.st<(a.maxSt||100))return restSkill(a)?'skill':'none';
 if(d<=w.r&&a.ap>=w.ap)return attack(a,t)?'attack':'none';
 // Already at fighting distance but cannot attack: brace instead of dancing around target.
 if(d<=w.r){if(a.ap>=4&&!a.prepared)return prepareSkill(a)?'skill':'none';return 'end'}
 let mc=moveCost(a),maxSteps=Math.floor(a.ap/mc.ap),route=[],ghost={...a};for(let s=0;s<maxSteps;s++){let o=pathStep(ghost,t,w.r);if(!o)break;route.push(o);ghost={...ghost,q:o[0],r:o[1]};if(hd(ghost.q,ghost.r,t.q,t.r)<=w.r)break}
 if(route.length){let q0=a.q,r0=a.r,ap0=a.ap,st0=a.st,steps=route.length,dest=route[steps-1];if(!simulationRunning)moveAnimations.set(a.id,{path:[[q0,r0],...route],start:performance.now(),stepMs:Math.max(90,300/combatSpeed)});a.q=dest[0];a.r=dest[1];a.ap-=mc.ap*steps;a.st=Math.max(0,a.st-mc.st*steps);log('[ДВИЖЕНИЕ] '+a.name+' ['+q0+','+r0+']→['+a.q+','+a.r+'] · маршрут '+steps+' кл. · цель '+t.name+' · AP '+ap0+'→'+a.ap+' · ST '+st0+'→'+a.st+' · дистанция '+hd(q0,r0,t.q,t.r)+'→'+dist(a,t));return 'move'}
 if(a.ap>=4&&!a.prepared)return prepareSkill(a)?'skill':'none';
 return 'end'
}
function combatStepSync(){
 if(over)return false;let a=order[idx];if(!a.alive)return advanceTurnCore();
 let action=chooseCombatAction(a);if(over)return false;
 if(action==='end'||action==='none')advanceTurnCore();
 else{
  let foes=units.filter(x=>x.alive&&x.team!==a.team).sort((x,y)=>dist(a,x)-dist(a,y)),t=foes[0];
  if(!t){checkEnd();return false}
  let w=W[activeWeapon(a,t)],mc=moveCost(a),canAttack=dist(a,t)<=w.r&&a.ap>=w.ap,canMove=dist(a,t)>w.r&&a.ap>=mc.ap&&!!pathStep(a,t,w.r),canRest=a.st<25&&a.ap>=4&&a.st<(a.maxSt||100),canPrep=dist(a,t)<=w.r&&a.ap>=4&&!a.prepared;
  if(!canAttack&&!canMove&&!canRest&&!canPrep)advanceTurnCore()
 }
 return true
}
function aiTurn(){
 if(over)return;let a=order[idx];if(!a.alive)return nextTurn();
 let action=chooseCombatAction(a);nextRender();if(over)return;
 if(action==='end'||action==='none')return queueAi(nextTurn);
 queueAi(()=>{if(over)return;let foes=units.filter(x=>x.alive&&x.team!==a.team).sort((x,y)=>dist(a,x)-dist(a,y)),t=foes[0];if(!t)return;let w=W[activeWeapon(a,t)],mc=moveCost(a),canAttack=dist(a,t)<=w.r&&a.ap>=w.ap,canMove=dist(a,t)>w.r&&a.ap>=mc.ap&&!!pathStep(a,t,w.r),canRest=a.st<25&&a.ap>=4&&a.st<(a.maxSt||100),canPrep=dist(a,t)<=w.r&&a.ap>=4&&!a.prepared;if(canAttack||canMove||canRest||canPrep)aiTurn();else nextTurn()})
}
function nextRender(){render();$('round').textContent=(over?$('round').textContent:'Раунд '+round+' · ход '+(order[idx]?.name||''));let l=$('combatLog');if(l)l.textContent=combatLog.slice(0,18).join('\n');}

async function simulateDiagnostic(mode,n=100){
 simulationRunning=true;
 let wins={ally:0,enemy:0,draw:0},rounds=0,maxRounds=0,timeouts=0,oldAuto=auto,details=[],equipWins={};
 const snap={cfg:structuredClone(cfg),units:structuredClone(units),terrain:structuredClone(terrain),order:structuredClone(order),idx,round,over,combatLog:[...combatLog],fullLog:[...fullLog],equip:structuredClone(playerInventory.equip)};
 let progress=$('simProgress'),pt=$('simProgressText'),pb=$('simProgressBar'),b1=$('sim1v1'),b3=$('sim3v3'),batchSize=5;
 progress.classList.remove('hidden');b1.disabled=true;b3.disabled=true;pt.textContent='Подготовка · 0 / '+n;pb.style.width='0%';
 await new Promise(r=>setTimeout(r,0));
 for(let k=0;k<n;k++){
  let duel=mode==='1v1',ap=duel?[[2,5]]:[[1,4],[1,5],[1,6]],ep=duel?[[11,5]]:[[12,2],[12,3],[12,4]];
  units=[];let count=duel?1:3;
  for(let i=0;i<count;i++)units.push(make('a'+i,i?'Союзник '+(i+1):'ГГ','ally',...ap[i],'guardian'));
  for(let i=0;i<count;i++)units.push(make('e'+i,'Враг '+(i+1),'enemy',...ep[i],'guardian'));
  if(duel){let ae=randomLoadout(),ee=randomLoadout();applyLoadoutToUnit(units[0],ae);applyLoadoutToUnit(units[1],ee)}
  else{ // strict mirrored gear per pair
   for(let i=0;i<3;i++){let eq=randomLoadout();applyLoadoutToUnit(units[i],eq);applyLoadoutToUnit(units[3+i],structuredClone(eq))}
  }
  order=[...units];idx=0;round=1;over=false;combatLog=[];fullLog=[];genTerrain();fullLog.push('=== SIM START ===',...units.map(u=>u.name+' ['+u.q+','+u.r+']'+(u.loadout?'\n'+loadoutText(u.loadout):'')));let guard=0;
  while(!over&&round<=250&&guard++<6000)combatStepSync();
  let A=units.some(u=>u.alive&&u.team==='ally'),E=units.some(u=>u.alive&&u.team==='enemy'),limitHit=!over&&(round>250||guard>=6000);if(limitHit)log('[STALL] лимит симуляции · round '+round+' · actions '+guard+' · '+units.filter(u=>u.alive).map(u=>u.name+' ['+u.q+','+u.r+'] HP '+u.hp+' ST '+u.st).join(' | '));let res=A&&!E?'ally':E&&!A?'enemy':'draw';if(res==='draw')timeouts++;wins[res]++;rounds+=round;maxRounds=Math.max(maxRounds,round);
  if(duel){let keyA=units[0].loadout.main,keyE=units[1].loadout.main;equipWins[keyA]=equipWins[keyA]||{b:0,w:0};equipWins[keyE]=equipWins[keyE]||{b:0,w:0};equipWins[keyA].b++;equipWins[keyE].b++;if(res==='ally')equipWins[keyA].w++;if(res==='enemy')equipWins[keyE].w++;details.push('BATTLE '+(k+1)+' · '+res.toUpperCase()+' · rounds '+round+'\nALLY\n'+loadoutText(units[0].loadout)+'\n'+unitDerivedText(units[0])+'\nENEMY\n'+loadoutText(units[1].loadout)+'\n'+unitDerivedText(units[1])+'\nEVENTS\n'+fullLog.join('\n'))}
  let done=k+1;if(done%batchSize===0||done===n){pt.textContent=(mode==='1v1'?'1v1':'3v3')+' · '+done+' / '+n+' · победы '+wins.ally+'/'+wins.enemy+' · ничьи '+wins.draw;pb.style.width=(done/n*100).toFixed(1)+'%';await new Promise(r=>setTimeout(r,20))}
 }
 let equipLines=Object.entries(equipWins).map(([id,x])=>(INV_ITEMS[id]?.n||id)+': '+x.w+'/'+x.b+' wins ('+(x.b?(x.w/x.b*100).toFixed(1):0)+'%)');
 let report=['EIRDAN 0.15 · DIAGNOSTIC','BUILD: '+(window.EIRDAN_BUILD||'unknown'),'MODE: '+(mode==='1v1'?'1v1 RANDOM EQUIPMENT':'3v3 MIRROR EQUIPMENT'),'BATTLES: '+n,'SEED CALLS: '+GameRNG.calls,'','RESULTS','Allies: '+wins.ally,'Enemies: '+wins.enemy,'Draws/timeouts: '+wins.draw,'Average rounds: '+(rounds/n).toFixed(1),'Max rounds: '+maxRounds,'Timeouts: '+timeouts,'',...(mode==='1v1'?['WEAPON RESULTS',...equipLines,'','FULL LOADOUTS',...details]:['MIRROR RULE: each ally slot is mirrored by corresponding enemy slot; Guardian only.','FULL TRACE OF LAST MIRROR BATTLE',...fullLog]),'','CHECKS','Two-handed weapon occupies off-hand: enforced','Inventory loadout -> combat stats: enforced','Armor/head/shield reset from loadout: enforced','Round cap: 250 · guard cap: 6000','Balance values: unchanged.'].join('\n');
 cfg=snap.cfg;units=snap.units;terrain=snap.terrain;order=snap.order;idx=snap.idx;round=snap.round;over=snap.over;combatLog=snap.combatLog;fullLog=snap.fullLog;playerInventory.equip=snap.equip;auto=oldAuto;nextRender();pt.textContent=(mode==='1v1'?'1v1':'3v3')+' · '+n+' / '+n+' · ГОТОВО';pb.style.width='100%';b1.disabled=false;b3.disabled=false;window.lastSimulationReport=report;window.lastSimulationFile='Eirdan_'+mode+'_diagnostic_'+Date.now()+'.txt';$('resultTitle').textContent='Симуляция завершена';$('resultBrief').textContent=(mode==='1v1'?'1v1':'3v3')+' ×'+n+' · Союзники '+wins.ally+' · Враги '+wins.enemy+' · Ничьи/лимит '+wins.draw+' · среднее '+(rounds/n).toFixed(1)+' раундов';$('resultNew').textContent='Продолжить';$('resultOverlay').dataset.kind='simulation';simulationRunning=false;showResultOverlay();setTimeout(()=>progress.classList.add('hidden'),2500)
}
$('sim1v1').onclick=()=>simulateDiagnostic('1v1',100);
$('sim3v3').onclick=()=>simulateDiagnostic('3v3',100);
function reachablePaths(a){let mc=moveCost(a),steps=Math.floor(a.ap/mc.ap),start=a.q+','+a.r,queue=[[a.q,a.r]],seen=new Map([[start,{d:0,parent:null}]]);while(queue.length){let [q,r]=queue.shift(),cur=seen.get(q+','+r);if(cur.d>=steps)continue;for(const [nq,nr] of neigh(q,r)){let k=nq+','+nr;if(seen.has(k)||blocked(nq,nr)||at(nq,nr))continue;seen.set(k,{d:cur.d+1,parent:[q,r]});queue.push([nq,nr])}}return seen}
function routeTo(a,q,r){let seen=reachablePaths(a),k=q+','+r;if(!seen.has(k)||k===a.q+','+a.r)return null;let path=[[q,r]],cur=seen.get(k);while(cur.parent){let p=cur.parent;if(p[0]===a.q&&p[1]===a.r)break;path.unshift(p);cur=seen.get(p[0]+','+p[1])}return path}
function manualHexAction(q,r){if(over||auto||order[idx]?.id!=='a0')return false;let a=order[idx],u=at(q,r);if(u&&u.team!==a.team){let done=attack(a,u);nextRender();return done}let path=!u&&!blocked(q,r)?routeTo(a,q,r):null;if(path){let mc=moveCost(a),q0=a.q,r0=a.r,ap0=a.ap,st0=a.st,steps=path.length;moveAnimations.set(a.id,{path:[[q0,r0],...path],start:performance.now(),stepMs:Math.max(90,300/combatSpeed)});a.q=q;a.r=r;a.ap-=mc.ap*steps;a.st=Math.max(0,a.st-mc.st*steps);log('[ДВИЖЕНИЕ] '+a.name+' ['+q0+','+r0+']→['+q+','+r+'] · маршрут '+steps+' кл. · AP '+ap0+'→'+a.ap+' · ST '+st0+'→'+a.st);nextRender();return true}return false}
function canvasHexFromEvent(e){let L=window.__isoLayout;if(!L)return null;let rect=$('battleCanvas').getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,best=null,score=Infinity;for(let q=0;q<GRID.C;q++)for(let r=0;r<GRID.R;r++){let p=isoCenter(q,r,L),dx=Math.abs(x-p.x)/(L.tileW/2),dy=Math.abs(y-p.y)/(L.tileH/2),d=dx+dy;if(d<score){score=d;best=[q,r]}}return best&&score<=1.12?best:null}
function ensureBattleControls(){['combatLog','auto','combatSpeed','endTurn','restSkill','prepareSkill'].forEach(id=>$(id)?.remove());let lg=document.createElement('div');lg.id='combatLog';lg.style='margin-top:10px;max-height:180px;overflow:auto;font-size:12px;line-height:1.5;white-space:pre-line';$('hud').append(lg);let b=document.createElement('button');b.id='auto';b.textContent='Автобой: ВЫКЛ';b.onclick=()=>{auto=!auto;if(auto){combatSpeed=2;let s=$('combatSpeed');if(s)s.value='2'}b.textContent='Автобой: '+(auto?'ВКЛ':'ВЫКЛ');if(!auto){clearTimeout(combatTimer);nextRender();return}if(order[idx]?.id==='a0')aiTurn();else queueAi()};$('hud').querySelector('.actions').append(b);let sp=document.createElement('select');sp.id='combatSpeed';sp.innerHTML='<option value="0.5">Скорость ×0.5</option><option value="1" selected>Скорость ×1</option><option value="2">Скорость ×2</option><option value="4">Скорость ×4</option>';sp.onchange=()=>{combatSpeed=+sp.value||1};$('hud').querySelector('.actions').append(sp);let r=document.createElement('button');r.id='restSkill';r.textContent='Передышка (+30 ST, 4 AP)';r.onclick=()=>{if(!auto&&order[idx]?.id==='a0'&&restSkill(order[idx]))nextRender()};$('hud').querySelector('.actions').append(r);let p=document.createElement('button');p.id='prepareSkill';p.textContent='Приготовиться (4 AP)';p.onclick=()=>{if(!auto&&order[idx]?.id==='a0'&&prepareSkill(order[idx]))nextRender()};$('hud').querySelector('.actions').append(p);let e=document.createElement('button');e.id='endTurn';e.textContent='Конец хода';e.onclick=()=>{if(!auto&&order[idx]?.id==='a0')nextTurn()};$('hud').querySelector('.actions').append(e);nextRender()}
const battlePointer=e=>{e.preventDefault();let h=canvasHexFromEvent(e);if(h)manualHexAction(h[0],h[1])};$('battleCanvas').onpointerup=battlePointer;


document.body.appendChild($('invOverlay'));document.body.appendChild($('resultOverlay'));
const WORLD_DATA=window.EIRDAN_WORLD_DATA||{regions:{},places:{},cities:{},travel:{}};
const WORLD={day:1,minutes:8*60,region:'ren',location:'road',gold:24,reputation:0,hasHorse:false,needs:{hunger:0,thirst:0,fatigue:0},flags:{gateIncident:false},regions:WORLD_DATA.regions,places:WORLD_DATA.places};
let rpgScreen='worldMap';
function worldTime(){let h=Math.floor(WORLD.minutes/60)%24,m=WORLD.minutes%60;return 'День '+WORLD.day+' · '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')}
function passTime(min){WORLD.minutes+=min;while(WORLD.minutes>=1440){WORLD.minutes-=1440;WORLD.day++}}
function applyTravelNeeds(min,mode){WORLD.needs.hunger=Math.min(100,WORLD.needs.hunger+min/55);WORLD.needs.thirst=Math.min(100,WORLD.needs.thirst+min/38);WORLD.needs.fatigue=Math.min(100,WORLD.needs.fatigue+min/(mode==='horse'?65:40))}
function formatDuration(min){let h=Math.floor(min/60),m=min%60;return (h?h+' ч ':'')+(m?m+' мин':'')}
function renderRpg(){
 $('worldClock').textContent=worldTime();renderRpgStatsOnly();
 if(rpgScreen==='town')return renderTown();
 if(rpgScreen==='location')return renderLocation(WORLD.location);
 if(rpgScreen==='region')return renderRegion();
 renderWorldMap()
}
function renderWorldMap(){
 $('rpgView').innerHTML='<h2 style="margin:0 0 4px">Карта мира</h2><div class="note">Выберите регион. Дальние переходы требуют лагеря.</div><div class="worldMap grandMap"><div class="continent"></div>'+Object.entries(WORLD.regions).map(([id,p])=>'<button class="worldNode regionNode '+(WORLD.region===id?'current':'')+'" style="left:'+p.x+'%;top:'+p.y+'%" data-region="'+id+'"><span class="mapIcon">'+p.icon+'</span><span class="mapLabel">'+p.name+'</span></button>').join('')+'</div>';
 document.querySelectorAll('[data-region]').forEach(b=>b.onclick=()=>openRegionTravel(b.dataset.region))
}
function openRegionTravel(id){
 if(id===WORLD.region){rpgScreen='region';renderRpg();return}
 const p=WORLD.regions[id],min=480+Math.floor(Math.random()*360);showTravelCard(p.name,p.desc,min,()=>runJourney({kind:'region',id,min}))
}
function renderRegion(){
 const list=Object.entries(WORLD.places).filter(([,p])=>p.region===WORLD.region),r=WORLD.regions[WORLD.region];
 $('rpgView').innerHTML='<div class="mapHead"><div><h2 style="margin:0">'+r.name+'</h2><div class="note">'+r.desc+'</div></div><button id="toWorld">К миру</button></div><div class="worldMap"><div class="mapTerrain"><i class="mapForest f1"></i><i class="mapForest f2"></i><i class="mapHill h1"></i><i class="mapRiver"></i><i class="mapRoad r1"></i><i class="mapRoad r2"></i></div>'+list.map(([id,p])=>'<button class="worldNode '+(WORLD.location===id?'current':'')+'" style="left:'+p.x+'%;top:'+p.y+'%" data-place="'+id+'"><span class="mapIcon">'+p.icon+'</span><span class="mapLabel">'+p.name+'</span></button>').join('')+'</div>';
 $('toWorld').onclick=()=>{rpgScreen='worldMap';renderRpg()};document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>openTravel(b.dataset.place))
}
function showTravelCard(name,desc,min,go){
 const ov=document.createElement('div');ov.className='travelOverlay';ov.innerHTML='<section class="travelCard"><h3>'+name+'</h3><div class="note">'+desc+'</div><div class="travelMeta"><div><small>Пешком</small><br><b>~'+formatDuration(min)+'</b></div><div><small>Лагерь</small><br><b>'+(min>=600?'обязателен':'по ситуации')+'</b></div></div><div class="travelActions"><button class="primary" data-go>Отправиться</button><button data-cancel>Отмена</button></div></section>';document.body.appendChild(ov);ov.querySelector('[data-cancel]').onclick=()=>ov.remove();ov.querySelector('[data-go]').onclick=()=>{ov.remove();go()}
}
function openTravel(id){
 const p=WORLD.places[id];if(!p)return;if(id===WORLD.location){rpgScreen=p.type==='town'?'town':'location';renderRpg();return}
 const from=WORLD.places[WORLD.location],dx=(p.x-(from?.x||50))/56,dy=(p.y-(from?.y||50))/56,min=Math.max(25,Math.round(Math.hypot(dx,dy)*32/4.5*60));showTravelCard(p.name,p.desc,min,()=>runJourney({kind:'place',id,min}))
}
function runJourney(j){
 let remaining=j.min,stops=[];while(remaining>0){let leg=Math.min(240,remaining);passTime(leg);applyTravelNeeds(leg,'walk');remaining-=leg;if(remaining>0&&Math.random()<(WORLD_DATA.travel?.roadEventChance??.42))stops.push('event');if(remaining>0&&WORLD.needs.fatigue>=12){passTime(480);WORLD.needs.fatigue=Math.max(0,WORLD.needs.fatigue-45);stops.push('camp')}}
 if(j.kind==='region'){WORLD.region=j.id;WORLD.location='road';rpgScreen='region'}else{WORLD.location=j.id;WORLD.region=WORLD.places[j.id].region;rpgScreen=WORLD.places[j.id].type==='town'?'town':'location'}renderRpg();if(stops.length)showJourneyReport(stops);else maybeLocalEvent();if(j.kind==='place'&&j.id==='eirdan'&&!WORLD.flags.gateIncident)setTimeout(showGateEvent,0)
}
function showJourneyReport(stops){const ov=document.createElement('div');ov.className='travelOverlay';let events=stops.filter(x=>x==='event').length,camps=stops.filter(x=>x==='camp').length;ov.innerHTML='<section class="travelCard"><h3>Путь завершён</h3><p>Случайных событий: '+events+' · остановок лагеря: '+camps+'.</p><div class="eventBox"><b>'+(events?'Дорожное событие':'Спокойная дорога')+'</b><p>'+(events?'Во время пути произошло тестовое случайное событие. Позже здесь появятся реальные встречи и выборы.':'Путь прошёл без происшествий.')+'</p></div><button class="primary" data-ok style="width:100%">Продолжить</button></section>';document.body.appendChild(ov);ov.querySelector('[data-ok]').onclick=()=>ov.remove()}
function maybeLocalEvent(){if(Math.random()<(WORLD_DATA.travel?.localEventChance??.25)){const box=$('townEvent');if(box)box.innerHTML='<div class="eventBox"><b>Случайное событие</b><p>Тест события локации сработал. Вероятность сейчас 25%.</p></div>'}}
function travelTo(id){openTravel(id)}
function renderLocation(id){
 let p=WORLD.places[id];$('worldClock').textContent=worldTime();renderRpgStatsOnly();
 $('rpgView').innerHTML='<h2 style="margin:0 0 4px">'+p.name+'</h2><div class="note">'+p.desc+'</div><div class="eventBox"><b>Осмотреться</b><p>'+(id==='forest'?'Между деревьями тянется старая тропа. Пока здесь нет активных событий.':id==='village'?'Небольшая деревня живёт обычной жизнью. Позже здесь появятся дома и NPC.':'Пыльный тракт соединяет поселения региона. Пока дорога безопасна.')+'</p></div><button id="locationBack" style="width:100%;margin-top:10px">На карту региона</button>';
 $('locationBack').onclick=()=>{rpgScreen='region';renderRpg()}
}
const EIRDAN_PLACES=WORLD_DATA.cities?.eirdan?.places||{};
function townFallbackIcon(id){return ({tavern:'♨',smith:'⚒',market:'¤',barracks:'⚔',temple:'✦',homes:'⌂'})[id]||'◆'}
function renderTown(){renderCityHub()}
const CITY_HUB={trade:{name:'Торговый район',desc:'Рынок, кузницы, лавки и таверны.',x:31,y:39,icon:'¤',type:'district'},homes:{name:'Жилой район',desc:'Улицы и дома жителей Эйрдана.',x:53,y:28,icon:'⌂',type:'district'},castle:{name:'Замок',desc:'Цитадель, двор и резиденция власти.',x:72,y:35,icon:'♜',type:'district'},arena:{name:'Арена',desc:'Бои, турниры и зрелища.',x:70,y:62,icon:'⚔',type:'location'},temple:{name:'Храм',desc:'Главный городской храм.',x:31,y:62,icon:'✦',type:'location'}};
const DISTRICTS={trade:{name:'Торговый район',places:['market','smith','tavern']},homes:{name:'Жилой район',places:['homes']}}, CITY_DIRECT={arena:{name:'Арена',desc:'Городская арена. Здесь позже появятся бои, ставки и турниры.',minutes:15},temple:EIRDAN_PLACES.temple};
function renderCityHub(){$('rpgView').innerHTML='<h2 style="margin:0 0 4px">Эйрдан</h2><div class="note">Выберите район или отдельное место.</div><div class="townMap"><div class="townWall"></div><i class="townRoad main"></i><i class="townRoad cross"></i><i class="townCenter"></i>'+Object.entries(CITY_HUB).map(([id,p])=>'<button class="townPlace" data-city-node="'+id+'" style="left:'+p.x+'%;top:'+p.y+'%"><span class="placeIcon">'+p.icon+'</span><span class="placeLabel">'+p.name+'</span></button>').join('')+'<button id="leaveTown" class="townGate">Ворота</button></div><div id="townEvent"></div>';document.querySelectorAll('[data-city-node]').forEach(btn=>btn.onclick=()=>openCityNode(btn.dataset.cityNode));$('leaveTown').onclick=()=>{rpgScreen='world';renderRpg()}}
function openCityNode(id){const p=CITY_HUB[id];if(!p)return;if(p.type==='district')return renderDistrict(id);openDirectPlace(id)}
function renderDistrict(id){const d=DISTRICTS[id];if(!d)return;const list=id==='homes'?[{id:'house_smith',name:'Дом кузнеца',desc:'Дом семьи городского кузнеца.',sprite:'homes',x:31,y:37},{id:'house_merchant',name:'Дом торговца',desc:'Добротный дом зажиточного торговца.',sprite:'homes',x:68,y:38},{id:'inn_rooms',name:'Съёмные комнаты',desc:'Жильё для приезжих и работников.',sprite:'homes',x:50,y:61}]:d.places.map((pid,i)=>({...EIRDAN_PLACES[pid],id:pid,sprite:pid,x:[28,52,73][i],y:[42,58,38][i]}));$('rpgView').innerHTML='<h2 style="margin:0 0 4px">'+d.name+'</h2><div class="note">Выберите здание.</div><div class="townMap districtMap">'+list.map(p=>'<button class="townPlace spritePlace" data-district-place="'+p.id+'" style="left:'+p.x+'%;top:'+p.y+'%"><span class="buildingSprite" style="background-image:url('+window.EIRDAN_BUILDING_SHEET+');background-position:'+(-64*(window.EIRDAN_BUILDING_INDEX?.[p.sprite]??window.EIRDAN_BUILDING_INDEX?.homes??0))+'px 0"></span><span class="placeLabel">'+p.name+'</span></button>').join('')+'<button id="backCity" class="townGate">← Центр Эйрдана</button></div><div id="townEvent"></div>';document.querySelectorAll('[data-district-place]').forEach(btn=>btn.onclick=()=>visitDistrictPlace(id,btn.dataset.districtPlace));$('backCity').onclick=renderCityHub}
function visitDistrictPlace(district,id){let p=EIRDAN_PLACES[id];if(!p){const names={house_smith:['Дом кузнеца','Дом семьи городского кузнеца.'],house_merchant:['Дом торговца','Дом зажиточного торговца.'],inn_rooms:['Съёмные комнаты','Жильё для приезжих и работников.']};p={name:names[id]?.[0]||id,desc:names[id]?.[1]||'',minutes:10}}openTownPlaceData(p)}
function openDirectPlace(id){if(id==='arena')return openArena();openTownPlaceData(CITY_DIRECT[id])}
function openArena(){const p=CITY_DIRECT.arena;const ov=document.createElement('div');ov.className='placeOverlay';ov.innerHTML='<section class="placeCard"><h3>Арена Эйрдана</h3><div class="note">'+p.desc+'</div><div class="placeActions"><button class="primary" data-fight>Выйти на арену</button><button data-watch>Осмотреть арену · ~10 мин</button><button data-cancel>Уйти</button></div></section>';document.body.appendChild(ov);ov.querySelector('[data-cancel]').onclick=()=>ov.remove();ov.querySelector('[data-watch]').onclick=()=>{ov.remove();passTime(10);renderRpgStatsOnly();$('townEvent').innerHTML='<div class="eventBox"><b>Арена</b><p>На песке идёт тренировочный бой. Трибуны пока полупусты.</p></div>'};ov.querySelector('[data-fight]').onclick=()=>{ov.remove();startArenaCombat()}}
function startArenaCombat(){passTime(15);applyTravelNeeds(15,'horse');combatContext={type:'arena',returnTo:'rpgShell'};combatLabReturn='rpgShell';showOnly('combatLab');$('battleMode').value='1v1';updateModeUI();pendingDuel=false;$('prepFight').classList.add('hidden');$('setup').classList.add('hidden');$('battle').classList.add('hidden');$('hud').classList.add('hidden');beginBattle(true)}
function returnFromArenaCombat(A,E){hideResultOverlay();$('resultOverlay').dataset.kind='';combatContext=null;showOnly('rpgShell');rpgScreen='town';renderRpg();setTimeout(()=>{let box=$('townEvent');if(box)box.innerHTML='<div class="eventBox"><b>Арена · '+(A&&!E?'Победа':'Поражение')+'</b><p>'+(A&&!E?'Вы выиграли пробный бой на арене.':'Пробный бой окончен поражением.')+'</p><p class="note">Раунд '+round+'. Награды и рейтинг арены добавим следующим слоем.</p></div>'},0)}
function openTownPlace(id){const p=EIRDAN_PLACES[id];if(p)openTownPlaceData(p)}
function openTownPlaceData(p){const ov=document.createElement('div');ov.className='placeOverlay';ov.innerHTML='<section class="placeCard"><h3>'+p.name+'</h3><div class="note">'+p.desc+'</div><div class="placeActions"><button class="primary" data-enter>Войти · ~'+(p.minutes||15)+' мин</button><button data-cancel>Отмена</button></div></section>';document.body.appendChild(ov);ov.querySelector('[data-cancel]').onclick=()=>ov.remove();ov.querySelector('[data-enter]').onclick=()=>{ov.remove();passTime(p.minutes||15);applyTravelNeeds(p.minutes||15,'horse');renderRpgStatsOnly();$('townEvent').innerHTML='<div class="eventBox"><b>'+p.name+'</b><p>'+p.desc+'</p><p class="note">Интерьер и действия будут добавлены позже.</p></div>'}}
function visitTownPlace(id){const p=EIRDAN_PLACES[id];if(p)openTownPlaceData(p)}
function renderRpgStatsOnly(){$('worldClock').textContent=worldTime();$('rpgStats').textContent='Локация: '+WORLD.places[WORLD.location].name+' · Золото: '+WORLD.gold+' · Репутация Эйрдана: '+WORLD.reputation}
function showGateEvent(){
 WORLD.flags.gateIncident=true;let box=$('townEvent');if(!box)return;
 box.innerHTML='<div class="eventBox"><b>У городских ворот</b><p>У телеги спорят торговец и городской стражник. Вокруг уже собрались зеваки.</p><div class="eventChoices"><button data-event="listen">Остановиться и послушать</button><button data-event="leave">Не вмешиваться</button></div></div>';
 box.querySelector('[data-event="listen"]').onclick=()=>{passTime(10);WORLD.reputation+=1;box.innerHTML='<div class="eventBox"><b>Слух</b><p>Торговец жалуется на пропажи товара на северном тракте. Стражник советует не ходить к лесу после заката.</p></div>';renderRpgStatsOnly()};
 box.querySelector('[data-event="leave"]').onclick=()=>{box.innerHTML=''}
}
function showOnly(id){['mainMenu','settingsMenu','rpgShell','combatLab'].forEach(x=>$(x)?.classList.toggle('hidden',x!==id))}
function openCombatLab(returnTo='settingsMenu'){closeInventory();combatLabReturn=returnTo;showOnly('combatLab')}
let settingsReturn='mainMenu',combatLabReturn='settingsMenu',fullDiagnosticLog='',combatContext=null;
const DIAGNOSTIC_ENDPOINT='https://eirdan-diagnostics.arttk800.workers.dev/';
function openSettingsFrom(returnTo){settingsReturn=returnTo||'mainMenu';showOnly('settingsMenu')}
function diagnosticLine(a){return '['+new Date().toISOString()+'] '+a}
async function runFullDiagnostic(){
 const btn=$('runFullDiagnostic'),status=$('fullDiagnosticStatus');btn.disabled=true;$('downloadFullDiagnostic').disabled=true;
 let out=['EIRDAN FULL GAME DIAGNOSTIC','Build: '+(window.EIRDAN_BUILD||'unknown'),'Generated: '+new Date().toISOString(),'Source code: NOT INCLUDED','','=== AUTOMATED INTERACTION TESTS ==='];
 let pass=0,fail=0,warn=0;
 const ok=(name,cond,extra='')=>{if(cond){out.push('PASS | '+name+(extra?' | '+extra:''));pass++}else{out.push('FAIL | '+name+(extra?' | '+extra:''));fail++}};
 const err=(name,e)=>{out.push('FAIL | '+name+' | '+(e?.message||e));fail++};
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const snap={screen:rpgScreen,settingsReturn,combatLabReturn,world:structuredClone(WORLD),inv:structuredClone(playerInventory),ui:document.body.dataset.ui||'',vol:window.EIRDAN_MASTER_VOLUME};
 const hiddenIds=['mainMenu','rpgShell','combatLab','gameMenu','invOverlay','resultOverlay','debugPanel','versionOverlay'];
 const hiddenState=Object.fromEntries(hiddenIds.map(id=>[id,$(id).classList.contains('hidden')]));
 try{
  status.textContent='Проверка кнопок и переходов...';await sleep(20);
  // Navigation handlers are validated without visibly switching the player's current screen.
  ok('Button: Новая игра handler',typeof $('newGame').onclick==='function');
  ok('Button: ☰ handler',typeof $('gameMenuBtn').onclick==='function');
  ok('Button: Продолжить handler',typeof $('resumeGame').onclick==='function');
  ok('Button: Настройки from game handler',typeof $('gameSettings').onclick==='function');
  ok('Button: Назад handler',typeof $('settingsBack').onclick==='function');
  ok('Button: Настройки from main handler',typeof $('openSettings').onclick==='function');
  ok('Button: Отладка handler',typeof $('openDebug').onclick==='function');
  ok('Button: Combat Lab handler',typeof $('enterCombatLab').onclick==='function');
  ok('Button: Combat Lab back handler',typeof $('closeCombatLab').onclick==='function');
  ok('Button: В главное меню handler',typeof $('toMainMenu').onclick==='function');

  // Static UI contract: catches missing controls/IDs without navigating the visible game.
  const requiredIds=['mainMenu','newGame','loadGame','openSettings','quitGame','settingsMenu','uiMode','masterVolume','settingsBack','openDebug','debugPanel','runFullDiagnostic','downloadFullDiagnostic','uploadFullDiagnostic','enterCombatLab','rpgShell','gameMenuBtn','gameMenu','resumeGame','gameSettings','toMainMenu','rpgCharacter','inventory','invOverlay','invClose','invEquip','invUnequip','tabBag','tabChar','combatLab','closeCombatLab','sim1v1','sim3v3','resultOverlay','resultNew','resultDownload'];
  ok('UI: required controls exist',requiredIds.every(id=>!!$(id)),requiredIds.filter(id=>!$(id)).join(', '));
  ok('UI: Load Game intentionally disabled',$('loadGame').disabled===true);
  ok('Settings: interface control wired',typeof $('uiMode').onchange==='function');
  ok('Settings: volume control wired',typeof $('masterVolume').oninput==='function');
  ok('Inventory: action handlers wired',[invClose,invEquip,invUnequip,tabBag,tabChar].every(el=>typeof $(el.id).onclick==='function'));
  ok('Result: action handlers wired',typeof $('resultNew').onclick==='function'&&typeof $('resultDownload').onclick==='function');
  ok('Simulation: action handlers wired',typeof $('sim1v1').onclick==='function'&&typeof $('sim3v3').onclick==='function');

  status.textContent='Проверка мира...';await sleep(20);
  ok('World: all places valid',Object.values(WORLD.places).every(p=>p&&p.name&&Number.isInteger(p.x)&&Number.isInteger(p.y)));
  let t0=WORLD.minutes;passTime(30);ok('World: passTime +30',WORLD.minutes===t0+30||WORLD.day>snap.world.day);Object.assign(WORLD,structuredClone(snap.world));
  ok('World: current place exists',!!WORLD.places[WORLD.location]);
  ok('World: travel function exists',typeof travelTo==='function');
  ok('World: render functions exist',[renderRpg,renderLocation,renderTown,showGateEvent].every(fn=>typeof fn==='function'));
  ok('World: place IDs unique',new Set(Object.keys(WORLD.places)).size===Object.keys(WORLD.places).length);

  status.textContent='Проверка города, районов и арены...';await sleep(20);
  ok('City: hierarchy functions exist',[renderCityHub,openCityNode,renderDistrict,openArena,startArenaCombat,returnFromArenaCombat].every(fn=>typeof fn==='function'));
  ok('City: hub nodes valid',Object.values(CITY_HUB).every(p=>p&&p.name&&['district','location'].includes(p.type)));
  ok('City: trade district exists',!!DISTRICTS.trade&&DISTRICTS.trade.places.every(id=>!!EIRDAN_PLACES[id]));
  ok('City: residential district exists',!!DISTRICTS.homes);
  ok('City: arena is direct location',CITY_HUB.arena?.type==='location'&&!!CITY_DIRECT.arena);
  rpgScreen='town';renderRpg();
  ok('City: hub renders',!!document.querySelector('[data-city-node="arena"]')&&!!document.querySelector('[data-city-node="trade"]')&&!!document.querySelector('[data-city-node="homes"]'));
  renderDistrict('trade');ok('City: trade district renders',document.querySelectorAll('[data-district-place]').length===3);
  renderDistrict('homes');ok('City: residential district renders',document.querySelectorAll('[data-district-place]').length>=3);
  renderCityHub();openArena();let arenaOverlay=document.querySelector('.placeOverlay:not(#versionOverlay)');
  ok('Arena: interaction overlay opens',!!arenaOverlay);
  ok('Arena: fight action exists',!!arenaOverlay?.querySelector('[data-fight]'));
  ok('Arena: watch action exists',!!arenaOverlay?.querySelector('[data-watch]'));
  arenaOverlay?.remove();
  ok('Arena: combat context initially clear',combatContext===null);
  ok('Versions: badge exists and wired',!!$('versionBadge')&&typeof $('versionBadge').onclick==='function');
  ok('Versions: overlay exists and wired',!!$('versionOverlay')&&typeof $('versionClose').onclick==='function');
  ok('Build: displayed version matches runtime',$('versionBadge')?.textContent.includes(window.EIRDAN_BUILD||'__missing__'),$('versionBadge')?.textContent||'missing');
  ok('Startup: boot screen exists',!!$('bootScreen')&&!!$('bootBar')&&!!$('bootStatus'));

  status.textContent='Проверка инвентаря и предметов...';await sleep(20);
  playerInventory=structuredClone(snap.inv);openInventory();ok('Inventory: opens',!$('invOverlay').classList.contains('hidden'));
  $('tabBag').click();ok('Inventory: Рюкзак tab',playerInventory.view==='bag'&&!$('bagView').classList.contains('hidden'));
  let gs=playerInventory.bag.indexOf('greatsword');playerInventory.selected=gs;playerInventory.selectedSlot=null;equipSelected();
  ok('Inventory: equip two-handed weapon',playerInventory.equip.main==='greatsword');
  ok('Inventory: two-handed clears off-hand',!playerInventory.equip.off);
  let sh=playerInventory.bag.indexOf('shield_round');if(sh>=0){playerInventory.selected=sh;equipSelected();ok('Inventory: shield blocked with two-handed',playerInventory.equip.main==='greatsword'&&!playerInventory.equip.off)}else ok('Inventory: shield returned to bag',playerInventory.bag.includes('shield_round'));
  let dag=playerInventory.bag.indexOf('dagger');playerInventory.selected=dag;equipSelected();ok('Inventory: equip one-handed weapon',playerInventory.equip.main==='dagger');
  sh=playerInventory.bag.indexOf('shield_round');playerInventory.selected=sh;equipSelected();ok('Inventory: equip shield with one-handed',playerInventory.equip.off==='shield_round');
  $('tabChar').click();ok('Inventory: Персонаж tab',playerInventory.view==='char'&&!$('charView').classList.contains('hidden'));
  playerInventory.selected=null;playerInventory.selectedSlot='off';unequipSelected();ok('Inventory: unequip selected slot',!playerInventory.equip.off&&playerInventory.bag.includes('shield_round'));
  closeInventory();ok('Inventory: closes',$('invOverlay').classList.contains('hidden'));
  playerInventory=structuredClone(snap.inv);

  status.textContent='Проверка боя и симуляций...';await sleep(20);
  ok('Combat: core functions exist',['attack','nextTurn','restSkill','prepareSkill','simulateDiagnostic'].every(n=>typeof eval(n)==='function'));
  const combatIds=['start','random','back','inventory'];
  ok('Combat: primary controls exist',combatIds.every(id=>!!$(id)),combatIds.filter(id=>!$(id)).join(', '));
  ok('Combat: skills available',['restSkill','prepareSkill','nextTurn'].every(n=>typeof eval(n)==='function'));
  ok('Combat: start/random/back handlers wired',['start','random','back'].every(id=>typeof $(id)?.onclick==='function'));
  ok('Combat: inventory handler wired',typeof $('inventory').onclick==='function');
  await simulateDiagnostic('1v1',100);ok('Simulation: 1v1 x100 report generated',!!window.lastSimulationReport);
  if(window.lastSimulationReport)out.push('','--- 1v1 x100 REPORT ---',window.lastSimulationReport,'--- END 1v1 ---');hideResultOverlay();
  await simulateDiagnostic('3v3',100);ok('Simulation: 3v3 x100 report generated',!!window.lastSimulationReport);
  if(window.lastSimulationReport)out.push('','--- 3v3 x100 REPORT ---',window.lastSimulationReport,'--- END 3v3 ---');hideResultOverlay();
  ok('Simulation: buttons restored',!$('sim1v1').disabled&&!$('sim3v3').disabled);
  ok('Result: overlay can close',$('resultOverlay').classList.contains('hidden'));
 }catch(e){err('Diagnostic runner exception',e)}
 Object.assign(WORLD,structuredClone(snap.world));playerInventory=structuredClone(snap.inv);rpgScreen=snap.screen;settingsReturn=snap.settingsReturn;combatLabReturn=snap.combatLabReturn;document.body.dataset.ui=snap.ui;window.EIRDAN_MASTER_VOLUME=snap.vol;
 hiddenIds.forEach(id=>$(id).classList.toggle('hidden',hiddenState[id]));
 $('debugPanel').classList.remove('hidden');
 out.push('','SUMMARY','PASS: '+pass,'FAIL: '+fail,'WARN: '+warn,'RESULT: '+(fail?'FAILED':'PASSED'));
 fullDiagnosticLog=out.join('\n');window.lastFullDiagnosticLog=fullDiagnosticLog;$('downloadFullDiagnostic').disabled=false;$('uploadFullDiagnostic').disabled=false;btn.disabled=false;status.textContent='Готово: PASS '+pass+' · FAIL '+fail+' · WARN '+warn+' · отправка...';setTimeout(()=>uploadFullDiagnosticLog(true),0);
}
$('newGame').onclick=()=>{showOnly('rpgShell');rpgScreen='world';renderRpg()};
$('openSettings').onclick=()=>openSettingsFrom('mainMenu');
$('settingsBack').onclick=()=>showOnly(settingsReturn);
$('openDebug').onclick=()=>$('debugPanel').classList.toggle('hidden');
$('enterCombatLab').onclick=()=>openCombatLab('settingsMenu');
$('runFullDiagnostic').onclick=runFullDiagnostic;
$('downloadFullDiagnostic').onclick=()=>{if(fullDiagnosticLog)downloadTxt('Eirdan_full_diagnostic_'+Date.now()+'.txt',fullDiagnosticLog)};
async function uploadFullDiagnosticLog(auto=false){
 const button=$('uploadFullDiagnostic'),status=$('fullDiagnosticStatus');
 if(!fullDiagnosticLog){status.textContent='TRANSPORT: NO LOG';return false}
 button.disabled=true;
 const runId='eirdan_'+Date.now();
 const payload=JSON.stringify({run_id:runId,build:window.EIRDAN_BUILD||'unknown',generated_at:new Date().toISOString(),log:fullDiagnosticLog});
 let lastError='';
 for(let attempt=1;attempt<=3;attempt++){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),7000);
  status.textContent='TRANSPORT: '+runId+' > attempt '+attempt+'/3 > POST';
  try{
   const response=await fetch(DIAGNOSTIC_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:payload,signal:controller.signal});
   clearTimeout(timer);
   status.textContent='TRANSPORT: '+runId+' > attempt '+attempt+'/3 > HTTP '+response.status;
   const result=await response.json();
   if(!response.ok||!result.ok)throw Error(result.error||('HTTP '+response.status));
   status.textContent='TRANSPORT: '+runId+' > HTTP '+response.status+' > OK '+(result.run_id||runId);
   button.disabled=false;
   return true;
  }catch(e){
   clearTimeout(timer);
   lastError=e?.name==='AbortError'?'timeout 7s':(e?.message||String(e));
   if(attempt<3){
    status.textContent='TRANSPORT: '+runId+' > attempt '+attempt+'/3 > RETRY '+lastError;
    await new Promise(r=>setTimeout(r,1000*attempt));
   }
  }
 }
 status.textContent='TRANSPORT: '+runId+' > FAILED after 3 attempts > '+lastError;
 button.disabled=false;
 return false;
}
$('uploadFullDiagnostic').onclick=()=>uploadFullDiagnosticLog(false);
$('gameMenuBtn').onclick=()=>$('gameMenu').classList.toggle('hidden');
$('resumeGame').onclick=()=>$('gameMenu').classList.add('hidden');
$('gameSettings').onclick=()=>{$('gameMenu').classList.add('hidden');openSettingsFrom('rpgShell')};
$('toMainMenu').onclick=()=>{$('gameMenu').classList.add('hidden');showOnly('mainMenu')};
$('refreshGame').onclick=async()=>{await window.EirdanUpdater?.check()};$('applyUpdate').onclick=()=>window.EirdanUpdater?.reload();
$('fullscreenGame').onclick=async()=>{try{if(!document.fullscreenElement){await document.documentElement.requestFullscreen({navigationUI:'hide'});$('fullscreenGame').textContent='Выйти из полного экрана'}else{await document.exitFullscreen();$('fullscreenGame').textContent='Полный экран'}}catch(e){alert('Браузер не разрешил полноэкранный режим. Для полного скрытия адресной строки можно установить Eirdan на главный экран как веб-приложение.')}};
document.addEventListener('fullscreenchange',()=>{if($('fullscreenGame'))$('fullscreenGame').textContent=document.fullscreenElement?'Выйти из полного экрана':'Полный экран'});
$('quitGame').onclick=()=>{$('quitOverlay').classList.remove('hidden')};
$('quitCancel').onclick=()=>{$('quitOverlay').classList.add('hidden')};
$('quitOverlay').onclick=e=>{if(e.target===$('quitOverlay'))$('quitOverlay').classList.add('hidden')};
$('quitConfirm').onclick=()=>{try{window.close()}catch(_){}setTimeout(()=>{document.body.innerHTML='<main class="mainMenu"><section class="mainMenuCard"><h1 class="mainTitle">EIRDAN</h1><div class="mainSub">Игра завершена</div><div class="mainActions"><button onclick="location.reload()">Запустить снова</button></div></section></main>'},120)};
$('uiMode').onchange=e=>document.body.dataset.ui=e.target.value;
const savedTheme=localStorage.getItem('eirdan-theme')||'dark';document.body.dataset.theme=savedTheme;if($('themeMode'))$('themeMode').value=savedTheme;
$('themeMode').onchange=e=>{document.body.dataset.theme=e.target.value;localStorage.setItem('eirdan-theme',e.target.value)};
$('masterVolume').oninput=e=>{window.EIRDAN_MASTER_VOLUME=(+e.target.value||0)/100};
$('rpgCharacter').onclick=()=>{playerInventory.view='char';playerInventory.selected=null;playerInventory.selectedSlot=null;openInventory()};
renderRpg();
showOnly('mainMenu');
$('versionBadge').onclick=()=>{$('versionOverlay').classList.remove('hidden')};
$('versionClose').onclick=()=>{$('versionOverlay').classList.add('hidden')};
$('versionOverlay').onclick=e=>{if(e.target===$('versionOverlay'))$('versionOverlay').classList.add('hidden')};
$('inventory').onclick=openInventory;
$('invClose').onclick=closeInventory;
$('invEquip').onclick=equipSelected;
$('invUnequip').onclick=unequipSelected;
$('statsToggle').onclick=()=>{$('statsDrawer').classList.toggle('hidden')};
initInvWindow();

function closeTopOverlay(){
 const overlays=[...document.querySelectorAll('.placeOverlay,.travelOverlay')].filter(x=>!x.classList.contains('hidden'));if(overlays.length){overlays.at(-1).remove();return true}
 if(!$('versionOverlay')?.classList.contains('hidden')){$('versionOverlay').classList.add('hidden');return true}
 if(!$('invOverlay')?.classList.contains('hidden')){closeInventory();return true}
 if(!$('debugPanel')?.classList.contains('hidden')){$('debugPanel').classList.add('hidden');return true}
 if(!$('gameMenu')?.classList.contains('hidden')){$('gameMenu').classList.add('hidden');return true}
 return false
}
function logicalBack(){
 if(closeTopOverlay())return;
 if(!$('resultOverlay')?.classList.contains('hidden')){let sim=$('resultOverlay').dataset.kind==='simulation';if(sim){$('resultNew').click();return}let A=units.some(u=>u.alive&&u.team==='ally'),E=units.some(u=>u.alive&&u.team==='enemy');hideResultOverlay();$('resultOverlay').dataset.kind='';combatContext=null;showOnly('rpgShell');rpgScreen='worldMap';renderRpg();return}
 if(!$('settingsMenu')?.classList.contains('hidden')){showOnly(settingsReturn||'mainMenu');return}
 if(!$('combatLab')?.classList.contains('hidden')){if(!$('setup').classList.contains('hidden')||over){showOnly(combatLabReturn||'settingsMenu');if(combatLabReturn==='rpgShell')renderRpg();return}$('gameMenu').classList.remove('hidden');return}
 if(!$('rpgShell')?.classList.contains('hidden')){if(rpgScreen==='town'||rpgScreen==='location'){rpgScreen='region';renderRpg();return}if(rpgScreen==='region'){rpgScreen='worldMap';renderRpg();return}$('gameMenu').classList.remove('hidden');return}
 // Main menu is the root: keep the app open instead of letting Android close it.
}
function armHistoryBack(){try{history.replaceState({eirdanRoot:true},'',location.href);history.pushState({eirdanGuard:1},'',location.href);history.pushState({eirdanGuard:2},'',location.href)}catch(_){}}
let handlingSystemBack=false;
window.addEventListener('popstate',()=>{if(handlingSystemBack)return;handlingSystemBack=true;logicalBack();try{history.pushState({eirdanGuard:Date.now()},'',location.href)}catch(_){}setTimeout(()=>handlingSystemBack=false,0)});
armHistoryBack();

$('tabBag').onclick=()=>{playerInventory.view='bag';playerInventory.selectedSlot=null;renderInventory()};
$('tabChar').onclick=()=>{playerInventory.view='char';playerInventory.selected=null;renderInventory()};

$('resultNew').onclick=()=>{
 let sim=$('resultOverlay').dataset.kind==='simulation';
 if(sim){hideResultOverlay();$('resultOverlay').dataset.kind='';$('resultNew').textContent='Новый бой';window.lastSimulationReport=null;window.lastSimulationFile=null;$('sim1v1').disabled=false;$('sim3v3').disabled=false;return}
 if(combatContext?.type==='arena'){let A=units.some(u=>u.alive&&u.team==='ally'),E=units.some(u=>u.alive&&u.team==='enemy');return returnFromArenaCombat(A,E)}
 hideResultOverlay();$('back').click()
};
$('resultDownload').onclick=()=>{
 if($('resultOverlay').dataset.kind==='simulation'&&window.lastSimulationReport){downloadTxt(window.lastSimulationFile||('Eirdan_simulation_'+Date.now()+'.txt'),window.lastSimulationReport);return}
 if(window.lastBattleReport)downloadTxt('Eirdan_battle_'+Date.now()+'.txt',window.lastBattleReport)
};

$('closeCombatLab').onclick=()=>{showOnly(combatLabReturn);if(combatLabReturn==='rpgShell')renderRpg()};
