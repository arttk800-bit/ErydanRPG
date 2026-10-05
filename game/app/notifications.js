let toastTimer=null;
export function createNotifications(root=document){
 const $=selector=>root.querySelector(selector);
 function toast(message){const el=$('#toast');if(!el)return;el.textContent=message;el.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),2200)}
 return {toast,discovery(name){toast('Вы узнали о новом месте: '+(name||'неизвестное место'))}};
}
