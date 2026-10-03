// Exact alpha14p RNG semantics.
export const GameRNG={
 seed:0xE1D4A11D>>>0,state:0xE1D4A11D>>>0,calls:0,
 setSeed(seed){this.seed=(Number(seed)>>>0)||1;this.state=this.seed;this.calls=0;return this.seed},
 random(){let t=this.state+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);this.state=t>>>0;this.calls++;return((t^t>>>14)>>>0)/4294967296}
};
export const pick=a=>a[Math.floor(GameRNG.random()*a.length)];
export const ri=(a,b)=>Math.floor(GameRNG.random()*(b-a+1))+a;
