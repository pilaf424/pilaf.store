/* Articulated game cast. Gallery masters stay in character-art.js.
   Rigs use a common 100-unit canvas with the ground at y=0. */
(() => {
  'use strict';
  const art=window.PilafCharacterArt;
  const INK='#26322e';
  const C={cream:'#fff5de',copper:'#c78256',purple:'#b9a4c6',sage:'#94b9a7',teal:'#599f9b',gold:'#e8c46a',coral:'#df9b85',blue:'#91b9c8',brown:'#9e7256'};
  const sourceCache=new Map(),partCache=new Map();
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function sourcePaths(id){
    if(sourceCache.has(id))return sourceCache.get(id);
    const paths=art[id].paths.map(p=>{
      const path=new Path2D();let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
      for(const ring of p.rings){
        for(let i=1;i<ring.length;i+=2){const x=ring[i],y=ring[i+1];if(i===1)path.moveTo(x,y);else path.lineTo(x,y);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
        if(ring[0])path.closePath();
      }
      return {...p,path,bounds:[x0,y0,x1,y1]};
    });sourceCache.set(id,paths);return paths;
  }
  function paintSource(ctx,p){if(p.fill!=='none'){ctx.fillStyle=p.fill;ctx.fill(p.path,p.rule);}if(p.stroke!=='none'){ctx.strokeStyle=p.stroke;ctx.lineWidth=p.width;ctx.stroke(p.path);}}
  function sourcePart(ctx,id,indices,cx,cy,width,angle=0){
    const key=id+':'+indices.join(',');let part=partCache.get(key);
    if(!part){const paths=sourcePaths(id),selected=indices.map(i=>paths[i]).filter(Boolean);const bounds=[Infinity,Infinity,-Infinity,-Infinity];for(const p of selected){bounds[0]=Math.min(bounds[0],p.bounds[0]);bounds[1]=Math.min(bounds[1],p.bounds[1]);bounds[2]=Math.max(bounds[2],p.bounds[2]);bounds[3]=Math.max(bounds[3],p.bounds[3]);}part={selected,bounds};partCache.set(key,part);}
    const [x0,y0,x1,y1]=part.bounds;if(!Number.isFinite(x0)||x1===x0)return;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);ctx.scale(width/(x1-x0),width/(x1-x0));ctx.translate(-(x0+x1)/2,-(y0+y1)/2);for(const p of part.selected)paintSource(ctx,p);ctx.restore();
  }
  function oval(ctx,x,y,rx,ry,fill,stroke=INK,width=1){ctx.beginPath();ctx.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);if(fill&&fill!=='none'){ctx.fillStyle=fill;ctx.fill();}if(stroke&&stroke!=='none'){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
  function shape(ctx,d,fill,stroke=INK,width=1){const path=new Path2D(d);if(fill&&fill!=='none'){ctx.fillStyle=fill;ctx.fill(path);}if(stroke&&stroke!=='none'){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke(path);}}
  function line(ctx,points,color=INK,width=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function joint(ctx,points,fill,width=5){line(ctx,points,INK,width+1.8);line(ctx,points,fill,width);}
  function box(ctx,x,y,w,h,r,fill,stroke=INK,width=1){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill&&fill!=='none'){ctx.fillStyle=fill;ctx.fill();}if(stroke&&stroke!=='none'){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
  function face(ctx,x,y,scale,p){
    const open=1-(p.blink||0);oval(ctx,x-4*scale,y,1.05*scale,Math.max(.2,1.6*open)*scale,INK,null);oval(ctx,x+4*scale,y,1.05*scale,Math.max(.2,1.6*open)*scale,INK,null);
    if(p.play&&p.singing>.08)oval(ctx,x,y+5*scale,1.8*scale,(1.2+p.singing)*scale,INK,null);
    else shape(ctx,`M${x-2*scale} ${y+4*scale} Q${x} ${y+6.5*scale} ${x+2*scale} ${y+4*scale}`,null,INK,.8*scale);
  }
  // Two-bone IK: elbows and knees bend while paws stay on their targets.
  function bendJoint(a,b,upper,lower,bend=1){
    const dx=b[0]-a[0],dy=b[1]-a[1],d=clamp(Math.hypot(dx,dy),.001,upper+lower-.001),u=Math.atan2(dy,dx),cos=clamp((upper*upper+d*d-lower*lower)/(2*upper*d),-1,1),angle=u+bend*Math.acos(cos);
    return [a[0]+Math.cos(angle)*upper,a[1]+Math.sin(angle)*upper];
  }
  function makePose(id,options={}){
    const still=!!options.still,time=still?0:(Number.isFinite(options.time)?options.time:0),speed=still?0:clamp(Number.isFinite(options.speed)?options.speed:1,0,1);
    const walk=!still&&(options.state==='walk'||options.moving===true)&&speed>.01;
    const play=!still&&!walk&&(options.state==='play'||options.performing===true||options.hit>0||options.singing>0);
    const phase=id.length*.73,beat=time*(options.bpm||100)/60*Math.PI*2;
    const cycle=still?0:(Number.isFinite(options.stride)?options.stride:time*(6+speed*3));
    const blinkPhase=(time+phase)%4.7,blink=still?0:Math.max(0,1-Math.abs(blinkPhase-4.48)/.11);
    const p={time,still,walk,play,speed,cycle,beat,hit:still?0:clamp(options.hit||0,0,1),singing:still?0:clamp(options.singing||0,0,1),vowel:options.vowel||'ah',sway:still?0:Math.sin(time*1.8+phase),breath:still?0:Math.sin(time*2+phase),blink};
    p.step=(side,index=0)=>{
      if(!walk)return {x:0,y:0,planted:true};
      const t=((cycle/(Math.PI*2)+(side<0?.5:0)+index*.17)%1+1)%1,reach=7*(.65+speed*.35);
      if(t<.6)return {x:reach*(1-2*t/.6),y:0,planted:true};
      const swing=(t-.6)/.4,ease=swing*swing*(3-2*swing);
      return {x:reach*(-1+2*ease),y:-6*Math.sin(swing*Math.PI),planted:false};
    };return p;
  }
  const CAT_HEAD=[2,16,22,23,24,25,26,29,30,31,32,33,34,35,36,37,38];
  function keyboard(ctx,x,y,angle){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    box(ctx,-25,-8,50,16,2.7,C.purple,INK,1.2);box(ctx,-21,-5.5,36,10.5,.8,C.cream,INK,.7);
    for(let i=1;i<9;i++)line(ctx,[[-21+i*4,-5.3],[-21+i*4,4.8]],INK,.55);
    for(const i of [1,2,4,5,6,8])box(ctx,-22+i*4,-5.3,2.2,5.8,.3,INK,null);
    oval(ctx,20,-3,1.3,1.3,C.gold,INK,.6);oval(ctx,20,2,1.3,1.3,C.sage,INK,.6);ctx.restore();
  }
  function catPaw(ctx,x,y,r=4){oval(ctx,x,y,r,r*.88,C.copper,INK,.9);line(ctx,[[x-1.2,y+1.3],[x-1.2,y+2.5]],INK,.55);line(ctx,[[x+1.1,y+1.3],[x+1.1,y+2.5]],INK,.55);}
  function drawCat(ctx,p){
    const lean=p.walk?Math.sin(p.cycle)*.6:p.sway*.45,hipY=-28,headY=-76+p.breath*.45;
    const tail=p.sway*4+(p.walk?Math.sin(p.cycle-1)*2:0);
    shape(ctx,`M10 -34 C27 -32 ${37+tail} -44 ${31+tail} -54 C${26+tail} -64 ${19+tail} -55 ${25+tail} -51`,null,INK,7.6);
    shape(ctx,`M10 -34 C27 -32 ${37+tail} -44 ${31+tail} -54 C${26+tail} -64 ${19+tail} -55 ${25+tail} -51`,null,C.copper,5.6);
    for(const side of [1,-1]){
      const step=p.step(side),hip=[side*8+lean,hipY],foot=[side*10+step.x,-3+step.y],knee=bendJoint(hip,foot,13,14,side<0?1:-1);
      joint(ctx,[hip,knee,foot],side>0?'#b9825b':C.copper,8);oval(ctx,foot[0]+1,foot[1],6,3,C.copper,INK,1);
      line(ctx,[[foot[0]+3,foot[1]],[foot[0]+3,foot[1]+1.7]],INK,.65);
    }
    shape(ctx,`M${-10+lean} -62 Q${-20+lean} -52 ${-15+lean} -37 Q${-15+lean} -25 ${lean} -24 Q${16+lean} -25 ${15+lean} -38 L${12+lean} -60 Z`,C.copper,INK,1.2);
    oval(ctx,lean,-42,8.5,11.5,'#e7b892',null);
    const leftShoulder=[-13+lean,-57],rightShoulder=[13+lean,-57];
    const keyAngle=p.play?-.07:.72+p.sway*.015,keyPos=p.play?[1+lean,-39+p.hit*.7]:[18+lean,-40];
    if(!p.play){
      const swing=p.walk?Math.sin(p.cycle)*6:p.sway*.65,hand=[-19+lean+swing,-32-Math.max(0,swing)*.35];
      joint(ctx,[leftShoulder,bendJoint(leftShoulder,hand,14,14,1),hand],C.copper,7);catPaw(ctx,...hand);
      joint(ctx,[rightShoulder,[30+lean,-45]],'#b9825b',7);
    }
    keyboard(ctx,...keyPos,keyAngle);
    if(p.play){
      const tapL=p.hit*2.2,tapR=(.5+.5*Math.sin(p.beat+1.8))*p.hit*2.2;
      const left=[-10+lean,-40+tapL],right=[10+lean,-41+tapR];
      joint(ctx,[leftShoulder,[-24+lean,-45],left],C.copper,7);joint(ctx,[rightShoulder,[26+lean,-43],right],C.copper,7);catPaw(ctx,...left,3.6);catPaw(ctx,...right,3.6);
    }else{const grip=[24+lean,-34];joint(ctx,[[30+lean,-45],grip],C.copper,7);catPaw(ctx,...grip,4);}
    ctx.save();ctx.translate(-3+lean,headY);ctx.rotate(p.sway*.025+(p.play?p.hit*.035:0));sourcePart(ctx,'cat',CAT_HEAD,0,0,46);
    for(const [x,y] of [[-5.1,3],[11.8,3]]){if(p.blink>.3)shape(ctx,`M${x-3} ${y} Q${x} ${y+2} ${x+3} ${y}`,null,INK,.9);else oval(ctx,x,y,1.15,1.6*(1-p.blink),INK,null);}ctx.restore();return true;
  }

// Insert inside the shared renderer closure, after its drawing helpers.
// Limbs have their own joints; instrument groups remain rigid and grounded.
function bandLegs(ctx,p,color,{hip=-23,spread=11,foot=6.5,right=color}={}){
 for(const side of [-1,1]){
  const s=p.step(side),x=side*spread+s.x,y=-3+s.y,fill=side<0?color:right;
  joint(ctx,[[side*spread,hip],[side*spread+s.x*.42,(hip-3)/2+s.y*.35],[x,y-1]],fill,6.5);
  oval(ctx,x+side*.9,y,foot,3.2,fill);
  line(ctx,[[x+side*2,y+.1],[x+side*2,y+1.8]],INK,.65);
 }
}
function bandArm(ctx,sx,sy,hx,hy,color,side,width=6){
 const ex=(sx+hx)*.5+side*4,ey=(sy+hy)*.5+4;
 joint(ctx,[[sx,sy],[ex,ey],[hx,hy]],color,width);
 oval(ctx,hx,hy,width*.62,width*.5,color);
}
function bandBlink(ctx,x,y,spacing,p,color=INK){
 for(const side of [-1,1]){
  if(p.blink>.5)line(ctx,[[x+side*spacing-1.8,y],[x+side*spacing+1.8,y]],color,1.2);
  else oval(ctx,x+side*spacing,y,1.5,1.8,color,null);
 }
}
function drawBand(ctx,id,p){
 const walking=p.walk?Math.sin(p.cycle)*p.speed:0;
 const gesture=p.play&&!p.still?Math.sin(p.beat):0;
 const nod=p.sway*.025+p.hit*.035;
 switch(id){
 case 'onigiri':{
  bandLegs(ctx,p,C.cream,{hip:-24,spread:12});
  const left=p.play?[-31,-58]:[-35-walking*2,-33+walking*7];
  const right=p.play?[31,-58+p.hit*2]:[35-walking*2,-33-walking*7];
  bandArm(ctx,-26,-47,...left,C.cream,-1,5.5);
  bandArm(ctx,26,-47,...right,C.cream,1,5.5);
  // Keep the rice triangle, copper headphones, nori pouch and original face.
  sourcePart(ctx,id,[0,1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27],0,-57,71,nod);
  if(p.play){oval(ctx,...left,3.4,3.6,C.cream);oval(ctx,...right,3.4,3.6,C.cream);}
  shape(ctx,`M 31 -39 C 43 -34 ${36+p.sway*2} -15 22 -14`,null,INK,1);
  box(ctx,18,-16,7,3.6,1,C.gold);line(ctx,[[18,-14.2],[15,-14.2]],INK,1);
  return true;
 }
 case 'rabbit':{
  // A crescent worn behind the shoulders preserves Moon Rabbit's silhouette.
  sourcePart(ctx,id,[2,10,11,12],-15,-59,35,p.sway*.018);
  oval(ctx,-17,-26,6,6,C.cream);
  bandLegs(ctx,p,C.cream,{hip:-21,spread:9,foot:7});
  oval(ctx,0,-34,16,22+p.breath*.35,C.cream);
  // Separate ears flex at their bases rather than stretching the whole face.
  for(const side of [-1,1]){
   ctx.save();ctx.translate(side*8,-72);ctx.rotate(side*.13+p.sway*.055+(p.walk?walking*.025:0));
   oval(ctx,0,-13,4.7,16,C.cream);line(ctx,[[0,-24],[0,-6]],C.coral,1.2);ctx.restore();
  }
  oval(ctx,0,-64,18,15,C.cream);
  sourcePart(ctx,id,[19,20,21,22,23,24,25],0,-61.5,26,nod);
  if(p.blink>.5){oval(ctx,-7.5,-65,2,2,C.cream,null);oval(ctx,7.5,-65,2,2,C.cream,null);bandBlink(ctx,0,-65,7.5,p);}
  // The theremin rests on a shoulder strap; the aerial never bends.
  line(ctx,[[-8,-48],[20,-28]],C.gold,2);
  sourcePart(ctx,id,[4,6,33,34,35,36],22,-29,29);
  line(ctx,[[39,-35],[39,-72]],INK,1.25);oval(ctx,39,-73,2.2,2.2,C.gold);
  const hand=p.play?[28+gesture*3,-52-p.hit*6]:[26,-36];
  bandArm(ctx,13,-44,...hand,C.cream,1,5.5);
  bandArm(ctx,-13,-44,p.play?-5:-21,p.play?-31+p.hit*2:-30+walking*7,C.cream,-1,5.5);
  if(p.play)line(ctx,[[hand[0]+3,hand[1]-2],[hand[0]+5,hand[1]-4]],INK,.7);
  return true;
 }
 case 'fox':{
  sourcePart(ctx,id,[2,4,16,17,18,19],30,-39,23,p.sway*.10);
  bandLegs(ctx,p,C.copper,{hip:-22,spread:11});
  oval(ctx,0,-37,18,23+p.breath*.35,C.copper);
  shape(ctx,'M -11 -54 Q 0 -45 11 -54 L 7 -34 Q 0 -28 -7 -34 Z',C.cream,null);
  sourcePart(ctx,id,[0,23,24,25,26,27,28,29,30,31],0,-73,53,nod);
  line(ctx,[[-13,-51],[16,-24]],'#644e43',2);
  sourcePart(ctx,id,[1,5,10,11,12,13,32,33,34,35,36,37,38,39,40,41,42,43],0,-29,46);
  bandArm(ctx,-17,-45,-23,-31,C.copper,-1);
  const hand=p.play?[8+gesture*5,-30+p.hit*2]:[27,-29-walking*7];
  bandArm(ctx,17,-45,...hand,C.copper,1);
  if(p.play){line(ctx,[[hand[0]-1,hand[1]+2],[hand[0]-1,hand[1]+4]],INK,.7);}
  return true;
 }
 case 'axolotl':{
  const rose='#995166',gill='#b86b5b';
  sourcePart(ctx,id,[3,37,38,39],19,-22,43,p.sway*.075);
  bandLegs(ctx,p,rose,{hip:-21,spread:10,foot:6});
  oval(ctx,0,-37,17,22+p.breath*.4,rose);
  // Each feathery gill has its own pivot at the cheek.
  const gills=[[[5,13,14,19],-30,-83,16,-1],[[6,15,16,20],-34,-68,19,-1],[[9,11,17,18,21],-30,-55,16,-1],
   [[4,22,23,28],30,-83,16,1],[[7,24,25,29],34,-68,19,1],[[8,12,26,27,30],30,-55,16,1]];
  for(let i=0;i<gills.length;i++){const [indices,x,y,w,side]=gills[i];sourcePart(ctx,id,indices,x,y,w,side*(p.sway*.08+gesture*.04));}
  sourcePart(ctx,id,[1,31,32,33,34],0,-69,47,nod);
  sourcePart(ctx,id,[2,40,41,42,44,45],0,-30,53);
  const slider=p.play?gesture*15:0;
  oval(ctx,slider,-30,2.5,2.5,C.gold);
  bandArm(ctx,-15,-46,-25,-33,rose,-1,5.5);
  bandArm(ctx,15,-46,p.play?slider:26,p.play?-31:-34-walking*6,rose,1,5.5);
  return true;
 }
 case 'tanuki':{
  const fur='#87644e';
  sourcePart(ctx,id,[9,10,13,14,33,34,35,36],30,-35,19,p.sway*.11);
  bandLegs(ctx,p,fur,{hip:-21,spread:11});
  oval(ctx,0,-37,20,22+p.breath*.35,fur);
  oval(ctx,0,-35,12,16,C.cream,null);
  sourcePart(ctx,id,[0,2,3,4,5,6,27,28,29,30,31,32,42,43,44,45,46,47,48,49,50,51,52,53],0,-72,56,nod);
  line(ctx,[[-15,-50],[17,-25]],C.gold,2);
  sourcePart(ctx,id,[1,11,12,15,21,22,23,24,26,56,57,58,59,60,61,62,63,64,65,66,67,68,69],0,-28,46);
  bandArm(ctx,-19,-44,-24,-31,fur,-1,6.5);
  const hand=p.play?[13,-28+p.hit*2]:[27,-31-walking*6];
  bandArm(ctx,19,-44,...hand,fur,1,6.5);
  if(p.play){oval(ctx,hand[0],hand[1],2.2,2,C.cream);line(ctx,[[hand[0],hand[1]],[hand[0]+Math.cos(p.beat)*2,hand[1]+Math.sin(p.beat)*2]],INK,.8);}
  return true;
 }
 case 'daruma':{
  const red='#b86b5b';
  bandLegs(ctx,p,red,{hip:-20,spread:12,foot:6});
  bandArm(ctx,-24,-45,-32-walking*2,-27+walking*5-gesture*3,red,-1,5.5);
  bandArm(ctx,24,-45,32-walking*2,-27-walking*5+gesture*3,red,1,5.5);
  sourcePart(ctx,id,[0,1,2,3,4,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,30,31,32,33,34,35,36,37,38,39,40],0,-50,58);
  // The metronome pendulum is a real pivot, separate from its dial and shell.
  const angle=p.still?-.15:Math.sin(p.beat)*(p.play?.55:.20);
  ctx.save();ctx.translate(0,-26.6);ctx.rotate(angle);
  line(ctx,[[0,0],[0,-19]],INK,1.3);box(ctx,-3,-16,6,7,.4,C.cream);ctx.restore();
  oval(ctx,0,-26.6,2.4,2.4,C.gold);oval(ctx,0,-26.6,.7,.7,INK,null);
  return true;
 }
 case 'robot':{
  // Segmented legs, copper hinge joints and broad cream shoes.
  for(const side of [-1,1]){
   const s=p.step(side),x=side*12+s.x,y=-3+s.y;
   joint(ctx,[[side*11,-22],[side*12+s.x*.4,-12+s.y*.4],[x,y]],side<0?C.coral:C.gold,5.7);
   oval(ctx,side*12+s.x*.4,-12+s.y*.4,2.6,2.6,C.copper);
   box(ctx,x-6.5,y-2,13,5,2,C.cream);
  }
  box(ctx,-5,-60,10,12,1,C.copper);
  sourcePart(ctx,id,[1,12,13,14,15,16,17,18,19,23,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51],0,-36,45);
  sourcePart(ctx,id,[0,2,8,26,27,28,29,30,31,32,33,34],0,-73,55,nod);
  line(ctx,[[0,-88],[5+p.sway*2,-96]],INK,1.2);oval(ctx,5+p.sway*2,-96,2.7,2.7,C.gold);
  for(const side of [-1,1]){
   const hx=p.play?(side<0?-31:8+gesture*5):side*33-walking*2;
   const hy=p.play?(side<0?-59-p.hit*5:-35+p.hit*2):-35-side*walking*9;
   const ex=side*32,ey=-40+(p.play?gesture*2:side*walking*3);
   joint(ctx,[[side*23,-45],[ex,ey],[hx,hy]],C.copper,5.5);oval(ctx,ex,ey,2.7,2.7,C.gold);
   line(ctx,[[hx-3,hy-3],[hx-3,hy+2],[hx+3,hy+2],[hx+3,hy-3]],INK,3.2);
   line(ctx,[[hx-3,hy-3],[hx-3,hy+2],[hx+3,hy+2],[hx+3,hy-3]],C.copper,1.7);
  }
  return true;
 }
 case 'lion':{
  const gold='#d3aa61';
  shape(ctx,`M -15 -23 C -32 -12 -22 -46 ${-36+p.sway*2} -35`,null,gold,5);
  oval(ctx,-36+p.sway*2,-35,4.2,5,C.copper);
  bandLegs(ctx,p,C.cream,{hip:-22,spread:12,foot:7});
  oval(ctx,0,-37,20,24+p.breath*.35,gold);oval(ctx,0,-34,12,17,C.cream,null);
  sourcePart(ctx,id,[0,1,6,31,36,37,38,39,40,41,42,43,44,45,46],-2,-72,61,nod);
  line(ctx,[[-15,-51],[15,-23]],C.brown,2.2);
  // A rigid little bass. Only the plucking paw and fretting fingers move.
  ctx.save();ctx.translate(0,-30);ctx.rotate(-.45);
  shape(ctx,'M -8 -11 C -15 -16 -21 -9 -18 -3 C -28 5 -18 15 -9 12 C 0 18 10 10 4 3 C 10 -7 3 -13 -3 -9 Q -5 -5 -8 -11 Z','#995166');
  box(ctx,-6,-4.5,42,8,1,C.copper);box(ctx,33,-6,10,12,1,C.copper);
  for(let i=0;i<4;i++)line(ctx,[[-17,-2.5+i*1.7],[41,-2.5+i*1.7]],INK,.55);
  for(let x=7;x<33;x+=6)line(ctx,[[x,-4],[x,3]],INK,.65);
  box(ctx,-14,-6,2,13,0,C.cream);
  for(const x of [35,40]){line(ctx,[[x,-6],[x,-9]],INK,.8);oval(ctx,x,-10,1.8,1.1,C.cream);line(ctx,[[x,6],[x,9]],INK,.8);oval(ctx,x,10,1.8,1.1,C.cream);}
  ctx.restore();
  bandArm(ctx,18,-47,25,-43+(p.play?gesture:0),gold,1,6);
  bandArm(ctx,-18,-46,-8+(p.play?gesture*1.4:0),-29+(p.play?p.hit*4:walking*2),gold,-1,6);
  return true;
 }
 case 'scope':{
  const shell='#726080',screen='#a4b8ab';
  bandLegs(ctx,p,screen,{hip:-29,spread:18,foot:7,right:C.gold});
  sourcePart(ctx,id,[0,1,2,3,4,8,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,35,36,37,38,39],0,-54,62);
  bandBlink(ctx,-6.5,-59,6.6,p);
  const points=[];
  for(let x=-23;x<=8;x+=1.5)points.push([x,-45+Math.sin((x+23)*.22+(p.play?p.beat*.5:0))*(p.play?3+p.hit*2:3)]);
  line(ctx,points,INK,1.1);
  // Flexible patch-cable arms curl from the sockets; the case stays square.
  const lh=[-34-walking*2,-28+walking*6],rh=p.play?[23,-59+p.hit*2]:[35-walking*2,-28-walking*6];
  bandArm(ctx,-31,-50,...lh,shell,-1,4.5);bandArm(ctx,31,-48,...rh,shell,1,4.5);
  shape(ctx,`M 26 -37 C 47 -36 ${42+p.sway*2} -14 25 -14`,null,INK,1);
  box(ctx,18,-16,8,4,1,C.gold);line(ctx,[[18,-14],[14,-14]],INK,1);
  return true;
 }
 case 'fuzz':{
  const red='#b86b5b',violet='#726080';
  bandLegs(ctx,p,C.cream,{hip:-23,spread:11,foot:6,right:violet});
  sourcePart(ctx,id,[0,1,2,3,6,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27],0,-53,53);
  const lh=p.play?[0,-30+p.hit*2]:[-34-walking*2,-29+walking*7];
  const rh=[34-walking*2,-30-walking*7-gesture*3];
  bandArm(ctx,-25,-44,...lh,red,-1,5);bandArm(ctx,25,-44,...rh,red,1,5);
  const plugX=39+p.sway*2,plugY=-76-gesture*2;
  shape(ctx,`M 26 -47 C 43 -46 31 -65 ${plugX} ${plugY+4}`,null,INK,1.1);
  ctx.save();ctx.translate(plugX,plugY);ctx.rotate(.4+p.sway*.05);box(ctx,-2.5,-3,5,6,.5,C.gold);line(ctx,[[0,-3],[0,-7]],INK,1);ctx.restore();
  if(p.play){oval(ctx,0,-30,2,2,violet);line(ctx,[[0,-30],[Math.sin(p.beat)*2,-30-Math.cos(p.beat)*2]],INK,.8);}
  return true;
 }
 default:return false;
 }
}

/* Shared-closure snippet: articulated members of the original nature/electronics cast. */
function natureFace(ctx, x, y, s, p, singing = false) {
  const blink = Math.max(0.12, 1 - p.blink);
  oval(ctx, x - 4.3 * s, y, 1.05 * s, 1.2 * s * blink, INK, null);
  oval(ctx, x + 4.3 * s, y, 1.05 * s, 1.2 * s * blink, INK, null);
  if (singing) oval(ctx, x, y + 5 * s, 2.7 * s, (3.3 + p.hit * 1.4) * s, '#995166', INK, 0.8);
  else shape(ctx, `M${x - 3 * s},${y + 4 * s} Q${x},${y + 8 * s} ${x + 3 * s},${y + 4 * s}`, null, INK, 0.95);
}

function natureWireLeg(ctx, hipX, hipY, footX, footY, bend = 1, color = INK, width = 1.25) {
  const kneeY = hipY * 0.48 + footY * 0.52;
  const kneeX = (hipX + footX) / 2 + bend * 3;
  line(ctx, [[hipX, hipY], [kneeX, kneeY], [footX, footY - 1.5], [footX + 3.5, footY - 1.5]], color, width);
}

function drawNature(ctx, id, p) {
  const live = p.still ? 0 : 1;
  const wave = (speed, phase = 0) => Math.sin(p.time * speed + phase) * live;
  const playing = p.play || p.hit > 0.12;

  if (id === 'crane') {
    const bob = p.breath * 0.45;
    // Two independently jointed bird legs keep their toes on the ground during stance.
    for (const side of [-1, 1]) {
      const step = p.step(side);
      const hx = side < 0 ? -8 : 7;
      const fx = hx + step.x * 0.9;
      const fy = step.y;
      line(ctx, [[hx, -32 + bob], [hx + side * 4 - step.x * 0.3, -17 + fy * 0.3], [fx, fy - 3]], INK, 1.6);
      line(ctx, [[fx - 5, fy], [fx, fy - 3], [fx + 5.5, fy]], INK, 1.4);
      line(ctx, [[fx, fy - 3], [fx + 1, fy + 0.1]], INK, 1.2);
    }
    ctx.save(); ctx.translate(0, bob);
    shape(ctx, 'M-19,-49 L-37,-42 L-33,-29 L-17,-38 Q1,-25 19,-41 Q30,-53 28,-68 L20,-69 Q20,-53 8,-53 Q-10,-62 -19,-49 Z', C.cream, INK, 1.4);
    // Folded wing pivots at the shoulder; feathers retain the original cream silhouette.
    ctx.save(); ctx.translate(-10, -52); ctx.rotate(wave(2.4) * 0.025 + (playing ? wave(5.5) * 0.10 : 0) + (p.walk ? wave(7) * 0.06 : 0));
    shape(ctx, 'M-11,0 Q-17,-12 -8,-12 Q2,-10 15,2 Q4,19 -8,10 Q-11,6 -11,0 Z', C.cream, INK, 1.25);
    shape(ctx, 'M-7,-5 Q-7,9 6,8 M-3,-1 Q0,8 11,6', null, INK, 0.9);
    ctx.restore();
    // A separate head/upper-neck joint gives the long-beaked crane attentive nods.
    ctx.save(); ctx.translate(22, -66); ctx.rotate(wave(1.9) * 0.035 + p.hit * 0.07);
    shape(ctx, 'M-4,5 Q-7,-8 -5,-18 Q-2,-29 6,-27 Q13,-26 13,-14 L8,-11 Q8,0 5,7 Z', C.cream, INK, 1.35);
    shape(ctx, 'M12,-20 L24,-15 L12,-13 Z', C.copper, INK, 1.15);
    oval(ctx, 6.5, -21, 1.15, 1.3 * Math.max(0.12, 1 - p.blink), INK, null);
    shape(ctx, 'M-1,-23 Q2,-27 6,-26', null, INK, 0.9);
    if (playing) {
      line(ctx, [[22, -12], [22, 4]], INK, 1);
      oval(ctx, 18.5, 5.2, 4, 2.7, C.copper, INK, 0.9);
    }
    ctx.restore(); ctx.restore();
    return true;
  }

  if (id === 'origami') {
    for (const side of [-1, 1]) {
      const step = p.step(side);
      natureWireLeg(ctx, side * 9, -31, side * 12 + step.x, step.y, -side);
    }
    const nod = wave(2.3) * 0.025 + p.hit * 0.045;
    ctx.save(); ctx.translate(0, p.breath * 0.35); ctx.rotate(nod);
    // The original paper facets are rigid pieces hinged at their crease, never stretched.
    shape(ctx, 'M-2,-45 L-39,-49 L-22,-33 L1,-37 Z', '#a4b8ab', INK, 1.3);
    shape(ctx, 'M-39,-49 L-9,-57 L-2,-45 Z', '#25608a', INK, 1.2);
    shape(ctx, 'M-11,-43 L-3,-70 L17,-60 L20,-37 Z', '#995166', INK, 1.3);
    ctx.save(); ctx.translate(-7, -45); ctx.rotate(-0.03 + wave(3.1) * 0.04 + (playing ? wave(7.3) * 0.15 : 0));
    shape(ctx, 'M0,0 L-6,-33 L7,-52 L15,-16 Z', '#426c4c', INK, 1.3);
    shape(ctx, 'M0,0 L-6,-33 L7,-52 Z', '#b86b5b', INK, 1.05);
    ctx.restore();
    shape(ctx, 'M8,-58 L32,-77 L35,-54 L20,-37 Z', '#3e756d', INK, 1.3);
    shape(ctx, 'M8,-58 L32,-77 L28,-58 Z', '#37789a', INK, 1.1);
    shape(ctx, 'M33,-64 L46,-59 L35,-54 Z', C.copper, INK, 1.1);
    oval(ctx, 29.5, -63.5, 1, 1.3 * Math.max(0.12, 1 - p.blink), INK, null);
    // Mixer stays level while the paper wing and the playing hands move separately.
    ctx.restore();
    for (const side of [-1, 1]) {
      const tap = playing ? wave(7.4, side * 1.4) * 3 : 0;
      line(ctx, [[side * 18, -39], [side * 24, -31 + tap], [side * 17, -24 + tap]], INK, 1.3);
    }
    box(ctx, -27, -27, 54, 17, 2.5, C.cream, INK, 1.2);
    for (let i = 0; i < 4; i++) {
      const x = -18 + i * 12;
      line(ctx, [[x, -24], [x, -13]], INK, 0.8);
      const shift = playing ? wave(5, i) * 1.5 : 0;
      box(ctx, x - 2.2, -20 + shift, 4.4, 4, 0.6, C.gold, INK, 0.8);
    }
    return true;
  }

  if (id === 'firefly') {
    const hover = wave(2.3) * 1.5;
    ctx.save(); ctx.translate(0, -47 + hover);
    // Six legs have their own small airborne kicks, behind the body and wings.
    for (let i = 0; i < 3; i++) for (const side of [-1, 1]) {
      const kick = wave(5.1, i * 1.7 + side) * 2;
      line(ctx, [[side * 6, -1 + i * 9], [side * 14, 7 + i * 8 + kick], [side * (19 - i), 10 + i * 9 + kick]], INK, 1.1);
    }
    for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(side * 7, -7);
      const flap = wave(p.walk ? 22 : 16, side * 0.3);
      ctx.rotate(side * (0.10 + flap * 0.15));
      ctx.scale(side * (0.82 + flap * 0.18), 1);
      shape(ctx, 'M0,0 Q8,-34 25,-27 Q43,-22 30,-5 Q20,7 0,5 Z', '#37789a', INK, 1.3);
      line(ctx, [[1, 1], [14, -2], [23, -17]], INK, 1.05);
      oval(ctx, 23, -17, 2.6, 2.6, C.cream, INK, 0.9);
      ctx.restore();
      ctx.save(); ctx.translate(side * 7, 8);
      ctx.rotate(side * (-0.06 - flap * 0.12)); ctx.scale(side * (0.87 - flap * 0.12), 1);
      shape(ctx, 'M0,0 Q20,-6 29,7 Q35,21 18,19 Q8,18 0,7 Z', C.purple, INK, 1.2);
      line(ctx, [[1, 4], [14, 4], [23, 12]], INK, 0.95);
      oval(ctx, 23, 12, 2.4, 2.4, C.cream, INK, 0.85);
      ctx.restore();
    }
    box(ctx, -9, -27, 18, 58, 9, '#d3aa61', INK, 1.35);
    line(ctx, [[-8, 1], [8, 1]], INK, 1.05);
    oval(ctx, 0, 14, 5.8 + p.hit * 0.5, 6.2, C.cream, INK, 1.05);
    natureFace(ctx, 0, -14, 1, p);
    for (const side of [-1, 1]) {
      const tipX = side * (13 + wave(2.9, side) * 1.2);
      shape(ctx, `M${side * 5},-25 Q${side * 6},-36 ${tipX},-40`, null, INK, 1.15);
      oval(ctx, tipX, -40, 1.75, 1.75, INK, null);
    }
    ctx.restore();
    return true;
  }

  if (id === 'caterpillar') {
    const segments = [-27, 0, 27].map((x, i) => ({x, y: -25 - i * 5 + wave(p.walk ? 7 : 2.7, -i * 0.9) * (p.walk ? 1.5 : 0.65)}));
    shape(ctx, `M-38,${segments[0].y + 1} Q-49,${segments[0].y + 4} -43,${segments[0].y - 10 + wave(2.5) * 3}`, null, INK, 1.1);
    for (let i = 0; i < 3; i++) {
      const s = segments[i];
      for (const side of [-1, 1]) {
        const step = p.step(side, i);
        natureWireLeg(ctx, s.x + side * 4, s.y + 10, s.x + side * 7 + step.x * 0.65, step.y * 0.7, side);
      }
    }
    for (let i = 0; i < 2; i++) line(ctx, [[segments[i].x + 11, segments[i].y], [segments[i + 1].x - 11, segments[i + 1].y]], INK, 1.4);
    segments.forEach((s, i) => {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(wave(2.4, i) * 0.025);
      if (i < 2) {
        oval(ctx, 0, 0, 12.5, 12, i ? '#c78256' : '#a4b8ab', INK, 1.2);
        ctx.save();
        const clip = new Path2D(); clip.ellipse(0, 0, 12.5, 12, 0, 0, Math.PI * 2); ctx.clip(clip);
        box(ctx, -1, -13, 14, 26, 0, i ? '#3e756d' : '#c78256', null);
        ctx.restore();
        line(ctx, [[-1, -11.7], [-1, 11.7]], INK, 1);
        if (i) line(ctx, [[3, -11.6], [3, 11.6]], INK, 1);
      } else {
        oval(ctx, 0, -1, 12.5, 15, '#a4b8ab', INK, 1.2);
        natureFace(ctx, 0, -3, 1, p);
        for (const side of [-1, 1]) {
          const tx = side * (13 + wave(3, side) * 1.4);
          shape(ctx, `M${side * 5},-13 Q${side * 6},-22 ${tx},-24`, null, INK, 1);
          oval(ctx, tx, -24, 1.7, 1.7, INK, null);
        }
      }
      ctx.restore();
    });
    return true;
  }

  if (id === 'sprout') {
    const sway = wave(2.15) * 0.035;
    for (const side of [-1, 1]) {
      const step = p.step(side);
      natureWireLeg(ctx, side * 8, -14, side * 8 + step.x * 0.7, step.y, side, INK, 1.35);
      const gesture = playing ? wave(5.7, side) * 4 : wave(2.8, side) * 1.5;
      line(ctx, [[side * 19, -32], [side * 27, -29 + gesture], [side * 29, -22 + gesture]], INK, 1.1);
      oval(ctx, side * 29, -22 + gesture, 1.7, 1.7, '#d3aa61', INK, 0.8);
    }
    ctx.save(); ctx.translate(0, -45); ctx.rotate(sway);
    shape(ctx, 'M0,1 Q0,-10 -3,-24', null, INK, 1.25);
    ctx.save(); ctx.translate(-2, -17); ctx.rotate(wave(2.6) * 0.045);
    shape(ctx, 'M0,0 Q-27,-1 -30,-23 Q-6,-25 0,0 Z', '#a4b8ab', INK, 1.2);
    shape(ctx, 'M-28,-22 Q-11,-15 0,0', null, INK, 1);
    ctx.restore();
    ctx.save(); ctx.translate(-3, -23); ctx.rotate(wave(2.6, 1.2) * 0.06);
    shape(ctx, 'M0,0 Q-1,-21 28,-23 Q22,-1 0,0 Z', '#426c4c', INK, 1.2);
    shape(ctx, 'M0,0 Q11,-15 27,-22', null, INK, 1);
    ctx.restore(); ctx.restore();
    shape(ctx, 'M-21,-46 L-21,-18 C-21,-7 21,-7 21,-18 L21,-46 Z', '#c78256', INK, 1.3);
    oval(ctx, 0, -46, 21, 5.6, '#d3aa61', INK, 1.2);
    oval(ctx, 0, -46, 2.3, 1.25, C.cream, INK, 0.8);
    line(ctx, [[-15, -39], [-15, -18]], INK, 0.9);
    line(ctx, [[-19, -33], [-16, -33]], INK, 0.9);
    natureFace(ctx, 4, -29, 1.15, p);
    return true;
  }

  if (id === 'trio') {
    const players = [{x:-28,y:-39,color:'#b86b5b'},{x:0,y:-57,color:'#a4b8ab'},{x:28,y:-38,color:'#37789a'}];
    players.forEach((v, i) => {
      const nod = wave(playing ? 5.2 : 2.3, i * 1.7) * (playing ? 1.2 : 0.45);
      for (let leg = 0; leg < 3; leg++) {
        const step = p.step(leg === 1 ? 1 : -1, i + leg);
        const offset = (leg - 1) * 6;
        const fx = v.x + offset + step.x * 0.5;
        const fy = step.y * 0.7;
        line(ctx, [[v.x + offset, v.y + 9 + nod], [v.x + offset + (leg - 1) * 1.8, v.y * 0.44], [fx, fy - 2]], INK, 1.2);
        oval(ctx, fx, fy - 2.2, 2.4, 2.5, leg === 1 ? '#37789a' : '#d3aa61', INK, 0.9);
      }
      ctx.save(); ctx.translate(v.x, v.y + nod); ctx.rotate(wave(2.6, i * 2) * 0.035);
      shape(ctx, 'M-11,10 L-11,0 A11,11 0 0 1 11,0 L11,10 Z', v.color, INK, 1.3);
      natureFace(ctx, 0, -1, 1, p, playing && i === Math.floor((p.time * 1.6) % 3));
      ctx.restore();
    });
    return true;
  }

  if (id === 'choir') {
    const singers = [{x:-27,y:-44,rx:11,ry:20,phase:0},{x:0,y:-56,rx:12,ry:25,phase:1.8},{x:27,y:-43,rx:11,ry:20,phase:3.5}];
    singers.forEach((s, i) => {
      const breath = wave(playing ? 3.4 : 2.1, s.phase) * 0.6;
      for (const side of [-1, 1]) {
        const step = p.step(side, i);
        natureWireLeg(ctx, s.x + side * 4, s.y + s.ry - 1 + breath, s.x + side * 5 + step.x * 0.45, step.y * 0.7, -side, INK, 1.1);
        const lift = playing ? 3 + wave(4.1, i + side) * 2 : wave(2, i + side);
        joint(ctx, [[s.x + side * (s.rx - 1), s.y + 5], [s.x + side * (s.rx + 4), s.y + 12 - lift], [s.x + side * (s.rx + 6), s.y + 6 - lift]], C.cream, 2.8);
      }
      ctx.save(); ctx.translate(s.x, s.y + breath); ctx.rotate(wave(2.1, s.phase) * 0.035);
      oval(ctx, 0, 0, s.rx, s.ry, C.cream, INK, 1.25);
      shape(ctx, 'M-5,-2 Q-3,-6 -1,-2 M2,-2 Q4,-6 6,-2', null, INK, 1);
      const mouth = playing ? 4.2 + wave(4.7, s.phase) * 0.9 + p.hit : 2.8;
      oval(ctx, 0.5, 6, 2.8, mouth, '#995166', INK, 0.9);
      ctx.restore();
    });
    // The conductor faces the singers; both shoulders, elbows and baton hand articulate.
    const left = playing ? wave(5.8) * 5 : wave(2.2) * 1.5;
    const right = playing ? wave(5.8, 1.8) * 6 : wave(2.2, 2) * 1.8;
    joint(ctx, [[-5, -20], [-14, -24 - left], [-19, -35 - left]], C.cream, 3.3);
    joint(ctx, [[5, -20], [13, -27 + right * 0.4], [19, -35 + right]], C.cream, 3.3);
    line(ctx, [[19, -35 + right], [23, -49 + right]], INK, 1.05);
    line(ctx, [[-4, -7], [-5, -1], [-8, -1]], INK, 1.2);
    line(ctx, [[4, -7], [5, -1], [8, -1]], INK, 1.2);
    shape(ctx, 'M-5,-23 Q-10,-14 -9,-6 Q0,-2 9,-6 Q10,-14 5,-23 Z', '#726080', INK, 1.2);
    oval(ctx, 0, -28, 6.7, 8, C.cream, INK, 1.2);
    return true;
  }

  if (id === 'mushroom') {
    const plants = [{x:-16,top:-52,width:29,height:29,color:'#b86b5b',phase:0},{x:28,top:-34,width:16,height:20,color:'#b9a4c6',phase:2}];
    plants.forEach((s, i) => {
      const bend = wave(playing ? 3.3 : 1.8, s.phase) * (playing ? 2.8 : 1.2);
      const w = i ? 6 : 9;
      for (const side of [-1, 1]) {
        const step = p.step(side, i);
        natureWireLeg(ctx, s.x + side * w * 0.4, -10, s.x + side * (w - 2) + step.x * 0.5, step.y * 0.7, side, INK, 1.1);
      }
      shape(ctx, `M${s.x - w},-13 Q${s.x - w - 3},-24 ${s.x - w + bend},${s.top - 1} L${s.x + w + bend},${s.top - 1} Q${s.x + w + 3},-24 ${s.x + w},-13 Q${s.x},-9 ${s.x - w},-13 Z`, C.cream, INK, 1.2);
      const handLift = playing ? wave(5.1, s.phase) * 3.5 : wave(2.7, s.phase);
      joint(ctx, [[s.x - w + 1, -26], [s.x - w - 6, -23], [s.x - w - 8, -30 - handLift]], C.cream, 2.6);
      joint(ctx, [[s.x + w - 1, -27], [s.x + w + 5, -24], [s.x + w + 7, -29 + handLift]], C.cream, 2.6);
      natureFace(ctx, s.x + bend * 0.25, i ? -24 : -36, i ? 0.7 : 0.9, p);
      oval(ctx, s.x, -18, i ? 2.2 : 2.8, i ? 2.2 : 2.8, '#d3aa61', INK, 0.8);
      ctx.save(); ctx.translate(s.x + bend, s.top); ctx.rotate(bend * 0.012);
      oval(ctx, 0, 0, s.width * 0.81, 5.3, '#d3aa61', INK, 1.1);
      shape(ctx, `M${-s.width},-3 Q${-s.width * 0.7},${-s.height} 0,${-s.height} Q${s.width * 0.7},${-s.height} ${s.width},-3 Q0,5 ${-s.width},-3 Z`, s.color, INK, 1.3);
      if (i) {
        oval(ctx, 0, -10, 4.2, 4.2, '#d3aa61', INK, 0.95);
        line(ctx, [[0, -14], [0, -11]], INK, 0.85);
      } else for (const spot of [[-14,-10,3.4],[1,-19,4.1],[16,-10,3.4]]) {
        oval(ctx, spot[0], spot[1], spot[2], spot[2], C.cream, INK, 0.95);
        line(ctx, [[spot[0], spot[1] - spot[2] + 0.6], [spot[0], spot[1] - 1]], INK, 0.7);
      }
      ctx.restore();
    });
    shape(ctx, `M-16,-17 Q-14,${-3 + wave(2.1)} 5,-5 Q25,-6 28,-17`, null, INK, 1);
    return true;
  }

  if (id === 'shrimp') {
    // Red tail fan remains distinct from the two small walking legs.
    for (const side of [-1, 1]) {
      const step = p.step(side);
      joint(ctx, [[side * 5, -20], [side * 8 - step.x * 0.35, -11 + step.y * 0.35], [side * 10 + step.x * 0.75, -2 + step.y]], '#d3aa61', 3.3);
      oval(ctx, side * 10 + step.x * 0.75, -2 + step.y, 4, 2, C.cream, INK, 1);
    }
    ctx.save(); ctx.translate(1, -20); ctx.rotate(wave(2.2) * 0.045);
    shape(ctx, 'M-5,-4 L-12,11 L0,6 L11,10 L5,-6 Z', '#b86b5b', INK, 1.15);
    line(ctx, [[0, -1], [0, 6]], INK, 0.8); ctx.restore();
    const shoulder = wave(2.4) * 0.6;
    const freeHand = playing ? wave(5.5) * 4 : (p.walk ? wave(7.5) * 5 : wave(2.6) * 2);
    joint(ctx, [[13, -44 + shoulder], [26, -38 - freeHand], [34, -45 - freeHand]], '#d3aa61', 4.5);
    oval(ctx, 34, -45 - freeHand, 2.4, 3.3, '#d3aa61', INK, 0.95);
    const micX = -30, micY = -46 + (p.walk ? wave(7.5, 1.5) * 2 : 0);
    joint(ctx, [[-7, -45 + shoulder], [-17, -39], [micX + 4, micY + 8]], '#d3aa61', 4.5);
    ctx.save(); ctx.translate(0, shoulder);
    shape(ctx, 'M-14,-67 Q-23,-66 -22,-73 Q-28,-76 -24,-83 Q-20,-88 -14,-83 Q-11,-94 -2,-90 Q4,-90 6,-84 Q16,-88 20,-79 Q29,-77 23,-67 Q31,-41 12,-24 Q1,-15 -10,-20 Q-14,-23 -7,-27 Q7,-36 8,-47 Q10,-58 5,-64 Q-1,-59 -6,-65 Q-11,-62 -14,-67 Z', '#d3aa61', INK, 1.3);
    natureFace(ctx, 0, -76, 1.1, p, playing);
    shape(ctx, 'M13,-59 Q15,-63 18,-59 M13,-45 Q16,-49 19,-45 M2,-30 Q4,-34 7,-31 M-18,-77 Q-16,-81 -13,-77', null, INK, 0.9);
    ctx.restore();
    // During performance the mic stand is grounded; in transit it is handheld.
    if (!p.walk) {
      line(ctx, [[micX, micY + 14], [micX, -5]], INK, 1.3);
      line(ctx, [[micX - 9, 0], [micX, -5], [micX + 10, 0]], INK, 1.15);
      line(ctx, [[micX, -5], [micX, 1]], INK, 1.05);
    }
    box(ctx, micX - 6, micY - 14, 12, 25, 6, '#37789a', INK, 1.2);
    for (let i = 0; i < 3; i++) line(ctx, [[micX - 3.5, micY - 8 + i * 4], [micX + 3.5, micY - 8 + i * 4]], INK, 0.85);
    shape(ctx, `M${micX - 9},${micY + 3} Q${micX - 10},${micY + 17} ${micX},${micY + 16} Q${micX + 10},${micY + 17} ${micX + 9},${micY + 3}`, null, INK, 1.1);
    return true;
  }
  return false;
}


  function drawOriginal(ctx,id,x,y,size,{face=1}={}){
    if(!art[id])return false;const [x0,y0,x1,y1]=art[id].bounds,s=size/Math.max(x1-x0,y1-y0);
    ctx.save();ctx.translate(x,y);ctx.scale(s*(face<0?-1:1),s);ctx.translate(-(x0+x1)/2,-y1);ctx.lineCap='round';ctx.lineJoin='round';for(const path of sourcePaths(id))paintSource(ctx,path);ctx.restore();return true;
  }
  function draw(ctx,id,x,y,size,options={}){
    if(!art[id])return false;const p=makePose(id,options);
    ctx.save();ctx.translate(x,y);ctx.scale(size/100*(options.face<0?-1:1),size/100);ctx.lineCap='round';ctx.lineJoin='round';
    if(id==='cat')drawCat(ctx,p);
    else if(typeof drawBand==='function'&&drawBand(ctx,id,p)){}
    else if(typeof drawNature==='function'&&drawNature(ctx,id,p)){}
    else drawOriginal(ctx,id,0,0,88);
    ctx.restore();return true;
  }
  window.PilafCharacters={draw,drawOriginal,ids:Object.keys(art),art,pose:makePose};
})();
