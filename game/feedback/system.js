// ============================================================================
// FEEDBACK SYSTEM
// Owns feedback validation and delegates delivery to interchangeable transports.
// ============================================================================
export const FeedbackSystem={
 validate(input){
  const errors=[];
  if(!['bug','suggestion'].includes(input?.type))errors.push('Не выбран тип обращения');
  if(!input?.title?.trim())errors.push('Укажите заголовок');
  if(!input?.text?.trim())errors.push('Добавьте описание');
  const images=Array.from(input?.screenshots||[]);
  if(images.some(f=>!String(f.type||'').startsWith('image/')))errors.push('Можно прикладывать только изображения');
  if(images.length>6)errors.push('Можно приложить не более 6 изображений');
  if(images.reduce((n,f)=>n+(f.size||0),0)>25*1024*1024)errors.push('Изображения должны занимать не более 25 МБ');
  return{ok:errors.length===0,errors};
 },
 async deliver(pkg,transport){if(!transport?.send)throw new Error('Feedback transport unavailable');return transport.send(pkg)}
};
