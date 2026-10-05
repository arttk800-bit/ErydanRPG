// ============================================================================
// AUDIO CATALOG
// Canonical metadata and semantic contexts for Eirdan music tracks.
// ============================================================================
export const AUDIO_CONTEXT=Object.freeze({WORLD:'world',TRAVEL:'travel',FOREST:'forest',TOWN:'town',INDOOR:'indoor',TAVERN:'tavern',CASTLE:'castle',BATTLE:'battle',ORC:'orc',HUMAN:'human',EVENT:'event'});
const track=(id,assetId,contexts,title)=>Object.freeze({id,assetId,contexts:Object.freeze(contexts),title,loop:true});
export const MUSIC_TRACKS=Object.freeze([
 track('battle-greensleeves','music-battle-greensleeves',['battle'],'Battle Greensleeves'),
 track('forest-frost','music-forest-frost',['forest','travel'],'Forest Frost'),
 track('forest-grenedier','music-forest-grenedier',['forest','travel'],'Forest Grenedier'),
 track('forest-fields','music-forest-fields',['forest','travel'],'Forest Fields'),
 track('town-indoor-hymn','music-town-indoor-hymn',['town','indoor'],'Town Indoor Hymn'),
 track('town-hayfields','music-town-hayfields',['town'],'Town Hayfields'),
 track('town-tower-inn','music-town-tower-inn',['town','tavern','indoor'],'Town Tower Inn'),
 track('town-locust-fields','music-town-locust-fields',['town'],'Town Locust Fields'),
 track('overworld-valley-shadows','music-overworld-valley-shadows',['world','travel'],'Overworld Valley Shadows'),
 track('overworld-mini-adventure','music-overworld-mini-adventure',['world','travel'],'Overworld Mini Adventure'),
 track('castle-chamber-birdseye','music-castle-chamber-birdseye',['castle','indoor'],'Castle Chamber Birdseye'),
 track('castle-crystal','music-castle-crystal',['castle'],'Castle Crystal'),
 track('theme-orcs-march','music-theme-orcs-march',['orc','event'],'Theme Orcs March'),
 track('theme-humans-march','music-theme-humans-march',['human','event'],'Theme Humans March'),
 track('theme-embarking','music-theme-embarking',['event','travel','tavern'],'Embarking — Wenches, Ale, Loot')
]);
export function tracksForContext(context){return MUSIC_TRACKS.filter(track=>track.contexts.includes(context))}
export function trackById(id){return MUSIC_TRACKS.find(track=>track.id===id)||null}
