/* The approved PILAF artwork, shared with portraits and orchestra. */
(() => {
 const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
 window.PilafSprites={draw(ctx,id,x,y,{scale=1,time=0,moving=false,face=1,dance=false}={}) {
  return PilafCharacters.draw(ctx,id,x,y,(id==='shrimp'?66:82)*scale,{
   time,moving,still:motionPreference.matches,
   face:['shrimp','crane','origami'].includes(id)?face:1,
   hit:dance?Math.max(0,Math.sin(time*3))* .85:0,
  });
 }};
})();
