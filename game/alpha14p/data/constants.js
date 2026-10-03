// Extracted from Eirdan 0.14.15-alpha14p. Keep values unchanged during parity migration.
export const W={
 sword:{n:'Меч',i:'⚔',min:20,max:30,r:1,ap:4,acc:3,sd:1,type:'melee',ad:.7,pen:.15},
 axe:{n:'Топор',i:'◆',min:20,max:30,r:1,ap:4,acc:0,sd:2.4,type:'melee',ad:1.4,pen:.20},
 spear:{n:'Копьё',i:'↟',min:16,max:25,r:2,ap:4,acc:5,sd:.75,type:'melee',two:true,ad:.8,pen:.35},
 bow:{n:'Лук',i:'➶',min:17,max:27,r:5,ap:4,acc:5,sd:.65,type:'bow',ad:.5,pen:.20},
 dagger:{n:'Кинжал',i:'†',min:13,max:20,r:1,ap:3,acc:7,sd:.3,type:'melee',ad:.3,pen:.10},
 staff:{n:'Посох',i:'✦',min:10,max:16,r:1,ap:4,acc:0,sd:.5,type:'magic',ad:.25,pen:.15,pow:2,mana:1,sap:1,sr:1},
 wand:{n:'Палочка',i:'⌁',min:7,max:12,r:1,ap:3,acc:2,sd:.3,type:'magic',ad:.2,pen:.1,pow:.72,mana:.7,sap:.75,sr:.75},
 crossbow:{n:'Арбалет',i:'➹',min:30,max:42,r:6,ap:4,acc:7,sd:.9,type:'bow',ad:.8,pen:.48},
 greatsword:{n:'Двуручный меч',i:'⚔',min:40,max:58,r:1,ap:5,acc:-2,sd:1.5,type:'melee',ad:1.1,pen:.22},
 greataxe:{n:'Двуручный топор',i:'◆',min:42,max:62,r:1,ap:5,acc:-5,sd:3,type:'melee',ad:1.8,pen:.28},
 throwknife:{n:'Метательный нож',i:'⌁',min:12,max:18,r:4,ap:3,acc:5,sd:.25,type:'bow',ad:.2,pen:.08}
};
export const CL={
 archer:{n:'Лучник',bonus:'Быстрая стрельба • дымовая бомба'},
 crossbowman:{n:'Арбалетчик',bonus:'Зарядка • высокая бронепробиваемость'},
 guardian:{n:'Страж',bonus:'Щит • Приготовиться • удар щитом'},
 berserker:{n:'Берсерк',bonus:'Двуручное оружие • размашистый удар'},
 priest:{n:'Священник',bonus:'Лечение • Каменная кожа • Ярость'},
 firemage:{n:'Маг огня',bonus:'Вспышка • Огненный взрыв • Огненная волна'},
 wizard:{n:'Волшебник',bonus:'Телепорт • Призыв • Разряд молнии'},
 assassin:{n:'Ассасин',bonus:'Кинжал • мобильность'},
 rogue:{n:'Разбойник',bonus:'Метательные ножи • яд'}
};
export const ARMORS={
 light:{n:'Лёгкая',head:18,body:32,arm:.30,leg:.10},
 medium:{n:'Средняя',head:30,body:55,arm:.50,leg:.20},
 heavy:{n:'Тяжёлая',head:45,body:80,arm:.75,leg:.40}
};
export const PD={head:{n:'Голова',mod:-30,m:1.55},torso:{n:'Туловище',mod:0,m:1.15},larm:{n:'Л.рука',mod:-17,m:.8},rarm:{n:'П.рука',mod:-17,m:.8},lleg:{n:'Л.нога',mod:-13,m:.85},rleg:{n:'П.нога',mod:-13,m:.85}};
export const CLASS_POOL=['archer','crossbowman','guardian','berserker','priest','firemage','wizard','assassin','rogue'];
export const GRID={C:14,R:10,XS:47,YS:58};
export const DEFAULT_BATTLE_CFG={allies:['guardian','archer','priest'],enemies:3,terrain:'normal'};
export const mkbody=()=>({head:{n:'Голова',hp:12,max:12,severed:false},torso:{n:'Туловище',hp:32,max:32,severed:false},larm:{n:'Л. рука',hp:10,max:10,severed:false},rarm:{n:'П. рука',hp:10,max:10,severed:false},lleg:{n:'Л. нога',hp:13,max:13,severed:false},rleg:{n:'П. нога',hp:13,max:13,severed:false}});
