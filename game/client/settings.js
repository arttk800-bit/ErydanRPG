export const SETTINGS_KEY='eirdan.settings.v2';
export const LEGACY_KEYS=['eirdan.shell.settings.v1','eirdan.settings'];
export const DEFAULT_SETTINGS=Object.freeze({theme:'dark',volume:70,confirmEndTurn:true,battleSpeed:1});

function get(storage,key){try{return storage?.getItem(key)??null}catch{return null}}
function parse(raw){try{return raw?JSON.parse(raw):{}}catch{return{}}}
function number(value,fallback,min,max){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback}
function normalize(value={}){
 return {
  theme:value.theme==='warm'?'warm':'dark',
  volume:number(value.volume,DEFAULT_SETTINGS.volume,0,100),
  confirmEndTurn:typeof value.confirmEndTurn==='boolean'?value.confirmEndTurn:DEFAULT_SETTINGS.confirmEndTurn,
  battleSpeed:number(value.battleSpeed,DEFAULT_SETTINGS.battleSpeed,0.1,10)
 };
}
export function loadSettings(storage=globalThis.localStorage){
 const raw=get(storage,SETTINGS_KEY);
 if(raw!==null)return normalize(parse(raw));
 const shell=parse(get(storage,LEGACY_KEYS[0])),legacy=parse(get(storage,LEGACY_KEYS[1]));
 const migrated=normalize({
  theme:shell.theme,
  volume:shell.volume??(Number.isFinite(legacy.musicVolume)?Math.round(legacy.musicVolume*100):undefined),
  confirmEndTurn:legacy.confirmEndTurn,
  battleSpeed:legacy.battleSpeed
 });
 saveSettings(migrated,storage);
 return migrated;
}
export function saveSettings(settings,storage=globalThis.localStorage){
 const value=normalize(settings);
 try{storage?.setItem(SETTINGS_KEY,JSON.stringify(value))}catch{}
 return value;
}
export function toggleEndConfirmation(settings){settings.confirmEndTurn=!settings.confirmEndTurn;return settings}
