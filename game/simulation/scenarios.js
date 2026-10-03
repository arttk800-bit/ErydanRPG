import {createUnit} from '../data/unit-factory.js';
import {SeededRng} from '../core/rng.js';

const LEFT=[[1,4],[1,5],[1,6]],RIGHT=[[12,2],[12,3],[12,4]];
const CLASS_POOL=['guardian','archer','priest','firemage','wizard','rogue','crossbowman','berserker','assassin'];
const ARMORS={
 light:{armorKind:'light',armorHead:18,armorBody:32,armCover:.30,legCover:.10},
 medium:{armorKind:'medium',armorHead:30,armorBody:55,armCover:.50,legCover:.20},
 heavy:{armorKind:'heavy',armorHead:45,armorBody:80,armCover:.75,legCover:.40}
};
function pick(rng,a){return a[Math.floor(rng.next()*a.length)];}
function oldGear(cls,rng){
 if(cls==='guardian')return{w:pick(rng,['sword','axe']),shield:55};
 if(cls==='berserker')return{w:pick(rng,['greatsword','greataxe']),shield:0};
 if(['priest','firemage','wizard'].includes(cls))return{w:pick(rng,['staff','wand']),shield:0};
 if(cls==='archer')return{w:'bow',shield:0};
 if(cls==='crossbowman')return{w:'crossbow',shield:0};
 if(cls==='assassin')return{w:'dagger',shield:0};
 if(cls==='rogue')return{w:'throwknife',shield:0};
 return{w:'sword',shield:0};
}
function template(cls,rng){
 const armor=ARMORS[pick(rng,Object.keys(ARMORS))],gear=oldGear(cls,rng);
 return{...armor,...gear,hp:90,maxHp:90,ap:9,maxAp:9,st:100,maxSt:100,mana:['priest','firemage','wizard'].includes(cls)?80:0,maxMana:['priest','firemage','wizard'].includes(cls)?80:0,skill:63,def:6,maxShield:gear.shield};
}
export function basic3v3(orientation='A',seed=1){
 const rng=new SeededRng(seed),classes=[0,1,2].map(()=>pick(rng,CLASS_POOL));
 const specs=classes.map(cls=>({cls,overrides:template(cls,rng)}));
 const flip=orientation==='B',allyPos=flip?RIGHT:LEFT,enemyPos=flip?LEFT:RIGHT;
 const ally=specs.map((s,i)=>createUnit({id:'a'+i,team:'ally',cls:s.cls,q:allyPos[i][0],r:allyPos[i][1],overrides:structuredClone(s.overrides)}));
 const enemy=specs.map((s,i)=>createUnit({id:'e'+i,team:'enemy',cls:s.cls,q:enemyPos[i][0],r:enemyPos[i][1],overrides:structuredClone(s.overrides)}));
 return flip?[...enemy,...ally]:[...ally,...enemy];
}
