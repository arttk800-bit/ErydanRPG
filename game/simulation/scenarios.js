import {createUnit} from '../data/unit-factory.js';
const LEFT=[[1,4],[1,5],[1,6]],RIGHT=[[12,2],[12,3],[12,4]];
const CLASSES=['guardian','archer','priest'];

export function basic3v3(orientation='A'){
 const flip=orientation==='B';
 const allyPos=flip?RIGHT:LEFT,enemyPos=flip?LEFT:RIGHT;
 const ally=CLASSES.map((cls,i)=>createUnit({id:'a'+i,team:'ally',cls,q:allyPos[i][0],r:allyPos[i][1]}));
 const enemy=CLASSES.map((cls,i)=>createUnit({id:'e'+i,team:'enemy',cls,q:enemyPos[i][0],r:enemyPos[i][1]}));
 // Mirror must reverse initiative together with battlefield orientation.
 // Otherwise ally always occupies order slots 0..2 and enemy 3..5 in both halves.
 return flip?[...enemy,...ally]:[...ally,...enemy];
}
