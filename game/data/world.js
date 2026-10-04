export const WORLD_DATA={
 regions:{
  ren:{name:'Долина Рен',desc:'Центральные земли вокруг Эйрдана.',x:47,y:48,icon:'♜'},
  north:{name:'Северные горы',desc:'Холодные перевалы и старые крепости.',x:56,y:17,icon:'▲'},
  west:{name:'Западные холмы',desc:'Пограничные земли и старые дороги.',x:19,y:48,icon:'◆'},
  east:{name:'Восточные леса',desc:'Дикие лесные земли.',x:78,y:42,icon:'♠'},
  south:{name:'Южные земли',desc:'Тёплые равнины и торговые пути.',x:43,y:79,icon:'☀'},
  marsh:{name:'Болотные низины',desc:'Опасные топи на юго-востоке.',x:78,y:76,icon:'≈'}
 },
 places:{
  road:{name:'Старый тракт',desc:'Главная дорога региона.',region:'ren',x:48,y:76,type:'wild',icon:'↟'},
  eirdan:{name:'Эйрдан',desc:'Укреплённый торговый город.',region:'ren',x:76,y:64,type:'town',icon:'♜'},
  village:{name:'Деревня Рен',desc:'Поля и небольшое поселение.',region:'ren',x:20,y:69,type:'village',icon:'⌂'},
  forest:{name:'Дремучий лес',desc:'Густой старый лес.',region:'ren',x:43,y:31,type:'wild',icon:'♠'},
  ruins:{name:'Старые руины',desc:'Развалины на холмах.',region:'ren',x:76,y:20,type:'wild',icon:'◆'}
 },
 cities:{eirdan:{name:'Эйрдан',places:{
  tavern:{name:'Таверна',desc:'Еда, ночлег, слухи и постояльцы.',sprite:22,x:31,y:36,minutes:15},
  smith:{name:'Кузница',desc:'Оружие, броня и услуги кузнеца.',sprite:39,x:67,y:34,minutes:20},
  market:{name:'Рынок',desc:'Лавки торговцев и городская площадь.',sprite:15,x:51,y:50,minutes:15},
  barracks:{name:'Казармы',desc:'Городская стража и гарнизон.',sprite:31,x:72,y:62,minutes:20},
  temple:{name:'Храм',desc:'Небольшой городской храм.',sprite:136,x:30,y:61,minutes:15},
  homes:{name:'Жилой район',desc:'Дома ремесленников и горожан.',sprite:83,x:51,y:27,minutes:15}
 }}},
 travel:{localEventChance:.25,roadEventChance:.42,legMinutes:240,campFatigue:12,campMinutes:480}
};
export const WorldData=WORLD_DATA;
