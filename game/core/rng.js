export class SeededRng{constructor(seed=1){this.s=seed>>>0||1;}next(){let x=this.s;x^=x<<13;x^=x>>>17;x^=x<<5;this.s=x>>>0;return this.s/4294967296;}}
