const SCREEN_IDS={main:'screen-main',game:'screen-game',settings:'screen-settings'};
export class Navigation{
 constructor(root=document){this.root=root;this.stack=['main'];}
 current(){return this.stack.at(-1);}
 show(name,{push=true}={}){if(!SCREEN_IDS[name])throw new Error('Unknown screen: '+name);for(const id of Object.values(SCREEN_IDS))this.root.getElementById(id)?.classList.add('hidden');this.root.getElementById(SCREEN_IDS[name])?.classList.remove('hidden');if(push&&this.current()!==name)this.stack.push(name);return name;}
 back(){if(this.stack.length>1)this.stack.pop();return this.show(this.current(),{push:false});}
 reset(name='main'){this.stack=[name];return this.show(name,{push:false});}
}