function hashSeed(value){let h=2166136261>>>0;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0||1}
export class SeededRng{constructor(seed=1){this.s=typeof seed==='number'?(seed>>>0||1):hashSeed(seed)}next(){let x=this.s;x^=x<<13;x^=x>>>17;x^=x<<5;this.s=x>>>0;return this.s/4294967296}int(min,max){if(!Number.isInteger(min)||!Number.isInteger(max)||max<min)throw new Error('Invalid RNG range');return min+Math.floor(this.next()*(max-min+1))}snapshot(){return this.s>>>0}}
export function createRng(seed){return new SeededRng(seed)}
export function nextFloat(stream){return stream.next()}
export function nextInt(stream,min,max){return stream.int(min,max)}
export function createRngSet(seed){return {world:{state:new SeededRng(String(seed)+':world').snapshot()},combat:{state:new SeededRng(String(seed)+':combat').snapshot()},loot:{state:new SeededRng(String(seed)+':loot').snapshot()},simulation:{state:new SeededRng(String(seed)+':simulation').snapshot()}}}
