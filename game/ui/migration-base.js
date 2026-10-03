import {W,CL,ARMORS,PD,CLASS_POOL,GRID,DEFAULT_BATTLE_CFG,mkbody} from '../alpha14p/data/constants.js';import {GameRNG,pick} from '../alpha14p/core/rng.js';
const TEST_POOL=['guardian'];

const INV_ITEMS={
 sword_iron:{n:'Железный меч',type:'weapon',slot:'main',w:1.35,ico:'⚔',desc:'Одноручный меч',combat:{weapon:'sword'}},
 axe_iron:{n:'Боевой топор',type:'weapon',slot:'main',w:1.8,ico:'◆',desc:'Одноручный топор',combat:{weapon:'axe'}},
 greatsword:{n:'Двуручный меч',type:'weapon',slot:'main',w:3.4,ico:'⚔',desc:'Двуручное оружие',two:true,combat:{weapon:'greatsword'}},
 greataxe:{n:'Двуручный топор',type:'weapon',slot:'main',w:4.2,ico:'◆',desc:'Двуручное оружие',two:true,combat:{weapon:'greataxe'}},
 shield_round:{n:'Круглый щит',type:'shield',slot:'off',w:3.2,ico:'◉',desc:'Щит · 55 прочности',combat:{shield:55}},
 helm_medium:{n:'Кольчужный капюшон',type:'armor',slot:'head',w:2.1,ico:'♜',desc:'Средний шлем · броня 30',combat:{head:30}},
 helm_heavy:{n:'Латный шлем',type:'armor',slot:'head',w:3.6,ico:'♜',desc:'Тяжёлый шлем · броня 45',combat:{head:45}},
 armor_medium:{n:'Кольчуга',type:'armor',slot:'body',w:8.4,ico:'▦',desc:'Средняя броня · 55 · руки 50% · ноги 20%',combat:{body:55,armCover:.50,legCover:.20,kind:'medium'}},
 armor_heavy:{n:'Латный доспех',type:'armor',slot:'body',w:14.5,ico:'▦',desc:'Тяжёлая броня · 80 · руки 75% · ноги 40%',combat:{body:80,armCover:.75,legCover:.40,kind:'heavy'}},
 boots_light:{n:'Кожаные сапоги',type:'armor',slot:'feet',w:1.1,ico:'♟',desc:'Лёгкие сапоги · защита 0 · ST +0',combat:{def:0,st:0}},
 boots_heavy:{n:'Латные сапоги',type:'armor',slot:'feet',w:3.2,ico:'♟',desc:'Латные сапоги · защита +2 · ST −5',combat:{def:2,st:-5}},
 backpack_small:{n:'Походный рюкзак',type:'bag',slot:'back',w:1.3,ico:'▣',desc:'Грузоподъёмность +12 кг',combat:{capacity:12}},
 backpack_large:{n:'Большой походный рюкзак',type:'bag',slot:'back',w:2.4,ico:'▣',desc:'Грузоподъёмность +22 кг · защита −1',combat:{capacity:22,def:-1}},
 dagger:{n:'Кинжал',type:'weapon',slot:'main',w:.55,ico:'†',desc:'Одноручный кинжал',combat:{weapon:'dagger'}}
};
let playerInventory={cap:30,slots:40,equip:{main:'sword_iron',off:'shield_round',head:'helm_medium',body:'armor_medium',feet:'boots_light',back:'backpack_small'},bag:['axe_iron','greatsword','greataxe','helm_heavy','armor_heavy','boots_heavy','backpack_large','dagger'],selected:null,selectedSlot:null,view:'bag'};
const SLOT_NAMES={main:'Правая рука',off:'Левая рука',head:'Голова',body:'Корпус',feet:'Ноги',back:'Спина'};
function invWeight(){let ids=[...Object.values(playerInventory.equip).filter(Boolean),...playerInventory.bag];return ids.reduce((s,id)=>s+(INV_ITEMS[id]?.w||0),0)}
function renderInventory(){
 let eq=$('equip'),bag=$('bag'),w=invWeight();
 $('invStats').textContent='Вес '+w.toFixed(1)+' / '+playerInventory.cap.toFixed(1)+' кг · '+playerInventory.bag.length+' / '+playerInventory.slots+' слотов';
 eq.innerHTML=Object.entries(SLOT_NAMES).map(([slot,n])=>{let id=playerInventory.equip[slot],it=id&&INV_ITEMS[id],main=INV_ITEMS[playerInventory.equip.main],twoHeld=slot==='off'&&main?.two&&!it;return '<div class="slot '+(!it&&!twoHeld?'empty ':'')+(playerInventory.selectedSlot===slot?'sel':'')+'" data-slot="'+slot+'"><b>'+n+'</b><div class="ico">'+(twoHeld?'↔':it?it.ico:'—')+'</div><small>'+(twoHeld?'Занято: '+main.n+' (двуручное)':it?it.n:'Пусто')+'</small></div>'}).join('');
 let pickText='Ничего не выбрано';if(playerInventory.selected!=null){let id=playerInventory.bag[playerInventory.selected],it=INV_ITEMS[id];if(it){let c=it.combat||{},wp=c.weapon&&W[c.weapon],extra=wp?' · Урон '+wp.min+'–'+wp.max+' · AP '+wp.ap+' · Точн. '+(wp.acc>=0?'+':'')+wp.acc+' · Проб. '+Math.round((wp.pen||0)*100)+'%':c.head!=null?' · Броня головы '+c.head:c.body!=null?' · Броня корпуса '+c.body:c.shield?' · Щит '+c.shield:c.capacity?' · Вместимость +'+c.capacity+' кг':'';pickText='Выбрано: '+it.n+' · '+it.w+' кг · '+it.desc+extra}}else if(playerInventory.selectedSlot){let id=playerInventory.equip[playerInventory.selectedSlot],it=id&&INV_ITEMS[id];pickText='Выбран слот: '+SLOT_NAMES[playerInventory.selectedSlot]+' · '+(it?it.n:'пусто')} $('invPick').textContent=pickText;
 let cells=[];for(let i=0;i<playerInventory.slots;i++){let id=playerInventory.bag[i],it=id&&INV_ITEMS[id];cells.push('<div class="bagSlot '+(!it?'empty ':'')+(playerInventory.selected===i?'sel':'')+'" data-i="'+i+'" title="'+(it?it.n:'Пустой слот')+'">'+(it?'<div class="ico">'+it.ico+'</div>':'')+'</div>')}bag.innerHTML=cells.join('');
 eq.querySelectorAll('.slot').forEach(el=>el.onclick=()=>{playerInventory.selectedSlot=el.dataset.slot;playerInventory.selected=null;renderInventory()});
 bag.querySelectorAll('.bagSlot').forEach(el=>el.onclick=()=>{let i=+el.dataset.i;if(!playerInventory.bag[i]){playerInventory.selected=null;renderInventory();return}playerInventory.selected=i;playerInventory.selectedSlot=null;renderInventory()});
 $('bagView').classList.toggle('hidden',playerInventory.view!=='bag');$('charView').classList.toggle('hidden',playerInventory.view!=='char');$('tabBag').classList.toggle('active',playerInventory.view==='bag');$('tabChar').classList.toggle('active',playerInventory.view==='char');$('invTitle').textContent=playerInventory.view==='bag'?'Рюкзак':'Персонаж';
}
function openInventory(){renderInventory();$('invOverlay').classList.remove('hidden')}
function closeInventory(){$('invOverlay').classList.add('hidden')}
function equipSelected(){
 let i=playerInventory.selected;if(i==null)return;let id=playerInventory.bag[i],it=INV_ITEMS[id];if(!it||!it.slot)return;
 if(it.slot==='off'){let main=INV_ITEMS[playerInventory.equip.main];if(main?.two){$('invPick').textContent='Нельзя: двуручное оружие занимает обе руки';return}}
 let old=playerInventory.equip[it.slot];
 if(it.slot==='main'&&it.two&&playerInventory.equip.off){playerInventory.bag.push(playerInventory.equip.off);playerInventory.equip.off=null}
 playerInventory.equip[it.slot]=id;playerInventory.bag.splice(i,1);if(old)playerInventory.bag.push(old);playerInventory.selected=null;refreshInventoryCombat()
}
function unequipSelected(){
 let s=playerInventory.selectedSlot;if(!s||!playerInventory.equip[s])return;playerInventory.bag.push(playerInventory.equip[s]);playerInventory.equip[s]=null;playerInventory.selectedSlot=null;refreshInventoryCombat()
}



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

let cfg=structuredClone(DEFAULT_BATTLE_CFG),units=[],terrain={},order=[],idx=0,round=1,over=false,auto=false,combatLog=[],fullLog=[];
const log=s=>{let line='R'+round+' · '+s;combatLog.unshift(line);if(combatLog.length>80)combatLog.length=80;fullLog.push(line)};
const $=id=>document.getElementById(id);
function gear(cls){if(cls==='guardian')return{w:pick(['sword','axe']),w2:null,shield:55};if(cls==='berserker')return{w:pick(['greatsword','greataxe']),w2:null,shield:0};if(['priest','firemage','wizard'].includes(cls))return{w:pick(['staff','wand']),w2:null,shield:0};if(cls==='archer')return{w:'bow',w2:'dagger',shield:0};if(cls==='crossbowman')return{w:'crossbow',w2:'dagger',shield:0};if(cls==='assassin')return{w:'dagger',w2:'dagger',shield:0};if(cls==='rogue')return{w:'throwknife',w2:'dagger',shield:0};return{w:'sword',w2:null,shield:0}}
function make(id,name,team,q,r,cls){let g=gear(cls),ak=pick(['light','medium','heavy']),ar=ARMORS[ak],magic=['priest','firemage','wizard'].includes(cls);return{id,name,team,q,r,cls,w:g.w,w2:g.w2,shield:g.shield,maxShield:g.shield,armorKind:ak,armorName:ar.n,armCover:ar.arm,legCover:ar.leg,body:mkbody(),hp:90,maxHp:90,bleed:0,armorHead:ar.head,maxArmorHead:ar.head,armorBody:ar.body,maxArmorBody:ar.body,ap:9,maxAp:9,st:100,mana:magic?80:0,maxMana:magic?80:0,skill:63,def:6,alive:true,bandages:1,loaded:false,guarding:false,poison:0,shock:0,stun:0,buffs:{stone:0,rage:0}}}
const hd=(q1,r1,q2,r2)=>{const x1=q1,z1=r1-(q1-(q1&1))/2,y1=-x1-z1,x2=q2,z2=r2-(q2-(q2&1))/2,y2=-x2-z2;return(Math.abs(x1-x2)+Math.abs(y1-y2)+Math.abs(z1-z2))/2};
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
 let s=Math.min(box.width/(1.5*(GRID.C-1)+2),box.height/(Math.sqrt(3)*(GRID.R+.5)))*.96;
 let fieldW=s*(1.5*(GRID.C-1)+2),fieldH=Math.sqrt(3)*s*(GRID.R+.5),ox=(box.width-fieldW)/2+s,oy=(box.height-fieldH)/2+Math.sqrt(3)*s/2;
 return{cv,ctx,s,ox,oy,w:box.width,h:box.height}
}
function hexCenter(q,r,L){return{x:L.ox+1.5*L.s*q,y:L.oy+Math.sqrt(3)*L.s*(r+.5*(q&1))}}
function hexPath(ctx,x,y,s){ctx.beginPath();for(let i=0;i<6;i++){let a=Math.PI/180*(60*i),px=x+s*Math.cos(a),py=y+s*Math.sin(a);i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath()}
function drawField(){
 let L=canvasLayout(),{ctx,s}=L;ctx.clearRect(0,0,L.w,L.h);let by=new Map(units.filter(u=>u.alive).map(u=>[u.q+','+u.r,u]));
 for(let q=0;q<GRID.C;q++)for(let r=0;r<GRID.R;r++){let {x,y}=hexCenter(q,r,L),u=by.get(q+','+r),t=terrain[q+','+r];hexPath(ctx,x,y,s);ctx.fillStyle=u?(u.team==='ally'?'#152d48':'#421a20'):t==='bush'?'#193023':t==='rock'||t==='tree'?'#29312d':'#141c1a';ctx.fill();ctx.strokeStyle='#46534f';ctx.lineWidth=1;ctx.stroke();let label=u?((u.team==='ally'?'● ':'● ')+(Number(u.id.slice(1))+1)):(t==='rock'?'К':t==='tree'?'Д':t==='bush'?'Кст':'');if(label){ctx.fillStyle=u?(u.team==='ally'?'#55aaff':'#ff5364'):'#dce4e0';ctx.font=Math.max(9,s*.34)+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x,y)}}
 let actors=units.filter(u=>u.alive).map(u=>({u,p:hexCenter(u.q,u.r,L)})).sort((a,b)=>a.p.y-b.p.y);
 for(const {u,p} of actors){let im=SPRITES[u.cls],h=s*2.15,w=h,footY=p.y+s*.36;ctx.save();ctx.fillStyle=u.team==='ally'?'rgba(60,140,255,.42)':'rgba(225,70,85,.42)';ctx.beginPath();ctx.ellipse(p.x,footY,s*.52,s*.22,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=u.team==='ally'?'#79b9ff':'#ff7582';ctx.font='bold '+Math.max(9,s*.3)+'px system-ui';ctx.textAlign='center';ctx.fillText(String(Number(u.id.slice(1))+1),p.x,footY+s*.38);ctx.restore()}
 window.__hexLayout=L
}
function render(){drawField();$('round').textContent='Раунд 1 · '+units.length+' бойцов · '+cfg.terrain;$('summary').innerHTML=units.map(u=>'<div class="card"><b>'+u.name+'</b><br>'+CL[u.cls].n+'<br>'+W[u.w].n+(u.w2?' + '+W[u.w2].n:'')+'<br>'+(u.id==='a0'?(u.helmetName+' · '+u.armorName+' · '+u.bootsName):u.armorName)+'<br>HP '+u.hp+' · AP '+u.ap+' · ST '+u.st+'/'+(u.maxSt||100)+' · DEF '+u.def+'<br>Щит '+u.shield+'/'+u.maxShield+' · Броня '+u.armorHead+'/'+u.armorBody+'<br>Кровотечение '+u.bleed+(u.prepared?' · ПРИГОТОВЛЕН':'')+(u.alive?'':' · ВЫБЫЛ')+'</div>').join('')}
$('back').onclick=()=>{hideResultOverlay();$('resultOverlay').dataset.kind='';$('resultNew').textContent='Новый бой';$('sim1v1').disabled=false;$('sim3v3').disabled=false;window.lastSimulationReport=null;window.lastSimulationFile=null;pendingDuel=false;$('prepFight').classList.add('hidden');$('setup').classList.remove('hidden');$('battle').classList.add('hidden');$('hud').classList.add('hidden')};

const dirs=(q)=>(q&1)?[[1,0],[1,1],[0,1],[-1,1],[-1,0],[0,-1]]:[[1,-1],[1,0],[0,1],[-1,0],[-1,-1],[0,-1]];
const neigh=(q,r)=>dirs(q).map(d=>[q+d[0],r+d[1]]).filter(p=>p[0]>=0&&p[0]<GRID.C&&p[1]>=0&&p[1]<GRID.R);
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
  log('[АТАКА] '+a.name+' → '+t.name+' · '+W[wk].n+' · '+PD[p].n+' · сырой '+raw+' · ЩИТ поглотил '+actual+' ('+pre.shield+'→'+t.shield+')');return
 }
 let slot=p==='head'?'armorHead':p==='torso'||p.includes('arm')||p.includes('leg')?'armorBody':null,cover=p==='head'?1:p==='torso'?1:p.includes('arm')?t.armCover:t.legCover,bodyD=raw,armorHit=false,armorLoss=0,pen=1;
 if(slot&&t[slot]>0&&GameRNG.random()<cover){
  armorHit=true;let max='max'+slot[0].toUpperCase()+slot.slice(1),ratio=t[slot]/Math.max(1,t[max]);pen=Math.min(.7,(w.pen||.1)+(1-ratio)*.45);bodyD=Math.max(1,Math.round(raw*pen));armorLoss=Math.min(t[slot],Math.max(1,Math.round(raw*(w.ad||.5))));t[slot]=Math.max(0,t[slot]-Math.max(1,Math.round(raw*(w.ad||.5))))
 }
 if(t.prepared){let beforePrep=bodyD;bodyD=Math.max(1,Math.round(bodyD*.8));log('[ПРИГОТОВИТЬСЯ] '+t.name+' поглощает '+(beforePrep-bodyD)+' урона · '+beforePrep+'→'+bodyD)}let before=t.body[p].hp;t.body[p].hp=Math.max(0,before-bodyD);t.hp=Math.max(0,t.hp-bodyD);
 let cripple=before>0&&t.body[p].hp<=0&&['larm','rarm','lleg','rleg'].includes(p);if(cripple)t.bleed=Math.min(12,(t.bleed||0)+2);
 if(t.hp<=0||t.body.head.hp<=0||t.body.torso.hp<=0)t.alive=false;
 log('[АТАКА] '+a.name+' → '+t.name+' · '+W[wk].n+' · '+PD[p].n+' · сырой '+raw+(armorHit?' · БРОНЯ '+(slot==='armorHead'?'голова':'корпус')+' −'+armorLoss+' ('+(slot==='armorHead'?pre.ah:pre.ab)+'→'+t[slot]+'), прошло '+bodyD+' ['+Math.round(pen*100)+'%]':' · без брони, прошло '+bodyD)+' · часть '+pre.part+'→'+t.body[p].hp+' · HP '+pre.hp+'→'+t.hp+(cripple?' · КОНЕЧНОСТЬ ВЫВЕДЕНА · bleed '+pre.bleed+'→'+t.bleed:'')+(t.alive?'':' · ВЫБЫЛ'))
}
function attack(a,t,p=null){let wk=activeWeapon(a,t),w=W[wk],cost=p?5:w.ap;if(a.ap<cost||dist(a,t)>w.r)return false;let ap0=a.ap,st0=a.st,d=dist(a,t);a.ap-=cost;a.st=Math.max(0,a.st-(p?18:14));let ch=chance(a,t,p,wk);log('[НАМЕРЕНИЕ] '+a.name+' атакует '+t.name+' · '+W[wk].n+' · дистанция '+d+' · шанс '+Math.round(ch)+'% · AP '+ap0+'→'+a.ap+' · ST '+st0+'→'+a.st);if(GameRNG.random()*100<=ch)oneHit(a,t,p||rndPart(),wk,p?PD[p].m:1);else log('[ПРОМАХ] '+a.name+' → '+t.name+' · '+W[wk].n+' · шанс '+Math.round(ch)+'% · позиция ['+a.q+','+a.r+']→['+t.q+','+t.r+']');checkEnd();return true}
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
 $('resultOverlay').dataset.kind='battle';$('resultNew').textContent='Новый бой';
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
function nextTurn(){if(!advanceTurnCore())return nextRender();nextRender();let c=order[idx];if(auto||c.id!=='a0')setTimeout(aiTurn,60)}
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
 let mc=moveCost(a),o=pathStep(a,t,w.r);
 if(o&&a.ap>=mc.ap){let q0=a.q,r0=a.r,ap0=a.ap,st0=a.st;a.q=o[0];a.r=o[1];a.ap-=mc.ap;a.st=Math.max(0,a.st-mc.st);log('[ДВИЖЕНИЕ] '+a.name+' ['+q0+','+r0+']→['+a.q+','+a.r+'] · цель '+t.name+' · AP '+ap0+'→'+a.ap+' · ST '+st0+'→'+a.st+' · дистанция '+hd(q0,r0,t.q,t.r)+'→'+dist(a,t));return 'move'}
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
 if(action==='end'||action==='none')return setTimeout(nextTurn,60);
 setTimeout(()=>{if(over)return;let foes=units.filter(x=>x.alive&&x.team!==a.team).sort((x,y)=>dist(a,x)-dist(a,y)),t=foes[0];if(!t)return;let w=W[activeWeapon(a,t)],mc=moveCost(a),canAttack=dist(a,t)<=w.r&&a.ap>=w.ap,canMove=dist(a,t)>w.r&&a.ap>=mc.ap&&!!pathStep(a,t,w.r),canRest=a.st<25&&a.ap>=4&&a.st<(a.maxSt||100),canPrep=dist(a,t)<=w.r&&a.ap>=4&&!a.prepared;if(canAttack||canMove||canRest||canPrep)aiTurn();else nextTurn()},60)
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
 let report=['EIRDAN 0.15 · DIAGNOSTIC','BUILD: '+(window.EIRDAN_BUILD||'unknown'),'MODE: '+(mode==='1v1'?'1v1 RANDOM EQUIPMENT':'3v3 MIRROR EQUIPMENT'),'BATTLES: '+n,'SEED CALLS: '+GameRNG.calls,'','RESULTS','Allies: '+wins.ally,'Enemies: '+wins.enemy,'Draws/timeouts: '+wins.draw,'Average rounds: '+(rounds/n).toFixed(1),'Max rounds: '+maxRounds,'Timeouts: '+timeouts,'',...(duel?['WEAPON RESULTS',...equipLines,'','FULL LOADOUTS',...details]:['MIRROR RULE: each ally slot is mirrored by corresponding enemy slot; Guardian only.','FULL TRACE OF LAST MIRROR BATTLE',...fullLog]),'','CHECKS','Two-handed weapon occupies off-hand: enforced','Inventory loadout -> combat stats: enforced','Armor/head/shield reset from loadout: enforced','Round cap: 250 · guard cap: 6000','Balance values: unchanged.'].join('\n');
 cfg=snap.cfg;units=snap.units;terrain=snap.terrain;order=snap.order;idx=snap.idx;round=snap.round;over=snap.over;combatLog=snap.combatLog;fullLog=snap.fullLog;playerInventory.equip=snap.equip;auto=oldAuto;nextRender();pt.textContent=(mode==='1v1'?'1v1':'3v3')+' · '+n+' / '+n+' · ГОТОВО';pb.style.width='100%';b1.disabled=false;b3.disabled=false;window.lastSimulationReport=report;window.lastSimulationFile='Eirdan_'+mode+'_diagnostic_'+Date.now()+'.txt';$('resultTitle').textContent='Симуляция завершена';$('resultBrief').textContent=(mode==='1v1'?'1v1':'3v3')+' ×'+n+' · Союзники '+wins.ally+' · Враги '+wins.enemy+' · Ничьи/лимит '+wins.draw+' · среднее '+(rounds/n).toFixed(1)+' раундов';$('resultNew').textContent='Продолжить';$('resultOverlay').dataset.kind='simulation';simulationRunning=false;showResultOverlay();setTimeout(()=>progress.classList.add('hidden'),2500)
}
$('sim1v1').onclick=()=>simulateDiagnostic('1v1',100);
$('sim3v3').onclick=()=>simulateDiagnostic('3v3',100);
function ensureBattleControls(){['combatLog','auto','endTurn','restSkill','prepareSkill'].forEach(id=>$(id)?.remove());let lg=document.createElement('div');lg.id='combatLog';lg.style='margin-top:10px;max-height:180px;overflow:auto;font-size:12px;line-height:1.5;white-space:pre-line';$('hud').append(lg);let b=document.createElement('button');b.id='auto';b.disabled=false;b.textContent='Автобой';b.onclick=()=>{auto=true;if(order[idx].id==='a0')aiTurn()};$('hud').querySelector('.actions').append(b);let r=document.createElement('button');r.id='restSkill';r.textContent='Передышка (+30 ST, 4 AP)';r.onclick=()=>{if(!auto&&order[idx]?.id==='a0'&&restSkill(order[idx]))nextRender()};$('hud').querySelector('.actions').append(r);let p=document.createElement('button');p.id='prepareSkill';p.textContent='Приготовиться (4 AP)';p.onclick=()=>{if(!auto&&order[idx]?.id==='a0'&&prepareSkill(order[idx]))nextRender()};$('hud').querySelector('.actions').append(p);let e=document.createElement('button');e.id='endTurn';e.disabled=false;e.textContent='Конец хода';e.onclick=()=>{if(!auto&&order[idx]?.id==='a0')nextTurn()};$('hud').querySelector('.actions').append(e);nextRender();}
$('grid').onclick=e=>{let cells=[...$('grid').children],i=cells.indexOf(e.target.closest('.hex'));if(i<0||over||auto||order[idx]?.id!=='a0')return;let h=e.target.closest('.hex'),q=+h.dataset.q,r=+h.dataset.r,a=order[idx],u=at(q,r);if(u&&u.team!==a.team){attack(a,u);nextRender();return}let mc=moveCost(a);if(!u&&!blocked(q,r)&&a.ap>=mc.ap&&neigh(a.q,a.r).some(p=>p[0]===q&&p[1]===r)){let q0=a.q,r0=a.r,ap0=a.ap,st0=a.st;a.q=q;a.r=r;a.ap-=mc.ap;a.st=Math.max(0,a.st-mc.st);log('[ДВИЖЕНИЕ] '+a.name+' ['+q0+','+r0+']→['+q+','+r+'] · AP '+ap0+'→'+a.ap+' · ST '+st0+'→'+a.st);nextRender()}};


document.body.appendChild($('invOverlay'));document.body.appendChild($('resultOverlay'));
const WORLD={
 day:1,minutes:8*60,location:'road',gold:24,reputation:0,
 flags:{gateIncident:false},
 places:{
  road:{name:'Старый тракт',desc:'Дорога к небольшому пограничному городу.',x:1,y:2},
  eirdan:{name:'Эйрдан',desc:'Небольшой укреплённый город.',x:2,y:2},
  village:{name:'Деревня Рен',desc:'Несколько десятков домов и поля.',x:0,y:2},
  forest:{name:'Серый лес',desc:'Лес к северу от тракта.',x:1,y:1},
  ruins:{name:'Старые руины',desc:'Пока недоступно.',x:2,y:0,locked:true}
 }
};
let rpgScreen='world';
function worldTime(){let h=Math.floor(WORLD.minutes/60)%24,m=WORLD.minutes%60;return 'День '+WORLD.day+' · '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')}
function passTime(min){WORLD.minutes+=min;while(WORLD.minutes>=1440){WORLD.minutes-=1440;WORLD.day++}}
function renderRpg(){
 $('worldClock').textContent=worldTime();
 $('rpgStats').textContent='Локация: '+WORLD.places[WORLD.location].name+' · Золото: '+WORLD.gold+' · Репутация Эйрдана: '+WORLD.reputation;
 if(rpgScreen==='town')return renderTown();
 let cells=Array(9).fill(null),entries=Object.entries(WORLD.places);for(const [id,p] of entries)cells[p.y*3+p.x]=[id,p];
 $('rpgView').innerHTML='<h2 style="margin-top:0">Карта региона</h2><div class="note">Тестовый регион. Переходы пока мгновенные с расходом игрового времени.</div><div class="worldMap">'+cells.map(x=>x?'<button class="worldNode '+(WORLD.location===x[0]?'current ':'')+(x[1].locked?'locked':'')+'" data-world="'+x[0]+'" '+(x[1].locked?'disabled':'')+'><b>'+x[1].name+'</b><small>'+x[1].desc+'</small></button>':'<div></div>').join('')+'</div>';
 document.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>travelTo(b.dataset.world))
}
function travelTo(id){
 if(id===WORLD.location&&id==='eirdan'){rpgScreen='town';return renderRpg()}
 if(id!==WORLD.location){passTime(id==='eirdan'?45:30);WORLD.location=id}
 if(id==='eirdan'){rpgScreen='town';renderRpg();if(!WORLD.flags.gateIncident)setTimeout(showGateEvent,0);return}
 rpgScreen='location';renderLocation(id)
}
function renderLocation(id){
 let p=WORLD.places[id];$('worldClock').textContent=worldTime();renderRpgStatsOnly();
 $('rpgView').innerHTML='<h2 style="margin:0 0 4px">'+p.name+'</h2><div class="note">'+p.desc+'</div><div class="eventBox"><b>Осмотреться</b><p>'+(id==='forest'?'Между деревьями тянется старая тропа. Пока здесь нет активных событий.':id==='village'?'Небольшая деревня живёт обычной жизнью. Позже здесь появятся дома и NPC.':'Пыльный тракт соединяет поселения региона. Пока дорога безопасна.')+'</p></div><button id="locationBack" style="width:100%;margin-top:10px">На карту региона</button>';
 $('locationBack').onclick=()=>{rpgScreen='world';renderRpg()}
}
function renderTown(){
 $('rpgView').innerHTML=`
 <h2 style="margin:0 0 4px">Эйрдан</h2><div class="note">Тестовая карта поселения.</div>
 <div class="townGrid">
  <button class="townPlace" data-place="Таверна"><b>Таверна</b><br><small>Еда, слухи и постояльцы</small></button>
  <button class="townPlace" data-place="Кузница"><b>Кузница</b><br><small>Оружие и ремесло</small></button>
  <button class="townPlace" data-place="Рынок"><b>Рынок</b><br><small>Торговцы и горожане</small></button>
  <button class="townPlace" data-place="Казармы"><b>Казармы</b><br><small>Городская стража</small></button>
 </div>
 <button id="leaveTown" style="width:100%;margin-top:10px">К городским воротам / на карту</button><div id="townEvent"></div>`;
 document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>{passTime(20);$('townEvent').innerHTML='<div class="eventBox"><b>'+b.dataset.place+'</b><p>Пока это тестовая точка. Время прошло на 20 минут.</p></div>';renderRpgStatsOnly()});
 $('leaveTown').onclick=()=>{rpgScreen='world';renderRpg()}
}
function renderRpgStatsOnly(){$('worldClock').textContent=worldTime();$('rpgStats').textContent='Локация: '+WORLD.places[WORLD.location].name+' · Золото: '+WORLD.gold+' · Репутация Эйрдана: '+WORLD.reputation}
function showGateEvent(){
 WORLD.flags.gateIncident=true;let box=$('townEvent');if(!box)return;
 box.innerHTML='<div class="eventBox"><b>У городских ворот</b><p>У телеги спорят торговец и городской стражник. Вокруг уже собрались зеваки.</p><div class="eventChoices"><button data-event="listen">Остановиться и послушать</button><button data-event="leave">Не вмешиваться</button></div></div>';
 box.querySelector('[data-event="listen"]').onclick=()=>{passTime(10);WORLD.reputation+=1;box.innerHTML='<div class="eventBox"><b>Слух</b><p>Торговец жалуется на пропажи товара на северном тракте. Стражник советует не ходить к лесу после заката.</p></div>';renderRpgStatsOnly()};
 box.querySelector('[data-event="leave"]').onclick=()=>{box.innerHTML=''}
}
function showOnly(id){['mainMenu','settingsMenu','rpgShell','combatLab'].forEach(x=>$(x)?.classList.toggle('hidden',x!==id))}
function openCombatLab(returnTo='settingsMenu'){closeInventory();combatLabReturn=returnTo;showOnly('combatLab')}
let settingsReturn='mainMenu',combatLabReturn='settingsMenu',fullDiagnosticLog='';
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
 try{
  status.textContent='Проверка кнопок и переходов...';await sleep(20);
  showOnly('mainMenu');$('newGame').click();ok('Button: Новая игра -> RPG',!$('rpgShell').classList.contains('hidden')&&rpgScreen==='world');
  $('gameMenuBtn').click();ok('Button: ☰ opens game menu',!$('gameMenu').classList.contains('hidden'));
  $('resumeGame').click();ok('Button: Продолжить closes game menu',$('gameMenu').classList.contains('hidden'));
  $('gameMenuBtn').click();$('gameSettings').click();ok('Button: Настройки from game -> settings',!$('settingsMenu').classList.contains('hidden')&&settingsReturn==='rpgShell');
  $('settingsBack').click();ok('Button: Назад from game settings -> same game',!$('rpgShell').classList.contains('hidden'));
  showOnly('mainMenu');$('openSettings').click();ok('Button: Настройки from main -> settings',!$('settingsMenu').classList.contains('hidden')&&settingsReturn==='mainMenu');
  $('openDebug').click();ok('Button: Отладка toggles panel',!$('debugPanel').classList.contains('hidden'));
  $('enterCombatLab').click();ok('Button: Открыть Combat Lab -> lab',!$('combatLab').classList.contains('hidden')&&combatLabReturn==='settingsMenu');
  $('closeCombatLab').click();ok('Button: Вернуться из Combat Lab -> settings',!$('settingsMenu').classList.contains('hidden'));
  showOnly('rpgShell');$('gameMenuBtn').click();$('toMainMenu').click();ok('Button: В главное меню -> main menu',!$('mainMenu').classList.contains('hidden'));

  status.textContent='Проверка мира...';await sleep(20);
  ok('World: all places valid',Object.values(WORLD.places).every(p=>p&&p.name&&Number.isInteger(p.x)&&Number.isInteger(p.y)));
  let t0=WORLD.minutes;passTime(30);ok('World: passTime +30',WORLD.minutes===t0+30||WORLD.day>snap.world.day);Object.assign(WORLD,structuredClone(snap.world));

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
  await simulateDiagnostic('1v1',100);ok('Simulation: 1v1 x100 report generated',!!window.lastSimulationReport);
  if(window.lastSimulationReport)out.push('','--- 1v1 x100 REPORT ---',window.lastSimulationReport,'--- END 1v1 ---');hideResultOverlay();
  await simulateDiagnostic('3v3',100);ok('Simulation: 3v3 x100 report generated',!!window.lastSimulationReport);
  if(window.lastSimulationReport)out.push('','--- 3v3 x100 REPORT ---',window.lastSimulationReport,'--- END 3v3 ---');hideResultOverlay();
  ok('Simulation: buttons restored',!$('sim1v1').disabled&&!$('sim3v3').disabled);
  ok('Result: overlay can close',$('resultOverlay').classList.contains('hidden'));
 }catch(e){err('Diagnostic runner exception',e)}
 Object.assign(WORLD,structuredClone(snap.world));playerInventory=structuredClone(snap.inv);rpgScreen=snap.screen;settingsReturn=snap.settingsReturn;combatLabReturn=snap.combatLabReturn;document.body.dataset.ui=snap.ui;window.EIRDAN_MASTER_VOLUME=snap.vol;
 showOnly('settingsMenu');$('debugPanel').classList.remove('hidden');
 out.push('','SUMMARY','PASS: '+pass,'FAIL: '+fail,'WARN: '+warn,'RESULT: '+(fail?'FAILED':'PASSED'));
 fullDiagnosticLog=out.join('\n');window.lastFullDiagnosticLog=fullDiagnosticLog;$('downloadFullDiagnostic').disabled=false;btn.disabled=false;status.textContent='Готово: PASS '+pass+' · FAIL '+fail+' · WARN '+warn;
}
$('newGame').onclick=()=>{showOnly('rpgShell');rpgScreen='world';renderRpg()};
$('openSettings').onclick=()=>openSettingsFrom('mainMenu');
$('settingsBack').onclick=()=>showOnly(settingsReturn);
$('openDebug').onclick=()=>$('debugPanel').classList.toggle('hidden');
$('enterCombatLab').onclick=()=>openCombatLab('settingsMenu');
$('runFullDiagnostic').onclick=runFullDiagnostic;
$('downloadFullDiagnostic').onclick=()=>{if(fullDiagnosticLog)downloadTxt('Eirdan_full_diagnostic_'+Date.now()+'.txt',fullDiagnosticLog)};
$('gameMenuBtn').onclick=()=>$('gameMenu').classList.toggle('hidden');
$('resumeGame').onclick=()=>$('gameMenu').classList.add('hidden');
$('gameSettings').onclick=()=>{$('gameMenu').classList.add('hidden');openSettingsFrom('rpgShell')};
$('toMainMenu').onclick=()=>{$('gameMenu').classList.add('hidden');showOnly('mainMenu')};
$('quitGame').onclick=()=>{alert('Выход из игры будет подключён позже.')};
$('uiMode').onchange=e=>document.body.dataset.ui=e.target.value;
$('masterVolume').oninput=e=>{window.EIRDAN_MASTER_VOLUME=(+e.target.value||0)/100};
$('rpgCharacter').onclick=()=>{playerInventory.view='char';playerInventory.selected=null;playerInventory.selectedSlot=null;openInventory()};
renderRpg();
showOnly('mainMenu');
$('inventory').onclick=openInventory;
$('invClose').onclick=closeInventory;
$('invEquip').onclick=equipSelected;
$('invUnequip').onclick=unequipSelected;

$('tabBag').onclick=()=>{playerInventory.view='bag';playerInventory.selectedSlot=null;renderInventory()};
$('tabChar').onclick=()=>{playerInventory.view='char';playerInventory.selected=null;renderInventory()};

$('resultNew').onclick=()=>{
 let sim=$('resultOverlay').dataset.kind==='simulation';
 hideResultOverlay();
 if(sim){$('resultOverlay').dataset.kind='';$('resultNew').textContent='Новый бой';window.lastSimulationReport=null;window.lastSimulationFile=null;$('sim1v1').disabled=false;$('sim3v3').disabled=false;return}
 $('back').click()
};
$('resultDownload').onclick=()=>{
 if($('resultOverlay').dataset.kind==='simulation'&&window.lastSimulationReport){downloadTxt(window.lastSimulationFile||('Eirdan_simulation_'+Date.now()+'.txt'),window.lastSimulationReport);return}
 if(window.lastBattleReport)downloadTxt('Eirdan_battle_'+Date.now()+'.txt',window.lastBattleReport)
};

$('closeCombatLab').onclick=()=>{showOnly(combatLabReturn);if(combatLabReturn==='rpgShell')renderRpg()};
