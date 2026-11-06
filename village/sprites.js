/* The approved PILAF artwork, shared with portraits and orchestra. */
(() => {
 const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
 window.PilafSprites={draw(ctx,id,x,y,{scale=1,time=0,bpm=100,moving=false,speed=moving?1:0,stride,face=1,dance=false,performing=dance,still=false,state}={}) {
  return PilafCharacters.draw(ctx,id,x,y,(id==='shrimp'?66:82)*scale,{
   time,bpm,moving,speed:Math.max(0,Math.min(1,speed)),stride,face,
   performing,state:state||(moving?'walk':performing?'play':'idle'),
   still:still||motionPreference.matches,
   hit:dance?Math.max(0,Math.sin(time*3))* .85:0,
  });
 }};
})();
