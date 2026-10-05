import {warmAssets} from './asset-cache.js';
export async function preloadStartupAssets({onProgress}={}){return warmAssets({startupOnly:true,onProgress})}
