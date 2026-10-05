export const SETTINGS_KEY='eirdan.settings.v2';
export const LEGACY_KEYS=['eirdan.shell.settings.v1','eirdan.settings'];
export const DEFAULT_SETTINGS={theme:'dark',volume:70,confirmEndTurn:true,battleSpeed:1};
function read(storage,key){try{return JSON.parse(storage.getItem(key)||'{}')}catch{return{}}}
export function loadSettings(storage=localStorage){const current=read(storage,SETTINGS_KEY);if(storage.getItem(SETTINGS_KEY))return{...DEFAULT_SETTINGS,...current};const shell=read(storage,LEGACY_KEYS[0]),legacy=read(storage,LEGACY_KEYS[1]);const migrated={...DEFAULT_SETTINGS,...legacy,...shell};if(Number.isFinite(legacy.musicVolume)&&shell.volume==null)migrated.volume=Math.round(legacy.musicVolume*100);saveSettings(migrated,storage);return migrated}
export function saveSettings(settings,storage=localStorage){storage.setItem(SETTINGS_KEY,JSON.stringify(settings));return settings}
export function toggleEndConfirmation(settings){settings.confirmEndTurn=!settings.confirmEndTurn;return settings}
