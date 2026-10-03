export class GameState{
  constructor(seed=0){
    this.seed=seed>>>0;
    this.round=1;
    this.turnIndex=0;
    this.units=[];
    this.order=[];
    this.over=false;
    this.result=null;
    this.lastBattleSnapshot=null;
  }
}
