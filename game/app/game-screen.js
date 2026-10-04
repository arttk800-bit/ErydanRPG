import {WorldUI} from '../ui/world.js';
export function mountGameScreen(state,onChange){
 const root=document.querySelector('#worldRoot');
 if(!root||!state)return ()=>{};
 return WorldUI.mount(root,state,onChange);
}
