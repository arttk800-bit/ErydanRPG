import assert from 'node:assert/strict';
import {DEFAULT_SETTINGS,SETTINGS_KEY,loadSettings,toggleEndConfirmation} from '../game/client/settings.js';
function storage(seed={}){const data=new Map(Object.entries(seed));return{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),value:k=>data.get(k)}}
const s={...DEFAULT_SETTINGS};assert.equal(s.confirmEndTurn,true);toggleEndConfirmation(s);assert.equal(s.confirmEndTurn,false);
const old=storage({'eirdan.shell.settings.v1':JSON.stringify({theme:'warm',volume:63}),'eirdan.settings':JSON.stringify({confirmEndTurn:false,musicVolume:.22,battleSpeed:2})});
const migrated=loadSettings(old);assert.equal(migrated.theme,'warm');assert.equal(migrated.volume,63);assert.equal(migrated.confirmEndTurn,false);assert.equal(migrated.battleSpeed,2);assert.ok(old.value(SETTINGS_KEY));
const musicOnly=storage({'eirdan.settings':JSON.stringify({musicVolume:.22})});assert.equal(loadSettings(musicOnly).volume,22);
console.log('settings + legacy migration: OK');

const bad={getItem(){throw new Error('denied')},setItem(){throw new Error('denied')}};
assert.deepEqual(loadSettings(bad),DEFAULT_SETTINGS);
assert.doesNotThrow(()=>saveSettings(DEFAULT_SETTINGS,bad));
