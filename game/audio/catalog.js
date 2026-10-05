// ============================================================================
// AUDIO CATALOG
// Canonical metadata and semantic contexts for Eirdan music tracks.
// ============================================================================
export const AUDIO_CONTEXT=Object.freeze({WORLD:'world',TRAVEL:'travel',FOREST:'forest',TOWN:'town',INDOOR:'indoor',TAVERN:'tavern',CASTLE:'castle',BATTLE:'battle',ORC:'orc',HUMAN:'human',EVENT:'event'});
const track=(id,path,contexts,title)=>Object.freeze({id,path,contexts:Object.freeze(contexts),title,loop:true});
export const MUSIC_TRACKS=Object.freeze([
 track('battle-greensleeves','../assets/audio/battle/greensleeves.mp3',['battle'],'Battle Greensleeves'),
 track('forest-frost','../assets/audio/forest/frost.mp3',['forest','travel'],'Forest Frost'),
 track('forest-grenedier','../assets/audio/forest/grenedier.mp3',['forest','travel'],'Forest Grenedier'),
 track('forest-fields','../assets/audio/forest/fields.mp3',['forest','travel'],'Forest Fields'),
 track('town-indoor-hymn','../assets/audio/town/indoor-hymn.mp3',['town','indoor'],'Town Indoor Hymn'),
 track('town-hayfields','../assets/audio/town/hayfields.mp3',['town'],'Town Hayfields'),
 track('town-tower-inn','../assets/audio/town/tower-inn.mp3',['town','tavern','indoor'],'Town Tower Inn'),
 track('town-locust-fields','../assets/audio/town/locust-fields.mp3',['town'],'Town Locust Fields'),
 track('overworld-valley-shadows','../assets/audio/overworld/valley-shadows.mp3',['world','travel'],'Overworld Valley Shadows'),
 track('overworld-mini-adventure','../assets/audio/overworld/mini-adventure.mp3',['world','travel'],'Overworld Mini Adventure'),
 track('castle-chamber-birdseye','../assets/audio/castle/chamber-birdseye.mp3',['castle','indoor'],'Castle Chamber Birdseye'),
 track('castle-crystal','../assets/audio/castle/crystal.mp3',['castle'],'Castle Crystal'),
 track('theme-orcs-march','../assets/audio/themes/orcs-march.mp3',['orc','event'],'Theme Orcs March'),
 track('theme-humans-march','../assets/audio/themes/humans-march.mp3',['human','event'],'Theme Humans March'),
 track('theme-embarking','../assets/audio/themes/embarking.mp3',['event','travel','tavern'],'Embarking — Wenches, Ale, Loot')
]);
export function tracksForContext(context){return MUSIC_TRACKS.filter(track=>track.contexts.includes(context))}
export function trackById(id){return MUSIC_TRACKS.find(track=>track.id===id)||null}
