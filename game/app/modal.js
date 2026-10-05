export class ModalController{
 constructor({root=document,onOpen,onClose}={}){this.root=root;this.onOpen=onOpen;this.onClose=onClose;this.opened=false}
 $(selector){return this.root.querySelector(selector)}
 isOpen(){return this.opened}
 close(){if(!this.opened)return;this.opened=false;this.$('#modal')?.classList.add('hidden');this.onClose?.()}
 show(title,body,actions=[['Закрыть',()=>this.close()]]){this.opened=true;this.$('#modalTitle').textContent=title;this.$('#modalBody').innerHTML=body;const box=this.$('#modalActions');box.replaceChildren();for(const [label,fn] of actions){const button=document.createElement('button');button.textContent=label;button.onclick=fn;box.append(button)}this.$('#modal').classList.remove('hidden');this.onOpen?.()}
}
