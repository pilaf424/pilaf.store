/* Neighbors drawn from the refined PILAF collection. */
(() => {
 const entries=[
  ['onigiri','Onigiri Listener','The welcoming committee',615,650,'I brought enough headphones for one rice ball. But there is always room beside me to listen. Crane has the invitations, just across the path.'],
  ['cat','Cat Nap Keyboard','Afternoon piano, mostly asleep',975,425,'I was practicing a very quiet chord. Then I fell asleep on it. I think the chord enjoyed the company.'],
  ['fox','Fox Pocket Sampler','Collector of tiny sounds',1240,555,'Today’s samples: a kettle, a leaf, and Tanuki saying “where did I put that?” That last one is becoming a whole album.'],
  ['axolotl','Axolotl Ribbon Slide','The pond’s ribbon dancer',125,440,'The fish think my ribbons are very long fins. I haven’t had the heart to correct them.'],
  ['daruma','Daruma Pendulum','Keeper of a very gentle tempo',485,480,'Tick. Tock. Some days the most musical thing you can do is slow down.'],
  ['mushroom','Mushroom Synth Garden','A small patch of harmony',365,920,'A cluster of mushrooms hums three soft notes. The smallest one is trying very hard to reach the high part.'],
  ['origami','Origami Mixer Bird','Folding the sound together',930,345,'A little more melody, a little less rustle. There. Every friend deserves a place in the mix.'],
  ['lion','Little Lion Bass','A warm, rumbly bass player',905,935,'I can roar, of course. But a good bass note makes the flowers wobble without frightening anybody.'],
  ['musubi','Cable Musubi','Helpful, if a little tangled',1210,725,'I connected the kettle to the doorbell again. It was an excellent breakfast concert.'],
  ['firefly','Circuit Firefly','The first light of the evening',400,180,'A little light blinks back at you. Once. Twice. It seems to be keeping time with the village.'],
  ['scope','Oscilloscope Smile','A face for every frequency',1100,860,'Your voice looks lovely on my little screen. Especially when you say hello.'],
  ['fuzz','Fuzz Pedal Critter','Soft friend, fuzzy sounds',590,850,'People expect me to be loud. Actually, I just like making tiny sounds a little fluffier.'],
  ['trio','Transistor Trio','Three friends, one conversation',705,950,'“We should start a trio.” “We are a trio.” “Then we’re already doing wonderfully.”']
 ];
 const entities=entries.map(([id,name,role,x,y,dialogue])=>({id,name,role,x,y,dialogue,kind:'resident:'+id,ambient:true}));
 const images=new Map();
 for(const e of entities){const image=new Image();image.src='assets/residents/'+e.id+'.svg';images.set(e.id,image);}
 function draw(ctx,id,x,y,{scale=1,time=0,still=false}={}){
  const image=images.get(id);if(!image?.complete||!image.naturalWidth)return false;
  const size=(id==='trio'?104:82)*scale,ratio=image.naturalWidth/image.naturalHeight;
  const w=ratio>1?size:size*ratio,h=ratio>1?size/ratio:size;
  const bob=still?0:Math.sin(time*1.6+id.length)*1.3;
  ctx.save();ctx.translate(x,y+bob);if(!still&&id==='firefly'){ctx.fillStyle='#f3dea83a';ctx.beginPath();ctx.ellipse(0,-h/2,45,45,0,0,Math.PI*2);ctx.fill();}ctx.drawImage(image,-w/2,-h,w,h);ctx.restore();return true;
 }
 window.VillageResidents={entities,images,draw};
})();
