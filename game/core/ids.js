const FALLBACK_PREFIX=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);
export function createId(kind='entity'){
 const token=globalThis.crypto?.randomUUID?.()||FALLBACK_PREFIX();
 return kind+'_'+token;
}
export function isId(value,kind){return typeof value==='string'&&value.startsWith(kind+'_')&&value.length>kind.length+1}
