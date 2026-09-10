/* Approved collection vectors with local joint motion. Mochi Vox retains
   its original opera rig because it is a game-only character. */
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
 const rigs={
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
 function draw(context,id,x,y,size,options={}){
  if(id!=='vox')return PilafCharacters.draw(context,id,x,y,size,options);
  c=context;c.save();c.translate(x,y);c.scale(size/115,size/115);rigs.vox(pose(id,options));c.restore();
 }
 window.OrchestraPerformers={draw,pose,ids:OrchestraPlayers.map(p=>p.id)};
})();
