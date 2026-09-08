/* Articulated stage versions of the PILAF cast. Local joints, grounded feet,
   and instrument gestures follow scheduled notes rather than moving a bitmap. */
(() => {
 const ink='#40573f',cream='#fff3d5',sage='#b9cba3',gold='#d9b978',rose='#dba99a';
 let c;
 function ellipse(x,y,rx,ry,fill=cream,stroke=ink){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
 function line(points,color=ink,width=2){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
 function round(x,y,w,h,r=5,fill=cream,stroke=ink){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
 function poly(points,fill=cream){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=ink;c.lineWidth=2;c.lineJoin='round';c.stroke();}
 function curve(points,color=ink,width=2){c.beginPath();c.moveTo(points[0],points[1]);c.bezierCurveTo(...points.slice(2));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
 function shape(d,fill=cream,stroke=ink,width=2){const path=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(path);}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(path);}}
 function joint(x,y,angle,fn){c.save();c.translate(x,y);c.rotate(angle);fn();c.restore();}
 function arm(sx,sy,hx,hy,color=cream,bend=1){const dx=hx-sx,dy=hy-sy,d=Math.max(1,Math.hypot(dx,dy)),ex=(sx+hx)/2-dy/d*7*bend,ey=(sy+hy)/2+dx/d*7*bend;line([[sx,sy],[ex,ey],[hx,hy]],ink,8);line([[sx,sy],[ex,ey],[hx,hy]],color,4.5);ellipse(hx,hy,4.2,3.7,color);}
 function feet(p,color=cream,top=-11){for(const side of [-1,1]){const tap=side===1?p.hit*2:0;line([[side*12,top],[side*15,-3-tap]],ink,3);ellipse(side*16,-2-tap,8,3.5,color);}}
 function face(x,y,p,{width=11,sleepy=false,mouth=true,open=false}={}){for(const side of [-1,1]){const ex=x+side*width;if(p.blink||sleepy)curve([ex-3,y,ex-1,y+3,ex+1,y+3,ex+3,y]);else{ellipse(ex,y,2.2,3.1,ink,null);ellipse(ex+.5,y-.7,.65,.7,cream,null);}}if(mouth){if(open&&p.hit>.15)ellipse(x,y+9,2.7,2+p.hit*3,ink,null);else curve([x-3,y+7,x-1,y+11,x+2,y+11,x+4,y+7]);}}
 function head(p,color,{cat=false,fox=false,lion=false}={}){joint(0,-64,p.nod,()=>{
  if(lion){const points=[];for(let i=0;i<160;i++){const a=i*Math.PI/80,r=34+3*Math.cos(a*10);points.push([Math.cos(a)*r,Math.sin(a)*r]);}poly(points,gold);ellipse(-18,-17,6,7,'#e8d19e');ellipse(18,-17,6,7,'#e8d19e');}
  if(cat||fox){poly([[-23,-10],[-26,-34],[-8,-22]],color);poly([[8,-22],[26,-34],[23,-9]],color);poly([[-21,-24],[-19,-13],[-12,-20]],rose);poly([[12,-20],[19,-13],[21,-24]],rose);}
  ellipse(0,0,26,23,color);if(fox){poly([[-24,2],[-9,14],[0,4],[-2,19]],cream);poly([[24,2],[9,14],[0,4],[2,19]],cream);}if(lion)ellipse(0,10,15,10,cream,null);
  face(0,0,p,{sleepy:cat&&p.hit<.2});if(lion){ellipse(0,10,10,7,cream);curve([-18,-12,-16,-17,-11,-17,-9,-14]);curve([9,-14,11,-17,16,-17,18,-12]);curve([-3,12,-1,15,1,15,3,12],ink,1.5);}ellipse(0,7,2.2,1.7,ink,null);if(cat)for(const side of [-1,1]){line([[side*17,7],[side*30,4]],ink,1.3);line([[side*17,10],[side*29,12]],ink,1.3);}
 });}
 function body(p,color=cream){feet(p,color);ellipse(0,-30,24,29,color);ellipse(0,-22,14,16,cream,null);}
 function keyboard(p,x=0,y=-12,width=72){round(x-width/2,y-7,width,18,4,'#d4d9b6');for(let i=0;i<8;i++){const active=p.hit>.18&&(i===p.key||i===(p.key+3)%8);round(x-width/2+4+i*(width-8)/8,y-3+(active?2:0),(width-8)/8-1,11,1,active?gold:cream,ink);}for(const i of [1,2,4,5,6])round(x-width/2+3+i*(width-8)/8,y-4,4,6,1,ink,null);line([[x-width/2+7,y+11],[x-width/2+5,y+19]],ink,2);line([[x+width/2-7,y+11],[x+width/2-5,y+19]],ink,2);}
 function mallet(x,y,angle,color=gold){joint(x,y,angle,()=>{line([[0,0],[0,-25]],ink,2);ellipse(0,-27,4,4,color);});}
 function bass(p,color){joint(9,-25,-.55,()=>{ellipse(-9,0,16,20,color);ellipse(-9,0,6,8,cream);round(0,-4,43,8,2,'#c3b28a');round(40,-7,10,13,3,sage);for(let i=0;i<4;i++)line([[-16,-3+i*2],[46,-3+i*2]],ink,.75);for(let i=0;i<5;i++)line([[9+i*6,-4],[9+i*6,4]],'#889072',.8);});arm(-19,-39,-5,-22+p.hit*6,color);arm(21,-42,34+p.hit*5,-44-p.hit*3,color,-1);}
 const rigs={
  rabbit(p){
   // Crescent, independently flexing ears, and two hands hovering at antennas.
   c.save();c.translate(-12,-56);c.rotate(-.2);c.beginPath();c.arc(0,0,43,.5,Math.PI*1.7);c.bezierCurveTo(-19,-20,-20,16,38,22);c.closePath();c.fillStyle='#dce1bc';c.fill();c.strokeStyle=ink;c.lineWidth=2;c.stroke();c.restore();
   ellipse(-5,-27,21,26);ellipse(-12,-15,15,8);ellipse(7,-11,13,7);joint(0,-65,p.nod,()=>{for(const s of [-1,1])joint(s*11,-15,s*(.1+p.hit*.13),()=>{ellipse(0,-18,6,22);ellipse(0,-18,2.2,15,rose,null);});ellipse(0,0,25,22);face(0,0,p,{mouth:false});ellipse(0,7,2,1.5,ink,null);curve([0,8,-4,16,-9,10,-5,10]);curve([0,8,4,16,9,10,5,10]);for(const s of [-1,1])line([[s*18,6],[s*22,7]],ink,1);});
   round(-11,-15,56,20,5,sage);ellipse(2,-5,3,3,gold);line([[35,-15],[35,-54]],ink,2.5);ellipse(35,-56,2.5,2.5,gold);ellipse(-19,-26,11,4,null,ink);line([[-12,-25],[-12,-15]]);arm(-21,-41,-26+p.hit*7,-32-p.hit*7,cream);arm(20,-42,31-p.hit*8,-46+p.hit*9,cream,-1);
  },
  cat(p){
   // The sleeping cat stays curled on its keyboard, as in the artwork.
   joint(18,-39,p.tail*.2,()=>{ellipse(0,-9,30,29,'#d8d5b7');curve([4,-23,36,-27,27,12,4,4]);curve([4,4,-12,-3,10,-16,13,-4]);});
   joint(-17,-49,p.nod,()=>{shape('M -25 -6 L -28 -35 Q -26 -38 -11 -22 Q 0 -26 11 -22 Q 27 -40 28 -33 L 26 -5 Q 33 18 4 22 Q -26 24 -25 -6 Z','#d8d5b7');line([[-22,-27],[-20,-16],[-14,-21]]);line([[21,-27],[18,-16],[13,-21]]);face(0,0,p,{sleepy:true,mouth:false});for(const x of [-8,0,8])line([[x,-18],[x+1,-13]],ink,1.5);ellipse(0,7,2,1.4,ink,null);curve([0,8,-5,18,-10,9,-6,10]);curve([0,8,5,18,10,9,6,10]);for(const s of [-1,1])line([[s*19,8],[s*29,6]],ink,1.5);});
   keyboard(p,0,-6,94);for(const s of [-1,1]){const x=-17+s*12,y=-14+(s<0?p.hit:p.off)*5;arm(x,-30,x,y,'#d8d5b7',s);for(const d of [-1,1])line([[x+d*1.5,y],[x+d*1.5,y+2]],ink,.8);}
  },
  lion(p){joint(-23,-17,p.tail,()=>{curve([0,0,-30,-6,-33,-23,-26,-32],ink,3);ellipse(-26,-33,5,7,gold);});body(p,'#e2c692');head(p,'#e8d19e',{lion:true});bass(p,'#d8b477');},
  robot(p){feet(p,sage);round(-24,-48,48,39,8,sage);round(-18,-44,36,5,1,cream);for(let i=0;i<8;i++)round(-17+(i%4)*9,-35+Math.floor(i/4)*9,6,6,1,i===p.key?gold:cream);joint(0,-69,p.nod*.6,()=>{line([[0,-19],[0,-30],[10,-34]]);ellipse(10,-35,3,3,p.hit>.3?gold:cream);round(-32,-23,64,36,9,'#c5d7b4');round(-26,-17,52,24,5,sage);face(0,-9,p,{width:16,mouth:false});shape('M -6 -3 Q 0 0 6 -3 Q 5 5 0 5 Q -5 5 -6 -3 Z',cream);round(-38,-12,6,15,2,sage);round(32,-12,6,15,2,sage);});
   for(const s of [-1,1]){round(s*25-15,-13,30,20,4,'#c1c9a1');ellipse(s*25,-13,15,5,cream);line([[s*25,7],[s*29,13]]);const strike=s<0?p.hit:p.off;arm(s*22,-38,s*31,-38+strike*2,sage,s);mallet(s*31,-38+strike*2,-s*(.6+strike*2));}ellipse(0,0,13,13,sage);ellipse(0,0,7,7,cream);},
  origami(p){
   poly([[-9,-46],[-48,-36],[-8,-18],[16,-32],[24,-54]],'#e6e6c8');line([[-48,-36],[-9,-34],[-8,-18]],ink,1.7);poly([[16,-32],[21,-55],[33,-66],[38,-47]],cream);poly([[33,-66],[38,-47],[54,-52]],cream);ellipse(35,-54,1.9,p.blink?1:2.1,ink,null);
   joint(-8,-34,p.hit*.08+p.nod*.3,()=>{poly([[0,0],[13,-59],[23,-17]],'#e6e6c8');line([[13,-59],[12,-10],[0,0]],ink,1.5);});
   round(-26,-5,55,15,3,sage);for(let i=0;i<4;i++){line([[-17+i*12,-1],[-17+i*12,7]],ink,1.3);round(-20+i*12,1+(i===p.key%4?p.hit*3:0),6,3,1,cream);}
   line([[-6,-19],[-6,-5]],ink,2);line([[13,-28],[10,-12],[15+p.hit*4,0]],ink,2);ellipse(15+p.hit*4,0,2,1,ink,null);
  },
  onigiri(p){feet(p);poly([[-30,-27],[-26,-49],[-9,-78],[0,-84],[11,-77],[30,-45],[32,-26],[24,-12],[-21,-12]],cream);round(-12,-34,24,22,4,'#77946b');c.beginPath();c.arc(0,-48,33,Math.PI,Math.PI*2);c.strokeStyle=ink;c.lineWidth=4;c.stroke();round(-37,-53,10,24,5,gold);round(27,-53,10,24,5,gold);face(0,-51,p);for(const s of [-1,1]){ellipse(s*34,-2,13,4,sage);ellipse(s*34,-8,10,9,gold);line([[s*34,-17],[s*34,-20]]);const hit=s<0?p.hit:p.off;arm(s*24,-30,s*35,-34-hit*9,cream,s);mallet(s*35,-34-hit*9,s*(.3+hit*(Math.PI-.3)));}},
  fox(p){
   const fur='#d6ac7e';
   joint(24,-20,p.tail*.5,()=>{shape('M 0 3 C 32 10 43 -13 28 -51 C 30 -29 9 -26 3 -13 Z',fur);shape('M 28 -51 C 38 -31 40 -19 34 -9 L 28 -19 L 22 -12 L 17 -23 C 25 -32 30 -36 28 -51 Z',cream);});
   feet(p,fur);ellipse(0,-28,25,27,fur);ellipse(0,-29,16,19,cream,null);
   joint(0,-65,p.nod,()=>{
    shape('M -28 -8 L -32 -39 Q -31 -44 -12 -23 Q 0 -27 12 -23 Q 31 -44 32 -39 L 28 -8 L 36 0 L 29 3 L 34 9 L 23 12 Q 10 24 0 25 Q -10 24 -23 12 L -34 9 L -29 3 L -36 0 Z',fur);
    line([[-26,-31],[-23,-16],[-16,-22]],ink,1.5);line([[26,-31],[23,-16],[16,-22]],ink,1.5);
    // A single unoutlined cream muzzle keeps cheek markings out of the mouth.
    shape('M -27 8 Q -15 7 -8 11 Q 0 17 8 11 Q 15 7 27 8 Q 11 23 0 23 Q -11 23 -27 8 Z',cream,null);
    curve([-20,-12,-17,-16,-13,-16,-10,-13],ink,1.8);curve([10,-13,13,-16,17,-16,20,-12],ink,1.8);
    face(0,-4,p,{width:17,mouth:false});ellipse(0,12,2.7,1.8,ink,null);curve([-5,17,-3,21,3,21,5,17],ink,1.5);
   });
   round(-33,-25,66,29,5,sage);round(-27,-19,25,12,2,cream);line([[-24,-13],[-20,-13],[-16,-17],[-12,-9],[-8,-13],[-5,-13]],ink,1.4);line([[-25,-2],[-14,-2]],ink,1.5);
   for(let i=0;i<6;i++)round(4+(i%3)*9,-19+Math.floor(i/3)*12,6,7,1,i===p.key%6?gold:cream);
   arm(-26,-37,-31,-23+p.hit*7,fur);arm(26,-37,22-p.key,-23+p.off*8,fur,-1);
  },
  axolotl(p){
   joint(20,-12,p.tail*.5,()=>shape('M 0 0 Q 48 6 37 -29 Q 65 16 -28 12 Q 3 12 0 0 Z',cream));ellipse(0,-29,21,20,cream);
   joint(0,-57,p.nod,()=>{for(const s of [-1,1])for(let i=0;i<3;i++)joint(s*29,-3,s*(-.8+i*.8+p.wing*.08),()=>{ellipse(s*11,0,13,5,'#e6c0b0');line([[s*3,0],[s*20,0]],ink,1);});ellipse(0,0,33,21,'#e6c0b0');face(0,-2,p,{width:10});});
   round(-37,-15,74,16,4,sage);line([[-29,-7],[29,-7]],ink,1.5);for(const x of [-29,29])line([[x,-10],[x,-4]],ink,1.5);
   const slide=-18+p.key*5;ellipse(slide,-7,3,3,cream);arm(-18,-30,-27,-15+p.off*5,cream);arm(18,-30,slide,-9,cream,-1);
  },
  daruma(p){
   joint(0,-4,p.nod,()=>{shape('M -32 -13 Q -41 -28 -31 -66 Q -27 -96 0 -96 Q 27 -96 31 -66 Q 41 -28 32 -13 Q 22 0 0 0 Q -22 0 -32 -13 Z','#d7ae90');ellipse(0,-64,27,23,'#e7c8ae');
    for(const s of [-1,1]){ellipse(s*13,-67,7,7,cream);ellipse(s*13,-67,2.7,p.blink?1:3,ink,null);curve([s*5,-77,s*12,-84,s*18,-80,s*22,-77],ink,2);curve([s*7,-54,s*15,-59,s*19,-57,s*23,-53],ink,1.5);}
    curve([-3,-66,-9,-57,-2,-58,2,-61],ink,1.5);curve([-8,-51,-3,-46,3,-46,8,-51]);
    ellipse(0,-24,27,18,'#e7c8ae');for(let i=0;i<7;i++){const a=Math.PI+i*Math.PI/6;line([[Math.cos(a)*21,-24+Math.sin(a)*13],[Math.cos(a)*17,-24+Math.sin(a)*10]],ink,1.4);}
    joint(0,-16,Math.sin(p.beat*.5)*.5,()=>{line([[0,0],[0,-19]],ink,2.5);round(-3,-22,6,7,1,gold);});ellipse(0,-16,3,3,cream);
   });
  },
  mushroom(p){
   shape('M -26 -54 Q -19 -26 -24 -5 Q -5 7 22 -7 Q 18 -19 23 -34 L 35 -34 Q 29 -17 34 -4 Q 10 15 -26 3 Z',cream);
   for(const [x,y,r] of [[-20,-55,29],[29,-33,18]])joint(x,y,p.nod,()=>{shape(`M ${-r} 0 Q ${-r*.5} ${-r*1.9} ${r*.35} ${-r*1.1} Q ${r*.8} ${-r*.75} ${r} 0 Q 0 ${r*.3} ${-r} 0 Z`,sage);for(const d of (r>20?[-12,4,17]:[0])){ellipse(d,-11-Math.abs(d+4)*.25,3.7,4,cream);line([[d,-14-Math.abs(d+4)*.25],[d,-11-Math.abs(d+4)*.25]],ink,1);}face(0,13,p,{width:r>20?6:4,mouth:false});curve([-3,17,-1,21,1,21,3,17],ink,1.3);});
   for(const [x,y] of [[-18,-20],[29,-9]]){ellipse(x,y,3.5,3.5,p.hit>.2?gold:cream);joint(x,y,p.hit*.9,()=>line([[0,0],[0,-3]],ink,1.3));}curve([-18,-17,-22,7,11,12,29,-5]);line([[-42,2],[-45,-10],[-40,-5],[-36,-15],[-33,2]],ink,1.5);
  },
  firefly(p){
   for(const s of [-1,1])for(const lower of [false,true])joint(s*8,lower?-29:-44,s*p.wing*.35,()=>{ellipse(s*17,lower?8:-15,24,lower?13:25,'#ddd9a7');const x=s*(lower?29:26),y=lower?10:-25;line([[0,0],[x*.5,0],[x,y]],ink,1.5);ellipse(x,y,3,3,p.hit>.25?gold:cream);});
   round(-10,-69,20,62,10,'#d5d7a7');face(0,-56,p,{width:4,mouth:false});curve([-3,-49,-1,-45,1,-45,3,-49],ink,1.4);ellipse(0,-22,6,6,p.hit>.2?'#f2d983':cream);
   for(const s of [-1,1]){curve([s*5,-68,s*12,-77,s*5,-80,s*9,-84]);ellipse(s*9,-84,2,2,ink,null);line([[s*5,-7],[s*9,-1]],ink,1.5);}
  },
  scope(p){
   round(-17,-84,34,9,2,sage);round(-44,-76,88,65,7,'#c5d2b0');round(-37,-68,56,45,4,'#eff0d2');
   for(const x of [-31,30])round(x-5,-11,10,6,1,sage);face(-9,-56,p,{width:11,mouth:false});const wave=[];for(let i=0;i<31;i++)wave.push([-32+i*1.5,-40+Math.sin(i*.25+p.beat*.12)*(4+p.hit*3)]);line(wave,ink,1.8);
   for(const y of [-62,-45,-28]){ellipse(31,y,5,5,cream);joint(31,y,p.hit*1.2,()=>line([[0,0],[2,-3]],ink,1.4));}for(let i=0;i<4;i++){line([[-26+i*11,-67],[-26+i*11,-65]],ink,1);line([[-26+i*11,-25],[-26+i*11,-23]],ink,1);}
   joint(44,-29,p.tail*.12,()=>{curve([0,0,36,47,-29,18,-42,26]);round(-47,23,13,5,1,sage);line([[-47,25],[-52,25]],ink,1.3);});
  },
  fuzz(p){
   const fur='#c7b49b';feet(p,fur);joint(29,-43,p.tail*.4,()=>{curve([0,0,19,8,10,-7,20,-13]);round(17,-20,6,9,1,cream);line([[18,-20],[18,-25]],ink,1);line([[22,-20],[22,-25]],ink,1);});
   joint(0,-43,p.nod*.4,()=>{shape('M -29 -14 L -32 -44 Q -31 -49 -13 -31 Q 0 -36 13 -31 Q 31 -49 32 -44 L 29 -14 Q 34 25 22 31 Q 0 39 -22 31 Q -34 25 -29 -14 Z',fur);line([[-26,-36],[-23,-25],[-17,-29]],ink,1.4);line([[26,-36],[23,-25],[17,-29]],ink,1.4);
    c.font='bold 7px system-ui';c.fillStyle=ink;c.textAlign='center';c.fillText('FUZZ',0,-26);
    for(const s of [-1,1]){ellipse(s*15,-15,8,9,cream);joint(s*15,-15,s*(.2+p.hit*.5),()=>line([[0,0],[-3,-6]],ink,1.7));line([[s*20,-1],[s*25,1]],ink,1.3);ellipse(s*22,22,1.3,1.3,ink,null);}
    ellipse(0,-1,2,1.4,ink,null);curve([0,0,-5,12,-10,4,-7,4]);curve([0,0,5,12,10,4,7,4]);ellipse(0,21,7,7,cream);ellipse(0,21,3.7,3.7,p.hit>.2?gold:fur);ellipse(0,11,1.7,1.7,p.hit>.2?gold:ink,null);
   });arm(-29,-37,-39,-32+p.hit*8,fur);
  },
  trio(p){
   ellipse(0,0,47,9,null,ink);for(const [i,x] of [-29,0,29].entries()){const h=[50,72,53][i],tilt=p.nod*(i%2?1:-1);joint(x,-3,tilt,()=>{for(const s of [-1,0,1]){const tap=i===p.key%3?p.hit*3:0;line([[s*7,-h+15],[s*7,-13],[s*9,-tap]],ink,1.8);ellipse(s*9,-tap,2.6,2.6,sage);}shape(`M -12 ${-h+17} L -12 ${-h+1} C -12 ${-h-15} 12 ${-h-15} 12 ${-h+1} L 12 ${-h+17} Z`,sage);face(0,-h+2,{...p,blink:p.blink&&i!==1},{width:4,mouth:false});curve([-3,-h+7,-1,-h+11,1,-h+11,3,-h+7],ink,1.3);});}
  },
  tanuki(p){joint(-22,-25,-.5+p.tail,()=>{ellipse(-15,-6,13,28,'#b69a77');for(let y=-21;y<10;y+=10)line([[-25,y],[-6,y]],'#796a53',4);});body(p,'#c9ae86');joint(0,-63,p.nod,()=>{ellipse(-19,-19,10,10,'#bea27e');ellipse(19,-19,10,10,'#bea27e');ellipse(0,0,32,23,'#c9ae86');ellipse(0,11,17,10,cream,null);for(const s of [-1,1])ellipse(s*15,-3,11,7,'#bea27e',ink);face(0,-3,p,{width:15});ellipse(0,6,2,2,ink,null);});round(-27,-29,54,32,5,sage);for(const x of [-13,13]){ellipse(x,-14,8,8,cream);joint(x,-14,p.beat,()=>{for(let i=0;i<3;i++)joint(0,0,i*Math.PI*2/3,()=>line([[0,0],[0,-5]],'#8fa07a',1.7));});}arm(-24,-39,-24,-18+p.hit*5,'#c9ae86');arm(24,-39,27,-9+p.hit*3,'#c9ae86',-1);},
  crane(p){for(const s of [-1,1])line([[s*9,-27],[s*12,-5],[s*20,-3]],ink,2.5);ellipse(-6,-46,28,20,cream);poly([[-26,-48],[-46,-33],[-24,-34]],sage);curve([7,-43,22,-52,2,-83,20,-89],ink,15);curve([7,-43,22,-52,2,-83,20,-89],cream,11);joint(21,-85,p.nod,()=>{ellipse(0,0,12,11,cream);ellipse(0,-9,7,3,rose,null);poly([[9,-3],[32,5],[10,5]],gold);ellipse(3,-2,2,p.blink?1:2.2,ink,null);});for(const s of [-1,1]){const hit=s<0?p.hit:p.off;joint(s*16,-44,s*(.25-hit*.5),()=>{poly([[0,0],[s*19,-9],[s*12,15],[0,9]],cream);});arm(s*16,-43,s*31,-34+hit,cream,s);mallet(s*31,-34+hit,-s*(.5+hit*2));}round(-38,-8,76,13,4,'#c8ad75');for(let i=0;i<6;i++)round(-34+i*11,-12-i%2*2,9,11,1,i===p.key%6?gold:cream);},
  shrimp(p){
   line([[-1,-14],[-5,-1],[-14,1]],ink,2);line([[9,-16],[14,-5],[23,-1]],ink,2);
   shape('M -25 -75 C -37 -79 -33 -65 -26 -63 C -27 -52 -16 -53 -13 -60 C -9 -52 0 -53 2 -60 C 26 -33 -3 -14 -13 -12 C 13 -5 39 -39 27 -66 C 32 -77 23 -83 18 -78 C 15 -89 2 -87 0 -80 C -5 -91 -17 -87 -18 -78 C -21 -83 -26 -81 -25 -75 Z','#e8ca87');
   face(-10,-70,p,{width:8,open:true});for(const [x,y] of [[23,-57],[24,-43],[16,-29]])curve([x-2,y,x,y-3,x+3,y-3,x+3,y],ink,1.3);
   arm(-3,-47,-33,-36+p.hit*3,gold);arm(28,-42,44,-38-p.hit*12+p.tail*12,gold,-1);
   line([[-41,-34],[-41,3],[-54,9],[-41,3],[-28,9]],ink,2);round(-51,-64,20,32,9,sage);for(let i=0;i<4;i++)line([[-47,-57+i*6],[-35,-57+i*6]],ink,1.5);
  },
  vox(p){
   const mochi='#ddd3df',collar='#a8beaa',sing=p.singing||p.hit*.65;
   feet(p,mochi,-23);
   // A soft mochi silhouette, a petal collar, and a tiny opera bow.
   shape('M -30 -27 C -40 -32 -34 -66 -22 -76 C -13 -85 12 -85 23 -76 C 34 -66 40 -32 30 -27 Q 0 -12 -30 -27 Z',mochi);
   shape('M -27 -29 Q -22 -13 -13 -25 Q -8 -8 0 -23 Q 8 -8 13 -25 Q 22 -13 27 -29 Q 0 -20 -27 -29 Z',collar);
   poly([[-1,-23],[-9,-28],[-9,-18]],cream);poly([[1,-23],[9,-28],[9,-18]],cream);ellipse(0,-23,2,2,gold);
   joint(0,-52,p.nod,()=>{face(0,-6,p,{width:12,mouth:false,sleepy:sing>.65});for(const s of [-1,1])ellipse(s*21,1,4,2,rose,null);
    if(sing>.06){const oo=p.vowel==='oo',ee=p.vowel==='ee';ellipse(0,7,oo?3.4:ee?6:5,ee?2.7+sing:3+sing*4.5,ink);ellipse(0,10+sing*2,oo?1.3:2.8,1.2,rose,null);}else curve([-3,5,-1,8,1,8,3,5],ink,1.5);
   });
   arm(-29,-32,-12,-27-sing*7,mochi);arm(29,-32,43,-30-sing*24,mochi,-1);joint(43,-30-sing*24,-sing*.3,()=>{line([[0,0],[1,-4]],ink,1);line([[3,0],[4,-3]],ink,1);});
   joint(-7,-80,p.nod,()=>{shape('M -3 1 Q -11 -12 2 -15 Q 5 -3 0 1 Z',collar);curve([0,0,-1,-4,-2,-8,1,-11],ink,1.2);ellipse(3,-2,3,3,gold);});
  }
 };
 function pose(id,{time=0,bpm=100,hit=0,singing=0,vowel='ah',still=false}={}){if(still)return {hit:0,singing:0,vowel:'ah',off:0,key:0,blink:false,nod:0,tail:0,wing:0,beat:0};const phase=[...id].reduce((a,v)=>a+v.charCodeAt(0),0),beat=time*bpm/60*Math.PI*2;return {hit,singing,vowel,off:hit*Math.max(0,Math.sin(beat+1)),key:Math.floor(time*bpm/60*2+phase)%8,blink:(time+phase*.13)%4.7>4.54,nod:Math.sin(beat*.5+phase)*.035+hit*.025,tail:Math.sin(time*1.6+phase)*.12,wing:Math.sin(time*14)*.22,beat};}
 function choir(p){
  for(const [i,x] of [-53,0,53].entries()){joint(x,-84+(i===1?-17:0),p.nod*(i===1?-1:1),()=>{ellipse(0,-12,17,29,cream);face(0,-18,{...p,hit:.25+.65*Math.max(0,Math.sin(p.beat+i*.8))},{width:7,open:true});for(const s of [-1,1]){line([[s*6,16],[s*7,29],[s*13,29]],ink,2);arm(s*15,-1,s*23,4-p.hit*7,cream,s);}});}
  // Back-facing conductor, shoulders/elbows/wrists and independent baton.
  feet(p,sage);poly([[-17,-42],[17,-42],[24,-7],[0,-2],[-24,-7]],sage);line([[0,-39],[0,-7]],'#91a27b',1.5);joint(0,-55,p.nod,()=>ellipse(0,0,14,16,cream));const down=(1-Math.cos(p.beat))/2;
  const rx=32+Math.sin(p.beat*.5)*8,ry=-65+down*27,lx=-29-Math.sin(p.beat*.5)*8,ly=-52+Math.cos(p.beat)*10;arm(-16,-38,lx,ly,cream,-1);arm(16,-38,rx,ry,cream,1);joint(rx,ry,-.6+down*.6,()=>{line([[0,0],[6,-35]],cream,4);line([[0,0],[6,-35]],ink,1.3);});
 }
 function draw(context,id,x,y,size,options={}){c=context;c.save();c.translate(x,y);const scale=size/(id==='choir'?170:115);c.scale(scale,scale);const p=pose(id,options);if(id==='choir')choir(p);else rigs[id]?.(p);c.restore();}
 window.OrchestraPerformers={draw,pose,ids:Object.keys(rigs)};
})();
