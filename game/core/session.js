import {createGameState} from './state.js';
export const SAVE_VERSION=1;
export function createSession({seed=Date.now(),worldName='Новый мир'}={}){return createGameState({seed,worldName})}
