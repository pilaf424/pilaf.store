/* Familiar PILAF characters, shared by the village and its portraits. */
(() => {
  let ctx, elapsed=0;
  const ink='#334a3e',green='#4d7457',paper='#fff7df';
  const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
  function line(x1,y1,x2,y2,color=ink,width=2) {ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function ellipse(x,y,rx,ry,fill,stroke) {ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function round(x,y,w,h,r,fill,stroke) {ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function label(text,x,y,size=10,color=ink) {ctx.fillStyle=color;ctx.font=`${size}px ui-monospace, monospace`;ctx.fillText(text,x,y);}
  function polygon(points,fill,stroke) {ctx.beginPath();ctx.moveTo(...points[0]);for(const point of points.slice(1))ctx.lineTo(...point);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.8;ctx.stroke();}}
  function character(info, pose, sway = 0, scale = 1, still = false) {
    still = still || motionPreference.matches;
    const squash = still ? 0 : Math.sin((pose.landing||0)/.18*Math.PI)*.14;
    const stretch = !still && !pose.grounded && Math.abs(pose.vy||0)>200 ? .045 : 0;
    ctx.save();ctx.translate(pose.x+22,pose.y+26+squash*22);ctx.rotate(sway);ctx.scale(scale*(1+squash-stretch),scale*(1-squash+stretch));
    const bob = !still && pose.grounded && Math.abs(pose.vx)>10 ? Math.sin(elapsed*18)*1.5 : 0;
    ctx.translate(0,bob);
    const stride = !still && pose.grounded && Math.abs(pose.vx)>10 ? Math.sin(elapsed*18)*2 : 0;
    ellipse(-10-stride,25,7,3,ink);ellipse(11+stride,25,7,3,ink);
    const kind = info.id;
    if(['shrimp','crane','origami'].includes(kind)) ctx.scale(pose.face,1);
    if(kind === 'onigiri') {
      ctx.beginPath();ctx.moveTo(-22,16);ctx.quadraticCurveTo(-30,12,-19,-5);ctx.lineTo(-7,-24);ctx.quadraticCurveTo(0,-34,8,-23);ctx.lineTo(25,9);ctx.quadraticCurveTo(31,22,15,23);ctx.lineTo(-14,23);ctx.closePath();ctx.fillStyle=paper;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2.4;ctx.stroke();
      round(-9,9,18,15,3,green);
      ctx.beginPath();ctx.ellipse(0,-2,27,24,0,Math.PI,Math.PI*2);ctx.strokeStyle=ink;ctx.lineWidth=4;ctx.stroke();
      round(-30,-5,9,19,4,'#d2af76',ink);round(22,-5,9,19,4,'#d2af76',ink);
    } else if(kind === 'cat' || kind === 'fox') {
      const fur = kind === 'fox' ? '#c89565' : '#c6c4ac';
      ctx.save();ctx.translate(-20,13);ctx.rotate(-.5 + (still ? 0 : Math.sin(elapsed*4)*.1));ellipse(-8,0,17,8,fur,ink);ellipse(-18,0,6,6,paper);ctx.restore();
      ctx.beginPath();ctx.moveTo(-22,14);ctx.lineTo(-22,-25);ctx.lineTo(-7,-15);ctx.quadraticCurveTo(0,-18,8,-15);ctx.lineTo(23,-25);ctx.lineTo(23,14);ctx.quadraticCurveTo(21,25,0,24);ctx.quadraticCurveTo(-20,25,-22,14);ctx.closePath();ctx.fillStyle=fur;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();
      line(-18,-18,-12,-13,'#a87966',3);line(18,-18,12,-13,'#a87966',3);
      ellipse(0,7,15,10,paper);
      if(kind === 'cat') {
        round(-18,14,37,10,2,paper,ink);
        for(let i=0;i<6;i++)line(-12+i*5,15,-12+i*5,23,ink,1);
        for(const x of [-10,0,10])round(x,15,3,5,0,ink);
        line(-26,0,-17,2,ink,1);line(18,2,27,0,ink,1);
      } else {
        round(-14,13,28,12,3,green,ink);
        for(const x of [-8,0,8])round(x-2,17,4,4,1,'#e1cca0');
      }
    } else if(kind === 'rabbit') {
      ellipse(-10,-23,7,19,paper,ink);ellipse(10,-23,7,19,paper,ink);
      ellipse(-10,-27,3,10,'#d8b8ac');ellipse(10,-27,3,10,'#d8b8ac');
      ellipse(0,3,23,22,paper,ink);ellipse(23,19,6,6,paper,ink);
      round(-13,13,26,12,3,'#b9c8a6',ink);line(11,13,11,-1,ink,2);
      ellipse(-6,18,3,3,'#e1cca0');
    } else if(kind === 'shrimp') {
      // Craggy tempura batter, a curved shrimp body, and a tiny singing mic.
      ctx.beginPath();ctx.moveTo(-23,-21);ctx.lineTo(-17,-29);ctx.lineTo(-9,-25);ctx.lineTo(-3,-31);ctx.lineTo(5,-26);ctx.lineTo(14,-27);ctx.lineTo(17,-20);
      ctx.bezierCurveTo(39,2,22,21,2,26);ctx.lineTo(-7,18);ctx.bezierCurveTo(11,8,10,-2,-3,-9);ctx.lineTo(-12,-7);ctx.lineTo(-16,-14);ctx.lineTo(-24,-14);ctx.closePath();ctx.fillStyle='#e8cd89';ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();
      polygon([[-6,16],[-18,18],[-12,27],[-1,25],[7,30],[12,22],[2,18]],'#d59a79',ink);
      for(const [x,y] of [[17,-14],[21,-4],[16,6]])line(x,y,x+3,y+3,'#c2a066',1.4);
      ellipse(-1,-18,1.6,2,ink);ellipse(10,-16,1.6,2,ink);
      ctx.beginPath();ctx.arc(4,-12,3,0,Math.PI);ctx.strokeStyle=ink;ctx.stroke();
      line(-2,3,-22,9,ink,1.6);round(-33,-6,12,20,5,'#ced4b5',ink);
      for(let i=0;i<3;i++)line(-30,-1+i*4,-24,-1+i*4,'#879975',1);
      line(-27,14,-27,23,ink,1.5);
    } else if(kind === 'crane') {
      ellipse(-6,8,21,13,paper,ink);polygon([[-24,6],[-32,16],[-17,14]],'#bec9ae',ink);
      ctx.beginPath();ctx.moveTo(0,9);ctx.bezierCurveTo(19,6,3,-21,14,-27);ctx.bezierCurveTo(24,-33,30,-15,17,-9);ctx.lineTo(17,10);ctx.closePath();ctx.fillStyle=paper;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();
      ellipse(18,-26,5,2,'#bf8772');polygon([[25,-22],[39,-17],[25,-16]],'#d0b078',ink);
      ellipse(20,-22,1.5,1.8,ink);
      ctx.beginPath();ctx.moveTo(-19,5);ctx.quadraticCurveTo(-9,20,4,6);ctx.strokeStyle='#7a9270';ctx.lineWidth=1.6;ctx.stroke();
      line(37,-17,37,5,'#748e66',1.3);ellipse(33,8,4,3,green);line(37,6,37,-3,green,1.3);
      line(-10,19,-10,26,ink,1.5);line(4,19,5,26,ink,1.5);
    } else if(kind === 'tanuki') {
      ctx.save();ctx.translate(-25,12);ctx.rotate(-.4);ellipse(-5,0,16,8,'#aa9172',ink);line(-9,-7,-9,7,'#766a52',4);line(0,-7,0,7,'#766a52',4);ctx.restore();
      ellipse(-17,-20,9,9,'#ae9575',ink);ellipse(17,-20,9,9,'#ae9575',ink);
      ellipse(-17,-20,4,4,'#d2b697');ellipse(17,-20,4,4,'#d2b697');
      ellipse(0,1,25,23,'#c1a482',ink);ellipse(0,9,15,12,'#f0dfbe');
      for(const x of [-9,9]){ellipse(x,-3,8,6,'#7c6c56');ellipse(x,-3,2.8,2.8,paper);ellipse(x+1,-3,1.3,1.7,ink);}
      ellipse(0,3,2,1.5,ink);
      round(-21,12,42,15,3,'#e3d9b9',ink);round(-15,15,30,7,2,'#adba96',ink);ellipse(-9,18.5,3,3,paper,ink);ellipse(9,18.5,3,3,paper,ink);
    } else if(kind === 'robot') {
      line(0,-24,0,-36,ink,2);ellipse(0,-37,4,4,'#d6bb78',ink);
      round(-30,-10,7,14,3,'#a8b99a',ink);round(23,-10,7,14,3,'#a8b99a',ink);
      round(-23,-24,46,32,7,'#c7d6b9',ink);round(-17,-17,34,17,4,paper,'#91a883');
      for(const x of [-9,9]){ellipse(x,-9,4,4,'#a8bca0',ink);ellipse(x,-9,1.5,2,ink);}
      round(-18,11,36,15,3,'#d4dabe',ink);
      for(let i=0;i<4;i++)round(-13+i*8,15,5,5,1,i===Math.floor(elapsed*2)%4&&!still?'#d2ac61':'#adc198',ink);
      for(const side of [-1,1]){line(side*19,16,side*29,8,ink,1.8);line(side*29,8,side*29,-1,ink,1.5);line(side*29,-1,side*34,-5,ink,1.4);line(side*29,-1,side*25,-5,ink,1.4);}
    } else if(kind === 'origami') {
      const flap=still?0:Math.sin(elapsed*3)*3;
      polygon([[-6,15],[-34,4],[-12,0],[-7,-30-flap],[9,-10],[21,-24],[25,-8],[37,-2],[20,0],[11,15]],'#e9e7ce',ink);
      polygon([[-7,-30-flap],[-12,0],[9,-10]],'#b6c7a7',ink);
      line(-34,4,-6,6,'#819875',1);line(-6,6,9,-10,'#819875',1);line(-6,6,-6,15,'#819875',1);
      ellipse(21,-12,1.5,1.8,ink);
      round(-19,18,38,11,2,'#cfdbc0',ink);
      for(let i=0;i<4;i++){line(-12+i*8,20,-12+i*8,27,'#7f9770',1);round(-14+i*8,22+(i%2),4,2,1,ink);}
    } else {
      for(const side of [-1,1])for(let i=0;i<3;i++) {
        const y=-12+i*11;line(side*18,y+3,side*(29+(i===1?4:0)),y-4,'#9c6968',3);
        ellipse(side*(29+(i===1?4:0)),y-4,4,5,'#c9918c',ink);
      }
      round(-22,-20,44,44,17,'#e4bdb0',ink);
      ctx.beginPath();ctx.moveTo(-20,17);ctx.bezierCurveTo(-5,32,16,9,28,22);ctx.strokeStyle=green;ctx.lineWidth=5;ctx.stroke();
      ellipse(-14,7,4,2,'#c9918c');ellipse(14,7,4,2,'#c9918c');
    }
    if(['shrimp','crane','tanuki','robot','origami'].includes(kind)) {ctx.restore();return;}
    if(kind === 'cat' || (!still && elapsed%5.7>5.52)) {
      line(-10+pose.face*2,-1,-5+pose.face*2,1,ink,2);line(5+pose.face*2,1,10+pose.face*2,-1,ink,2);
    } else {
      ellipse(-7+pose.face*2,0,1.7,2.5,ink);ellipse(7+pose.face*2,0,1.7,2.5,ink);
    }
    ctx.beginPath();ctx.arc(pose.face*2,3,3,0,Math.PI);ctx.lineWidth=1.5;ctx.stroke();
    ctx.restore();
  }

  window.PilafSprites={draw(context,id,x,y,{scale=1,time=0,moving=false,face=1,dance=false}={}) {
    ctx=context;elapsed=time;
    character({id},{x:x-22,y:y-52,face,grounded:true,vx:moving?80:0,vy:0},dance&&!motionPreference.matches?Math.sin(time*3)*.08:0,scale,false);
  }};
})();
