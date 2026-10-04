export function mapPoint(frame,x,y){const r=frame.getBoundingClientRect(),u=(x-r.left)/r.width,v=(y-r.top)/r.height;return{x:Math.max(0,Math.min(1,u)),y:Math.max(0,Math.min(1,v))}}
